import { useState } from 'react';
import { assistant, legal } from '../site.config';
import { useAssistantStore } from './useAssistantStore';
import { QuizResultCard } from './QuizResultCard';
import { Button } from '../components/ui/Button';
import { ConsentCheckbox, Field, HoneypotField } from '../components/ui/Field';
import { emptyLeadForm, useLeadSubmit, type LeadFormValues } from '../hooks/useLeadSubmit';

/**
 * Финальный шаг обеих веток помощника — квиза и свободного чата.
 * После квиза сверху итог подбора, ответы уезжают вместе с заявкой — менеджер сразу видит контекст.
 */
export function ContactView() {
  const { quizAnswers, quizIndex, quizResult, quizResultStatus, finish, setMode, goBackQuiz } =
    useAssistantStore();
  const [values, setValues] = useState<LeadFormValues>(emptyLeadForm);

  const fromQuiz = quizAnswers.length > 0;
  const { submit, status, errors, serverError } = useLeadSubmit({
    source: fromQuiz ? 'quiz' : 'chat',
    quizAnswers,
  });

  const set = <K extends keyof LeadFormValues>(key: K, value: LeadFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const ok = await submit(values);
    if (ok) finish({ name: values.name.trim(), contact: values.contact.trim() });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="scroll-thin flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
      <h3 className="font-display text-lg font-bold text-white">
        {fromQuiz ? 'Подбор готов' : 'Оставьте контакт'}
      </h3>

      {fromQuiz && <QuizResultCard status={quizResultStatus} result={quizResult} />}

      {fromQuiz && (
        <details className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
          <summary className="cursor-pointer text-xs text-slate-400 transition-colors hover:text-slate-200">
            Ваши ответы
          </summary>
          <ul className="mt-3 flex flex-col gap-1.5">
            {quizAnswers.map((answer) => (
              <li key={answer.stepId} className="flex gap-2 text-xs">
                <span className="shrink-0 text-slate-500">{answer.question}</span>
                <span className="ml-auto text-right font-medium text-slate-200">{answer.answer}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="text-sm leading-relaxed text-slate-400">{assistant.contactIntro}</p>

      <HoneypotField value={values.company} onChange={(e) => set('company', e.target.value)} />

      <Field
        label="Имя"
        placeholder="Азиз"
        autoComplete="name"
        value={values.name}
        error={errors.name}
        onChange={(e) => set('name', e.target.value)}
      />

      <Field
        label="Телефон, почта или Telegram"
        placeholder="+998 90 123-45-67"
        autoComplete="tel"
        inputMode="tel"
        value={values.contact}
        error={errors.contact}
        onChange={(e) => set('contact', e.target.value)}
      />

      <ConsentCheckbox
        checked={values.consent}
        onChange={(value) => set('consent', value)}
        error={errors.consent}
        text={legal.consent}
      />

      {serverError && (
        <p role="alert" className="rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {serverError}
        </p>
      )}

      <Button type="submit" size="lg" disabled={status === 'sending'} className="mt-auto w-full">
        {status === 'sending' ? 'Отправляем…' : 'Получить расчёт'}
      </Button>

      <button
        type="button"
        onClick={() => (quizIndex > 0 ? goBackQuiz() : setMode('chat'))}
        className="focus-ring rounded text-xs text-slate-500 transition-colors hover:text-slate-300"
      >
        ← Вернуться к диалогу
      </button>
    </form>
  );
}
