import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '../ui/Button';
import { ArrowRight } from '../ui/Icons';

export function FinalCta({ onOpenQuiz, onScrollToForm }: { onOpenQuiz: () => void; onScrollToForm: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });

  // Финальный аккорд: блок слегка «выезжает» и подсвечивается на подходе.
  const y = useTransform(scrollYProgress, [0, 1], ['8%', '-8%']);
  const glow = useTransform(scrollYProgress, [0, 0.5, 1], [0.2, 0.7, 0.2]);

  return (
    <section ref={ref} className="section-pad relative overflow-hidden">
      <div className="container-page">
        <motion.div style={{ y }} className="relative">
          <motion.span
            aria-hidden
            style={{ opacity: glow }}
            className="absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2
                       rounded-full bg-accent-indigo/25 blur-[110px]"
          />

          <div className="glass relative flex flex-col items-center gap-7 px-6 py-14 text-center sm:px-12 sm:py-20">
            <h2 className="max-w-3xl text-display-lg">
              Расскажите про задачу — вернёмся с{' '}
              <span className="text-gradient">планом и сметой</span>
            </h2>
            <p className="max-w-xl text-body-lg text-slate-400">
              Бесплатно: разберём задачу, предложим структуру и назовём вилку стоимости.
              Ни к чему не обязывает.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" onClick={onOpenQuiz} magnetic>
                Подобрать решение за 60 секунд
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={onScrollToForm}>
                Написать напрямую
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
