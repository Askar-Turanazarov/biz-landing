import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  adminApi,
  contactHref,
  formatDate,
  SOURCE_LABEL,
  STATUS_LABEL,
  STATUS_STYLE,
  type DialogMessage,
  type Lead,
  type LeadStatus,
} from './adminApi';
import { Close, Phone } from '../components/ui/Icons';
import { Button } from '../components/ui/Button';
import { QualificationBlock } from './QualificationBlock';

const STATUSES: LeadStatus[] = ['new', 'in_work', 'won', 'lost'];

interface LeadDrawerProps {
  lead: Lead | null;
  onClose: () => void;
  onChanged: (lead: Lead) => void;
  onDeleted: (id: string) => void;
}

/** Боковая панель с деталями заявки и полным диалогом посетителя с ИИ. */
export function LeadDrawer({ lead, onClose, onChanged, onDeleted }: LeadDrawerProps) {
  const [dialog, setDialog] = useState<DialogMessage[]>([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!lead) return;
    setNote(lead.managerNote);
    setConfirmDelete(false);
    setDialog([]);
    // Диалог тянем отдельным запросом: в списке заявок он не нужен и только раздувал бы ответ.
    adminApi
      .dialog(lead.id)
      .then(({ messages }) => setDialog(messages))
      .catch(() => setDialog([]));
  }, [lead]);

  useEffect(() => {
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  const setStatus = async (status: LeadStatus) => {
    if (!lead) return;
    const { lead: updated } = await adminApi.update(lead.id, { status });
    onChanged(updated);
  };

  const saveNote = async () => {
    if (!lead) return;
    setSaving(true);
    try {
      const { lead: updated } = await adminApi.update(lead.id, { managerNote: note });
      onChanged(updated);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!lead) return;
    await adminApi.remove(lead.id);
    onDeleted(lead.id);
  };

  return (
    <AnimatePresence>
      {lead && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-ink-950/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={`Заявка от ${lead.name}`}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 34 }}
            className="glass-strong scroll-thin fixed inset-y-0 right-0 z-50 w-full
                       overflow-y-auto rounded-l-3xl rounded-r-none p-6 sm:w-[32rem]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="truncate font-display text-xl font-extrabold text-white">
                  {lead.name}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {formatDate(lead.createdAt)} · {SOURCE_LABEL[lead.source]}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Закрыть"
                className="focus-ring grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 text-slate-300"
              >
                <Close className="h-4 w-4" />
              </button>
            </div>

            <a
              href={contactHref(lead)}
              className="focus-ring mt-5 flex items-center gap-3 rounded-2xl border border-white/10
                         bg-white/[0.03] px-4 py-3.5 font-display text-lg font-bold text-white
                         transition-colors hover:bg-white/[0.07]"
            >
              <Phone className="h-5 w-5 text-accent-cyan" />
              {lead.contact}
            </a>

            <Block title="Статус">
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatus(status)}
                    className={`focus-ring rounded-full border px-4 py-1.5 text-xs font-medium
                                transition-colors ${
                                  lead.status === status
                                    ? STATUS_STYLE[status]
                                    : 'border-white/10 text-slate-400 hover:text-white'
                                }`}
                  >
                    {STATUS_LABEL[status]}
                  </button>
                ))}
              </div>
            </Block>

            <QualificationBlock qualification={lead.qualification} />

            {lead.comment && (
              <Block title="Комментарий клиента">
                <p className="text-sm leading-relaxed text-slate-300">{lead.comment}</p>
              </Block>
            )}

            {lead.quizAnswers.length > 0 && (
              <Block title="Ответы квиза">
                <ul className="flex flex-col gap-2">
                  {lead.quizAnswers.map((answer) => (
                    <li key={answer.stepId} className="flex gap-3 text-sm">
                      <span className="shrink-0 text-slate-500">{answer.question}</span>
                      <span className="ml-auto text-right font-medium text-slate-200">
                        {answer.answer}
                      </span>
                    </li>
                  ))}
                </ul>
              </Block>
            )}

            {dialog.length > 0 && (
              <Block title="Диалог с помощником">
                <div className="scroll-thin flex max-h-80 flex-col gap-2 overflow-y-auto pr-1">
                  {dialog.map((message, index) => (
                    <div
                      key={`${message.at}-${index}`}
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        message.role === 'user'
                          ? 'self-end bg-accent-indigo/25 text-white'
                          : 'self-start border border-white/[0.08] bg-white/[0.04] text-slate-300'
                      }`}
                    >
                      {message.text}
                      {message.model && (
                        <span className="mt-1 block text-[10px] text-slate-600">{message.model}</span>
                      )}
                    </div>
                  ))}
                </div>
              </Block>
            )}

            <Block title="Заметка менеджера">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="О чём договорились, что дальше"
                className="scroll-thin w-full resize-y rounded-2xl border border-white/10
                           bg-white/[0.03] px-4 py-3 text-sm text-white outline-none
                           transition-colors placeholder:text-slate-600 focus:border-accent-cyan/60"
              />
              <Button
                size="md"
                variant="outline"
                onClick={saveNote}
                disabled={saving || note === lead.managerNote}
                className="mt-3"
              >
                {saving ? 'Сохраняем…' : 'Сохранить заметку'}
              </Button>
            </Block>

            <Block title="Источник">
              <dl className="flex flex-col gap-2 text-xs">
                <Row label="Telegram" value={telegramLabel(lead.telegramStatus)} />
                {Object.entries(lead.utm).map(([key, value]) => (
                  <Row key={key} label={key} value={value} />
                ))}
                {lead.referrer && <Row label="Переход с" value={lead.referrer} />}
                {lead.ip && <Row label="IP" value={lead.ip} />}
              </dl>
            </Block>

            <div className="mt-8 border-t border-white/[0.07] pt-5">
              {confirmDelete ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-400">Удалить заявку навсегда?</span>
                  <button
                    onClick={remove}
                    className="focus-ring ml-auto rounded-full bg-rose-500/20 px-4 py-1.5 text-xs font-medium text-rose-200"
                  >
                    Удалить
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="focus-ring rounded-full px-3 py-1.5 text-xs text-slate-400"
                  >
                    Отмена
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="focus-ring rounded text-xs text-slate-600 transition-colors hover:text-rose-300"
                >
                  Удалить заявку
                </button>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="ml-auto min-w-0 truncate text-right text-slate-300">{value}</dd>
    </div>
  );
}

function telegramLabel(status: Lead['telegramStatus']): string {
  switch (status) {
    case 'sent':
      return 'отправлено';
    case 'failed':
      return 'ошибка отправки';
    case 'skipped':
      return 'не настроен';
    default:
      return 'отправляется';
  }
}
