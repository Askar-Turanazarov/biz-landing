import { useEffect, useState } from 'react';

/**
 * Профиль устройства решает, насколько тяжёлую графику показывать.
 *
 * low  — WebGL не монтируется вообще: чанк three.js даже не скачивается.
 *        Сюда попадают телефоны, слабые машины и режим уменьшенной анимации.
 * mid  — сцена рендерится, но без постпроцессинга и с меньшим числом частиц.
 * high — полный визуал.
 */
export type DeviceTier = 'low' | 'mid' | 'high';

function detect(): DeviceTier {
  if (typeof window === 'undefined') return 'low';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return 'low';

  // Тач без точного указателя = телефон или планшет. WebGL там даёт
  // заметный расход батареи ради фона, который почти не виден за контентом.
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  if (coarsePointer) return 'low';

  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  if (cores <= 4 || memory <= 4) return 'mid';

  // Очень узкое окно на десктопе тоже не заслуживает полного качества.
  if (window.innerWidth < 900) return 'mid';

  return 'high';
}

export function useDeviceTier(): DeviceTier {
  // Первый рендер всегда low: страница отрисовывается без ожидания WebGL,
  // а тяжёлый слой подключается уже после, отдельным эффектом.
  const [tier, setTier] = useState<DeviceTier>('low');

  useEffect(() => {
    const update = () => setTier(detect());
    update();

    const queries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(pointer: coarse)'),
    ];
    for (const q of queries) q.addEventListener('change', update);
    window.addEventListener('resize', update);

    return () => {
      for (const q of queries) q.removeEventListener('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return tier;
}
