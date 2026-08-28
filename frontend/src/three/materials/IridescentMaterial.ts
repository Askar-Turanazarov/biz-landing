import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend, type ReactThreeFiber } from '@react-three/fiber';

/**
 * Переливающийся материал с эффектом Френеля: грани, повёрнутые от камеры,
 * светятся сильнее. Три цвета акцентного градиента смешиваются по углу обзора,
 * поэтому объект выглядит стеклянным без дорогих преломлений и постпроцессинга.
 */
const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uAmplitude;

  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vWave;

  void main() {
    vNormal = normalize(normalMatrix * normal);

    // Мягкая волна по поверхности: объект «дышит», но силуэт не ломается.
    float wave = sin(position.x * 2.4 + uTime * 0.7)
               * cos(position.y * 2.1 - uTime * 0.5)
               * uAmplitude;
    vWave = wave;

    vec3 displaced = position + normal * wave;
    vec4 viewPosition = modelViewMatrix * vec4(displaced, 1.0);
    vViewDir = normalize(-viewPosition.xyz);

    gl_Position = projectionMatrix * viewPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform float uOpacity;
  uniform float uTime;

  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vWave;

  void main() {
    vec3 normal = normalize(vNormal);

    // Высокая степень оставляет свечение только на кромке силуэта.
    // При меньшей степени объект превращается в плотный цветной шар.
    float fresnel = pow(1.0 - clamp(dot(normal, normalize(vViewDir)), 0.0, 1.0), 3.4);

    // Смещаем градиент во времени — переливы медленно ползут по поверхности.
    float shift = 0.5 + 0.5 * sin(uTime * 0.35 + vWave * 6.0 + normal.y * 2.2);

    // Основной цвет живёт между индиго и циан; фуксия появляется только
    // на самой кромке, иначе она перетягивает на себя всю палитру.
    vec3 base = mix(uColorA, uColorB, shift);
    vec3 color = mix(base, uColorC, fresnel * 0.7);

    // Ядро почти прозрачное, светятся только грани — объект читается как стекло
    // и не превращается в плотное пятно поверх текста.
    float alpha = (0.02 + fresnel * 0.55) * uOpacity;

    gl_FragColor = vec4(color, alpha);
  }
`;

export const IridescentMaterial = shaderMaterial(
  {
    uTime: 0,
    uAmplitude: 0.08,
    uOpacity: 1,
    uColorA: new THREE.Color('#6366F1'),
    uColorB: new THREE.Color('#22D3EE'),
    uColorC: new THREE.Color('#E879F9'),
  },
  vertexShader,
  fragmentShader,
);

extend({ IridescentMaterial });

export type IridescentMaterialImpl = THREE.ShaderMaterial & {
  uTime: number;
  uAmplitude: number;
  uOpacity: number;
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      iridescentMaterial: ReactThreeFiber.Object3DNode<
        IridescentMaterialImpl,
        typeof IridescentMaterial
      >;
    }
  }
}
