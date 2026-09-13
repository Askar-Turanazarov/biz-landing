/** Диалог с ассистентом: свободный чат, комментарии к шагам квиза и итог подбора. */
import { Router } from 'express';
import { answerQuestion, commentQuizAnswer, quizResultText } from '../services/llm/index.js';
import { appendMessages, ensureSession, recordQuizAnswers } from '../services/sessionStore.js';
import { normalizeQuizAnswers, qualify } from '../services/qualification.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { asyncRoute } from '../middleware/asyncRoute.js';

export const chatRouter = Router();

const chatLimit = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  message: 'Слишком много сообщений подряд. Передохните минуту.',
});

const clean = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

chatRouter.post(
  '/chat',
  chatLimit,
  asyncRoute(async (req, res) => {
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
  }),
);

chatRouter.post(
  '/quiz/step',
  chatLimit,
  asyncRoute(async (req, res) => {
    const sessionId = clean(req.body?.sessionId, 64);
    const [answer] = normalizeQuizAnswers([req.body]);

    if (!sessionId || !answer) {
      res.status(400).json({ error: 'Нужны sessionId, stepId и answer' });
      return;
    }

    const session = await recordQuizAnswers(sessionId, [answer]);
    const previous = session.quizAnswers.filter((a) => a.stepId !== answer.stepId);
    const { text, model } = await commentQuizAnswer(answer.question, answer.answer, previous);

    await appendMessages(sessionId, [
      { role: 'user', text: `${answer.question} — ${answer.answer}`, at: new Date().toISOString() },
      { role: 'assistant', text, at: new Date().toISOString(), model },
    ]);

    res.json({ comment: text });
  }),
);

/**
 * Итог квиза. Формат и цифры считает код, модель только объясняет выбор.
 * Все ответы приходят разом и пишутся в сессию: так нет гонки с последним шагом,
 * а заявка потом возьмёт ответы из сессии, а не из клиентского payload.
 */
chatRouter.post(
  '/quiz/result',
  chatLimit,
  asyncRoute(async (req, res) => {
    const sessionId = clean(req.body?.sessionId, 64);
    if (!sessionId) {
      res.status(400).json({ error: 'Не передан sessionId' });
      return;
    }

    const answers = normalizeQuizAnswers(req.body?.answers);
    const session = answers.length
      ? await recordQuizAnswers(sessionId, answers)
      : await ensureSession(sessionId);

    const match = qualify(session.quizAnswers);
    if (!match) {
      res.json({ text: '', service: null, alternative: null, budgetFit: 'unknown', deadlineFit: 'unknown' });
      return;
    }

    const { text, model } = await quizResultText(match, session.quizAnswers);
    await appendMessages(sessionId, [{ role: 'assistant', text, at: new Date().toISOString(), model }]);

    res.json({
      text,
      service: match.service,
      alternative: match.alternative,
      budgetFit: match.budgetFit,
      deadlineFit: match.deadlineFit,
    });
  }),
);
