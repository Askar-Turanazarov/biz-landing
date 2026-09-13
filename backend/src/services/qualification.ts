/**
 * Квалификация заявки по ответам квиза.
 * Формат, цены и сроки считает код по базе знаний, а ИИ получает готовый расчёт
 * и только объясняет его человеческим языком — цифры не могут «уплыть».
 */
import {
  BUDGET_MAX,
  DEADLINE_WEEKS,
  GOAL_TO_SERVICE,
  MIN_WEEKS,
  QUIZ_CODES,
  STARTER_SERVICES,
  priceLabel,
  serviceById,
  type ServiceInfo,
} from './knowledgeBase.js';
import type {
  BudgetFit,
  DeadlineFit,
  LeadTemperature,
  QuizAnswer,
  QuizMatch,
  ServiceOffer,
} from '../types.js';

type StepId = keyof typeof QUIZ_CODES;

export const TEMPERATURE_TEXT: Record<LeadTemperature, string> = {
  hot: 'горячая',
  warm: 'тёплая',
  cold: 'холодная',
};

export const NEXT_STEP: Record<LeadTemperature, string> = {
  hot: 'Связаться в течение часа: предложить созвон и сроки прототипа.',
  warm: 'Связаться сегодня: уточнить задачу и бюджет, прислать похожие кейсы.',
  cold: 'Отправить прайс и кейсы, предложить короткий бриф и вернуться через неделю.',
};

const BUDGET_POINTS: Record<BudgetFit, number> = { ok: 2, close: 1, unknown: 1, low: -1 };

const BUDGET_FACT: Record<BudgetFit, string> = {
  ok: 'укладывается в стартовую цену',
  close: 'чуть ниже стартовой цены — можно обсудить урезанный первый этап',
  low: 'заметно ниже стартовой цены этого формата',
  unknown: 'не назван, посетитель просит ориентир',
};

const DEADLINE_FACT: Record<DeadlineFit, string> = {
  ok: 'реалистичный для этого формата',
  tight: 'короче обычного срока этого формата',
  unknown: 'не указан',
};

/** Код варианта принимаем только из известного набора: payload приходит от клиента. */
export function isKnownCode(stepId: string, value: unknown): value is string {
  const codes = (QUIZ_CODES as Record<string, readonly string[]>)[stepId];
  return typeof value === 'string' && Boolean(codes?.includes(value));
}

const clean = (value: unknown, max: number): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

/** Приводит ответы квиза из запроса к безопасному виду: длины обрезаны, неизвестные коды отброшены. */
export function normalizeQuizAnswers(raw: unknown): QuizAnswer[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 12).flatMap((item) => {
    const stepId = clean(item?.stepId, 40);
    const answer = clean(item?.answer, 200);
    if (!stepId || !answer) return [];
    const normalized: QuizAnswer = { stepId, question: clean(item?.question, 200), answer };
    const value = clean(item?.value, 40);
    if (isKnownCode(stepId, value)) normalized.value = value;
    return [normalized];
  });
}

function codeOf(answers: QuizAnswer[], stepId: StepId): string | null {
  const value = answers.find((a) => a.stepId === stepId)?.value;
  return isKnownCode(stepId, value) ? value : null;
}

const toOffer = (s: ServiceInfo): ServiceOffer => ({
  id: s.id,
  title: s.title,
  priceFrom: s.priceFrom,
  duration: s.duration,
});

function pickService(
  type: string | null,
  state: string | null,
  goal: string | null,
): { service: ServiceInfo; inferred: boolean } | null {
  if (type && type !== 'unsure') {
    const chosen = serviceById(type);
    return chosen ? { service: chosen, inferred: false } : null;
  }
  // Формат не выбран. Старый сайт при цели «заявки» или «экспертиза» — это переупаковка,
  // иначе подбираем по цели.
  const byState = state === 'old_site' && (goal === 'leads' || goal === 'expertise') ? 'redesign' : null;
  const id = byState ?? (goal ? GOAL_TO_SERVICE[goal] : undefined) ?? 'landing';
  const service = serviceById(id);
  return service ? { service, inferred: true } : null;
}

/** Расчёт по ответам квиза. null — ответов с кодами нет (например, заявка из обычной формы). */
export function qualify(answers: QuizAnswer[]): QuizMatch | null {
  const type = codeOf(answers, 'type');
  const state = codeOf(answers, 'state');
  const deadline = codeOf(answers, 'deadline');
  const budget = codeOf(answers, 'budget');
  const goal = codeOf(answers, 'goal');
  if (!type && !goal) return null;

  const picked = pickService(type, state, goal);
  if (!picked) return null;
  const { service, inferred } = picked;

  const max = budget ? BUDGET_MAX[budget] : null;
  const budgetFit: BudgetFit =
    max == null
      ? 'unknown'
      : service.priceFrom <= max
        ? 'ok'
        : max >= service.priceFrom * 0.9
          ? 'close'
          : 'low';

  const weeks: number | undefined = deadline ? DEADLINE_WEEKS[deadline] : undefined;
  const minWeeks = MIN_WEEKS[service.id] ?? 0;
  const deadlineFit: DeadlineFit = weeks === undefined ? 'unknown' : minWeeks <= weeks ? 'ok' : 'tight';

  // Бюджета не хватает — предлагаем самый полный стартовый формат, который в него помещается.
  const alternative =
    budgetFit === 'low' && max != null
      ? [...STARTER_SERVICES]
          .reverse()
          .map((id) => serviceById(id))
          .find((s): s is ServiceInfo => Boolean(s && s.id !== service.id && s.priceFrom <= max))
      : undefined;

  // «Срочно» — признак живой потребности: повышает метку, а нереальный срок уходит в пометки.
  const score =
    BUDGET_POINTS[budgetFit] +
    (deadline === 'urgent' || deadline === 'month' ? 2 : deadline === 'quarter' ? 1 : 0) +
    (inferred ? 0 : 1) +
    (state && state !== 'scratch' ? 1 : 0);
  const temperature: LeadTemperature = score >= 4 ? 'hot' : score >= 2 ? 'warm' : 'cold';

  const flags: string[] = [];
  if (inferred) flags.push(`Формат не выбран — подобран по ответам: ${service.title}.`);
  if (budgetFit === 'low')
    flags.push(`Бюджет ниже стартовой цены: ${service.title} — ${priceLabel(service.priceFrom)}.`);
  if (budgetFit === 'close')
    flags.push(`Бюджет у нижней границы: ${service.title} — ${priceLabel(service.priceFrom)}. Обсудить объём первого этапа.`);
  if (budgetFit === 'unknown') flags.push('Бюджет не назван — клиент ждёт ориентир.');
  if (deadlineFit === 'tight')
    flags.push(`Срок жёсткий: ${service.title} обычно делается ${service.duration}.`);

  return {
    service: toOffer(service),
    alternative: alternative ? toOffer(alternative) : null,
    budgetFit,
    deadlineFit,
    temperature,
    score,
    flags,
    inferred,
  };
}

export function answersText(answers: QuizAnswer[]): string {
  return answers.map((a) => `- ${a.question || a.stepId} — ${a.answer}`).join('\n');
}

/** Расчёт текстом для промпта: модель получает готовые факты и сама ничего не считает. */
export function matchFacts(match: QuizMatch): string {
  const { service, alternative } = match;
  const lines = [
    `Рекомендуемый формат: ${service.title}, ${priceLabel(service.priceFrom)}, срок ${service.duration}.`,
    match.inferred
      ? 'Формат посетитель не выбрал — он подобран по цели и текущей ситуации.'
      : 'Этот формат посетитель выбрал сам.',
    `Бюджет: ${BUDGET_FACT[match.budgetFit]}.`,
    `Срок: ${DEADLINE_FACT[match.deadlineFit]}.`,
  ];
  if (alternative) {
    lines.push(
      `Альтернатива в рамках бюджета: ${alternative.title}, ${priceLabel(alternative.priceFrom)}, срок ${alternative.duration}.`,
    );
  }
  return lines.join('\n');
}
