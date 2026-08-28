import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { readScroll } from '../../hooks/useScrollStore';
import { lerp, phaseWeight, type QualityProfile } from '../perf';

/**
 * Вторая фаза: орбитальные кольца в средней части страницы.
 * Кристалл распадается на траектории — визуальная метафора этапов работы.
 */
export function Rings({ quality }: { quality: QualityProfile }) {
  const group = useRef<THREE.Group>(null);

  // Геометрию и наклоны считаем один раз: каждый кадр это было бы расточительно.
  const rings = useMemo(
    () =>
      Array.from({ length: quality.ringCount }, (_, i) => ({
        radius: 1.9 + i * 0.72,
        tilt: (Math.PI / 3) * (i + 1) * 0.42,
        spin: 0.12 + i * 0.07,
        color: ['#6366F1', '#22D3EE', '#E879F9'][i % 3],
      })),
    [quality.ringCount],
  );

  useFrame((_, delta) => {
    if (!group.current) return;
    const { progress, pointerX } = readScroll();
    const weight = phaseWeight(progress, 0.24, 0.5, 0.8);

    group.current.visible = weight > 0.01;
    if (!group.current.visible) return;

    group.current.rotation.y += delta * 0.1;
    group.current.rotation.z = lerp(group.current.rotation.z, pointerX * 0.2, 0.04);
    group.current.scale.setScalar(lerp(0.6, 1.05, weight));

    // Каждое кольцо крутится со своей скоростью — картинка не выглядит механической.
    group.current.children.forEach((child, index) => {
      child.rotation.z += delta * rings[index].spin;
      const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      material.opacity = weight * 0.5;
    });
  });

  return (
    <group ref={group} visible={false}>
      {rings.map((ring) => (
        <mesh key={ring.radius} rotation={[ring.tilt, 0, 0]}>
          <torusGeometry args={[ring.radius, 0.012, 8, 128]} />
          <meshBasicMaterial color={ring.color} transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
