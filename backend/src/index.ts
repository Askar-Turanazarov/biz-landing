/** Точка входа backend: Express, роуты, статика собранного фронтенда. */
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { config, reportConfig } from './config.js';
import { leadsRouter } from './routes/leads.js';
import { chatRouter } from './routes/chat.js';
import { adminRouter } from './routes/admin.js';
import { telegramRouter } from './routes/telegram.js';
import { chainStatus } from './services/llm/index.js';
import { storageKind } from './services/store.js';
import { startPolling } from './services/telegram.js';

const here = dirname(fileURLToPath(import.meta.url));
const app = express();

app.set('trust proxy', 1);
app.use(cors({ origin: config.frontendOrigin, credentials: true }));
app.use(express.json({ limit: '200kb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    llm: chainStatus(),
    telegram: config.telegram.enabled ? 'настроен' : 'отключён',
    telegramButtons: config.telegram.webhookSecret
      ? 'вебхук'
      : config.telegram.enablePolling
        ? 'polling'
        : 'выключены',
    storage: storageKind(),
  });
});

app.use('/api', leadsRouter);
app.use('/api', chatRouter);
app.use('/api', telegramRouter);
app.use('/api', adminRouter);

// Локальная прод-сборка: отдаём собранный фронтенд отсюда же. На Vercel фронтенд —
// отдельный проект, и эта ветка не срабатывает.
const frontendDist = resolve(here, '../../frontend/dist');
if (existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(resolve(frontendDist, 'index.html'));
  });
}

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.listen(config.port, () => {
  console.log(`\n  ORBIT backend → http://localhost:${config.port}`);
  reportConfig();
  console.log('');
  startPolling();
});
