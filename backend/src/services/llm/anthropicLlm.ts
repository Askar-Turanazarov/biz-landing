/** Адаптер Claude. Ретраи SDK отключены: переключением моделей управляет modelChain. */
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../config.js';
import type { FailureKind, LlmProvider, LlmRequest } from '../../types.js';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: config.anthropic.apiKey,
      // 0 — встроенный backoff SDK вставил бы паузу, которой мы избегаем:
      // вместо ожидания мы мгновенно уходим на следующую модель цепочки.
      maxRetries: 0,
    });
  }
  return client;
}

/** retry-after приходит либо как Headers, либо как обычный объект — зависит от версии SDK. */
function readRetryAfter(err: unknown): number | null {
  const headers = (err as { headers?: unknown }).headers;
  if (!headers) return null;
  let raw: string | null = null;
  if (typeof (headers as Headers).get === 'function') {
    raw = (headers as Headers).get('retry-after');
  } else if (typeof headers === 'object') {
    const rec = headers as Record<string, string>;
    raw = rec['retry-after'] ?? rec['Retry-After'] ?? null;
  }
  const seconds = Number(raw);
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : null;
}

export const anthropicLlm: LlmProvider = {
  name: 'anthropic',

  isConfigured: () => Boolean(config.anthropic.apiKey),

  async generate(model, req: LlmRequest): Promise<string> {
    const response = await getClient().messages.create(
      {
        model,
        max_tokens: req.maxTokens,
        system: req.system,
        // Никакого thinking: для ответов по прайсу и срокам reasoning только тормозит.
        messages: req.messages.map((m) => ({
          role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
          content: m.text,
        })),
      },
      { signal: req.signal },
    );

    return response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim();
  },

  classifyError(error: unknown): FailureKind {
    // Порядок важен: от частного к общему. APIConnectionError наследует APIError.
    if (error instanceof Anthropic.NotFoundError)
      return { kind: 'fatal', reason: 'модель не найдена (404) — проверьте ID модели' };
    if (error instanceof Anthropic.AuthenticationError)
      return { kind: 'fatal', reason: 'неверный ANTHROPIC_API_KEY (401)' };
    if (error instanceof Anthropic.PermissionDeniedError)
      return { kind: 'fatal', reason: 'нет доступа к модели (403)' };
    if (error instanceof Anthropic.BadRequestError)
      return { kind: 'fatal', reason: `некорректный запрос (400): ${error.message}` };
    if (error instanceof Anthropic.RateLimitError)
      return { kind: 'cooldown', retryAfterMs: readRetryAfter(error), reason: 'лимит запросов (429)' };
    if (error instanceof Anthropic.APIConnectionError)
      return { kind: 'transient', reason: 'обрыв соединения' };
    if (error instanceof Anthropic.APIError) {
      const status = error.status ?? 0;
      if (status >= 500) return { kind: 'transient', reason: `сервис недоступен (${status})` };
      return { kind: 'fatal', reason: `ошибка API (${status}): ${error.message}` };
    }
    return { kind: 'transient', reason: (error as Error)?.message ?? 'неизвестная ошибка' };
  },
};
