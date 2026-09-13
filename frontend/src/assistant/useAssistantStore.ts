import { create } from 'zustand';
import {
  askAssistant,
  getQuizResult,
  sendQuizStep,
  type QuizAnswerPayload,
  type QuizResult,
} from '../lib/api';
import { getSessionId } from '../lib/tracking';
import { assistant, quizSteps, type QuizOption } from '../site.config';

export type AssistantMode = 'menu' | 'quiz' | 'chat' | 'contact' | 'done';
export type QuizResultStatus = 'idle' | 'loading' | 'ready' | 'failed';

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

/** Что посетитель отправил в заявке — показываем на экране «Заявка принята». */
export interface SubmittedLead {
  name: string;
  contact: string;
}

let messageCounter = 0;
const nextId = () => `m${(messageCounter += 1)}`;

interface AssistantState {
  isOpen: boolean;
  mode: AssistantMode;
  messages: AssistantMessage[];
  /** Индекс текущего шага квиза; равен длине списка — квиз пройден. */
  quizIndex: number;
  quizAnswers: QuizAnswerPayload[];
  /** Итог подбора после последнего шага: формат и цены от сервера, пояснение от ИИ. */
  quizResult: QuizResult | null;
  quizResultStatus: QuizResultStatus;
  submittedLead: SubmittedLead | null;
  isTyping: boolean;

  open: (mode?: AssistantMode) => void;
  close: () => void;
  setMode: (mode: AssistantMode) => void;
  startQuiz: () => void;
  startChat: () => void;
  answerQuiz: (option: QuizOption) => void;
  goBackQuiz: () => void;
  sendMessage: (text: string) => Promise<void>;
  finish: (lead: SubmittedLead) => void;
  reset: () => void;
}

const greeting = (): AssistantMessage => ({
  id: nextId(),
  role: 'assistant',
  text: assistant.greeting,
});

const noResult = { quizResult: null, quizResultStatus: 'idle' as QuizResultStatus };

export const useAssistantStore = create<AssistantState>((set, get) => ({
  isOpen: false,
  mode: 'menu',
  messages: [greeting()],
  quizIndex: 0,
  quizAnswers: [],
  ...noResult,
  submittedLead: null,
  isTyping: false,

  open: (mode = 'menu') => set({ isOpen: true, mode }),
  close: () => set({ isOpen: false }),
  setMode: (mode) => set({ mode }),

  startQuiz: () =>
    set({
      mode: 'quiz',
      quizIndex: 0,
      quizAnswers: [],
      ...noResult,
      submittedLead: null,
      messages: [greeting(), { id: nextId(), role: 'assistant', text: assistant.quizIntro }],
    }),

  startChat: () => set({ mode: 'chat' }),

  /**
   * Шаг квиза переключается мгновенно, без ожидания сети: варианты — кнопки,
   * а ответ фиксируется локально. Реплика ИИ прилетает следом и просто
   * добавляется в ленту, поэтому пауза модели не тормозит прохождение.
   */
  answerQuiz: (option) => {
    const { quizIndex, quizAnswers, messages } = get();
    const step = quizSteps[quizIndex];
    if (!step) return;

    const answer: QuizAnswerPayload = {
      stepId: step.id,
      question: step.question,
      answer: option.label,
      value: option.value,
    };

    const nextAnswers = [...quizAnswers.filter((a) => a.stepId !== step.id), answer];
    const nextIndex = quizIndex + 1;
    const finished = nextIndex >= quizSteps.length;

    set({
      quizAnswers: nextAnswers,
      quizIndex: nextIndex,
      mode: finished ? 'contact' : 'quiz',
      messages: [...messages, { id: nextId(), role: 'user', text: option.label }],
      ...(finished ? { quizResult: null, quizResultStatus: 'loading' as const } : {}),
    });

    if (finished) {
      // Итог сервер считает по всем ответам разом. Последний шаг отдельно не шлём,
      // иначе итог мог бы посчитаться раньше, чем запишется последний ответ.
      void getQuizResult(getSessionId(), nextAnswers)
        .then((result) => {
          // Посетитель мог вернуться и поменять ответ, пока шёл запрос: старый итог не нужен.
          if (get().quizAnswers !== nextAnswers) return;
          set({ quizResult: result, quizResultStatus: result.service ? 'ready' : 'failed' });
        })
        // Техническую ошибку не показываем: карточка скажет, что расчёт пришлёт менеджер.
        .catch(() => {
          if (get().quizAnswers === nextAnswers) set({ quizResultStatus: 'failed' });
        });
      return;
    }

    void sendQuizStep(getSessionId(), answer)
      .then(({ comment }) => {
        if (!comment) return;
        set((state) => ({
          messages: [...state.messages, { id: nextId(), role: 'assistant', text: comment }],
        }));
      })
      // Комментарий — украшение, а не необходимость: молча пропускаем сбой.
      .catch(() => undefined);
  },

  goBackQuiz: () => {
    const { quizIndex } = get();
    if (quizIndex === 0) {
      set({ mode: 'menu' });
      return;
    }
    set({ quizIndex: quizIndex - 1, mode: 'quiz', ...noResult });
  },

  sendMessage: async (text) => {
    const trimmed = text.trim();
    if (!trimmed || get().isTyping) return;

    set((state) => ({
      messages: [...state.messages, { id: nextId(), role: 'user', text: trimmed }],
      isTyping: true,
    }));

    try {
      const { reply } = await askAssistant(getSessionId(), trimmed);
      set((state) => ({
        messages: [...state.messages, { id: nextId(), role: 'assistant', text: reply }],
        isTyping: false,
      }));
    } catch {
      // Технических ошибок посетитель видеть не должен — предлагаем живой контакт.
      set((state) => ({
        messages: [
          ...state.messages,
          {
            id: nextId(),
            role: 'assistant',
            text: 'Не получилось ответить прямо сейчас. Оставьте контакт — менеджер напишет и всё расскажет.',
          },
        ],
        isTyping: false,
      }));
    }
  },

  // История диалога и итог подбора не стираются: экран «Заявка принята» показывает их целиком.
  finish: (lead) => set({ mode: 'done', submittedLead: lead }),

  reset: () =>
    set({
      mode: 'menu',
      messages: [greeting()],
      quizIndex: 0,
      quizAnswers: [],
      ...noResult,
      submittedLead: null,
      isTyping: false,
    }),
}));

/** Короткий хелпер для секций: открыть помощника сразу в нужном режиме. */
export const openAssistant = (mode: AssistantMode = 'menu') => {
  const store = useAssistantStore.getState();
  if (mode === 'quiz') store.startQuiz();
  else if (mode === 'chat') store.startChat();
  store.open(mode);
};
