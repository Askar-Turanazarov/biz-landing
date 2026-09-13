/**
 * Минимальное файловое хранилище: весь массив держим в памяти, файл — только персистентность.
 * Запись атомарная (tmp + rename) и сериализована через промис-очередь,
 * иначе две одновременные заявки затрут друг друга.
 */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

/** Общий контракт хранилищ: JSON-файлы локально и Upstash Redis на Vercel. */
export interface Store<T> {
  all(): Promise<T[]>;
  insert(item: T): Promise<T>;
  update(match: (item: T) => boolean, patch: Partial<T>): Promise<T | null>;
  upsert(match: (item: T) => boolean, create: () => T, patch?: Partial<T>): Promise<T>;
  remove(match: (item: T) => boolean): Promise<boolean>;
}

export class JsonStore<T> implements Store<T> {
  private items: T[] = [];
  private ready: Promise<void>;
  /** Хвост очереди записи: каждая новая запись встаёт за предыдущей. */
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string) {
    this.ready = this.load();
  }

  private async load(): Promise<void> {
    try {
      const raw = await readFile(this.filePath, 'utf8');
      const parsed: unknown = JSON.parse(raw);
      this.items = Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch (err) {
      const code = (err as NodeJS.ErrnoException)?.code;
      if (code !== 'ENOENT') {
        console.error(`[store] не удалось прочитать ${this.filePath}:`, err);
      }
      this.items = [];
    }
  }

  private flush(): Promise<void> {
    const snapshot = JSON.stringify(this.items, null, 2);
    this.writeQueue = this.writeQueue.then(async () => {
      const tmp = `${this.filePath}.tmp`;
      await mkdir(dirname(this.filePath), { recursive: true });
      await writeFile(tmp, snapshot, 'utf8');
      await rename(tmp, this.filePath);
    });
    return this.writeQueue.catch((err) => {
      console.error(`[store] не удалось записать ${this.filePath}:`, err);
    });
  }

  async all(): Promise<T[]> {
    await this.ready;
    return this.items;
  }

  async insert(item: T): Promise<T> {
    await this.ready;
    this.items.unshift(item);
    await this.flush();
    return item;
  }

  /** Точечное обновление по предикату. Возвращает обновлённый элемент или null. */
  async update(match: (item: T) => boolean, patch: Partial<T>): Promise<T | null> {
    await this.ready;
    const idx = this.items.findIndex(match);
    if (idx === -1) return null;
    this.items[idx] = { ...this.items[idx], ...patch };
    await this.flush();
    return this.items[idx];
  }

  async upsert(match: (item: T) => boolean, create: () => T, patch?: Partial<T>): Promise<T> {
    await this.ready;
    const idx = this.items.findIndex(match);
    if (idx === -1) {
      const created = patch ? { ...create(), ...patch } : create();
      this.items.unshift(created);
      await this.flush();
      return created;
    }
    if (patch) this.items[idx] = { ...this.items[idx], ...patch };
    await this.flush();
    return this.items[idx];
  }

  async remove(match: (item: T) => boolean): Promise<boolean> {
    await this.ready;
    const idx = this.items.findIndex(match);
    if (idx === -1) return false;
    this.items.splice(idx, 1);
    await this.flush();
    return true;
  }
}
