import { useState } from 'react';
import { motion } from 'framer-motion';
import { company, hints, leadForm, legal } from '../../site.config';
import { Reveal } from '../ui/Reveal';
import { Button } from '../ui/Button';
import { Hint } from '../ui/Hint';
import { Check, Phone, Sparkles } from '../ui/Icons';
import { ConsentCheckbox, Field, HoneypotField, TextField } from '../ui/Field';
import { emptyLeadForm, useLeadSubmit, type LeadFormValues } from '../../hooks/useLeadSubmit';

export function LeadForm({ onOpenQuiz }: { onOpenQuiz: () => void }) {
  const [values, setValues] = useState<LeadFormValues>(emptyLeadForm);
  const { submit, status, errors, serverError } = useLeadSubmit({ source: 'form' });

  const set = <K extends keyof LeadFormValues>(key: K, value: LeadFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await submit(values);
  };

  return (
    <section id="contact" className="section-pad">
      <div className="container-page">
        <div className="glass-strong grid gap-10 overflow-hidden p-7 shadow-panel sm:p-10 lg:grid-cols-2 lg:gap-16 lg:p-14">
          <div className="flex flex-col gap-7">
            <Reveal>
              <span className="eyebrow">
                <Sparkles className="h-3.5 w-3.5 text-accent-cyan" />
                Заявка
              </span>
            </Reveal>

            <Reveal delay={0.06}>
              <h2 className="text-display-lg">{leadForm.title}</h2>
            </Reveal>

            <Reveal delay={0.1}>
              <p className="text-body-lg text-slate-400">{leadForm.subtitle}</p>
            </Reveal>

            <Reveal delay={0.16}>
              <ul className="flex flex-col gap-3">
                {leadForm.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-center gap-3 text-sm text-slate-300">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft">
                      <Check className="h-3.5 w-3.5 text-accent-cyan" />
                    </span>
                    {bullet}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="mt-auto flex flex-col gap-4 border-t border-white/[0.07] pt-7">
                <Hint text={hints.phone} align="start" className="w-fit">
                  <span className="flex items-center gap-3 font-display text-2xl font-extrabold text-white">
                    <Phone className="h-5 w-5" />
                    {company.phone}
                  </span>
                </Hint>
                <p className="text-sm text-slate-500">
                  {company.workHours} · заявки принимаем круглосуточно
                </p>
                <button
                  onClick={onOpenQuiz}
                  className="focus-ring w-fit text-sm text-accent-cyan underline-offset-4 hover:underline"
                >
                  Или пройдите подбор за 60 секунд
                </button>
              </div>
            </Reveal>
          </div>

          {status === 'done' ? (
            <SuccessPanel name={values.name} />
          ) : (
            <Reveal delay={0.12} className="h-full">
              <form onSubmit={handleSubmit} noValidate className="relative flex h-full flex-col gap-5">
                <HoneypotField
                  value={values.company}
                  onChange={(e) => set('company', e.target.value)}
                />

                <Field
                  label="Как вас зовут?"
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

                <TextField
                  label="Расскажите о задаче"
                  placeholder="Что за проект, есть ли сроки и примеры, которые нравятся"
                  rows={4}
                  value={values.comment}
                  onChange={(e) => set('comment', e.target.value)}
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
                  {status === 'sending' ? 'Отправляем…' : 'Отправить заявку'}
                </Button>
              </form>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}

function SuccessPanel({ name }: { name: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex h-full flex-col items-center justify-center gap-5 rounded-3xl
                 border border-accent-cyan/25 bg-accent-soft p-10 text-center"
    >
      <span className="relative grid h-16 w-16 place-items-center rounded-full bg-accent-line text-ink-950">
        <Check className="h-8 w-8" />
        <span aria-hidden className="absolute inset-0 animate-pulse-ring rounded-full bg-accent-cyan/40" />
      </span>
      <h3 className="text-display-md">Заявка отправлена</h3>
      <p className="max-w-sm text-sm leading-relaxed text-slate-300">
        {name ? `${name}, спасибо. ` : 'Спасибо. '}
        Менеджер свяжется с вами в течение рабочего дня и задаст пару уточняющих вопросов.
      </p>
    </motion.div>
  );
}
