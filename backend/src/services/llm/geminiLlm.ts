/** Адаптер Google Gemini через @google/genai. */
import { GoogleGenAI } from '@google/genai';
import { config } from '../../config.js';
import type { FailureKind, LlmProvider, LlmRequest } from '../../types.js';

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) client = new GoogleGenAI({ apiKey: config.gemini.apiKey });
  return client;
}

/** Достаём HTTP-статус из ошибки SDK: поле называется по-разному между версиями. */
function statusOf(error: unknown): number {
  const e = error as { status?: unknown; code?: unknown; message?: unknown };
  for (const candidate of [e?.status, e?.code]) {
    const n = Number(candidate);
    if (Number.isFinite(n) && n >= 100) return n;
  }
  const message = String(e?.message ?? '');
  const match = message.match(/\b(4\d\d|5\d\d)\b/);
  if (match) return Number(match[1]);
  if (/RESOURCE_EXHAUSTED|quota/i.test(message)) return 429;
  if (/UNAUTHENTICATED|API key/i.test(message)) return 401;
  if (/PERMISSION_DENIED/i.test(message)) return 403;
  if (/NOT_FOUND|is not found for API version/i.test(message)) return 404;
  return 0;
}

function retryDelayOf(error: unknown): number | null {
  const message = String((error as { message?: unknown })?.message ?? '');
  // Gemini кладёт подсказку в тело: "retryDelay":"27s"
  const match = message.match(/"?retryDelay"?\s*:\s*"?(\d+(?:\.\d+)?)s/i);
  if (!match) return null;
  return Math.round(Number(match[1]) * 1000);
}

export const geminiLlm: LlmProvider = {
  name: 'gemini',

  isConfigured: () => Boolean(config.gemini.apiKey),

  async generate(model, req: LlmRequest): Promise<string> {
    const response = await getClient().models.generateContent({
      model,
      contents: req.messages.map((m) => ({
        // В Gemini роль ассистента называется model.
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.text }],
      })),
      config: {
        systemInstruction: req.system,
        maxOutputTokens: req.maxTokens,
        abortSignal: req.signal,
      },
    });

    return (response.text ?? '').trim();
  },

  classifyError(error: unknown): FailureKind {
    if ((error as Error)?.name === 'AbortError')
      return { kind: 'transient', reason: 'таймаут запроса' };

    const status = statusOf(error);
    switch (true) {
      case status === 429:
        return { kind: 'cooldown', retryAfterMs: retryDelayOf(error), reason: 'лимит запросов (429)' };
      case status === 401 || status === 403:
        return { kind: 'fatal', reason: `нет доступа (${status}) — проверьте GEMINI_API_KEY` };
      case status === 404:
        return { kind: 'fatal', reason: 'модель не найдена (404) — проверьте ID в GEMINI_MODELS' };
      case status === 400:
        return { kind: 'fatal', reason: `некорректный запрос (400): ${(error as Error)?.message}` };
      case status >= 500:
        return { kind: 'transient', reason: `сервис недоступен (${status})` };
      default:
        return { kind: 'transient', reason: (error as Error)?.message ?? 'неизвестная ошибка' };
    }
  },
};
