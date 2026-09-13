/**
 * Вебхук Telegram для кнопки «Взять в работу» на Vercel, где long polling не живёт.
 * Регистрируется один раз вызовом setWebhook: url этого маршрута и secret_token,
 * равный TELEGRAM_WEBHOOK_SECRET.
 */
import { Router } from 'express';
import { config } from '../config.js';
import { safeEqual } from '../middleware/auth.js';
import { asyncRoute } from '../middleware/asyncRoute.js';
import { handleUpdate, type TelegramUpdate } from '../services/telegram.js';

export const telegramRouter = Router();

telegramRouter.post(
  '/telegram/webhook',
  asyncRoute(async (req, res) => {
    const secret = config.telegram.webhookSecret;
    const header = req.get('x-telegram-bot-api-secret-token') ?? '';

    // Без секрета маршрут закрыт: иначе любой POST-запрос мог бы брать заявки в работу.
    if (!secret || !safeEqual(header, secret)) {
      res.status(401).json({ error: 'Неверный секрет вебхука' });
      return;
    }

    // Обрабатываем до ответа: на Vercel функция живёт, пока идёт запрос.
    // Ошибку глотаем и всё равно отвечаем 200 — иначе Telegram будет слать то же обновление снова.
    await handleUpdate(req.body as TelegramUpdate).catch((error) =>
      console.error('[telegram] вебхук:', (error as Error).message),
    );
    res.json({ ok: true });
  }),
);
