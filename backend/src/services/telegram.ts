/**
 * Уведомления в группу отдела продаж через Bot API.
 * Библиотека не нужна — это два fetch-запроса.
 *
 * Настройка: создать бота у @BotFather, добавить его в группу, написать туда
 * любое сообщение и взять chat.id из https://api.telegram.org/bot<TOKEN>/getUpdates
 */
import { config } from '../config.js';
import { getLead, updateLead } from './leadStore.js';
import { TIMEZONE } from './knowledgeBase.js';
import type { Lead } from '../types.js';

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

function renderMessage(lead: Lead): string {
  // Время в сообщении — всегда по Ташкенту, независимо от TZ сервера.
  const when = new Date(lead.createdAt).toLocaleString('ru-RU', { timeZone: TIMEZONE });
  const rows = [
    `<b>🔔 Новая заявка — ${esc(SOURCE_LABEL[lead.source])}</b>`,
    '',
    `<b>Имя:</b> ${esc(lead.name)}`,
    `<b>Контакт:</b> ${contactLink(lead)}`,
  ];

  if (lead.comment) rows.push(`<b>Комментарий:</b> ${esc(lead.comment)}`);

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

function keyboard(lead: Lead) {
  return {
    inline_keyboard: [
      [{ text: '✅ Взять в работу', callback_data: `take:${lead.id}` }, ...adminButton()],
    ],
  };
}

async function call(method: string, payload: unknown): Promise<{ ok: boolean; result?: any }> {
  const response = await fetch(API(method), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  });
  const data = (await response.json()) as { ok: boolean; result?: any; description?: string };
  if (!data.ok) throw new Error(data.description ?? `Telegram вернул ошибку на ${method}`);
  return data;
}

/**
 * Отправка «выстрелил и забыл»: вызывается ПОСЛЕ ответа клиенту.
 * Падение Telegram не должно ломать приём заявки — фиксируем статус и повторяем один раз.
 */
export function notifyLead(lead: Lead, attempt = 1): void {
  if (!config.telegram.enabled) {
    void updateLead(lead.id, { telegramStatus: 'skipped' });
    return;
  }

  void call('sendMessage', {
    chat_id: config.telegram.chatId,
    text: renderMessage(lead),
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: keyboard(lead),
  })
    .then(async (data) => {
      await updateLead(lead.id, {
        telegramStatus: 'sent',
        telegramMessageId: data.result?.message_id ?? null,
      });
    })
    .catch(async (error) => {
      console.error(`[telegram] попытка ${attempt} не удалась:`, (error as Error).message);
      if (attempt === 1) {
        setTimeout(() => notifyLead(lead, 2), 30_000).unref();
        return;
      }
      await updateLead(lead.id, { telegramStatus: 'failed' });
    });
}

/**
 * Long polling для кнопки «Взять в работу». Включается флагом TELEGRAM_ENABLE_POLLING.
 * Вебхук не используем осознанно: на localhost он не работает без публичного туннеля.
 */
export function startPolling(): void {
  if (!config.telegram.enabled || !config.telegram.enablePolling) return;

  let offset = 0;
  let stopped = false;

  const loop = async (): Promise<void> => {
    while (!stopped) {
      try {
        const data = await call('getUpdates', { offset, timeout: 25, allowed_updates: ['callback_query'] });
        for (const update of data.result ?? []) {
          offset = update.update_id + 1;
          const query = update.callback_query;
          if (!query) continue;

          // Кнопка-заглушка «уже в работе»: гасим спиннер и идём дальше.
          if (!query.data?.startsWith('take:')) {
            await call('answerCallbackQuery', { callback_query_id: query.id }).catch(() => undefined);
            continue;
          }

          const leadId = query.data.slice('take:'.length);
          const lead = await getLead(leadId);
          const manager = query.from?.first_name ?? 'менеджер';

          if (lead) {
            await updateLead(leadId, {
              status: 'in_work',
              managerNote: lead.managerNote || `Взял в работу: ${manager} (Telegram)`,
            });
            await call('editMessageReplyMarkup', {
              chat_id: query.message.chat.id,
              message_id: query.message.message_id,
              reply_markup: {
                // callback_data, а не url: на локальном адресе Telegram
                // отклонил бы кнопку-ссылку и правка сообщения не прошла бы.
                inline_keyboard: [
                  [{ text: `✅ В работе — ${manager}`, callback_data: 'taken' }, ...adminButton()],
                ],
              },
            }).catch(() => undefined);
          }

          await call('answerCallbackQuery', {
            callback_query_id: query.id,
            text: lead ? 'Заявка отмечена как «в работе»' : 'Заявка не найдена',
          }).catch(() => undefined);
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
