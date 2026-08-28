import type { SVGProps } from 'react';
import type { ServiceIcon } from '../../site.config';

/** Инлайновые иконки: ни одного сетевого запроса и корректный цвет в любой теме. */
const base: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function ArrowRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function Check(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  );
}

export function ChevronDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function Close(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function Menu(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function Send(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 12L20 4l-7 16-2.5-6.5L4.5 12z" />
    </svg>
  );
}

export function Sparkles(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z" />
      <path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" />
    </svg>
  );
}

export function Star(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5-5.9-3.1-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9 2.9-6z" />
    </svg>
  );
}

export function Phone(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M5 4h3.5l1.6 4-2 1.4a12 12 0 006.5 6.5l1.4-2 4 1.6V19a1.6 1.6 0 01-1.8 1.6C10.4 19.9 4.1 13.6 3.4 5.8A1.6 1.6 0 015 4z" />
    </svg>
  );
}

// ── Иконки услуг ──────────────────────────────────────────────────────────

const SERVICE_PATHS: Record<ServiceIcon, JSX.Element> = {
  landing: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2.5" />
      <path d="M8 8h8M8 12h8M8 16h4" />
    </>
  ),
  corporate: (
    <>
      <rect x="3" y="4" width="18" height="15" rx="2.5" />
      <path d="M3 9h18M8 9v10" />
    </>
  ),
  shop: (
    <>
      <path d="M4 7h16l-1.2 11.2a2 2 0 01-2 1.8H7.2a2 2 0 01-2-1.8L4 7z" />
      <path d="M9 7a3 3 0 016 0" />
    </>
  ),
  app: (
    <>
      <rect x="3" y="4" width="18" height="14" rx="2.5" />
      <path d="M8 21h8M12 18v3M7 9l2 2-2 2M12 13h5" />
    </>
  ),
  ai: (
    <>
      <rect x="5" y="6" width="14" height="12" rx="3" />
      <path d="M9 11v2M15 11v2M12 3v3M8 21l1.5-3M16 21l-1.5-3" />
    </>
  ),
  redesign: (
    <>
      <path d="M4 20l4-1 10-10a2.1 2.1 0 10-3-3L5 16l-1 4z" />
      <path d="M14.5 6.5l3 3" />
    </>
  ),
};

export function ServiceGlyph({ name, ...props }: { name: ServiceIcon } & SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      {SERVICE_PATHS[name]}
    </svg>
  );
}
