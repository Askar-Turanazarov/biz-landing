import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { benefits } from '../../site.config';
import { SectionHeading } from '../ui/SectionHeading';
import { Reveal } from '../ui/Reveal';

export function Benefits() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });

  // Два слоя движутся с разной скоростью — это и создаёт ощущение глубины.
  const slowY = useTransform(scrollYProgress, [0, 1], ['6%', '-6%']);
  const fastY = useTransform(scrollYProgress, [0, 1], ['12%', '-12%']);

  return (
    <section ref={ref} id="benefits" className="section-pad relative">
      <div className="container-page">
        <SectionHeading
          eyebrow="Почему мы"
          title={
            <>
              Шесть причин, по которым с нами <span className="text-gradient">спокойно</span>
            </>
          }
          description="Мы не обещаем «космос за три дня». Обещаем предсказуемость: понятные сроки, зафиксированную смету и прогресс, который видно каждую неделю."
        />

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              // Нечётные карточки движутся быстрее — сетка «дышит» при прокрутке.
              style={{ y: index % 2 === 0 ? slowY : fastY }}
            >
              <Reveal delay={index * 0.05} className="h-full">
                <article
                  className="glass group relative flex h-full flex-col gap-4 overflow-hidden p-6
                             transition-colors duration-300 hover:border-white/[0.14] sm:p-7"
                >
                  {/* Крупная метрика — якорь для взгляда при беглом просмотре. */}
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-3xl font-extrabold text-gradient">
                      {benefit.metric}
                    </span>
                    <span className="text-xs uppercase tracking-wider text-slate-500">
                      {benefit.metricLabel}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold leading-snug">{benefit.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-400">{benefit.text}</p>

                  <span
                    aria-hidden
                    className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-accent-indigo/10
                               blur-2xl transition-opacity duration-500 group-hover:opacity-100
                               opacity-0"
                  />
                </article>
              </Reveal>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
