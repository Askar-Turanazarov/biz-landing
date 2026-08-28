import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { readScroll } from '../../hooks/useScrollStore';
import { lerp, phaseWeight, type QualityProfile } from '../perf';
import type { IridescentMaterialImpl } from '../materials/IridescentMaterial';
import '../materials/IridescentMaterial';

/**
 * Первая фаза сцены: кристалл в hero-экране.
 * Медленно вращается, слегка доворачивается к курсору и растворяется,
 * когда посетитель уходит из первого экрана.
 */
export function Crystal({ quality }: { quality: QualityProfile }) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<IridescentMaterialImpl>(null);
  const wireframe = useRef<THREE.LineSegments>(null);

  useFrame((state, delta) => {
    if (!group.current) return;
    const { progress, pointerX, pointerY } = readScroll();

    // Кристалл живёт в верхней трети страницы.
    const weight = progress < 0.02 ? 1 : phaseWeight(progress, -0.2, 0.02, 0.42);

    // Собственное вращение + мягкий доворот к курсору.
    group.current.rotation.y += delta * 0.16;
    group.current.rotation.x = lerp(group.current.rotation.x, pointerY * 0.28, 0.05);
    group.current.rotation.z = lerp(group.current.rotation.z, pointerX * 0.16, 0.05);

    // Уводим кристалл в правую часть кадра: текст hero живёт слева и должен
    // читаться поверх чистого фона. На узких экранах он уходит вверх и назад.
    // viewport.width — ширина сцены в мировых единицах на плоскости z=0, не пиксели:
    // на 1440×900 это около 7.6, на планшете в портрете — около 3.6.
    // И размер, и смещение считаем от неё, иначе на узком экране кристалл
    // разрастается на пол-кадра и наезжает на заголовок.
    const { width } = state.viewport;
    const target = Math.min(Math.max(width * 0.125, 0.34), 0.95);

    group.current.position.x = lerp(group.current.position.x, width * 0.28, 0.06);
    group.current.position.y = lerp(group.current.position.y, lerp(3.4, 0.5, weight), 0.06);
    group.current.position.z = -1.2;

    group.current.scale.setScalar(lerp(target * 0.5, target, weight));
    group.current.visible = weight > 0.01;

    if (material.current) {
      material.current.uTime += delta;
      material.current.uOpacity = weight;
    }
    if (wireframe.current) {
      const lineMaterial = wireframe.current.material as THREE.LineBasicMaterial;
      lineMaterial.opacity = weight * 0.14;
    }
  });

  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[1.55, quality.crystalDetail]} />
        {/* Только лицевые грани: у задних нормаль смотрит от камеры, френель
            даёт единицу по всей поверхности, и кристалл превращается
            в плотное цветное пятно поверх текста. */}
        <iridescentMaterial
          ref={material}
          transparent
          depthWrite={false}
          side={THREE.FrontSide}
          blending={THREE.AdditiveBlending}
          uAmplitude={0.09}
        />
      </mesh>

      {/* Каркас поверх заливки: даёт огранку и читаемый силуэт. */}
      <lineSegments ref={wireframe}>
        <edgesGeometry args={[new THREE.IcosahedronGeometry(1.58, 1)]} />
        <lineBasicMaterial color="#93c5fd" transparent opacity={0.14} depthWrite={false} />
      </lineSegments>
    </group>
  );
}
