import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

type Direction = 'up' | 'left' | 'right' | 'none';

const OFFSET: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 28 },
  left: { x: -28, y: 0 },
  right: { x: 28, y: 0 },
  none: { x: 0, y: 0 },
};

interface RevealProps {
  children: ReactNode;
  delay?: number;
  direction?: Direction;
  className?: string;
  as?: 'div' | 'li' | 'span' | 'section';
}

/**
 * Появление блока при входе во вьюпорт.
 * once: true — анимация не повторяется при обратной прокрутке, иначе страница
 * начинает мерцать. Анимируем только transform и opacity: браузер держит их
 * на композиторе и не пересчитывает лейаут.
 */
export function Reveal({
  children,
  delay = 0,
  direction = 'up',
  className,
  as = 'div',
}: RevealProps) {
  const Component = motion[as];
  const offset = OFFSET[direction];

  return (
    <Component
      className={className}
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-12%' }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Component>
  );
}
