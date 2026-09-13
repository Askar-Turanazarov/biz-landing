/** Чтение и нормализация .env. Один источник правды по настройкам. */
import 'dotenv/config';

const bool = (v: string | undefined, fallback = false): boolean => {
  if (v === undefined || v.trim() === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(v.trim().toLowerCase());
};

const list = (v: string | undefined): string[] =>
  (v ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const num = (v: string | undefined, fallback: number): number => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const config = {
  port: num(process.env.PORT, 3001),
  frontendOrigin: process.env.FRONTEND_ORIGIN?.trim() || 'http://localhost:5173',
  publicAdminUrl: process.env.PUBLIC_ADMIN_URL?.trim() || 'http://localhost:5173/superadmin',
  isProd: process.env.NODE_ENV === 'production',

  gemini: {
    apiKey: process.env.GEMINI_API_KEY?.trim() || '',
    models: list(process.env.GEMINI_MODELS).length
      ? list(process.env.GEMINI_MODELS)
      : ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-3.6-flash'],
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY?.trim() || '',
    models: list(process.env.ANTHROPIC_MODELS).length
      ? list(process.env.ANTHROPIC_MODELS)
      : ['claude-haiku-4-5', 'claude-sonnet-5'],
  },
  llm: {
    /** Пустая строка = автоопределение по наличию ключей. */
    provider: (process.env.LLM_PROVIDER?.trim().toLowerCase() || '') as
      | ''
      | 'gemini'
      | 'anthropic'
      | 'mock',
    useMock: bool(process.env.USE_MOCK_LLM, false),
    timeoutMs: num(process.env.LLM_TIMEOUT_MS, 8000),
  },

  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN?.trim() || '',
    /**
     * Получателей может быть несколько: рабочая группа плюс личка руководителя.
     * Перечисляются через запятую, заявка уходит в каждый чат отдельным сообщением.
     */
    chatIds: list(process.env.TELEGRAM_CHAT_ID),
    // На Vercel нет постоянного процесса: бесконечный цикл getUpdates там не живёт,
    // нажатия кнопок приходят через вебхук.
    enablePolling: bool(process.env.TELEGRAM_ENABLE_POLLING, false) && !process.env.VERCEL,
    /** Секрет вебхука: Telegram присылает его в заголовке X-Telegram-Bot-Api-Secret-Token. */
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || '',
    get enabled(): boolean {
      return Boolean(this.botToken && this.chatIds.length);
    },
    /** Кнопку «Взять в работу» показываем, только если нажатия кто-то принимает. */
    get acceptsCallbacks(): boolean {
      return this.enablePolling || Boolean(this.webhookSecret);
    },
  },

  admin: {
    password: process.env.ADMIN_PASSWORD?.trim() || '',
    secret: process.env.ADMIN_SECRET?.trim() || '',
    sessionTtlMs: 12 * 60 * 60 * 1000,
  },

  /**
   * Upstash Redis для деплоя на Vercel. Интеграция Vercel может назвать переменные
   * по-своему (KV_REST_API_*), поэтому читаем оба варианта. Пусто — данные в JSON-файлах.
   */
  redis: {
    url: process.env.UPSTASH_REDIS_REST_URL?.trim() || process.env.KV_REST_API_URL?.trim() || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || process.env.KV_REST_API_TOKEN?.trim() || '',
  },
} as const;

/** Предупреждения при старте: сайт работает и без ключей, но об этом надо сказать вслух. */
export function reportConfig(): void {
  const lines: string[] = [];
  if (config.llm.useMock) lines.push('LLM: принудительный mock-режим (USE_MOCK_LLM=true)');
  else if (!config.gemini.apiKey && !config.anthropic.apiKey)
    lines.push('LLM: ключи не заданы — ассистент отвечает сценарными заготовками (mock)');
  if (!config.telegram.enabled)
    lines.push('Telegram: TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID не заданы — уведомления отключены');
  if (!config.admin.password || config.admin.password === 'change-me-please')
    lines.push('Админка: ADMIN_PASSWORD не изменён — обязательно поменяйте перед публикацией');
  if (!config.admin.secret || config.admin.secret.length < 16)
    lines.push('Админка: ADMIN_SECRET короткий или пустой — токены сессии легко подделать');
  for (const l of lines) console.warn('  ! ' + l);
}
