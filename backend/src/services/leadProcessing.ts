/**
 * Что происходит с заявкой после ответа посетителю: квалификация и уведомление менеджеров.
 * Это фоновая работа — посетитель не ждёт ни модель, ни Telegram.
 */
import { updateLead } from './leadStore.js';
import { NEXT_STEP, qualify } from './qualification.js';
import { leadSummary } from './llm/index.js';
import { notifyLead } from './telegram.js';
import type { ChatMessage, Lead, Qualification } from '../types.js';

export async function processLead(lead: Lead, dialog: ChatMessage[]): Promise<void> {
  let current = lead;

  try {
    const match = qualify(lead.quizAnswers);
    const summary = await leadSummary({
      match,
      answers: lead.quizAnswers,
      comment: lead.comment,
      dialog,
    });

    if (match || summary) {
      // Метка из правил важнее метки модели: она посчитана по прайсу, а не угадана.
      const temperature = match?.temperature ?? summary?.temperature ?? null;
      const qualification: Qualification = {
        temperature,
        match,
        summary: summary?.summary ?? '',
        summaryBy: summary?.model ?? '',
        nextStep: temperature ? NEXT_STEP[temperature] : '',
      };
      current = (await updateLead(lead.id, { qualification })) ?? { ...lead, qualification };
    }
  } catch (error) {
    // Квалификация — дополнение: если она не удалась, заявка всё равно должна дойти до менеджера.
    console.error('[lead] квалификация не удалась:', (error as Error).message);
  }

  await notifyLead(current);
}
