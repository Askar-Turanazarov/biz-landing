/**
 * База знаний ассистента: единственный источник фактов об услугах.
 * Тексты здесь обязаны совпадать с frontend/src/site.config.ts —
 * иначе ассистент начнёт противоречить тому, что написано на странице.
 *
 * Все цены — в узбекских сумах. Доллары нигде не хранятся: справочная сумма
 * считается по курсу USD_RATE, чтобы прайс и ориентир не разъезжались.
 */

/** Условный курс для справочного пересчёта. Держим его в одном месте. */
export const USD_RATE = 11_900;

export const TIMEZONE = 'Asia/Tashkent';

export const COMPANY = {
  name: 'ORBIT',
  tagline: 'студия веб-разработки',
  city: 'Ташкент, работаем удалённо по всему Узбекистану и Центральной Азии',
  since: 2016,
  team: 14,
  projects: 180,
  // Заглушки, как на сайте (frontend/src/site.config.ts): студия вымышленная,
  // а настоящий на вид номер мог бы принадлежать реальному человеку.
  email: 'hello@orbit.example',
  phone: '+998 (71) XXX-XX-XX',
  telegram: '@orbit_xxx',
  workHours: 'будни 10:00–19:00 по Ташкенту (UTC+5), заявки принимаем круглосуточно',
} as const;

export function formatSum(amount: number): string {
  return `${amount.toLocaleString('ru-RU')} сум`;
}

export function formatUsdApprox(amount: number): string {
  return `~$${Math.round(amount / USD_RATE).toLocaleString('ru-RU')}`;
}

/** «от 23 800 000 сум (~$2 000)» — так цена звучит в ответах ассистента. */
export function priceLabel(amount: number): string {
  return `от ${formatSum(amount)} (${formatUsdApprox(amount)})`;
}

/** Вилка: единица измерения ставится один раз, в конце. */
export function formatSumRange(from: number, to: number): string {
  return `${from.toLocaleString('ru-RU')}–${formatSum(to)}`;
}

export interface ServiceInfo {
  id: string;
  title: string;
  /** Стартовая цена в сумах. */
  priceFrom: number;
  duration: string;
  summary: string;
  includes: string[];
}

export const SERVICES: ServiceInfo[] = [
  {
    id: 'landing',
    title: 'Продающий лендинг',
    priceFrom: 23_800_000,
    duration: '3–4 недели',
    summary: 'Одностраничник под один продукт или услугу с фокусом на заявки.',
    includes: ['Прототип и копирайтинг', 'Индивидуальный дизайн', 'Вёрстка и анимации', 'Формы, аналитика, интеграция с CRM'],
  },
  {
    id: 'corporate',
    title: 'Корпоративный сайт',
    priceFrom: 59_500_000,
    duration: '6–10 недель',
    summary: 'Многостраничный сайт компании с каталогом услуг, блогом и админкой.',
    includes: ['Структура и SEO-каркас', 'Дизайн-система', 'CMS для самостоятельного наполнения', 'Мультиязычность: узбекский, русский, английский'],
  },
  {
    id: 'ecommerce',
    title: 'Интернет-магазин',
    priceFrom: 95_200_000,
    duration: '10–16 недель',
    summary: 'Каталог, корзина, оплата, доставка, личный кабинет покупателя.',
    includes: ['Интеграция с 1С и складом', 'Оплата через Payme, Click и Uzum Bank', 'Промокоды и программа лояльности', 'Аналитика продаж'],
  },
  {
    id: 'webapp',
    title: 'Веб-сервис и личный кабинет',
    priceFrom: 154_700_000,
    duration: 'от 3 месяцев',
    summary: 'MVP продукта или внутренняя система: роли, данные, интеграции.',
    includes: ['Проектирование архитектуры', 'Backend и база данных', 'Роли и права доступа', 'API для мобильных приложений'],
  },
  {
    id: 'ai',
    title: 'Внедрение ИИ на сайт',
    priceFrom: 35_700_000,
    duration: '2–4 недели',
    summary: 'Ассистент-консультант, квалификация лидов, автоответы на заявки.',
    includes: ['База знаний по вашим услугам', 'Квиз-воронка с подбором решения', 'Уведомления в Telegram и CRM', 'Админ-панель с диалогами'],
  },
  {
    id: 'redesign',
    title: 'Редизайн и ускорение',
    priceFrom: 29_750_000,
    duration: '3–5 недель',
    summary: 'Переупаковка существующего сайта: внешний вид, скорость, конверсия.',
    includes: ['Аудит текущего сайта', 'Новый дизайн без потери позиций', 'Оптимизация Core Web Vitals', 'A/B-тесты ключевых экранов'],
  },
];

export function serviceById(id: string): ServiceInfo | undefined {
  return SERVICES.find((service) => service.id === id);
}

/**
 * Минимальный срок услуги в неделях — для сравнения со сроком клиента.
 * Строка duration в SERVICES написана для людей, считать по ней нельзя.
 */
export const MIN_WEEKS: Record<string, number> = {
  landing: 3,
  corporate: 6,
  ecommerce: 10,
  webapp: 12,
  ai: 2,
  redesign: 3,
};

/**
 * Коды вариантов квиза. Подписи живут во frontend/src/site.config.ts (quizSteps),
 * смысл кодов — здесь. Наборы обязаны совпадать: неизвестный код в расчёт не попадёт.
 */
export const QUIZ_CODES = {
  type: ['landing', 'corporate', 'ecommerce', 'webapp', 'unsure'],
  state: ['scratch', 'brand', 'old_site', 'figma'],
  deadline: ['urgent', 'month', 'quarter', 'flexible'],
  budget: ['lt25', '25_60', '60_150', 'gt150', 'unknown'],
  goal: ['leads', 'sales', 'expertise', 'automation'],
} as const;

/**
 * Верхняя граница бюджетных вилок квиза в сумах; null — посетитель просит ориентир.
 * Числа совпадают с подписями вариантов на фронтенде.
 */
export const BUDGET_MAX: Record<string, number | null> = {
  lt25: 25_000_000,
  '25_60': 60_000_000,
  '60_150': 150_000_000,
  gt150: Number.POSITIVE_INFINITY,
  unknown: null,
};

/** Сколько недель у клиента есть на запуск. */
export const DEADLINE_WEEKS: Record<string, number> = {
  urgent: 2,
  month: 4,
  quarter: 13,
  flexible: Number.POSITIVE_INFINITY,
};

/** Если формат не выбран, подбираем его по главной цели сайта. */
export const GOAL_TO_SERVICE: Record<string, string> = {
  leads: 'landing',
  sales: 'ecommerce',
  expertise: 'corporate',
  automation: 'webapp',
};

/** С чего начать, если бюджет ниже нужного формата. Порядок — от дешёвого к дорогому. */
export const STARTER_SERVICES = ['landing', 'corporate'];

/** Как подбирать формат по задаче. Одна логика для чата (через промпт) и для квиза. */
export const SELECTION_GUIDE: { when: string; serviceId: string }[] = [
  { when: 'нужно собирать заявки на один продукт или услугу', serviceId: 'landing' },
  { when: 'нужно показать компанию, несколько направлений и экспертизу', serviceId: 'corporate' },
  { when: 'нужно продавать онлайн: каталог, корзина, оплата', serviceId: 'ecommerce' },
  { when: 'нужно автоматизировать процессы, личные кабинеты или MVP продукта', serviceId: 'webapp' },
  { when: 'сайт уже есть, но устарел, медленный или плохо приносит заявки', serviceId: 'redesign' },
  { when: 'сайт есть, а нужен ИИ-консультант и квалификация заявок', serviceId: 'ai' },
];

export const PROCESS = [
  { step: 1, title: 'Бриф и аналитика', duration: '3–5 дней', text: 'Разбираем задачу, изучаем конкурентов, фиксируем цели и метрики.' },
  { step: 2, title: 'Прототип и дизайн', duration: '1–3 недели', text: 'Собираем структуру, показываем кликабельный прототип, рисуем макеты.' },
  { step: 3, title: 'Разработка', duration: '2–8 недель', text: 'Вёрстка, backend, интеграции. Каждую неделю — демо на тестовом стенде.' },
  { step: 4, title: 'Запуск и поддержка', duration: 'бессрочно', text: 'Переносим на боевой сервер, обучаем команду, ведём сайт дальше.' },
];

export const GUARANTEES = [
  'Работаем по договору с поэтапной оплатой — предоплата за этап, а не за весь проект.',
  'После прототипа фиксируем стоимость: смета не растёт в процессе.',
  'Расчёты в сумах, счёт-фактура и закрывающие документы для МЧЖ (ООО) и ЯТТ.',
  '3 месяца бесплатной технической поддержки после запуска.',
  'Исходный код и все макеты передаём заказчику — сайт остаётся вашим.',
  'Подписываем NDA, если проект закрытый.',
];

export const STACK = 'React, Next.js, TypeScript, Node.js, PostgreSQL, Figma. ИИ-часть — Gemini и Claude.';

export const FAQ = [
  {
    q: 'Сколько стоит сайт?',
    a: `Лендинг — ${priceLabel(23_800_000)}, корпоративный сайт — ${priceLabel(59_500_000)}, магазин — ${priceLabel(95_200_000)}, веб-сервис — ${priceLabel(154_700_000)}. Точную смету называем после брифа, обычно в течение двух рабочих дней.`,
  },
  {
    q: 'Сколько времени займёт работа?',
    a: 'Лендинг — 3–4 недели, корпоративный сайт — 6–10 недель, магазин — 10–16 недель, веб-сервис — от 3 месяцев. Срочный запуск обсуждаем отдельно.',
  },
  {
    q: 'Как происходит оплата?',
    a: 'По договору, поэтапно: аванс за текущий этап, остаток — по его приёмке. Работаем с МЧЖ (ООО), ЯТТ и самозанятыми, выставляем счёт-фактуру и даём закрывающие документы.',
  },
  {
    q: 'Можно ли платить в долларах?',
    a: `Расчёты по договору ведём в сумах. В смете дублируем сумму в долларах по условному курсу $1 = ${USD_RATE.toLocaleString('ru-RU')} сум — это только ориентир, итог фиксируется в сумах на дату подписания.`,
  },
  {
    q: 'Что если мне не понравится дизайн?',
    a: 'В стоимость входят две итерации правок на каждом этапе. Дизайн утверждаем до старта вёрстки, поэтому переделывать готовый сайт не приходится.',
  },
  {
    q: 'Вы делаете тексты и фотографии?',
    a: `Копирайтинг входит в проект. Съёмку и покупку стоков организуем отдельно — обычно ${formatSumRange(4_000_000, 12_000_000)} в зависимости от объёма.`,
  },
  {
    q: 'На каких языках делаете сайт?',
    a: 'Обычно узбекский и русский, при необходимости английский. Переключатель языков и структуру под мультиязычность закладываем сразу.',
  },
  {
    q: 'Кто будет наполнять сайт после запуска?',
    a: 'Вы сами через админку — мы записываем видеоинструкцию и проводим обучение. Либо ведём наполнение сами в рамках поддержки.',
  },
  {
    q: 'Будет ли сайт в топе поиска?',
    a: 'Мы закладываем технический SEO-каркас: скорость, семантика, микроразметка, карта сайта. Продвижение в топ — отдельная услуга, её ведут партнёры.',
  },
  {
    q: 'Работаете с другими городами?',
    a: 'Да, большинство проектов ведём удалённо: Самарканд, Бухара, Фергана, а также Казахстан и Кыргызстан. Созвоны в Zoom или Telegram, доступ к прогрессу — на тестовом стенде в любое время.',
  },
];

/** Компактная выжимка базы знаний для системного промпта. */
export function knowledgeSummary(): string {
  const services = SERVICES.map(
    (s) => `- ${s.title}: ${priceLabel(s.priceFrom)}, срок ${s.duration}. ${s.summary}`,
  ).join('\n');
  const process = PROCESS.map((p) => `${p.step}. ${p.title} (${p.duration}) — ${p.text}`).join('\n');
  const faq = FAQ.map((f) => `В: ${f.q}\nО: ${f.a}`).join('\n');
  const guide = SELECTION_GUIDE.map((g) => {
    const s = serviceById(g.serviceId);
    return s ? `- Если ${g.when} → ${s.title} (${priceLabel(s.priceFrom)}, ${s.duration}).` : '';
  })
    .filter(Boolean)
    .join('\n');
  const starters = STARTER_SERVICES.map((id) => serviceById(id))
    .map((s) => (s ? `${s.title.toLowerCase()} ${priceLabel(s.priceFrom)}` : ''))
    .filter(Boolean)
    .join(' или ');

  return `КОМПАНИЯ
${COMPANY.name} — ${COMPANY.tagline}. На рынке с ${COMPANY.since} года, команда ${COMPANY.team} человек, ${COMPANY.projects}+ проектов.
${COMPANY.city}. График: ${COMPANY.workHours}.
Контакты: ${COMPANY.phone}, ${COMPANY.email}, Telegram ${COMPANY.telegram}.

ВАЛЮТА
Все цены — в узбекских сумах. Сумму в долларах называем только как ориентир
по условному курсу $1 = ${USD_RATE.toLocaleString('ru-RU')} сум и обязательно со словом «примерно».
Рубли, евро и другие валюты не упоминаем.

УСЛУГИ И ЦЕНЫ
${services}

ПОДБОР ФОРМАТА
${guide}
- Если бюджет ниже стартовой цены нужного формата — честно назови цену и предложи начать с меньшего: ${starters}, а остальное добавить вторым этапом.
- Если нужный срок короче обычного — назови обычный срок и предложи запуск по этапам: сначала ключевые страницы и функции.

ЭТАПЫ РАБОТЫ
${process}

ГАРАНТИИ
${GUARANTEES.map((g) => '- ' + g).join('\n')}

СТЕК
${STACK}

ЧАСТЫЕ ВОПРОСЫ
${faq}`;
}
