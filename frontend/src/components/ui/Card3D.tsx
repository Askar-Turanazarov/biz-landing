import type { ReactNode } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface Card3DProps {
  children: ReactNode;
  className?: string;
  /** Максимальный наклон в градусах. */
  tilt?: number;
}

/**
 * Карточка с наклоном по курсору и световым бликом, идущим за указателем.
 * На тач-устройствах эффект отключается: наклон там либо не срабатывает,
 * либо залипает после тапа.
 */
export function Card3D({ children, className = '', tilt = 7 }: Card3DProps) {
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);

  const spring = { stiffness: 140, damping: 18, mass: 0.4 };
  const rotateX = useSpring(useTransform(my, [0, 1], [tilt, -tilt]), spring);
  const rotateY = useSpring(useTransform(mx, [0, 1], [-tilt, tilt]), spring);

  const glowX = useTransform(mx, (v) => `${v * 100}%`);
  const glowY = useTransform(my, (v) => `${v * 100}%`);
  // useMotionTemplate пересобирает строку без ререндера React.
  const glow = useMotionTemplate`radial-gradient(340px circle at ${glowX} ${glowY}, rgba(99,102,241,0.18), transparent 62%)`;

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    mx.set((event.clientX - rect.left) / rect.width);
    my.set((event.clientY - rect.top) / rect.height);
  };

  const handleLeave = () => {
    mx.set(0.5);
    my.set(0.5);
  };

  return (
    <motion.div
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformPerspective: 1000, transformStyle: 'preserve-3d' }}
      className={`group relative ${className}`}
    >
      {/* Блик следует за курсором и не перехватывает события мыши. */}
      <motion.span
        aria-hidden
        style={{ background: glow }}
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0
                   transition-opacity duration-500 group-hover:opacity-100"
      />
      {children}
    </motion.div>
  );
}
