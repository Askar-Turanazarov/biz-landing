/**
 * Выбор хранилища. Заданы переменные Upstash (деплой на Vercel) — данные в Redis,
 * иначе, как и раньше, в JSON-файлах backend/data.
 */
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Redis } from '@upstash/redis';
import { config } from '../config.js';
import { JsonStore, type Store } from './jsonStore.js';
import { RedisStore } from './redisStore.js';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(here, '../../data');

let redis: Redis | null = null;

export const storageKind = (): 'upstash' | 'json' =>
  config.redis.url && config.redis.token ? 'upstash' : 'json';

export function createStore<T>(name: string, options: { maxItems?: number } = {}): Store<T> {
  if (storageKind() === 'upstash') {
    redis ??= new Redis({ url: config.redis.url, token: config.redis.token });
    return new RedisStore<T>(redis, `orbit:${name}`, options.maxItems);
  }
  return new JsonStore<T>(resolve(dataDir, `${name}.json`));
}
