import { legal, pricing } from '../../site.config';
import { formatSumFrom, formatUsdApprox } from '../../lib/price';
import { SectionHeading } from '../ui/SectionHeading';
import { Reveal } from '../ui/Reveal';
import { Button } from '../ui/Button';
import { Check } from '../ui/Icons';

export function Pricing({ onOpenQuiz, onScrollToForm }: { onOpenQuiz: () => void; onScrollToForm: () => void }) {
  return (
    <section id="pricing" className="section-pad">
      <div className="container-page">
        <SectionHeading
          eyebrow="Стоимость"
          title={
            <>
              Три формата <span className="text-gradient">под разные задачи</span>
            </>
          }
          description="Цены стартовые: итог зависит от объёма страниц и интеграций. Точную смету называем после брифа и фиксируем в договоре."
          align="center"
        />

        <div className="mt-14 grid items-start gap-5 lg:grid-cols-3">
          {pricing.map((plan, index) => (
            <Reveal key={plan.id} delay={index * 0.08} className="h-full">
              <article
                className={`relative flex h-full flex-col gap-6 p-7 sm:p-8 ${
                  plan.highlighted
                    ? 'glass-strong border-accent-indigo/40 shadow-panel lg:-mt-4 lg:pb-12'
                    : 'glass'
                }`}
              >
                {plan.highlighted && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full
                               bg-accent-line px-4 py-1 text-xs font-bold text-ink-950"
                  >
                    Выбирают чаще всего
                  </span>
                )}

                <div>
                  <h3 className="font-display text-xl font-extrabold text-white">{plan.name}</h3>
                  <p className="mt-1.5 text-sm leading-snug text-slate-500">{plan.audience}</p>
                </div>

                <div className="border-y border-white/[0.07] py-5">
                  <p className="font-display text-2xl font-extrabold leading-tight text-white sm:text-[1.65rem]">
                    {formatSumFrom(plan.price)}
                  </p>
                  {/* Доллары — только ориентир по условному курсу, не валюта договора. */}
                  <p className="mt-0.5 text-xs text-slate-500">{formatUsdApprox(plan.price)}</p>
                  <p className="mt-2 text-sm text-slate-500">Срок: {plan.duration}</p>
                </div>

                <ul className="flex flex-col gap-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-cyan" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.highlighted ? 'primary' : 'outline'}
                  size="lg"
                  onClick={plan.highlighted ? onOpenQuiz : onScrollToForm}
                  className="mt-auto w-full"
                >
                  {plan.highlighted ? 'Рассчитать за 60 секунд' : 'Обсудить задачу'}
                </Button>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-8 flex flex-col items-center gap-2 text-center">
            <p className="text-sm text-slate-500">
              Нужен нестандартный формат? Опишите задачу — предложим решение и посчитаем смету
              бесплатно.
            </p>
            <p className="max-w-xl text-xs text-slate-600">{legal.priceNote}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
