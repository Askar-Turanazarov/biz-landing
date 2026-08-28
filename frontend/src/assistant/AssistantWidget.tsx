import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { assistant } from '../site.config';
import { useAssistantStore } from './useAssistantStore';
import { QuizView } from './QuizView';
import { ChatView } from './ChatView';
import { ContactView } from './ContactView';
import { Button } from '../components/ui/Button';
import { Check, Close, Sparkles } from '../components/ui/Icons';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

export function AssistantWidget() {
  const { isOpen, mode, open, close, startQuiz, startChat, reset } = useAssistantStore();

  // На телефоне панель занимает весь экран — прокрутку страницы под ней глушим.
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  useLockBodyScroll(isOpen && isMobile);

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen, close]);

  return (
    <>
      <LauncherButton visible={!isOpen} onClick={() => open()} />

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Затемнение только на мобильных: на десктопе панель не перекрывает страницу. */}
            <motion.div
              className="fixed inset-0 z-40 bg-ink-950/70 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />

            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="ИИ-помощник"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="glass-strong fixed inset-0 z-50 flex flex-col overflow-hidden rounded-none
                         shadow-panel md:inset-auto md:bottom-6 md:right-6 md:h-[min(38rem,calc(100vh-6rem))]
                         md:w-[25rem] md:rounded-3xl"
            >
              <Header onClose={close} onReset={reset} showReset={mode !== 'menu'} />

              {mode === 'menu' && <MenuView onQuiz={startQuiz} onChat={startChat} />}
              {mode === 'quiz' && <QuizView />}
              {mode === 'chat' && <ChatView />}
              {mode === 'contact' && <ContactView />}
              {mode === 'done' && <DoneView onClose={close} />}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function LauncherButton({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          onClick={onClick}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ type: 'spring', stiffness: 400, damping: 24 }}
          aria-label={`Открыть ${assistant.buttonLabel}`}
          // На телефоне это компактный кружок над липкой панелью CTA: подпись
          // рядом с кнопками первого экрана перекрывала бы их.
          className="focus-ring group fixed bottom-24 right-4 z-40 flex items-center gap-3
                     rounded-full bg-accent-line p-2.5 font-semibold text-ink-950 shadow-glow
                     md:bottom-6 md:right-6 md:py-3 md:pl-3 md:pr-5"
        >
          <span className="relative grid h-9 w-9 place-items-center rounded-full bg-ink-950/15">
            <Sparkles className="h-5 w-5" />
            <span
              aria-hidden
              className="absolute inset-0 animate-pulse-ring rounded-full bg-white/50"
            />
          </span>
          <span className="hidden text-sm md:inline">{assistant.buttonLabel}</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function Header({
  onClose,
  onReset,
  showReset,
}: {
  onClose: () => void;
  onReset: () => void;
  showReset: boolean;
}) {
  return (
    <header className="flex items-center gap-3 border-b border-white/[0.07] p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-cyan">
        <Sparkles className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm font-bold text-white">Помощник ORBIT</p>
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Отвечает сразу
        </p>
      </div>
      {showReset && (
        <button
          onClick={onReset}
          className="focus-ring rounded-full px-3 py-1.5 text-xs text-slate-500 transition-colors hover:text-white"
        >
          Заново
        </button>
      )}
      <button
        onClick={onClose}
        aria-label="Закрыть помощника"
        className="focus-ring grid h-9 w-9 shrink-0 place-items-center rounded-full
                   border border-white/10 text-slate-300 transition-colors hover:text-white"
      >
        <Close className="h-4 w-4" />
      </button>
    </header>
  );
}

function MenuView({ onQuiz, onChat }: { onQuiz: () => void; onChat: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-5">
      <p className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 text-sm leading-relaxed text-slate-200">
        {assistant.greeting}
      </p>

      <div className="mt-auto flex flex-col gap-3">
        <Button size="lg" onClick={onQuiz} className="w-full">
          {assistant.quizCta}
        </Button>
        <Button size="lg" variant="outline" onClick={onChat} className="w-full">
          {assistant.chatCta}
        </Button>
        <p className="text-center text-xs text-slate-600">
          Отвечает ИИ. Сложные вопросы передадим менеджеру.
        </p>
      </div>
    </div>
  );
}

function DoneView({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 p-8 text-center">
      <span className="relative grid h-16 w-16 place-items-center rounded-full bg-accent-line text-ink-950">
        <Check className="h-8 w-8" />
        <span aria-hidden className="absolute inset-0 animate-pulse-ring rounded-full bg-accent-cyan/40" />
      </span>
      <h3 className="font-display text-xl font-extrabold text-white">Заявка принята</h3>
      <p className="max-w-xs text-sm leading-relaxed text-slate-400">
        Расчёт и предложение по срокам пришлём в течение рабочего дня. Если вопрос срочный —
        позвоните, ответим быстрее.
      </p>
      <Button variant="outline" onClick={onClose}>
        Вернуться на сайт
      </Button>
    </div>
  );
}
