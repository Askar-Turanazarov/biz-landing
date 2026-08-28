/**
 * Метки источника трафика и идентификатор сессии.
 * UTM запоминаем один раз за визит: посетитель может уйти на другую страницу
 * и вернуться уже без параметров в адресе, а заявку нужно приписать к каналу.
 */

const UTM_KEY = 'orbit_utm';
const REFERRER_KEY = 'orbit_referrer';
const SESSION_KEY = 'orbit_session';

const UTM_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;

/** localStorage может быть недоступен: приватный режим, отключённые куки. */
function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* без хранилища просто теряем метки — на приём заявки это не влияет */
  }
}

export function captureTraffic(): void {
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of UTM_PARAMS) {
    const value = params.get(key);
    if (value) utm[key] = value.slice(0, 120);
  }
  if (Object.keys(utm).length) safeSet(UTM_KEY, JSON.stringify(utm));

  if (!safeGet(REFERRER_KEY) && document.referrer && !document.referrer.includes(location.host)) {
    safeSet(REFERRER_KEY, document.referrer.slice(0, 300));
  }
}

export function getUtm(): Record<string, string> {
  const raw = safeGet(UTM_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

export function getReferrer(): string {
  return safeGet(REFERRER_KEY) ?? '';
}

/** Один идентификатор на устройство: он связывает диалог с ассистентом и заявку. */
export function getSessionId(): string {
  const existing = safeGet(SESSION_KEY);
  if (existing) return existing;
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  safeSet(SESSION_KEY, id);
  return id;
}
