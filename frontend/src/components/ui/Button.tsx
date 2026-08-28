import { forwardRef, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'ghost' | 'outline';
type Size = 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent-line text-ink-950 font-semibold shadow-glow hover:shadow-[0_0_80px_-10px_rgba(34,211,238,.7)]',
  outline: 'border border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.07]',
  ghost: 'text-slate-300 hover:text-white hover:bg-white/[0.05]',
};

const SIZES: Record<Size, string> = {
  md: 'px-5 py-3 text-sm',
  lg: 'px-7 py-4 text-base',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  /** Магнитный эффект: кнопка слегка тянется к курсору. */
  magnetic?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', magnetic = false, className = '', children, ...rest },
  forwardedRef,
) {
  const localRef = useRef<HTMLButtonElement | null>(null);

  // Магнитный эффект пишем прямо в style, минуя React: это обработчик
  // mousemove, ререндер на каждое движение курсора здесь недопустим.
  const handleMove = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!magnetic || !localRef.current) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const rect = localRef.current.getBoundingClientRect();
    const dx = (event.clientX - rect.left - rect.width / 2) * 0.18;
    const dy = (event.clientY - rect.top - rect.height / 2) * 0.28;
    localRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
  };

  const handleLeave = () => {
    if (localRef.current) localRef.current.style.transform = '';
  };

  return (
    <button
      ref={(node) => {
        localRef.current = node;
        if (typeof forwardedRef === 'function') forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`focus-ring inline-flex items-center justify-center gap-2 rounded-full
        transition-[transform,box-shadow,background-color,color] duration-300 ease-out
        active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
});
