/**
 * Уведомления в группу отдела продаж через Bot API.
 * Библиотека не нужна — это несколько fetch-запросов.
 *
 * Настройка: создать бота у @BotFather, добавить его в группу, написать туда
 * любое сообщение и взять chat.id из https://api.telegram.org/bot<TOKEN>/getUpdates
 */
import { request } from 'node:https';
import { config } from '../config.js';
import { getLead, updateLead } from './leadStore.js';
import { TIMEZONE, priceLabel } from './knowledgeBase.js';
import type { BudgetFit, DeadlineFit, Lead, LeadTemperature } from '../types.js';

const API = (method: string) => `https://api.telegram.org/bot${config.telegram.botToken}/${method}`;

const SOURCE_LABEL: Record<Lead['source'], string> = {
  form: 'Форма на сайте',
  quiz: 'Квиз ИИ-помощника',
  chat: 'Чат с ИИ-помощником',
};

const STATUS_LABEL: Record<Lead['status'], string> = {
  new: 'Новая',
  in_work: 'В работе',
  won: 'Успех',
  lost: 'Отказ',
};

const TEMPERATURE_TITLE: Record<LeadTemperature, string> = {
  hot: '🔥 Горячая заявка',
  warm: '🟡 Тёплая заявка',
  cold: '❄️ Холодная заявка',
};

const BUDGET_LABEL: Record<BudgetFit, string> = {
  ok: '✅ укладывается',
  close: '≈ у нижней границы',
  low: '❌ ниже стартовой цены',
  unknown: '❔ не назван',
};

const DEADLINE_LABEL: Record<DeadlineFit, string> = {
  ok: '✅ реалистичный',
  tight: '⚠️ жёсткий',
  unknown: '❔ не указан',
};

/** Повтор отправки тем чатам, что не приняли сообщение с первого раза. */
const RETRY_DELAY_MS = 30_000;

/** Telegram ломается на сырых <, > и & в HTML-разметке. */
function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function contactLink(lead: Lead): string {
  const value = esc(lead.contact);
  switch (lead.contactType) {
    case 'phone':
      return `<a href="tel:${lead.contact.replace(/[^\d+]/g, '')}">${value}</a>`;
    case 'telegram':
      return `<a href="https://t.me/${lead.contact.replace(/^@/, '')}">${value}</a>`;
    default:
      return `<a href="mailto:${value}">${value}</a>`;
  }
}

/** Блок квалификации: расчёт по прайсу и выжимка ИИ. Текст модели экранируем, как и всё остальное. */
function renderQualification(lead: Lead): string[] {
  const q = lead.qualification;
  if (!q || (!q.match && !q.summary)) return [];

  const rows = ['', '<b>Квалификация</b>'];
  const m = q.match;
  if (m) {
    rows.push(
      `Подходит: ${esc(m.service.title)} — ${esc(priceLabel(m.service.priceFrom))}, ${esc(m.service.duration)}`,
    );
    if (m.inferred) rows.push('<i>Формат клиент не выбрал — подобран по цели.</i>');
    rows.push(`Бюджет: ${BUDGET_LABEL[m.budgetFit]} · Срок: ${DEADLINE_LABEL[m.deadlineFit]}`);
    if (m.alternative) {
      rows.push(`Альтернатива: ${esc(m.alternative.title)} — ${esc(priceLabel(m.alternative.priceFrom))}`);
    }
  }
  if (q.summary) rows.push(`<b>Резюме ИИ:</b> ${esc(q.summary)}`);
  if (q.nextStep) rows.push(`<b>Что делать:</b> ${esc(q.nextStep)}`);
  return rows;
}

function renderMessage(lead: Lead): string {
  // Время в сообщении — всегда по Ташкенту, независимо от TZ сервера.
  const when = new Date(lead.createdAt).toLocaleString('ru-RU', { timeZone: TIMEZONE });
  const temperature = lead.qualification?.temperature;
  const title = temperature ? TEMPERATURE_TITLE[temperature] : '🔔 Новая заявка';
  const rows = [
    `<b>${title} — ${esc(SOURCE_LABEL[lead.source])}</b>`,
    '',
    `<b>Имя:</b> ${esc(lead.name)}`,
    `<b>Контакт:</b> ${contactLink(lead)}`,
  ];

  if (lead.comment) rows.push(`<b>Комментарий:</b> ${esc(lead.comment)}`);

  rows.push(...renderQualification(lead));

  if (lead.quizAnswers.length) {
    rows.push('', '<b>Ответы квиза:</b>');
    for (const a of lead.quizAnswers) rows.push(`• ${esc(a.question)} — <i>${esc(a.answer)}</i>`);
  }

  const utm = Object.entries(lead.utm);
  if (utm.length) {
    rows.push('', `<b>UTM:</b> ${utm.map(([k, v]) => `${esc(k)}=${esc(v)}`).join(', ')}`);
  }
  if (lead.referrer) rows.push(`<b>Источник перехода:</b> ${esc(lead.referrer)}`);

  rows.push('', `<i>${when} (Ташкент) · статус: ${STATUS_LABEL[lead.status]}</i>`);
  return rows.join('\n');
}

/**
 * Telegram принимает в кнопках только публичные адреса: на localhost и на
 * приватные подсети он отвечает «Wrong HTTP URL» и роняет всю отправку.
 * В дев-режиме PUBLIC_ADMIN_URL всегда локальный, поэтому кнопку-ссылку
 * добавляем только когда адрес действительно доступен извне.
 */
function isPubliclyReachable(rawUrl: string): boolean {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;

  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return false;
  if (host === '::1' || host === '0.0.0.0') return false;
  if (/^127\./.test(host)) return false;
  if (/^10\./.test(host)) return false;
  if (/^192\.168\./.test(host)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;

  return true;
}

function adminButton() {
  return isPubliclyReachable(config.publicAdminUrl)
    ? [{ text: '🗂 Открыть в админке', url: config.publicAdminUrl }]
    : [];
}

/** Кнопка «Взять в работу» есть, только если нажатия кто-то принимает: polling или вебхук. */
function keyboard(lead: Lead) {
  const take = config.telegram.acceptsCallbacks
    ? [{ text: '✅ Взять в работу', callback_data: `take:${lead.id}` }]
    : [];
  const row = [...take, ...adminButton()];
  return row.length ? { inline_keyboard: [row] } : undefined;
}

/** Сколько секунд Telegram держит соединение открытым в getUpdates. */
const LONG_POLL_SECONDS = 25;

async function call(
  method: string,
  payload: unknown,
  timeoutMs = 10_000,
): Promise<{ ok: boolean; result?: any }> {
  const response = await fetch(API(method), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const data = (await response.json()) as { ok: boolean; result?: any; description?: string };
  if (!data.ok) throw new Error(data.description ?? `Telegram вернул ошибку на ${method}`);
  return data;
}

async function sendTo(chatId: string, lead: Lead): Promise<number | null> {
  const data = await call('sendMessage', {
    chat_id: chatId,
    text: renderMessage(lead),
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: keyboard(lead),
  });
  return data.result?.message_id ?? null;
}

/**
 * Отправка менеджерам. Вызывается ПОСЛЕ ответа клиенту: падение Telegram не должно
 * ломать приём заявки.
 *
 * Получателей может быть несколько (группа + личка). Шлём во все параллельно, а через
 * 30 с повторяем только тем чатам, что не приняли сообщение: успешные адресаты не должны
 * получить дубль из-за чужой ошибки. Возвращает Promise, чтобы на Vercel его можно было
 * отдать в waitUntil и функция не остановилась раньше времени.
 */
export async function notifyLead(lead: Lead): Promise<void> {
  if (!config.telegram.enabled) {
    await updateLead(lead.id, { telegramStatus: 'skipped' });
    return;
  }

  let pending = config.telegram.chatIds;
  let delivered = false;

  for (let attempt = 1; attempt <= 2 && pending.length; attempt += 1) {
    if (attempt > 1) await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));

    const chats = pending;
    const results = await Promise.allSettled(chats.map((chatId) => sendTo(chatId, lead)));

    const failed: string[] = [];
    const sent: string[] = [];
    let firstMessageId: number | null = null;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        sent.push(chats[index]);
        firstMessageId ??= result.value;
        return;
      }
      failed.push(chats[index]);
      console.error(`[telegram] чат ${chats[index]}, попытка ${attempt}: ${(result.reason as Error).message}`);
    });

    // Явно пишем адресатов: иначе при нескольких чатах непонятно, куда заявка дошла.
    if (sent.length) {
      console.log(`[telegram] заявка ${lead.id} доставлена в: ${sent.join(', ')}`);
      if (!delivered) {
        await updateLead(lead.id, { telegramStatus: 'sent', telegramMessageId: firstMessageId });
      }
      delivered = true;
    }

    pending = failed;
  }

  // Ни один адресат так и не принял заявку — помечаем как неудачу.
  if (!delivered) await updateLead(lead.id, { telegramStatus: 'failed' });
}

interface TelegramCallbackQuery {
  id: string;
  data?: string;
  from?: { first_name?: string };
  message?: { chat: { id: number }; message_id: number };
}

export interface TelegramUpdate {
  update_id: number;
  callback_query?: TelegramCallbackQuery;
}

/** Нажатие кнопки под заявкой. Одна логика для long polling (localhost) и вебхука (Vercel). */
export async function handleUpdate(update: TelegramUpdate): Promise<void> {
  const query = update.callback_query;
  if (!query) return;

  // Кнопка-заглушка «уже в работе»: гасим спиннер и выходим.
  if (!query.data?.startsWith('take:')) {
    await call('answerCallbackQuery', { callback_query_id: query.id }).catch(() => undefined);
    return;
  }

  const leadId = query.data.slice('take:'.length);
  const lead = await getLead(leadId);
  const manager = query.from?.first_name ?? 'менеджер';

  if (lead) {
    await updateLead(leadId, {
      status: 'in_work',
      managerNote: lead.managerNote || `Взял в работу: ${manager} (Telegram)`,
    });
    if (query.message) {
      await call('editMessageReplyMarkup', {
        chat_id: query.message.chat.id,
        message_id: query.message.message_id,
        reply_markup: {
          // callback_data, а не url: на локальном адресе Telegram
          // отклонил бы кнопку-ссылку и правка сообщения не прошла бы.
          inline_keyboard: [[{ text: `✅ В работе — ${manager}`, callback_data: 'taken' }, ...adminButton()]],
        },
      }).catch(() => undefined);
    }
  }

  await call('answerCallbackQuery', {
    callback_query_id: query.id,
    text: lead ? 'Заявка отмечена как «в работе»' : 'Заявка не найдена',
  }).catch(() => undefined);
}

/**
 * getUpdates для long polling идёт через node:https, а не через fetch.
 * В Node 26 (undici 8) POST-запрос fetch к тому же хосту ждёт, пока завершится уже открытый
 * POST long polling: sendMessage не укладывался в свой таймаут, и заявки не доходили до чатов.
 * Отдельный https-запрос не делит с fetch пул соединений.
 */
function pollUpdates(offset: number): Promise<TelegramUpdate[]> {
  const body = JSON.stringify({ offset, timeout: LONG_POLL_SECONDS, allowed_updates: ['callback_query'] });

  return new Promise((resolve, reject) => {
    const req = request(
      {
        host: 'api.telegram.org',
        path: `/bot${config.telegram.botToken}/getUpdates`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        // Таймаут обязан быть больше окна long polling, иначе запрос обрывается раньше ответа.
        timeout: (LONG_POLL_SECONDS + 10) * 1000,
      },
      (res) => {
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', (chunk: string) => (raw += chunk));
        res.on('end', () => {
          try {
            const data = JSON.parse(raw) as { ok: boolean; result?: TelegramUpdate[]; description?: string };
            if (data.ok) resolve(data.result ?? []);
            else reject(new Error(data.description ?? 'Telegram вернул ошибку на getUpdates'));
          } catch (error) {
            reject(error);
          }
        });
      },
    );
    req.on('timeout', () => req.destroy(new Error('таймаут getUpdates')));
    req.on('error', reject);
    req.end(body);
  });
}

/**
 * Long polling для кнопки «Взять в работу» на localhost. Включается флагом TELEGRAM_ENABLE_POLLING.
 * На Vercel вместо него работает вебхук: там нет процесса, который жил бы между запросами.
 */
export function startPolling(): void {
  if (!config.telegram.enabled || !config.telegram.enablePolling) return;

  let offset = 0;
  let stopped = false;

  const loop = async (): Promise<void> => {
    while (!stopped) {
      try {
        for (const update of await pollUpdates(offset)) {
          offset = update.update_id + 1;
          await handleUpdate(update);
        }
      } catch (error) {
        console.error('[telegram] polling:', (error as Error).message);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  };

  console.log('[telegram] long polling запущен');
  void loop();

  process.once('SIGINT', () => {
    stopped = true;
  });
}
