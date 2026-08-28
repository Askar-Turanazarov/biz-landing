import { create } from 'zustand';

/**
 * Прогресс скролла и позиция курсора живут вне React.
 *
 * Это принципиально: WebGL-сцена читает значения внутри useFrame через
 * getState(), поэтому 60 раз в секунду не происходит ни одного ререндера
 * React-дерева. Если бы прогресс лежал в useState, каждая прокрутка
 * перерисовывала бы весь лендинг.
 */
interface ScrollState {
  /** 0 — верх страницы, 1 — низ. */
  progress: number;
  /** Нормализованная позиция курсора, от -1 до 1 по каждой оси. */
  pointerX: number;
  pointerY: number;
  setProgress: (value: number) => void;
  setPointer: (x: number, y: number) => void;
}

export const useScrollStore = create<ScrollState>((set) => ({
  progress: 0,
  pointerX: 0,
  pointerY: 0,
  setProgress: (progress) => set({ progress }),
  setPointer: (pointerX, pointerY) => set({ pointerX, pointerY }),
}));

/** Прямой доступ для useFrame — без подписки и без ререндера. */
export const readScroll = () => useScrollStore.getState();
