import { create } from 'zustand';
import { askAssistant, sendQuizStep, type QuizAnswerPayload } from '../lib/api';
import { getSessionId } from '../lib/tracking';
import { assistant, quizSteps } from '../site.config';

export type AssistantMode = 'menu' | 'quiz' | 'chat' | 'contact' | 'done';

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
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
  isTyping: boolean;

  open: (mode?: AssistantMode) => void;
  close: () => void;
  setMode: (mode: AssistantMode) => void;
  startQuiz: () => void;
  startChat: () => void;
  answerQuiz: (option: string) => void;
  goBackQuiz: () => void;
  sendMessage: (text: string) => Promise<void>;
  finish: () => void;
  reset: () => void;
}

const greeting = (): AssistantMessage => ({
  id: nextId(),
  role: 'assistant',
  text: assistant.greeting,
});

export const useAssistantStore = create<AssistantState>((set, get) => ({
  isOpen: false,
  mode: 'menu',
  messages: [greeting()],
  quizIndex: 0,
  quizAnswers: [],
  isTyping: false,

  open: (mode = 'menu') => set({ isOpen: true, mode }),
  close: () => set({ isOpen: false }),
  setMode: (mode) => set({ mode }),

  startQuiz: () =>
    set({
      mode: 'quiz',
      quizIndex: 0,
      quizAnswers: [],
      messages: [greeting(), { id: nextId(), role: 'assistant', text: assistant.quizIntro }],
    }),

  startChat: () => set({ mode: 'chat' }),

  /**
   * Шаг квиза переключается мгновенно, без ожидания сети: варианты — кнопки,
   * а ответ фиксируется локально. Реплика ИИ прилетает следом и просто
   * добавляется в ленту, поэтому пауза модели не тормозит прохождение.
   */
  answerQuiz: (option) => {
    const { quizIndex, quizAnswers } = get();
    const step = quizSteps[quizIndex];
    if (!step) return;

    const answer: QuizAnswerPayload = {
      stepId: step.id,
      question: step.question,
      answer: option,
    };

    const nextIndex = quizIndex + 1;
    const finished = nextIndex >= quizSteps.length;

    set({
      quizAnswers: [...quizAnswers.filter((a) => a.stepId !== step.id), answer],
      quizIndex: nextIndex,
      mode: finished ? 'contact' : 'quiz',
      messages: [...get().messages, { id: nextId(), role: 'user', text: option }],
    });

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
    set({ quizIndex: quizIndex - 1, mode: 'quiz' });
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

  finish: () => set({ mode: 'done' }),

  reset: () =>
    set({
      mode: 'menu',
      messages: [greeting()],
      quizIndex: 0,
      quizAnswers: [],
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
