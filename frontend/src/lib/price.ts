/**
 * Цены на сайте хранятся в сумах числом, а не строкой: рядом с каждой ценой
 * показывается ориентир в долларах, и оба значения обязаны считаться
 * из одного источника, иначе при правке прайса они разъедутся.
 */

/** Условный курс для справочного пересчёта. Обновляется в одном месте. */
export const USD_RATE = 11_900;

/** 23800000 → «23 800 000 сум» (неразрывные пробелы, чтобы число не переносилось). */
export function formatSum(amount: number): string {
  return `${amount.toLocaleString('ru-RU').replace(/\s/g, ' ')} сум`;
}

export function formatSumFrom(amount: number): string {
  return `от ${formatSum(amount)}`;
}

/** Ориентир в долларах по условному курсу — всегда со знаком «примерно». */
export function formatUsdApprox(amount: number): string {
  const usd = Math.round(amount / USD_RATE);
  return `~$${usd.toLocaleString('ru-RU').replace(/\s/g, ' ')}`;
}

/** Диапазон для тех мест, где цена задана вилкой. */
export function formatSumRange(from: number, to: number): string {
  return `${from.toLocaleString('ru-RU').replace(/\s/g, ' ')}–${formatSum(to)}`;
}
