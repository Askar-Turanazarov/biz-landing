/**
 * Цепочка моделей с бесшовным переключением.
 *
 * Правило: посетитель никогда не видит ошибку и не ждёт лишнего. Поэтому
 * при любой неудаче мы НЕ засыпаем и НЕ ретраим ту же модель — сразу берём
 * следующую запись цепочки. Проблемная запись уходит в cooldown (429, 5xx)
 * или выключается навсегда (битый ключ, несуществующая модель).
 */
import { config } from '../../config.js';
import { anthropicLlm } from './anthropicLlm.js';
import { geminiLlm } from './geminiLlm.js';
import type { LlmProvider, LlmRequest } from '../../types.js';

interface Entry {
  provider: LlmProvider;
  model: string;
  /** До этого момента запись пропускается. */
  cooldownUntil: number;
  /** Выключена до перезапуска процесса: конфигурация заведомо битая. */
  disabled: boolean;
  disabledReason: string;
  consecutiveFailures: number;
  successes: number;
}

/** Шаги cooldown при 429 без заголовка retry-after. */
const COOLDOWN_LADDER_MS = [30_000, 120_000, 600_000];
const TRANSIENT_COOLDOWN_MS = 20_000;

let entries: Entry[] | null = null;

function buildChain(): Entry[] {
  const built: Entry[] = [];
  const add = (provider: LlmProvider, models: string[]) => {
    if (!provider.isConfigured()) return;
    for (const model of models) {
      built.push({
        provider,
        model,
        cooldownUntil: 0,
        disabled: false,
        disabledReason: '',
        consecutiveFailures: 0,
        successes: 0,
      });
    }
  };

  // Явный выбор провайдера в .env перекрывает автоопределение по ключам.
  const forced = config.llm.provider;
  if (forced === 'gemini') add(geminiLlm, config.gemini.models);
  else if (forced === 'anthropic') add(anthropicLlm, config.anthropic.models);
  else if (forced !== 'mock') {
    add(geminiLlm, config.gemini.models);
    add(anthropicLlm, config.anthropic.models);
  }

  return built;
}

function chain(): Entry[] {
  if (!entries) {
    entries = config.llm.useMock ? [] : buildChain();
    if (entries.length) {
      console.log(
        `[llm] цепочка моделей: ${entries.map((e) => `${e.provider.name}/${e.model}`).join(' → ')}`,
      );
    } else {
      console.log('[llm] активных моделей нет — ассистент работает на сценарных ответах');
    }
  }
  return entries;
}

function available(entry: Entry, now: number): boolean {
  return !entry.disabled && entry.cooldownUntil <= now;
}

function markFailure(entry: Entry, error: unknown): void {
  const failure = entry.provider.classifyError(error);
  entry.consecutiveFailures += 1;
  const label = `${entry.provider.name}/${entry.model}`;

  if (failure.kind === 'fatal') {
    entry.disabled = true;
    entry.disabledReason = failure.reason;
    console.warn(`[llm] ${label} отключена до перезапуска: ${failure.reason}`);
    return;
  }

  const ladderIndex = Math.min(entry.consecutiveFailures - 1, COOLDOWN_LADDER_MS.length - 1);
  const waitMs =
    failure.kind === 'cooldown'
      ? (failure.retryAfterMs ?? COOLDOWN_LADDER_MS[ladderIndex])
      : TRANSIENT_COOLDOWN_MS;

  entry.cooldownUntil = Date.now() + waitMs;
  console.warn(`[llm] ${label} пауза ${Math.round(waitMs / 1000)} с: ${failure.reason}`);
}

export interface ChainResult {
  text: string;
  /** Какая модель ответила, либо 'mock' если сработал запасной сценарий. */
  model: string;
}

/**
 * Прогоняет запрос по цепочке. Возвращает null, если все записи недоступны —
 * вызывающая сторона подставляет сценарный ответ.
 */
export async function runChain(req: Omit<LlmRequest, 'signal'>): Promise<ChainResult | null> {
  const list = chain();
  const now = Date.now();
  const candidates = list.filter((e) => available(e, now));

  for (const entry of candidates) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.llm.timeoutMs);
    try {
      const text = await entry.provider.generate(entry.model, { ...req, signal: controller.signal });
      if (!text) throw new Error('пустой ответ модели');
      entry.consecutiveFailures = 0;
      entry.successes += 1;
      return { text, model: `${entry.provider.name}/${entry.model}` };
    } catch (error) {
      markFailure(entry, error);
      // Никакой паузы: сразу пробуем следующую запись цепочки.
    } finally {
      clearTimeout(timer);
    }
  }

  if (list.length) {
    console.warn('[llm] все модели недоступны — отвечаем сценарной заготовкой');
  }
  return null;
}

/** Состояние цепочки для /api/health — удобно смотреть на уроке. */
export function chainStatus() {
  const now = Date.now();
  const list = chain();
  return {
    mock: list.length === 0,
    active: list.find((e) => available(e, now))
      ? `${list.find((e) => available(e, now))!.provider.name}/${list.find((e) => available(e, now))!.model}`
      : null,
    models: list.map((e) => ({
      model: `${e.provider.name}/${e.model}`,
      state: e.disabled ? 'disabled' : e.cooldownUntil > now ? 'cooldown' : 'ready',
      cooldownSeconds: e.cooldownUntil > now ? Math.ceil((e.cooldownUntil - now) / 1000) : 0,
      reason: e.disabledReason || undefined,
      successes: e.successes,
    })),
  };
}
