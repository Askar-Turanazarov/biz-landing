import { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { process } from '../../site.config';
import { SectionHeading } from '../ui/SectionHeading';
import { Reveal } from '../ui/Reveal';

export function Process() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 60%'] });

  // Линия прогресса заполняется по мере прокрутки секции.
  const lineScale = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.4 });
  const lineOpacity = useTransform(scrollYProgress, [0, 0.08], [0, 1]);

  return (
    <section id="process" className="section-pad relative">
      <div className="container-page">
        <SectionHeading
          eyebrow="Как мы работаем"
          title={
            <>
              Четыре этапа, <span className="text-gradient">без сюрпризов</span>
            </>
          }
          description="После каждого этапа у вас на руках конкретный результат, а не обещание. Смета фиксируется на втором шаге и дальше не меняется."
        />

        <div ref={ref} className="relative mt-14">
          {/* Вертикальная линия слева на десктопе, скрыта на узких экранах. */}
          <div
            aria-hidden
            className="absolute left-[27px] top-2 hidden h-[calc(100%-2rem)] w-px bg-white/[0.08] lg:block"
          >
            <motion.div
              className="h-full w-full origin-top bg-accent-line"
              style={{ scaleY: lineScale, opacity: lineOpacity }}
            />
          </div>

          <ol className="flex flex-col gap-5 lg:gap-8">
            {process.map((item, index) => (
              <Reveal key={item.step} delay={index * 0.06} direction="left">
                <li className="relative lg:pl-20">
                  <span
                    aria-hidden
                    className="absolute left-0 top-6 hidden h-14 w-14 place-items-center rounded-2xl
                               border border-white/10 bg-ink-900 font-display text-lg font-extrabold
                               text-gradient lg:grid"
                  >
                    {item.step}
                  </span>

                  <div
                    className="glass flex flex-col gap-4 p-6 transition-colors duration-300
                               hover:border-white/[0.14] sm:p-7 lg:flex-row lg:items-center lg:gap-8"
                  >
                    <div className="lg:flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-display text-sm font-extrabold text-gradient lg:hidden">
                          {item.step}
                        </span>
                        <h3 className="text-xl font-bold">{item.title}</h3>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.text}</p>
                    </div>

                    <div className="flex shrink-0 flex-col gap-1 border-t border-white/[0.06] pt-4 lg:w-64 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                      <span className="text-xs uppercase tracking-wider text-slate-500">
                        {item.duration}
                      </span>
                      <span className="text-sm font-medium text-slate-200">{item.deliverable}</span>
                    </div>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
