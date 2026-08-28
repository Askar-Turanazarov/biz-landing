/** Скрытая админка: вход по паролю, список заявок, статусы, диалоги, экспорт. */
import { Router } from 'express';
import {
  deleteLead,
  getLead,
  getStats,
  listLeads,
  updateLead,
  type LeadFilter,
} from '../services/leadStore.js';
import { getSession } from '../services/sessionStore.js';
import { chainStatus } from '../services/llm/index.js';
import {
  ADMIN_COOKIE,
  checkPassword,
  clearLoginAttempts,
  cookieOptions,
  issueToken,
  loginThrottleCheck,
  registerFailedLogin,
  requireAdmin,
} from '../middleware/auth.js';
import type { LeadStatus } from '../types.js';

export const adminRouter = Router();

adminRouter.post('/admin/login', (req, res) => {
  const throttle = loginThrottleCheck(req);
  if (throttle.blocked) {
    res.setHeader('Retry-After', String(throttle.retryAfter));
    res.status(429).json({
      error: `Слишком много попыток. Повторите через ${Math.ceil(throttle.retryAfter / 60)} мин.`,
    });
    return;
  }

  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!checkPassword(password)) {
    registerFailedLogin(req);
    res.status(401).json({ error: 'Неверный пароль' });
    return;
  }

  clearLoginAttempts(req);
  res.cookie(ADMIN_COOKIE, issueToken(), cookieOptions());
  res.json({ ok: true });
});

adminRouter.post('/admin/logout', (_req, res) => {
  res.clearCookie(ADMIN_COOKIE, { path: '/' });
  res.json({ ok: true });
});

// Всё, что ниже, доступно только с валидным токеном.
adminRouter.use('/admin', requireAdmin);

adminRouter.get('/admin/session', (_req, res) => res.json({ ok: true }));

function filterFrom(query: Record<string, unknown>): LeadFilter {
  const str = (v: unknown): string | undefined =>
    typeof v === 'string' && v.trim() ? v.trim() : undefined;
  return {
    status: str(query.status) as LeadFilter['status'],
    source: str(query.source) as LeadFilter['source'],
    query: str(query.q),
    from: str(query.from),
    to: str(query.to),
  };
}

adminRouter.get('/admin/leads', async (req, res) => {
  res.json({ leads: await listLeads(filterFrom(req.query as Record<string, unknown>)) });
});

adminRouter.get('/admin/stats', async (_req, res) => {
  res.json(await getStats());
});

adminRouter.get('/admin/health', (_req, res) => {
  res.json(chainStatus());
});

const STATUSES: LeadStatus[] = ['new', 'in_work', 'won', 'lost'];

adminRouter.patch('/admin/leads/:id', async (req, res) => {
  const patch: Record<string, unknown> = {};
  const status = req.body?.status;
  if (typeof status === 'string') {
    if (!STATUSES.includes(status as LeadStatus)) {
      res.status(400).json({ error: 'Неизвестный статус' });
      return;
    }
    patch.status = status;
  }
  if (typeof req.body?.managerNote === 'string') {
    patch.managerNote = req.body.managerNote.slice(0, 2000);
  }

  const lead = await updateLead(req.params.id, patch);
  if (!lead) {
    res.status(404).json({ error: 'Заявка не найдена' });
    return;
  }
  res.json({ lead });
});

adminRouter.delete('/admin/leads/:id', async (req, res) => {
  const removed = await deleteLead(req.params.id);
  if (!removed) {
    res.status(404).json({ error: 'Заявка не найдена' });
    return;
  }
  res.json({ ok: true });
});

/** Диалог посетителя целиком — видно, о чём он спрашивал до заявки. */
adminRouter.get('/admin/leads/:id/dialog', async (req, res) => {
  const lead = await getLead(req.params.id);
  if (!lead) {
    res.status(404).json({ error: 'Заявка не найдена' });
    return;
  }
  const session = lead.sessionId ? await getSession(lead.sessionId) : null;
  res.json({ messages: session?.messages ?? [], quizAnswers: session?.quizAnswers ?? [] });
});

const CSV_HEADERS = [
  'Дата',
  'Имя',
  'Контакт',
  'Тип контакта',
  'Источник',
  'Статус',
  'Комментарий',
  'Ответы квиза',
  'Заметка менеджера',
  'UTM',
];

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

adminRouter.get('/admin/leads-export.csv', async (req, res) => {
  const leads = await listLeads(filterFrom(req.query as Record<string, unknown>));
  const rows = leads.map((lead) =>
    [
      new Date(lead.createdAt).toLocaleString('ru-RU'),
      lead.name,
      lead.contact,
      lead.contactType,
      lead.source,
      lead.status,
      lead.comment,
      lead.quizAnswers.map((a) => `${a.question}: ${a.answer}`).join(' | '),
      lead.managerNote,
      Object.entries(lead.utm).map(([k, v]) => `${k}=${v}`).join(' '),
    ]
      .map(csvCell)
      .join(';'),
  );

  // BOM + разделитель «;» — иначе Excel на Windows открывает кириллицу кракозябрами.
  const csv = '﻿' + [CSV_HEADERS.map(csvCell).join(';'), ...rows].join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="leads-${Date.now()}.csv"`);
  res.send(csv);
});
