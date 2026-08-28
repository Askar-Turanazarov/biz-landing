import { api } from '../lib/api';

export type LeadStatus = 'new' | 'in_work' | 'won' | 'lost';
export type LeadSource = 'form' | 'quiz' | 'chat';

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
  contactType: 'phone' | 'telegram' | 'email';
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
  telegramStatus: 'pending' | 'sent' | 'failed' | 'skipped';
}

export interface Stats {
  total: number;
  today: number;
  week: number;
  byStatus: Record<LeadStatus, number>;
  bySource: Record<LeadSource, number>;
  aiShare: number;
}

export interface DialogMessage {
  role: 'user' | 'assistant';
  text: string;
  at: string;
  model?: string;
}

export interface LeadFilters {
  status: LeadStatus | 'all';
  source: LeadSource | 'all';
  query: string;
}

function toQuery(filters: LeadFilters): string {
  const params = new URLSearchParams();
  if (filters.status !== 'all') params.set('status', filters.status);
  if (filters.source !== 'all') params.set('source', filters.source);
  if (filters.query.trim()) params.set('q', filters.query.trim());
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const adminApi = {
  login: (password: string) => api.post<{ ok: true }>('/admin/login', { password }),
  logout: () => api.post<{ ok: true }>('/admin/logout'),
  /** Проверка живой сессии: используется как «страж» при открытии страницы. */
  session: () => api.get<{ ok: true }>('/admin/session'),

  leads: (filters: LeadFilters) => api.get<{ leads: Lead[] }>(`/admin/leads${toQuery(filters)}`),
  stats: () => api.get<Stats>('/admin/stats'),
  dialog: (id: string) =>
    api.get<{ messages: DialogMessage[]; quizAnswers: QuizAnswer[] }>(`/admin/leads/${id}/dialog`),

  update: (id: string, patch: { status?: LeadStatus; managerNote?: string }) =>
    api.patch<{ lead: Lead }>(`/admin/leads/${id}`, patch),
  remove: (id: string) => api.del<{ ok: true }>(`/admin/leads/${id}`),

  exportUrl: (filters: LeadFilters) => `/api/admin/leads-export.csv${toQuery(filters)}`,
};

export const STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'Новая',
  in_work: 'В работе',
  won: 'Успех',
  lost: 'Отказ',
};

export const STATUS_STYLE: Record<LeadStatus, string> = {
  new: 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30',
  in_work: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
  won: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
  lost: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

export const SOURCE_LABEL: Record<LeadSource, string> = {
  form: 'Форма',
  quiz: 'Квиз ИИ',
  chat: 'Чат ИИ',
};

export function contactHref(lead: Lead): string {
  switch (lead.contactType) {
    case 'phone':
      return `tel:${lead.contact.replace(/[^\d+]/g, '')}`;
    case 'telegram':
      return `https://t.me/${lead.contact.replace(/^@/, '')}`;
    default:
      return `mailto:${lead.contact}`;
  }
}

/**
 * Время всегда показываем в Ташкенте, а не в часовом поясе браузера:
 * менеджер и клиент должны видеть одну и ту же дату заявки, откуда бы
 * ни открыли админку.
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    timeZone: 'Asia/Tashkent',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
