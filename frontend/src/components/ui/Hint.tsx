import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

const ALIGN = {
  start: 'left-0',
  center: 'left-1/2 -translate-x-1/2',
  end: 'right-0',
} as const;

/**
 * Небольшая всплывающая подсказка в стиле сайта. На десктопе — по наведению и фокусу,
 * на тач-устройствах — по нажатию: у атрибута title нет ни стиля, ни поддержки на телефоне.
 */
export function Hint({
  text,
  children,
  side = 'top',
  align = 'center',
  className = '',
}: {
  text: string;
  children: ReactNode;
  side?: 'top' | 'bottom';
  align?: keyof typeof ALIGN;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLSpanElement>(null);

  // Открытую по нажатию подсказку закрывает нажатие в любом другом месте.
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [open]);

  return (
    <span
      ref={root}
      tabIndex={0}
      aria-describedby={open ? id : undefined}
      onPointerEnter={(event) => event.pointerType === 'mouse' && setOpen(true)}
      onPointerLeave={(event) => event.pointerType === 'mouse' && setOpen(false)}
      onPointerDown={(event) => event.pointerType !== 'mouse' && setOpen((value) => !value)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      className={`focus-ring relative inline-flex cursor-help rounded ${className}`}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          id={id}
          className={`pointer-events-none absolute z-50 w-max max-w-[18rem] rounded-xl border border-white/10
                      bg-ink-850/95 px-3 py-2 text-left font-sans text-xs font-normal normal-case leading-snug
                      tracking-normal text-slate-200 shadow-panel backdrop-blur-md
                      ${side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} ${ALIGN[align]}`}
        >
          {text}
        </span>
      )}
    </span>
  );
}
