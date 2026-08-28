import { Canvas } from '@react-three/fiber';
import { Scene } from './Scene';
import { QUALITY } from './perf';
import type { DeviceTier } from '../hooks/useDeviceTier';

/**
 * Единственный WebGL-canvas на всю страницу.
 *
 * Секции НЕ создают собственные <Canvas>: каждый лишний canvas — это отдельный
 * GL-контекст и отдельный цикл рендера, и именно от этого на среднем Android
 * начинается просадка до 25–40 fps. Здесь один контекст, а сцена меняется
 * по прогрессу скролла.
 *
 * Файл подключается только через React.lazy на профилях mid и high,
 * поэтому на телефонах чанк three.js даже не скачивается.
 */
export default function SceneLayer({ tier }: { tier: Exclude<DeviceTier, 'low'> }) {
  const quality = QUALITY[tier];

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      // Слой декоративный: скринридеры его не видят, клики проходят насквозь.
    >
      <Canvas
        dpr={quality.dpr}
        camera={{ position: [0, 0, 6.2], fov: 42, near: 0.1, far: 60 }}
        gl={{
          antialias: quality.antialias,
          alpha: true,
          powerPreference: 'high-performance',
          // Буфер не сохраняем: экономит память, скриншот canvas нам не нужен.
          preserveDrawingBuffer: false,
        }}
      >
        <Scene quality={quality} />
      </Canvas>
    </div>
  );
}
