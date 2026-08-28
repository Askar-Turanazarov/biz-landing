import { useState } from 'react';
import { assistant, faq } from '../site.config';
import { useAssistantStore } from './useAssistantStore';
import { MessageList } from './MessageList';
import { Send } from '../components/ui/Icons';

/** Быстрые подсказки: снимают ступор «а что вообще спросить». */
const SUGGESTIONS = faq.slice(0, 3).map((item) => item.q);

export function ChatView() {
  const { messages, isTyping, sendMessage, setMode } = useAssistantStore();
  const [draft, setDraft] = useState('');

  const send = (text: string) => {
    if (!text.trim() || isTyping) return;
    setDraft('');
    void sendMessage(text);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MessageList messages={messages} isTyping={isTyping} className="min-h-0 flex-1" />

      {/* Подсказки показываем, пока диалог не завязался. */}
      {messages.length <= 2 && (
        <div className="flex flex-wrap gap-2 px-5 pb-3">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => send(suggestion)}
              className="focus-ring rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5
                         text-xs text-slate-300 transition-colors hover:bg-white/[0.08]"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          send(draft);
        }}
        className="flex items-end gap-2 border-t border-white/[0.07] p-4"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(event) => {
            // Enter отправляет, Shift+Enter переносит строку — привычно по мессенджерам.
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              send(draft);
            }
          }}
          rows={1}
          placeholder={assistant.chatPlaceholder}
          aria-label="Сообщение помощнику"
          className="scroll-thin max-h-28 min-h-[3rem] flex-1 resize-none rounded-2xl border
                     border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none
                     transition-colors placeholder:text-slate-600 focus:border-accent-cyan/60"
        />
        <button
          type="submit"
          disabled={!draft.trim() || isTyping}
          aria-label="Отправить"
          className="focus-ring grid h-12 w-12 shrink-0 place-items-center rounded-2xl
                     bg-accent-line text-ink-950 transition-opacity disabled:opacity-40"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>

      <button
        onClick={() => setMode('contact')}
        className="focus-ring border-t border-white/[0.07] px-5 py-3 text-xs text-slate-500
                   transition-colors hover:text-accent-cyan"
      >
        Оставить контакт — менеджер ответит подробно
      </button>
    </div>
  );
}
