import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { hero } from '../../site.config';
import { Button } from '../ui/Button';
import { Hint } from '../ui/Hint';
import { ArrowRight, Sparkles } from '../ui/Icons';
import { useCountUp } from '../../hooks/useCountUp';

interface HeroProps {
  onOpenQuiz: () => void;
  onScrollToForm: () => void;
}

export function Hero({ onOpenQuiz, onScrollToForm }: HeroProps) {
  const ref = useRef<HTMLElement>(null);

  // Параллакс первого экрана: контент уходит вверх медленнее фона и тает.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '26%']);
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  const words = hero.title.split(' ');

  return (
    <section
      ref={ref}
      id="top"
      className="relative flex min-h-[100svh] items-center overflow-hidden pt-24 pb-16 lg:pt-28"
    >
      <motion.div style={{ y, opacity }} className="container-page relative">
        <div className="max-w-4xl">
          <motion.span
            className="eyebrow"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <Sparkles className="h-3.5 w-3.5 text-accent-cyan" />
            {hero.eyebrow}
          </motion.span>

          {/* Заголовок проявляется по словам — взгляд успевает его прочитать. */}
          <h1 className="mt-7 text-display-xl">
            {words.map((word, index) => (
              <motion.span
                key={`${word}-${index}`}
                className="inline-block"
                initial={{ opacity: 0, y: 26, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.7, delay: 0.08 + index * 0.045, ease: [0.16, 1, 0.3, 1] }}
              >
                {word === 'заявки,' ? <span className="text-gradient">{word}</span> : word}
                {/* Неразрывный пробел: обычный браузер отбрасывает в конце inline-block, и слова слипаются. */}
                {' '}
              </motion.span>
            ))}
          </h1>

          <motion.p
            className="mt-7 max-w-2xl text-body-lg text-slate-400"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
          >
            {hero.subtitle}
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.58 }}
          >
            <Button size="lg" onClick={onOpenQuiz} magnetic>
              {hero.primaryCta}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={onScrollToForm}>
              {hero.secondaryCta}
            </Button>
          </motion.div>
        </div>

        <motion.dl
          className="mt-16 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-white/[0.07] pt-10
                     sm:mt-20 lg:grid-cols-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.75 }}
        >
          {hero.stats.map((stat) => (
            <HeroStat key={stat.label} {...stat} />
          ))}
        </motion.dl>
      </motion.div>
    </section>
  );
}

function HeroStat({
  value,
  suffix,
  label,
  hint,
}: {
  value: number;
  suffix: string;
  label: string;
  hint: string;
}) {
  const { ref, value: current } = useCountUp(value);

  return (
    <div className="flex flex-col gap-1.5">
      <dt className="font-display text-display-md font-extrabold text-white">
        {/* Шутка про вымышленную цифру видна только тому, кто наведёт курсор. */}
        <Hint text={hint} align="start">
          <span>
            <span ref={ref}>{current}</span>
            <span className="text-gradient">{suffix}</span>
          </span>
        </Hint>
      </dt>
      <dd className="text-sm leading-snug text-slate-500">{label}</dd>
    </div>
  );
}
