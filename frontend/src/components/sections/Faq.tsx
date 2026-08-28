import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { faq } from '../../site.config';
import { SectionHeading } from '../ui/SectionHeading';
import { Reveal } from '../ui/Reveal';
import { ChevronDown } from '../ui/Icons';

export function Faq({ onOpenChat }: { onOpenChat: () => void }) {
  // null = все свёрнуты. Открыт всегда только один пункт — так список читается.
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="section-pad">
      <div className="container-page grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            eyebrow="Частые вопросы"
            title={
              <>
                Отвечаем на то, <span className="text-gradient">что спрашивают чаще всего</span>
              </>
            }
            description="Не нашли свой вопрос? Спросите ИИ-помощника — он отвечает мгновенно и знает всё про сроки, цены и этапы."
          />
          <Reveal delay={0.15}>
            <button
              onClick={onOpenChat}
              className="focus-ring mt-7 rounded-full border border-white/15 bg-white/[0.03]
                         px-6 py-3 text-sm font-medium text-white transition-colors
                         hover:bg-white/[0.08]"
            >
              Задать вопрос помощнику
            </button>
          </Reveal>
        </div>

        <ul className="flex flex-col gap-3">
          {faq.map((item, index) => {
            const open = openIndex === index;
            return (
              <Reveal key={item.q} delay={index * 0.04} as="li">
                <div
                  className={`glass overflow-hidden transition-colors duration-300 ${
                    open ? 'border-white/[0.16]' : ''
                  }`}
                >
                  <h3>
                    <button
                      onClick={() => setOpenIndex(open ? null : index)}
                      aria-expanded={open}
                      className="focus-ring flex w-full items-start justify-between gap-5 p-5 text-left sm:p-6"
                    >
                      <span className="text-[0.95rem] font-semibold leading-snug text-white sm:text-base">
                        {item.q}
                      </span>
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full
                                    border border-white/10 text-slate-300 transition-transform
                                    duration-300 ${open ? 'rotate-180 bg-white/[0.06]' : ''}`}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </span>
                    </button>
                  </h3>

                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        // Анимируем height, а не display: иначе текст появляется рывком.
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 text-sm leading-relaxed text-slate-400 sm:px-6 sm:pb-6">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
