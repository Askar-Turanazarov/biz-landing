import { services } from '../../site.config';
import { formatSumFrom, formatUsdApprox } from '../../lib/price';
import { SectionHeading } from '../ui/SectionHeading';
import { Reveal } from '../ui/Reveal';
import { Card3D } from '../ui/Card3D';
import { ArrowRight, Check, ServiceGlyph } from '../ui/Icons';

export function Services({ onOpenQuiz }: { onOpenQuiz: () => void }) {
  return (
    <section id="services" className="section-pad">
      <div className="container-page">
        <SectionHeading
          eyebrow="Услуги"
          title={
            <>
              Делаем то, что <span className="text-gradient">решает задачу бизнеса</span>
            </>
          }
          description="От лендинга за три недели до веб-сервиса с личными кабинетами. Не берёмся за проект, если понимаем, что задачу дешевле закрыть другим способом."
        />

        {/* auto-fit вместо фиксированных колонок: сетка сама подстраивается
            под 360, 744 и 1440 без отдельных правил на каждый брейкпоинт. */}
        <div className="mt-14 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr))]">
          {services.map((service, index) => (
            <Reveal key={service.id} delay={index * 0.06}>
              <Card3D className="h-full">
                <article
                  className="glass relative flex h-full flex-col gap-5 p-6 transition-colors
                             duration-300 hover:border-white/[0.14] sm:p-7"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl
                                 bg-accent-soft text-accent-cyan"
                    >
                      <ServiceGlyph name={service.icon} className="h-6 w-6" />
                    </span>
                    <div className="text-right">
                      <p className="font-display text-base font-bold leading-tight text-white">
                        {formatSumFrom(service.priceFrom)}
                      </p>
                      {/* Ориентир в долларах — справочный, поэтому мельче и тусклее суммы в сумах. */}
                      <p className="text-[0.7rem] leading-tight text-slate-500">
                        {formatUsdApprox(service.priceFrom)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{service.duration}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold">{service.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{service.summary}</p>
                  </div>

                  <ul className="mt-auto flex flex-col gap-2 border-t border-white/[0.06] pt-5">
                    {service.includes.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-slate-400">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-cyan" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              </Card3D>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <button
            onClick={onOpenQuiz}
            className="focus-ring group mt-10 flex w-full items-center justify-between gap-4
                       rounded-3xl border border-white/[0.08] bg-accent-soft p-6 text-left
                       transition-colors hover:border-white/20 sm:p-8"
          >
            <div>
              <p className="font-display text-lg font-bold text-white sm:text-xl">
                Не знаете, что выбрать?
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Пять вопросов — и ИИ-помощник подберёт формат и назовёт вилку стоимости.
              </p>
            </div>
            <span
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/10
                         text-white transition-transform duration-300 group-hover:translate-x-1"
            >
              <ArrowRight className="h-5 w-5" />
            </span>
          </button>
        </Reveal>
      </div>
    </section>
  );
}
