/** Публичный приём заявок: валидация, антиспам, запись, уведомление в Telegram. */
import { Router } from 'express';
import { createLead } from '../services/leadStore.js';
import { linkLead, getSession } from '../services/sessionStore.js';
import { notifyLead } from '../services/telegram.js';
import { rateLimit, clientIp } from '../middleware/rateLimit.js';
import type { ContactType, LeadSource, QuizAnswer } from '../types.js';

export const leadsRouter = Router();

// Узбекские номера длиннее российских: «+998 (90) 123-45-67» — это 19 символов,
// поэтому верхняя граница с запасом.
const PHONE_RE = /^\+?[\d\s()\-]{9,24}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const TELEGRAM_RE = /^@?[a-z0-9_]{4,32}$/i;

/** Минимальное время заполнения формы: боты отправляют мгновенно. */
const MIN_FILL_MS = 3000;

function detectContactType(value: string): ContactType | null {
  if (EMAIL_RE.test(value)) return 'email';
  if (PHONE_RE.test(value)) return 'phone';
  if (TELEGRAM_RE.test(value)) return 'telegram';
  return null;
}

function clean(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function normalizeQuiz(raw: unknown): QuizAnswer[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 12)
    .map((item) => ({
      stepId: clean((item as QuizAnswer)?.stepId, 40),
      question: clean((item as QuizAnswer)?.question, 200),
      answer: clean((item as QuizAnswer)?.answer, 200),
    }))
    .filter((a) => a.stepId && a.answer);
}

function normalizeUtm(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^utm_[a-z_]{2,20}$/i.test(key)) continue;
    const v = clean(value, 120);
    if (v) out[key] = v;
  }
  return out;
}

leadsRouter.post(
  '/leads',
  rateLimit({ windowMs: 10 * 60 * 1000, max: 5, message: 'Заявка уже отправлена. Мы свяжемся с вами.' }),
  async (req, res) => {
    const body = req.body ?? {};

    // Ловушка для ботов: поле скрыто в разметке, человек его не заполнит.
    if (clean(body.company, 100)) {
      res.status(200).json({ ok: true });
      return;
    }

    const elapsed = Number(body.elapsedMs);
    if (Number.isFinite(elapsed) && elapsed >= 0 && elapsed < MIN_FILL_MS) {
      res.status(400).json({ error: 'Форма заполнена слишком быстро. Попробуйте ещё раз.' });
      return;
    }

    const name = clean(body.name, 60);
    if (name.length < 2) {
      res.status(400).json({ error: 'Укажите имя — от 2 символов.' });
      return;
    }

    const contact = clean(body.contact, 120);
    const contactType = detectContactType(contact);
    if (!contactType) {
      res.status(400).json({ error: 'Укажите телефон, email или ник в Telegram.' });
      return;
    }

    if (body.consent !== true) {
      res.status(400).json({ error: 'Нужно согласие на обработку персональных данных.' });
      return;
    }

    const sourceRaw = clean(body.source, 10);
    const source: LeadSource = ['form', 'quiz', 'chat'].includes(sourceRaw)
      ? (sourceRaw as LeadSource)
      : 'form';

    const sessionId = clean(body.sessionId, 64) || null;

    // Ответы квиза берём из серверной сессии — она надёжнее того, что прислал клиент.
    let quizAnswers = normalizeQuiz(body.quizAnswers);
    if (sessionId) {
      const session = await getSession(sessionId);
      if (session?.quizAnswers.length) quizAnswers = session.quizAnswers;
    }

    const lead = await createLead({
      name,
      contact,
      contactType,
      source,
      comment: clean(body.comment, 1000),
      quizAnswers,
      sessionId,
      utm: normalizeUtm(body.utm),
      referrer: clean(body.referrer, 300),
      userAgent: clean(req.headers['user-agent'], 300),
      ip: clientIp(req),
    });

    if (sessionId) await linkLead(sessionId, lead.id);

    // Отвечаем сразу: Telegram не должен задерживать или ломать приём заявки.
    res.status(201).json({ ok: true, id: lead.id });
    notifyLead(lead);
  },
);
