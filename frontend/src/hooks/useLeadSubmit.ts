import { useCallback, useRef, useState } from 'react';
import { sendLead, type LeadPayload, type QuizAnswerPayload } from '../lib/api';
import { getReferrer, getSessionId, getUtm } from '../lib/tracking';

// Границы совпадают с проверкой на бэкенде: «+998 (90) 123-45-67» — 19 символов.
const PHONE_RE = /^\+?[\d\s()-]{9,24}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const TELEGRAM_RE = /^@?[a-z0-9_]{4,32}$/i;

export interface LeadFormValues {
  name: string;
  contact: string;
  comment: string;
  consent: boolean;
  /** Honeypot: поле спрятано от людей, боты заполняют его охотно. */
  company: string;
}

export const emptyLeadForm: LeadFormValues = {
  name: '',
  contact: '',
  comment: '',
  consent: false,
  company: '',
};

export type LeadFieldErrors = Partial<Record<'name' | 'contact' | 'consent', string>>;

export function validateLead(values: LeadFormValues): LeadFieldErrors {
  const errors: LeadFieldErrors = {};

  if (values.name.trim().length < 2) errors.name = 'Как к вам обращаться?';

  const contact = values.contact.trim();
  if (!contact) errors.contact = 'Оставьте телефон, почту или ник в Telegram';
  else if (!PHONE_RE.test(contact) && !EMAIL_RE.test(contact) && !TELEGRAM_RE.test(contact))
    errors.contact = 'Похоже на опечатку. Проверьте контакт';

  if (!values.consent) errors.consent = 'Нужно согласие на обработку данных';

  return errors;
}

interface SubmitOptions {
  source: LeadPayload['source'];
  quizAnswers?: QuizAnswerPayload[];
}

type Status = 'idle' | 'sending' | 'done' | 'error';

/**
 * Общая логика отправки заявки для основной формы и для шага контактов
 * в ИИ-помощнике: одинаковая валидация, антиспам и разбор ошибок сервера.
 */
export function useLeadSubmit({ source, quizAnswers }: SubmitOptions) {
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<LeadFieldErrors>({});
  const [serverError, setServerError] = useState('');

  // Момент, когда форма впервые показалась: боты отправляют её мгновенно.
  const mountedAt = useRef(Date.now());

  const submit = useCallback(
    async (values: LeadFormValues): Promise<boolean> => {
      const found = validateLead(values);
      setErrors(found);
      setServerError('');
      if (Object.keys(found).length) return false;

      setStatus('sending');
      try {
        await sendLead({
          name: values.name.trim(),
          contact: values.contact.trim(),
          comment: values.comment.trim(),
          consent: values.consent,
          company: values.company,
          source,
          sessionId: getSessionId(),
          quizAnswers,
          elapsedMs: Date.now() - mountedAt.current,
          utm: getUtm(),
          referrer: getReferrer(),
        });
        setStatus('done');
        return true;
      } catch (error) {
        setStatus('error');
        setServerError(
          error instanceof Error ? error.message : 'Не удалось отправить. Попробуйте ещё раз.',
        );
        return false;
      }
    },
    [source, quizAnswers],
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setErrors({});
    setServerError('');
    mountedAt.current = Date.now();
  }, []);

  return { submit, reset, status, errors, serverError };
}
