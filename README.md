# ORBIT — AI-powered landing page

**[English](#english) · [O'zbekcha](#ozbekcha) · [Русский](#русский)**

Live demo: **https://biz-landing-askar.vercel.app**

---

## English

> Learning project.

A sales landing page for a web development studio with a built-in AI assistant. The assistant answers
questions about services, runs a short quiz, recommends a format with a price estimate and qualifies the lead.
Leads go to a hidden admin panel and to Telegram.

### Features

- **AI quiz** — five questions; the format, budget fit and timing are calculated in code from the price list,
  and the AI explains the recommendation in two short paragraphs.
- **AI chat** — answers from a knowledge base. A model chain (Gemini → Claude → scripted answers) switches
  instantly on rate limits or errors, so the visitor never sees an error.
- **Lead qualification** — hot / warm / cold label, an AI summary and the next step for the manager.
- **Telegram** — instant notifications with a "take lead" button (long polling locally, webhook on Vercel).
- **Admin panel** at `/superadmin` — password login, statistics, filters, dialog history, CSV export.
- **3D background** on a single WebGL canvas; three.js is not downloaded on phones.
- **Anti-spam** — honeypot field, minimum fill time, rate limiting.

### Stack

React 18 · Vite · TypeScript · Tailwind CSS · three.js / React Three Fiber · Express · Gemini & Claude APIs ·
Upstash Redis · Vercel

### Quick start

Requires Node 20+.

```bash
cd backend && npm install && cp .env.example .env && npm run dev
```

```bash
cd frontend && npm install && npm run dev
```

The site runs at http://localhost:5173, the API at `:3001` (Vite proxies `/api`). The site works without API keys:
the assistant falls back to scripted answers and leads are saved to `backend/data/*.json`.

Checks before committing:

```bash
cd backend && npm run typecheck && cd ../frontend && npm run build
```

### Configuration

All settings live in `backend/.env` (see `.env.example` for comments).

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY`, `GEMINI_MODELS` | Gemini key and model chain (order = priority) |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODELS` | optional Claude fallback |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | bot token and chat IDs (comma-separated) |
| `TELEGRAM_ENABLE_POLLING` | "take lead" button on localhost |
| `TELEGRAM_WEBHOOK_SECRET` | webhook secret on Vercel |
| `ADMIN_PASSWORD`, `ADMIN_SECRET` | admin login and session signing |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` or `KV_REST_API_URL` / `_TOKEN` | storage on Vercel |

### Deploying to Vercel

The repository is deployed as **two Vercel projects**, because a Vercel project cannot read folders outside
its root directory.

1. **API** — Root Directory `backend`, project name `biz-landing-api`. Connect **Upstash Redis**
   (Storage, custom prefix `KV`), add the variables above plus `FRONTEND_ORIGIN` and `PUBLIC_ADMIN_URL`
   pointing to the site domain, then redeploy.
2. **Site** — Root Directory `frontend`. `frontend/vercel.json` proxies `/api` to the API project;
   change the address there if your API project has a different name.
3. Register the Telegram webhook once:

```text
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://biz-landing-api.vercel.app/api/telegram/webhook&secret_token=<SECRET>&allowed_updates=%5B%22callback_query%22%5D
```

After that set `TELEGRAM_ENABLE_POLLING=false` locally or use a separate bot for development.

### Project structure

| What | Where |
|---|---|
| Texts, services, prices, quiz steps | `frontend/src/site.config.ts` |
| Assistant knowledge base (must match the site) | `backend/src/services/knowledgeBase.ts` |
| Format matching and lead qualification | `backend/src/services/qualification.ts` |
| Assistant prompts | `backend/src/services/systemPrompt.ts` |
| Model chain | `backend/src/services/llm/` |
| 3D scene | `frontend/src/three/` |

---

## O'zbekcha

> O'quv loyihasi.

Veb-dasturlash studiyasi uchun sotuvchi landing sahifa, unga sun'iy intellekt yordamchisi o'rnatilgan.
Yordamchi xizmatlar haqidagi savollarga javob beradi, qisqa kviz o'tkazadi, taxminiy narx bilan mos formatni
tavsiya qiladi va arizani saralaydi. Arizalar yashirin boshqaruv paneliga va Telegramga tushadi.

### Imkoniyatlar

- **AI-kviz** — beshta savol; format, byudjet va muddatga moslik kodda narxlar ro'yxati bo'yicha hisoblanadi,
  AI esa tavsiyani ikki qisqa xatboshida tushuntiradi.
- **AI-chat** — bilimlar bazasidan javob beradi. Modellar zanjiri (Gemini → Claude → tayyor javoblar)
  limit yoki xatolikda darhol almashadi, shuning uchun tashrif buyuruvchi xatoni ko'rmaydi.
- **Arizani saralash** — issiq / iliq / sovuq belgisi, menejer uchun AI xulosasi va keyingi qadam.
- **Telegram** — «Ishga olish» tugmasi bilan tezkor bildirishnomalar (lokalda long polling, Vercel'da webhook).
- **Boshqaruv paneli** `/superadmin` manzilida — parol bilan kirish, statistika, filtrlar, suhbatlar tarixi,
  CSV eksport.
- **3D fon** bitta WebGL canvas'da; telefonlarda three.js yuklanmaydi.
- **Spamdan himoya** — honeypot maydoni, minimal to'ldirish vaqti, so'rovlar chegarasi.

### Texnologiyalar

React 18 · Vite · TypeScript · Tailwind CSS · three.js / React Three Fiber · Express · Gemini va Claude API ·
Upstash Redis · Vercel

### Tezkor ishga tushirish

Node 20+ talab qilinadi.

```bash
cd backend && npm install && cp .env.example .env && npm run dev
```

```bash
cd frontend && npm install && npm run dev
```

Sayt http://localhost:5173 manzilida, API esa `:3001` portida ishlaydi (Vite `/api` so'rovlarini proksilaydi).
Sayt API kalitlarisiz ham ishlaydi: yordamchi tayyor javoblardan foydalanadi, arizalar `backend/data/*.json`
fayllariga yoziladi.

Commit oldidan tekshirish:

```bash
cd backend && npm run typecheck && cd ../frontend && npm run build
```

### Sozlash

Barcha sozlamalar `backend/.env` faylida (izohlar bilan namuna — `.env.example`).

| O'zgaruvchi | Vazifasi |
|---|---|
| `GEMINI_API_KEY`, `GEMINI_MODELS` | Gemini kaliti va modellar zanjiri (tartib = ustuvorlik) |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODELS` | ixtiyoriy zaxira — Claude |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | bot tokeni va chat ID'lari (vergul bilan) |
| `TELEGRAM_ENABLE_POLLING` | lokalda «Ishga olish» tugmasi |
| `TELEGRAM_WEBHOOK_SECRET` | Vercel'dagi webhook siri |
| `ADMIN_PASSWORD`, `ADMIN_SECRET` | panelga kirish va sessiyani imzolash |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` yoki `KV_REST_API_URL` / `_TOKEN` | Vercel'dagi ma'lumotlar ombori |

### Vercel'ga joylashtirish

Repozitoriy **ikkita Vercel loyihasi** sifatida joylashtiriladi, chunki Vercel loyihasi o'z asosiy papkasidan
tashqaridagi fayllarni ko'rmaydi.

1. **API** — Root Directory `backend`, loyiha nomi `biz-landing-api`. **Upstash Redis**ni ulang
   (Storage, custom prefix `KV`), yuqoridagi o'zgaruvchilarni hamda sayt domeniga ishora qiluvchi
   `FRONTEND_ORIGIN` va `PUBLIC_ADMIN_URL`ni qo'shing, so'ng qayta deploy qiling.
2. **Sayt** — Root Directory `frontend`. `frontend/vercel.json` `/api` so'rovlarini API loyihasiga yo'naltiradi;
   API loyihasining nomi boshqacha bo'lsa, manzilni o'sha faylda o'zgartiring.
3. Telegram webhook'ini bir marta ro'yxatdan o'tkazing:

```text
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://biz-landing-api.vercel.app/api/telegram/webhook&secret_token=<SECRET>&allowed_updates=%5B%22callback_query%22%5D
```

Shundan so'ng lokalda `TELEGRAM_ENABLE_POLLING=false` qo'ying yoki ishlab chiqish uchun alohida bot ishlating.

### Loyiha tuzilmasi

| Nima | Qayerda |
|---|---|
| Matnlar, xizmatlar, narxlar, kviz qadamlari | `frontend/src/site.config.ts` |
| Yordamchining bilimlar bazasi (sayt bilan mos bo'lishi shart) | `backend/src/services/knowledgeBase.ts` |
| Formatni tanlash va arizani saralash | `backend/src/services/qualification.ts` |
| Yordamchi promptlari | `backend/src/services/systemPrompt.ts` |
| Modellar zanjiri | `backend/src/services/llm/` |
| 3D sahna | `frontend/src/three/` |

---

## Русский

> Учебный проект.

Продающий лендинг студии веб-разработки со встроенным ИИ-помощником. Помощник отвечает на вопросы об услугах,
проводит короткий квиз, рекомендует формат с ориентиром по цене и квалифицирует заявку. Заявки попадают
в скрытую админку и в Telegram.

### Возможности

- **ИИ-квиз** — пять вопросов; формат, соответствие бюджету и срокам считает код по прайсу,
  а ИИ объясняет рекомендацию в двух коротких абзацах.
- **ИИ-чат** — отвечает по базе знаний. Цепочка моделей (Gemini → Claude → заготовленные ответы) мгновенно
  переключается при лимитах и ошибках, поэтому посетитель не видит ошибок.
- **Квалификация заявки** — метка «горячая / тёплая / холодная», выжимка ИИ и следующий шаг для менеджера.
- **Telegram** — мгновенные уведомления с кнопкой «Взять в работу» (локально long polling, на Vercel вебхук).
- **Админка** по адресу `/superadmin` — вход по паролю, статистика, фильтры, история диалогов, экспорт в CSV.
- **3D-фон** на одном WebGL-canvas; на телефонах three.js не загружается.
- **Антиспам** — поле-ловушка, минимальное время заполнения, ограничение частоты запросов.

### Стек

React 18 · Vite · TypeScript · Tailwind CSS · three.js / React Three Fiber · Express · Gemini и Claude API ·
Upstash Redis · Vercel

### Быстрый старт

Нужен Node 20+.

```bash
cd backend && npm install && cp .env.example .env && npm run dev
```

```bash
cd frontend && npm install && npm run dev
```

Сайт открывается на http://localhost:5173, API работает на `:3001` (Vite проксирует `/api`). Сайт работает
и без API-ключей: помощник отвечает заготовками, заявки сохраняются в `backend/data/*.json`.

Проверка перед коммитом:

```bash
cd backend && npm run typecheck && cd ../frontend && npm run build
```

### Настройка

Все настройки — в `backend/.env` (образец с комментариями — `.env.example`).

| Переменная | Назначение |
|---|---|
| `GEMINI_API_KEY`, `GEMINI_MODELS` | ключ Gemini и цепочка моделей (порядок = приоритет) |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODELS` | необязательный запасной вариант — Claude |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | токен бота и ID чатов (через запятую) |
| `TELEGRAM_ENABLE_POLLING` | кнопка «Взять в работу» на localhost |
| `TELEGRAM_WEBHOOK_SECRET` | секрет вебхука на Vercel |
| `ADMIN_PASSWORD`, `ADMIN_SECRET` | вход в админку и подпись сессии |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` или `KV_REST_API_URL` / `_TOKEN` | хранилище на Vercel |

### Деплой на Vercel

Репозиторий подключается **двумя проектами Vercel**: проект Vercel не видит файлы вне своей корневой папки.

1. **API** — Root Directory `backend`, имя проекта `biz-landing-api`. Подключите **Upstash Redis**
   (Storage, custom prefix `KV`), добавьте переменные из таблицы, а также `FRONTEND_ORIGIN` и `PUBLIC_ADMIN_URL`
   с доменом сайта, затем сделайте Redeploy.
2. **Сайт** — Root Directory `frontend`. `frontend/vercel.json` проксирует `/api` на проект API;
   если имя проекта API другое, поправьте адрес в этом файле.
3. Один раз зарегистрируйте вебхук Telegram:

```text
https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://biz-landing-api.vercel.app/api/telegram/webhook&secret_token=<SECRET>&allowed_updates=%5B%22callback_query%22%5D
```

После этого локально поставьте `TELEGRAM_ENABLE_POLLING=false` или используйте для разработки отдельного бота.

### Структура проекта

| Что | Где |
|---|---|
| Тексты, услуги, цены, шаги квиза | `frontend/src/site.config.ts` |
| База знаний помощника (должна совпадать с сайтом) | `backend/src/services/knowledgeBase.ts` |
| Подбор формата и квалификация заявки | `backend/src/services/qualification.ts` |
| Промпты помощника | `backend/src/services/systemPrompt.ts` |
| Цепочка моделей | `backend/src/services/llm/` |
| 3D-сцена | `frontend/src/three/` |
