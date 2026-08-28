import { Suspense, lazy, useEffect } from 'react';
import { useScroll } from 'framer-motion';
import { useDeviceTier } from '../../hooks/useDeviceTier';
import { useScrollStore } from '../../hooks/useScrollStore';

// Отдельный чанк: на слабых устройствах он не запрашивается вообще.
const SceneLayer = lazy(() => import('../../three/SceneLayer'));

/**
 * Фон страницы. Здесь принимается главное решение по производительности:
 * монтировать WebGL или обойтись CSS-градиентом.
 */
export function Backdrop() {
  const tier = useDeviceTier();
  const { scrollYProgress } = useScroll();

  // Прогресс и курсор пишем прямо в zustand-стор, минуя состояние React:
  // сцена читает их в useFrame, поэтому прокрутка не вызывает ререндеров.
  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (value) => {
      useScrollStore.getState().setProgress(value);
    });
    return unsubscribe;
  }, [scrollYProgress]);

  useEffect(() => {
    if (tier === 'low') return;

    const handleMove = (event: PointerEvent) => {
      useScrollStore
        .getState()
        .setPointer(
          (event.clientX / window.innerWidth) * 2 - 1,
          (event.clientY / window.innerHeight) * 2 - 1,
        );
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    return () => window.removeEventListener('pointermove', handleMove);
  }, [tier]);

  if (tier === 'low') return <CssBackdrop />;

  return (
    <Suspense fallback={<CssBackdrop />}>
      <SceneLayer tier={tier} />
    </Suspense>
  );
}

/**
 * Запасной фон без WebGL: два размытых пятна градиента и шумовая текстура.
 * Визуально близок к сцене, но стоит браузеру ноль работы на кадр.
 */
function CssBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-1/4 top-[-10%] h-[70vh] w-[70vh] rounded-full bg-accent-indigo/20 blur-[120px]" />
      <div className="absolute right-[-15%] top-[15%] h-[55vh] w-[55vh] rounded-full bg-accent-cyan/15 blur-[110px]" />
      <div className="absolute bottom-[-20%] left-[20%] h-[60vh] w-[60vh] rounded-full bg-accent-fuchsia/15 blur-[130px]" />
      <svg className="absolute inset-0 h-full w-full opacity-[0.16]">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </div>
  );
}
