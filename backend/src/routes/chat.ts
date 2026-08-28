/** Диалог с ассистентом: свободный чат и комментарии к шагам квиза. */
import { Router } from 'express';
import { answerQuestion, commentQuizAnswer } from '../services/llm/index.js';
import { appendMessages, ensureSession, recordQuizAnswer } from '../services/sessionStore.js';
import { rateLimit } from '../middleware/rateLimit.js';

export const chatRouter = Router();

const chatLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  message: 'Слишком много сообщений подряд. Передохните минуту.',
});

const clean = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

chatRouter.post('/chat', chatLimit, async (req, res) => {
  const sessionId = clean(req.body?.sessionId, 64);
  const message = clean(req.body?.message, 1000);

  if (!sessionId) {
    res.status(400).json({ error: 'Не передан sessionId' });
    return;
  }
  if (!message) {
    res.status(400).json({ error: 'Пустое сообщение' });
    return;
  }

  const session = await ensureSession(sessionId);
  const { text, model } = await answerQuestion(session.messages, message);
  const now = new Date().toISOString();

  await appendMessages(sessionId, [
    { role: 'user', text: message, at: now },
    { role: 'assistant', text, at: new Date().toISOString(), model },
  ]);

  res.json({ reply: text });
});

chatRouter.post('/quiz/step', chatLimit, async (req, res) => {
  const sessionId = clean(req.body?.sessionId, 64);
  const stepId = clean(req.body?.stepId, 40);
  const question = clean(req.body?.question, 200);
  const answer = clean(req.body?.answer, 200);

  if (!sessionId || !stepId || !answer) {
    res.status(400).json({ error: 'Нужны sessionId, stepId и answer' });
    return;
  }

  await recordQuizAnswer(sessionId, { stepId, question, answer });
  const { text, model } = await commentQuizAnswer(question, answer);

  await appendMessages(sessionId, [
    { role: 'user', text: `${question} — ${answer}`, at: new Date().toISOString() },
    { role: 'assistant', text, at: new Date().toISOString(), model },
  ]);

  res.json({ comment: text });
});
