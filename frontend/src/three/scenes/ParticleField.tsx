import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { readScroll } from '../../hooks/useScrollStore';
import { lerp, smoothstep, type QualityProfile } from '../perf';

/**
 * Фоновое поле частиц. Живёт на всей странице, но к нижней трети становится
 * плотнее и ярче — там оно остаётся единственным элементом сцены.
 *
 * Один Points на все частицы: это один draw call независимо от их количества.
 */
export function ParticleField({ quality }: { quality: QualityProfile }) {
  const points = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const positions = new Float32Array(quality.particleCount * 3);
    const scales = new Float32Array(quality.particleCount);

    for (let i = 0; i < quality.particleCount; i += 1) {
      // Распределение по сплюснутой сфере: у краёв кадра пусто, в центре плотнее.
      const radius = 4 + Math.pow(Math.random(), 0.6) * 9;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi) * 0.55;
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta) * 0.7;
      scales[i] = 0.5 + Math.random();
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    return geo;
  }, [quality.particleCount]);

  useFrame((_, delta) => {
    if (!points.current) return;
    const { progress, pointerX, pointerY } = readScroll();

    points.current.rotation.y += delta * 0.02;
    points.current.rotation.x = lerp(points.current.rotation.x, pointerY * 0.06, 0.03);
    points.current.position.x = lerp(points.current.position.x, pointerX * 0.5, 0.03);

    const material = points.current.material as THREE.PointsMaterial;
    // Слабый фон вверху, заметное звёздное поле внизу страницы.
    material.opacity = lerp(0.22, 0.7, smoothstep(0.45, 0.92, progress));
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        size={0.028}
        sizeAttenuation
        color="#a5b4fc"
        transparent
        opacity={0.22}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
