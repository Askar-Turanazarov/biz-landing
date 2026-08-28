import type { ReactNode } from 'react';
import { Reveal } from './Reveal';

interface SectionHeadingProps {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}

/** Единый заголовок секции: надпись-метка, крупный заголовок, подзаголовок. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  className = '',
}: SectionHeadingProps) {
  const alignment = align === 'center' ? 'items-center text-center mx-auto' : 'items-start';

  return (
    <div className={`flex max-w-2xl flex-col gap-5 ${alignment} ${className}`}>
      <Reveal>
        <span className="eyebrow">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-cyan" />
          {eyebrow}
        </span>
      </Reveal>
      <Reveal delay={0.08}>
        <h2 className="text-display-lg">{title}</h2>
      </Reveal>
      {description && (
        <Reveal delay={0.14}>
          <p className="text-body-lg text-slate-400">{description}</p>
        </Reveal>
      )}
    </div>
  );
}
