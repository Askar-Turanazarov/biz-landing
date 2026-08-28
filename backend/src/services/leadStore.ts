/** Заявки: создание, фильтрация, статистика. Файл — backend/data/leads.json. */
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { JsonStore } from './jsonStore.js';
import type { Lead, LeadStatus, QuizAnswer, ContactType, LeadSource } from '../types.js';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(here, '../../data');

const store = new JsonStore<Lead>(resolve(dataDir, 'leads.json'));

export interface NewLeadInput {
  name: string;
  contact: string;
  contactType: ContactType;
  source: LeadSource;
  comment?: string;
  quizAnswers?: QuizAnswer[];
  sessionId?: string | null;
  utm?: Record<string, string>;
  referrer?: string;
  userAgent?: string;
  ip?: string;
}

export async function createLead(input: NewLeadInput): Promise<Lead> {
  const lead: Lead = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    name: input.name,
    contact: input.contact,
    contactType: input.contactType,
    source: input.source,
    comment: input.comment ?? '',
    quizAnswers: input.quizAnswers ?? [],
    sessionId: input.sessionId ?? null,
    status: 'new',
    managerNote: '',
    utm: input.utm ?? {},
    referrer: input.referrer ?? '',
    userAgent: input.userAgent ?? '',
    ip: input.ip ?? '',
    telegramStatus: 'pending',
    telegramMessageId: null,
  };
  return store.insert(lead);
}

export interface LeadFilter {
  status?: LeadStatus | 'all';
  source?: LeadSource | 'all';
  query?: string;
  from?: string;
  to?: string;
}

export async function listLeads(filter: LeadFilter = {}): Promise<Lead[]> {
  const all = await store.all();
  const q = filter.query?.trim().toLowerCase() ?? '';
  const fromTs = filter.from ? Date.parse(filter.from) : null;
  const toTs = filter.to ? Date.parse(filter.to) : null;

  return all.filter((lead) => {
    if (filter.status && filter.status !== 'all' && lead.status !== filter.status) return false;
    if (filter.source && filter.source !== 'all' && lead.source !== filter.source) return false;
    if (fromTs !== null && Date.parse(lead.createdAt) < fromTs) return false;
    if (toTs !== null && Date.parse(lead.createdAt) > toTs) return false;
    if (q) {
      const haystack = [lead.name, lead.contact, lead.comment, lead.managerNote]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export async function getLead(id: string): Promise<Lead | null> {
  const all = await store.all();
  return all.find((l) => l.id === id) ?? null;
}

export async function updateLead(id: string, patch: Partial<Lead>): Promise<Lead | null> {
  return store.update((l) => l.id === id, patch);
}

export async function deleteLead(id: string): Promise<boolean> {
  return store.remove((l) => l.id === id);
}

export interface LeadStats {
  total: number;
  today: number;
  week: number;
  byStatus: Record<LeadStatus, number>;
  bySource: Record<LeadSource, number>;
  /** Доля заявок, пришедших через ИИ-ассистента (квиз + чат). */
  aiShare: number;
}

/**
 * Начало сегодняшнего дня по Ташкенту. Считаем от фиксированного смещения:
 * в Узбекистане UTC+5 круглый год, перевода часов нет. Так «заявок сегодня»
 * совпадает с календарём менеджера, даже если сервер живёт в другой зоне.
 */
const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfTashkentDay(now: number): number {
  return Math.floor((now + TASHKENT_OFFSET_MS) / DAY_MS) * DAY_MS - TASHKENT_OFFSET_MS;
}

export async function getStats(): Promise<LeadStats> {
  const all = await store.all();
  const now = Date.now();
  const startOfToday = startOfTashkentDay(now);
  const weekAgo = now - 7 * DAY_MS;

  const byStatus: Record<LeadStatus, number> = { new: 0, in_work: 0, won: 0, lost: 0 };
  const bySource: Record<LeadSource, number> = { form: 0, quiz: 0, chat: 0 };
  let today = 0;
  let week = 0;

  for (const lead of all) {
    byStatus[lead.status] = (byStatus[lead.status] ?? 0) + 1;
    bySource[lead.source] = (bySource[lead.source] ?? 0) + 1;
    const ts = Date.parse(lead.createdAt);
    if (ts >= startOfToday) today += 1;
    if (ts >= weekAgo) week += 1;
  }

  const ai = bySource.quiz + bySource.chat;
  return {
    total: all.length,
    today,
    week,
    byStatus,
    bySource,
    aiShare: all.length ? Math.round((ai / all.length) * 100) : 0,
  };
}
