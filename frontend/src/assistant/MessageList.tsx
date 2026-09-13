import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { RichText } from '../components/ui/RichText';
import type { AssistantMessage } from './useAssistantStore';

/**
 * Лента сообщений с автопрокруткой к последнему и индикатором набора.
 * scrollable={false} — лента внутри чужого скролла (экран «Заявка принята»):
 * без своей прокрутки и без автопрокрутки вниз.
 */
export function MessageList({
  messages,
  isTyping,
  scrollable = true,
  className = '',
}: {
  messages: AssistantMessage[];
  isTyping: boolean;
  scrollable?: boolean;
  className?: string;
}) {
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollable) return;
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, isTyping, scrollable]);

  return (
    <div
      className={`flex flex-col gap-3 ${
        scrollable ? 'scroll-thin overflow-y-auto px-5 py-4' : 'py-3'
      } ${className}`}
    >
      {messages.map((message) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            message.role === 'user'
              ? 'self-end bg-accent-line font-medium text-ink-950'
              : 'self-start border border-white/[0.08] bg-white/[0.04] text-slate-200'
          }`}
        >
          {message.role === 'assistant' ? <RichText text={message.text} /> : message.text}
        </motion.div>
      ))}

      {isTyping && (
        <div className="self-start rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5">
          <span className="flex gap-1.5" aria-label="Помощник печатает">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-slate-400"
                animate={{ opacity: [0.25, 1, 0.25] }}
                transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.16 }}
              />
            ))}
          </span>
        </div>
      )}

      <div ref={bottom} />
    </div>
  );
}
