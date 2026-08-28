/** Общие типы бэкенда: заявки, диалоги, ответы LLM. */

export type LeadStatus = 'new' | 'in_work' | 'won' | 'lost';
export type LeadSource = 'form' | 'quiz' | 'chat';
export type ContactType = 'phone' | 'telegram' | 'email';
export type TelegramStatus = 'pending' | 'sent' | 'failed' | 'skipped';

/** Ответ на один шаг квиза — храним и вопрос, и текст ответа, чтобы менеджер читал без словаря. */
export interface QuizAnswer {
  stepId: string;
  question: string;
  answer: string;
}

export interface Lead {
  id: string;
  createdAt: string;
  name: string;
  contact: string;
  contactType: ContactType;
  source: LeadSource;
  comment: string;
  quizAnswers: QuizAnswer[];
  sessionId: string | null;
  status: LeadStatus;
  managerNote: string;
  utm: Record<string, string>;
  referrer: string;
  userAgent: string;
  ip: string;
  telegramStatus: TelegramStatus;
  telegramMessageId: number | null;
}

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  text: string;
  at: string;
  /** Какой моделью сгенерирован ответ ассистента — видно в админке. */
  model?: string;
}

/** Диалог посетителя: свободный чат + пройденные шаги квиза. */
export interface Session {
  id: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  quizAnswers: QuizAnswer[];
  leadId: string | null;
}

/** Единый интерфейс, к которому приводятся все LLM-провайдеры. */
export interface LlmRequest {
  system: string;
  messages: { role: ChatRole; text: string }[];
  maxTokens: number;
  signal: AbortSignal;
}

export interface LlmProvider {
  name: 'gemini' | 'anthropic';
  isConfigured(): boolean;
  generate(model: string, req: LlmRequest): Promise<string>;
  /** Разбор ошибки провайдера в решение: подождать эту модель или выключить навсегда. */
  classifyError(error: unknown): FailureKind;
}

export type FailureKind =
  /** 429 — модель перегружена лимитом, вернёмся к ней позже. */
  | { kind: 'cooldown'; retryAfterMs: number | null; reason: string }
  /** 5xx, обрыв связи, таймаут — короткая пауза. */
  | { kind: 'transient'; reason: string }
  /** 400/401/403/404 — конфигурация битая, модель бесполезна до перезапуска. */
  | { kind: 'fatal'; reason: string };
