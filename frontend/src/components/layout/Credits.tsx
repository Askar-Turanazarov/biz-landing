import { hints, legal } from '../../site.config';
import { Hint } from '../ui/Hint';

/**
 * Подпись в подвале сайта и админки. Сноска про вымышленные данные не висит на странице —
 * она всплывает, только если навести курсор на подпись.
 */
export function Credits({ className = '' }: { className?: string }) {
  const { year, brand, author, authorHref, rights } = legal.credits;

  return (
    <Hint text={hints.footnote} align="start" className={className}>
      <span>
        © {year} {brand} -{' '}
        <a
          href={authorHref}
          target="_blank"
          rel="noreferrer"
          className="rounded text-slate-400 underline-offset-4 transition-colors hover:text-white hover:underline"
        >
          {author}
        </a>
        . {rights}
      </span>
    </Hint>
  );
}

/** Звёздочка у «вымышленных» блоков: при наведении показывает ту же сноску. */
export function FootnoteMark({ large = false }: { large?: boolean }) {
  return (
    <Hint text={hints.footnote} className="ml-1 align-super">
      <span className={`leading-none text-accent-cyan/70 ${large ? 'text-[0.45em]' : 'text-[1.15em]'}`}>*</span>
    </Hint>
  );
}
