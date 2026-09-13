/**
 * Запасной ответчик без обращения к сети. Работает в двух случаях:
 * ключи не заданы вовсе, либо вся цепочка моделей временно недоступна.
 * Посетитель в любом случае получает осмысленный ответ, а не ошибку.
 */
import { FAQ, SERVICES, COMPANY, PROCESS, priceLabel, USD_RATE } from '../knowledgeBase.js';
import type { QuizMatch } from '../../types.js';

interface Rule {
  test: RegExp;
  answer: () => string;
}

/**
 * Стемы ищем только с начала слова.
 * Без этой границы «бот» срабатывал внутри «ра-бот-ы», «счет» — внутри
 * «ра-счет», а «ai» — внутри «em-ai-l», и вопрос уходил не в то правило.
 * Конец слова не ограничиваем: нужны именно основы («цен» → «цена», «цены»).
 */
const stems = (...variants: string[]): RegExp =>
  new RegExp(`(?<![\\p{L}\\d])(?:${variants.join('|')})`, 'iu');

const priceList = SERVICES.map((s) => `${s.title} — ${priceLabel(s.priceFrom)}`).join('; ');

const RULES: Rule[] = [
  {
    test: stems('цен', 'стоим', 'сколько стоит', 'бюджет', 'прайс', 'дорого'),
    answer: () => `Ориентиры такие: ${priceList}. Точную смету посчитаем после короткого брифа — оставьте контакт, вернёмся с расчётом в течение дня.`,
  },
  {
    test: stems('доллар', 'валют', 'курс', 'usd', 'сум'),
    answer: () => `Расчёты по договору — в сумах. Сумму в долларах называем как ориентир по условному курсу $1 = ${USD_RATE.toLocaleString('ru-RU')} сум; итог фиксируется в сумах на дату подписания.`,
  },
  {
    test: stems('срок', 'как долго', 'когда', 'успе', 'быстро', 'время'),
    answer: () => `Лендинг делаем 3–4 недели, корпоративный сайт — 6–10, магазин — 10–16. Срочный запуск обсуждаем отдельно.`,
  },
  {
    test: stems('этап', 'процесс', 'как работ', 'порядок', 'начина'),
    answer: () => `${PROCESS.map((p) => `${p.step}. ${p.title} — ${p.duration}`).join('. ')}. Каждую неделю показываем прогресс на тестовом стенде.`,
  },
  {
    test: stems('оплат', 'договор', 'предоплат', 'документ', 'счёт', 'счет', 'фактур'),
    answer: () => `Работаем по договору с поэтапной оплатой: аванс за этап, остаток — по приёмке. Выставляем счёт-фактуру и даём закрывающие документы для МЧЖ (ООО) и ЯТТ.`,
  },
  {
    test: stems('гаранти', 'поддержк', 'доработ', 'правк'),
    answer: () => `После прототипа фиксируем смету, даём 3 месяца бесплатной поддержки и передаём исходный код. Две итерации правок входят в каждый этап.`,
  },
  {
    test: stems('язык', 'узбекск', 'мультиязыч', 'перевод'),
    answer: () => `Обычно делаем сайт на узбекском и русском, при необходимости добавляем английский. Переключатель языков закладываем сразу, чтобы потом не переделывать.`,
  },
  {
    test: stems('ии', 'нейросет', 'ai', 'бот', 'ассистент'),
    answer: () => `Внедряем ассистента на сайт: база знаний по вашим услугам, квиз-воронка, уведомления в Telegram и админка с диалогами. Стоимость — ${priceLabel(35_700_000)}, срок 2–4 недели.`,
  },
  {
    test: stems('контакт', 'связ', 'телефон', 'почт', 'позвон', 'написать', 'график'),
    answer: () => `Телефон ${COMPANY.phone}, почта ${COMPANY.email}, Telegram ${COMPANY.telegram}. Работаем ${COMPANY.workHours}. Или оставьте свой контакт — перезвоним сами.`,
  },
  {
    test: stems('привет', 'здравств', 'добрый', 'salom', 'hi', 'hello'),
    answer: () => `Здравствуйте. Помогу разобраться с услугами ${COMPANY.name}: сроки, цены, этапы работы. Что интересует?`,
  },
];

const FALLBACK = `Подскажу по услугам, срокам и ценам ${COMPANY.name}. Если вопрос узкий — оставьте контакт, менеджер ответит подробно в течение рабочего дня.`;

export function mockAnswer(userText: string): string {
  const text = userText.trim();

  for (const rule of RULES) {
    if (rule.test.test(text)) return rule.answer();
  }

  // Совпадение по словам вопроса из FAQ — дешёвая замена поиску.
  // Порог в два слова: по одному совпадению «делаете» вопрос про смету
  // улетал в ответ про фотосъёмку, что хуже честной общей фразы.
  const words = text.toLowerCase().match(/[\p{L}\d]{4,}/gu) ?? [];
  if (words.length) {
    let best: { score: number; answer: string } | null = null;
    for (const item of FAQ) {
      const haystack = item.q.toLowerCase();
      const score = words.filter((w) => haystack.includes(w)).length;
      if (score >= 2 && (!best || score > best.score)) best = { score, answer: item.a };
    }
    if (best) return best.answer;
  }

  return FALLBACK;
}

export function mockQuizComment(answer: string): string {
  return `Понял: ${answer.toLowerCase()}. Учтём это при расчёте сметы.`;
}

/** Итог квиза без модели: тот же расчёт, только шаблонным текстом. */
export function mockQuizResult(match: QuizMatch): string {
  const { service, alternative } = match;
  const parts = [
    match.inferred
      ? `По вашим ответам лучше всего подходит ${service.title.toLowerCase()}: он закрывает главную цель без лишних затрат.`
      : `${service.title} — хороший выбор под вашу задачу, срок ${service.duration}.`,
  ];
  if (alternative) {
    parts.push(
      `Чтобы уложиться в бюджет, можно начать с формата «${alternative.title}» и добавить остальное вторым этапом.`,
    );
  } else if (match.budgetFit === 'close') {
    parts.push('Бюджет близок к стартовой цене — обсудим объём первого этапа.');
  }
  if (match.deadlineFit === 'tight') {
    parts.push('Срок сжатый — предложим запуск по этапам, чтобы главное заработало быстрее.');
  }
  return parts.join(' ');
}

/** Выжимка для менеджера без модели: пометки расчёта одной строкой. */
export function mockLeadSummary(match: QuizMatch): string {
  return [`Подходит: ${match.service.title}, ${priceLabel(match.service.priceFrom)}.`, ...match.flags].join(' ');
}
