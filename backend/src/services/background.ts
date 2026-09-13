/**
 * Фоновая работа после ответа клиенту. На Vercel функцию останавливают, как только ответ
 * отправлен, поэтому промис отдаём в waitUntil — он продлевает жизнь запроса.
 * Локально процесс живёт постоянно, и промис просто выполняется сам.
 */
import { waitUntil } from '@vercel/functions';

export function runInBackground(task: Promise<unknown>, label: string): void {
  const guarded = task.catch((error) =>
    console.error(`[${label}]`, (error as Error)?.message ?? error),
  );
  if (!process.env.VERCEL) return;
  try {
    waitUntil(guarded);
  } catch (error) {
    console.error('[background] waitUntil недоступен:', (error as Error).message);
  }
}
