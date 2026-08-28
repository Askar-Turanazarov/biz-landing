import { useEffect, useRef, useState } from 'react';

/**
 * Счётчик, который оживает, когда блок появляется во вьюпорте. Считает один раз.
 *
 * Наблюдатель здесь нативный, а не useInView из framer-motion: цифры стоят
 * внизу первого экрана и видны сразу при загрузке, а в этом сценарии хук
 * библиотеки не отдавал true и счётчики навсегда застревали на нуле.
 */
export function useCountUp(target: number, durationMs = 1400) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let raf = 0;

    const animate = () => {
      // Пользователь просил меньше движения — показываем итог сразу.
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setValue(target);
        return;
      }

      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / durationMs, 1);
        // easeOutExpo: быстро набирает и мягко останавливается.
        const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        setValue(Math.round(target * eased));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    // Всё состояние живёт внутри эффекта: повторный монтаж в StrictMode
    // просто запускает наблюдение заново, а не блокирует анимацию навсегда.
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        animate();
      },
      { threshold: 0.5 },
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target, durationMs]);

  return { ref, value };
}
