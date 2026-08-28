import { useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { readScroll } from '../hooks/useScrollStore';
import { lerp, smoothstep, type QualityProfile } from './perf';
import { Crystal } from './scenes/Crystal';
import { Rings } from './scenes/Rings';
import { ParticleField } from './scenes/ParticleField';

/**
 * Камера ведётся скроллом: одна траектория на всю страницу.
 * Ни одна фаза не размонтируется — они перетекают друг в друга весом,
 * поэтому переходы бесшовные, а WebGL-контекст всегда один.
 */
function CameraRig() {
  const camera = useThree((state) => state.camera);

  useFrame(() => {
    const { progress, pointerX, pointerY } = readScroll();

    // Камера отъезжает и приподнимается по мере прокрутки.
    const targetZ = lerp(6.2, 9.4, smoothstep(0, 1, progress));
    const targetY = lerp(0, 1.1, smoothstep(0.2, 1, progress));

    camera.position.z = lerp(camera.position.z, targetZ, 0.06);
    camera.position.y = lerp(camera.position.y, targetY + pointerY * 0.22, 0.06);
    camera.position.x = lerp(camera.position.x, pointerX * 0.55, 0.06);
    camera.lookAt(0, targetY * 0.35, 0);
  });

  return null;
}

/**
 * Пауза рендера, когда вкладка скрыта. Без этого сцена продолжает крутиться
 * в фоне и без нужды тратит батарею на ноутбуках и планшетах.
 */
function VisibilityGuard() {
  const setFrameloop = useThree((state) => state.setFrameloop);

  useEffect(() => {
    const handle = () => setFrameloop(document.hidden ? 'never' : 'always');
    document.addEventListener('visibilitychange', handle);
    return () => document.removeEventListener('visibilitychange', handle);
  }, [setFrameloop]);

  return null;
}

export function Scene({ quality }: { quality: QualityProfile }) {
  return (
    <>
      <CameraRig />
      <VisibilityGuard />

      {/* Свет нужен только кольцам: кристалл и частицы светятся сами. */}
      <ambientLight intensity={0.7} />
      <pointLight position={[4, 5, 6]} intensity={22} color="#22D3EE" distance={22} />
      <pointLight position={[-5, -3, 4]} intensity={16} color="#E879F9" distance={20} />

      <ParticleField quality={quality} />
      <Crystal quality={quality} />
      <Rings quality={quality} />
    </>
  );
}
