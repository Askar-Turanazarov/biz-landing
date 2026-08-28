import type { DeviceTier } from '../hooks/useDeviceTier';

/**
 * Настройки качества по профилю устройства.
 * Профиль low сюда вообще не доходит — на нём canvas не монтируется,
 * так что чанк three.js не скачивается. Здесь описаны только mid и high.
 */
export interface QualityProfile {
  /** Диапазон devicePixelRatio: выше 1.75 разница уже не видна, а нагрузка растёт квадратично. */
  dpr: [number, number];
  antialias: boolean;
  /** Детализация икосаэдра. */
  crystalDetail: number;
  particleCount: number;
  /** Число орбитальных колец во второй фазе. */
  ringCount: number;
}

export const QUALITY: Record<Exclude<DeviceTier, 'low'>, QualityProfile> = {
  mid: {
    dpr: [1, 1.25],
    antialias: false,
    crystalDetail: 2,
    particleCount: 900,
    ringCount: 2,
  },
  high: {
    dpr: [1, 1.75],
    antialias: true,
    crystalDetail: 4,
    particleCount: 2600,
    ringCount: 3,
  },
};

/** Линейная интерполяция с ограничением — базовый инструмент всех переходов сцены. */
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Плавный переход 0→1 внутри отрезка [edge0, edge1], как smoothstep в GLSL. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

/**
 * Вес фазы: 0 за пределами отрезка, 1 в его середине.
 * Так сцена перетекает между состояниями без резких включений и выключений.
 */
export function phaseWeight(progress: number, start: number, peak: number, end: number): number {
  if (progress <= start || progress >= end) return 0;
  return progress < peak
    ? smoothstep(start, peak, progress)
    : 1 - smoothstep(peak, end, progress);
}
