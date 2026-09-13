import { formatSumFrom } from '../lib/price';
import {
  BUDGET_FIT_LABEL,
  DEADLINE_FIT_LABEL,
  TEMPERATURE_LABEL,
  TEMPERATURE_STYLE,
  type LeadTemperature,
  type Qualification,
} from './adminApi';

export function TemperatureBadge({
  temperature,
  className = '',
}: {
  temperature: LeadTemperature | null | undefined;
  className?: string;
}) {
  if (!temperature) return <span className={`text-slate-600 ${className}`}>—</span>;
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium
                  ${TEMPERATURE_STYLE[temperature]} ${className}`}
    >
      {TEMPERATURE_LABEL[temperature]}
    </span>
  );
}

/** Квалификация в карточке заявки: расчёт по прайсу, пометки и выжимка ИИ для менеджера. */
export function QualificationBlock({ qualification }: { qualification: Qualification | null | undefined }) {
  if (!qualification || (!qualification.match && !qualification.summary)) return null;
  const { match, summary, summaryBy, nextStep, temperature } = qualification;

  return (
    <section className="mt-7">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        Квалификация
      </h3>
      <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-sm">
        <TemperatureBadge temperature={temperature} className="self-start" />

        {match && (
          <dl className="flex flex-col gap-2 text-xs">
            <Line label="Подходит" value={`${match.service.title} · ${formatSumFrom(match.service.priceFrom)}`} />
            <Line label="Бюджет" value={BUDGET_FIT_LABEL[match.budgetFit]} />
            <Line label="Срок" value={DEADLINE_FIT_LABEL[match.deadlineFit]} />
            {match.alternative && (
              <Line
                label="Альтернатива"
                value={`${match.alternative.title} · ${formatSumFrom(match.alternative.priceFrom)}`}
              />
            )}
          </dl>
        )}

        {match && match.flags.length > 0 && (
          <ul className="flex flex-col gap-1 text-xs text-amber-200/90">
            {match.flags.map((flag) => (
              <li key={flag}>• {flag}</li>
            ))}
          </ul>
        )}

        {summary && (
          <p className="leading-relaxed text-slate-300">
            {summary}
            {summaryBy && <span className="mt-1 block text-[10px] text-slate-600">{summaryBy}</span>}
          </p>
        )}

        {nextStep && (
          <p className="text-xs text-slate-400">
            <span className="text-slate-500">Что делать: </span>
            {nextStep}
          </p>
        )}
      </div>
    </section>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="ml-auto text-right text-slate-300">{value}</dd>
    </div>
  );
}
