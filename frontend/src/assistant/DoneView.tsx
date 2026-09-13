import { Button } from '../components/ui/Button';
import { Check } from '../components/ui/Icons';
import { MessageList } from './MessageList';
import { QuizResultCard } from './QuizResultCard';
import { useAssistantStore } from './useAssistantStore';

/**
 * Экран после отправки заявки. История не стирается: посетитель видит, что отправил,
 * какой формат ему подобрали и весь диалог с помощником.
 */
export function DoneView({ onClose }: { onClose: () => void }) {
  const { messages, quizAnswers, quizResult, quizResultStatus, submittedLead } = useAssistantStore();
  const fromQuiz = quizAnswers.length > 0;

  return (
    <div className="scroll-thin flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
      <div className="flex items-start gap-4 rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-line text-ink-950">
          <Check className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-display text-lg font-extrabold text-white">Заявка принята</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">
            Расчёт и предложение по срокам пришлём в течение рабочего дня. Если вопрос срочный —
            позвоните, ответим быстрее.
          </p>
        </div>
      </div>

      {submittedLead && (
        <p className="text-sm text-slate-400">
          Ваша заявка: <span className="font-medium text-slate-200">{submittedLead.name}</span> ·{' '}
          {submittedLead.contact}
        </p>
      )}

      {fromQuiz && <QuizResultCard status={quizResultStatus} result={quizResult} />}

      <section>
        <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">История диалога</h4>
        <MessageList messages={messages} isTyping={false} scrollable={false} />
      </section>

      <Button variant="outline" onClick={onClose} className="self-center">
        Вернуться на сайт
      </Button>
    </div>
  );
}
