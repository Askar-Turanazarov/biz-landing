/** Тонкая обёртка над fetch: единая обработка ошибок и типы ответов. */

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    // credentials нужны админке: токен сессии живёт в httpOnly-cookie.
    credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });

  if (!response.ok) {
    let message = 'Что-то пошло не так. Попробуйте ещё раз.';
    try {
      const data = (await response.json()) as { error?: string };
      if (data?.error) message = data.error;
    } catch {
      /* тело не JSON — оставляем текст по умолчанию */
    }
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// ── Публичные вызовы лендинга ────────────────────────────────────────────

export interface QuizAnswerPayload {
  stepId: string;
  question: string;
  answer: string;
  /** Машинный код варианта — по нему сервер считает подбор. */
  value?: string;
}

export interface ServiceOffer {
  id: string;
  title: string;
  /** Стартовая цена в сумах. */
  priceFrom: number;
  duration: string;
}

export type BudgetFit = 'ok' | 'close' | 'low' | 'unknown';
export type DeadlineFit = 'ok' | 'tight' | 'unknown';

/** Итог квиза: формат и цифры посчитаны сервером по прайсу, text — пояснение ИИ. */
export interface QuizResult {
  text: string;
  service: ServiceOffer | null;
  alternative: ServiceOffer | null;
  budgetFit: BudgetFit;
  deadlineFit: DeadlineFit;
}

export interface LeadPayload {
  name: string;
  contact: string;
  comment?: string;
  consent: boolean;
  source: 'form' | 'quiz' | 'chat';
  sessionId?: string | null;
  quizAnswers?: QuizAnswerPayload[];
  elapsedMs?: number;
  /** Honeypot: скрытое поле, которое заполняют только боты. */
  company?: string;
  utm?: Record<string, string>;
  referrer?: string;
}

export const sendLead = (payload: LeadPayload) =>
  api.post<{ ok: true; id: string }>('/leads', payload);

export const askAssistant = (sessionId: string, message: string) =>
  api.post<{ reply: string }>('/chat', { sessionId, message });

export const sendQuizStep = (sessionId: string, step: QuizAnswerPayload) =>
  api.post<{ comment: string }>('/quiz/step', { sessionId, ...step });

export const getQuizResult = (sessionId: string, answers: QuizAnswerPayload[]) =>
  api.post<QuizResult>('/quiz/result', { sessionId, answers });
