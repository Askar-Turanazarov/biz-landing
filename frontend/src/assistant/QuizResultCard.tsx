import type { QuizResult } from '../lib/api';
import { formatSumFrom, formatUsdApprox } from '../lib/price';
import { RichText } from '../components/ui/RichText';
import type { QuizResultStatus } from './useAssistantStore';

/**
 * Итог подбора. Формат, цена и срок приходят с сервера числами и форматируются здесь,
 * текст под ними — пояснение ИИ. Пока модель думает, показываем заглушку, а при сбое —
 * спокойную фразу вместо ошибки.
 */
export function QuizResultCard({
  status,
  result,
}: {
  status: QuizResultStatus;
  result: QuizResult | null;
}) {
  if (status === 'idle' || status === 'loading') {
    return (
      <div aria-live="polite" className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
        <p className="text-sm text-slate-400">Подбираю решение под ваши ответы…</p>
        <div className="mt-3 h-3 w-2/3 animate-pulse rounded-full bg-white/[0.08]" />
        <div className="mt-2 h-3 w-1/2 animate-pulse rounded-full bg-white/[0.06]" />
      </div>
    );
  }

  if (status === 'failed' || !result?.service) {
    return (
      <p className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-sm leading-relaxed text-slate-300">
        Ответы получили. Менеджер подберёт формат и пришлёт расчёт в течение рабочего дня.
      </p>
    );
  }

  const { service, alternative, text } = result;

  return (
    <div aria-live="polite" className="rounded-2xl border border-accent-cyan/30 bg-accent-soft p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-accent-cyan">Вам подойдёт</p>
      <p className="mt-1.5 font-display text-lg font-bold text-white">{service.title}</p>
      <p className="mt-1 text-sm text-slate-200">
        {formatSumFrom(service.priceFrom)}{' '}
        <span className="text-slate-400">({formatUsdApprox(service.priceFrom)})</span> · {service.duration}
      </p>

      {alternative && (
        <p className="mt-2 text-xs leading-relaxed text-slate-300">
          Уложиться в бюджет: {alternative.title.toLowerCase()} — {formatSumFrom(alternative.priceFrom)},{' '}
          {alternative.duration}
        </p>
      )}

      {text && <RichText text={text} className="mt-3 text-sm leading-relaxed text-slate-300" />}
    </div>
  );
}
