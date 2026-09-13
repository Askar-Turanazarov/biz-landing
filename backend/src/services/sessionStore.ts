/** Диалоги посетителей с ассистентом. Файл — backend/data/sessions.json. */
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { JsonStore } from './jsonStore.js';
import type { ChatMessage, QuizAnswer, Session } from '../types.js';

const here = dirname(fileURLToPath(import.meta.url));
const store = new JsonStore<Session>(resolve(here, '../../data/sessions.json'));

/** Длиннее хранить незачем: контекст ассистента и так режется до последних сообщений. */
const MAX_MESSAGES_PER_SESSION = 60;

function blank(id: string): Session {
  const now = new Date().toISOString();
  return { id, createdAt: now, updatedAt: now, messages: [], quizAnswers: [], leadId: null };
}

export async function getSession(id: string): Promise<Session | null> {
  const all = await store.all();
  return all.find((s) => s.id === id) ?? null;
}

export async function ensureSession(id: string): Promise<Session> {
  return store.upsert((s) => s.id === id, () => blank(id));
}

export async function appendMessages(id: string, messages: ChatMessage[]): Promise<Session> {
  const session = await ensureSession(id);
  const next = [...session.messages, ...messages].slice(-MAX_MESSAGES_PER_SESSION);
  const updated = await store.update((s) => s.id === id, {
    messages: next,
    updatedAt: new Date().toISOString(),
  });
  return updated ?? session;
}

/**
 * Ответы на шаги квиза перезаписываются по stepId: посетитель мог вернуться назад и передумать.
 * Итог квиза присылает все ответы разом — они ложатся одной записью.
 */
export async function recordQuizAnswers(id: string, answers: QuizAnswer[]): Promise<Session> {
  const session = await ensureSession(id);
  const replaced = new Set(answers.map((a) => a.stepId));
  const updated = await store.update((s) => s.id === id, {
    quizAnswers: [...session.quizAnswers.filter((a) => !replaced.has(a.stepId)), ...answers],
    updatedAt: new Date().toISOString(),
  });
  return updated ?? session;
}

export async function linkLead(id: string, leadId: string): Promise<void> {
  await store.update((s) => s.id === id, { leadId, updatedAt: new Date().toISOString() });
}
