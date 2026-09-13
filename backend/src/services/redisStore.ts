/**
 * Хранилище в Upstash Redis — для деплоя на Vercel, где у функций нет постоянного диска,
 * а у каждого экземпляра своя память. Массив целиком лежит в одном ключе и читается
 * заново на каждый запрос: для учебного объёма заявок этого достаточно.
 */
import type { Redis } from '@upstash/redis';
import type { Store } from './jsonStore.js';

export class RedisStore<T> implements Store<T> {
  /** Хвост очереди изменений: чтение-изменение-запись внутри экземпляра идут по одному. */
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly redis: Redis,
    private readonly key: string,
    /** Сколько последних записей хранить: значение ключа не должно расти бесконечно. */
    private readonly maxItems?: number,
  ) {}

  async all(): Promise<T[]> {
    const items = await this.redis.get<T[]>(this.key);
    return Array.isArray(items) ? items : [];
  }

  /**
   * Прочитать массив, изменить и записать обратно. Если чтение упало, до записи
   * дело не доходит — иначе пустой массив затёр бы все сохранённые заявки.
   */
  private mutate<R>(change: (items: T[]) => { result: R; changed: boolean }): Promise<R> {
    const run = this.queue.then(async () => {
      const items = await this.all();
      const { result, changed } = change(items);
      if (changed) {
        await this.redis.set(this.key, this.maxItems ? items.slice(0, this.maxItems) : items);
      }
      return result;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  insert(item: T): Promise<T> {
    return this.mutate((items) => {
      items.unshift(item);
      return { result: item, changed: true };
    });
  }

  update(match: (item: T) => boolean, patch: Partial<T>): Promise<T | null> {
    return this.mutate<T | null>((items) => {
      const idx = items.findIndex(match);
      if (idx === -1) return { result: null, changed: false };
      items[idx] = { ...items[idx], ...patch };
      return { result: items[idx], changed: true };
    });
  }

  upsert(match: (item: T) => boolean, create: () => T, patch?: Partial<T>): Promise<T> {
    return this.mutate((items) => {
      const idx = items.findIndex(match);
      if (idx === -1) {
        const created = patch ? { ...create(), ...patch } : create();
        items.unshift(created);
        return { result: created, changed: true };
      }
      if (!patch) return { result: items[idx], changed: false };
      items[idx] = { ...items[idx], ...patch };
      return { result: items[idx], changed: true };
    });
  }

  remove(match: (item: T) => boolean): Promise<boolean> {
    return this.mutate((items) => {
      const idx = items.findIndex(match);
      if (idx === -1) return { result: false, changed: false };
      items.splice(idx, 1);
      return { result: true, changed: true };
    });
  }
}
