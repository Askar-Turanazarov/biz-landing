import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { company } from '../../site.config';
import { Phone, Sparkles } from '../ui/Icons';

/**
 * Липкая панель действий на телефонах: звонок и запуск подбора всегда под рукой.
 * Появляется только после первого экрана, чтобы не перекрывать hero,
 * и прячется, когда открыт помощник.
 */
export function MobileCta({ onOpenQuiz, hidden }: { onOpenQuiz: () => void; hidden: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handle = () => setVisible(window.scrollY > window.innerHeight * 0.85);
    handle();
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, []);

  return (
    <AnimatePresence>
      {visible && !hidden && (
        <motion.div
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-white/[0.08]
                     bg-ink-950/90 px-4 pt-3 backdrop-blur-xl md:hidden"
        >
          <div className="flex items-center gap-3">
            <a
              href={company.phoneHref}
              className="focus-ring grid h-12 w-12 shrink-0 place-items-center rounded-full
                         border border-white/12 text-white"
              aria-label={`Позвонить ${company.phone}`}
            >
              <Phone className="h-5 w-5" />
            </a>
            <button
              onClick={onOpenQuiz}
              className="focus-ring flex h-12 flex-1 items-center justify-center gap-2 rounded-full
                         bg-accent-line text-sm font-semibold text-ink-950"
            >
              <Sparkles className="h-4 w-4" />
              Рассчитать стоимость
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
