import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { company, nav } from '../../site.config';
import { Button } from '../ui/Button';
import { Close, Menu, Phone } from '../ui/Icons';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function Header({ onOpenAssistant }: { onOpenAssistant: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useLockBodyScroll(menuOpen);

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 24);
    handle();
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, []);

  const go = (id: string) => {
    setMenuOpen(false);
    // Ждём закрытия меню, иначе прокрутка конфликтует со снятием блокировки body.
    requestAnimationFrame(() => scrollToSection(id));
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
          scrolled ? 'border-b border-white/[0.07] bg-ink-950/80 backdrop-blur-xl' : ''
        }`}
      >
        <div className="container-page flex h-16 items-center justify-between gap-6 lg:h-20">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="focus-ring flex items-center gap-2.5 rounded-full"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-line text-sm font-extrabold text-ink-950">
              O
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight text-white">
              {company.name}
            </span>
          </a>

          <nav className="hidden items-center gap-1 lg:flex">
            {nav.map((item) => (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                className="focus-ring whitespace-nowrap rounded-full px-3.5 py-2 text-sm
                           text-slate-400 transition-colors hover:text-white"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Узбекский номер длиннее российского: до 1280 он вместе с меню
                и кнопкой не помещается в строку и переносится. */}
            <a
              href={company.phoneHref}
              className="focus-ring hidden items-center gap-2 whitespace-nowrap rounded-full px-3
                         py-2 text-sm font-medium text-slate-300 transition-colors
                         hover:text-white tab:flex lg:hidden xl:flex"
            >
              <Phone className="h-4 w-4" />
              {company.phone}
            </a>
            <Button onClick={onOpenAssistant} size="md" className="hidden xs:inline-flex" magnetic>
              Обсудить проект
            </Button>
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Открыть меню"
              className="focus-ring grid h-10 w-10 place-items-center rounded-full
                         border border-white/10 text-white lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Выдвижное меню на планшетах и телефонах. */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
            <motion.nav
              className="glass-strong absolute inset-y-0 right-0 flex w-[min(22rem,86vw)] flex-col gap-2
                         rounded-l-3xl rounded-r-none p-6 pt-8"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="font-display text-lg font-bold text-white">Меню</span>
                <button
                  onClick={() => setMenuOpen(false)}
                  aria-label="Закрыть меню"
                  className="focus-ring grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white"
                >
                  <Close className="h-5 w-5" />
                </button>
              </div>

              {nav.map((item) => (
                <button
                  key={item.id}
                  onClick={() => go(item.id)}
                  className="focus-ring rounded-2xl px-4 py-3.5 text-left text-lg text-slate-200
                             transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  {item.label}
                </button>
              ))}

              <div className="mt-auto flex flex-col gap-3 pt-6">
                <a
                  href={company.phoneHref}
                  className="focus-ring flex items-center gap-2 rounded-2xl px-4 py-3 text-slate-200"
                >
                  <Phone className="h-4 w-4" />
                  {company.phone}
                </a>
                <Button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenAssistant();
                  }}
                  size="lg"
                >
                  Обсудить проект
                </Button>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
