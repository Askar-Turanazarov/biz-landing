import { useCallback, useEffect, useRef, useState } from 'react';
import { testimonials } from '../../site.config';
import { SectionHeading } from '../ui/SectionHeading';
import { Reveal } from '../ui/Reveal';
import { ArrowRight, Star } from '../ui/Icons';

/**
 * Отзывы — горизонтальная лента со scroll-snap.
 * На телефоне это привычный свайп, на десктопе работают стрелки.
 * Никакой библиотеки-слайдера: нативная прокрутка плавнее и весит ноль.
 */
export function Testimonials() {
  const track = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const syncEdges = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setAtStart(el.scrollLeft < 8);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    syncEdges();
    const el = track.current;
    if (!el) return;
    el.addEventListener('scroll', syncEdges, { passive: true });
    window.addEventListener('resize', syncEdges);
    return () => {
      el.removeEventListener('scroll', syncEdges);
      window.removeEventListener('resize', syncEdges);
    };
  }, [syncEdges]);

  const scrollByCard = (direction: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    // Шаг — ширина первой карточки плюс зазор, чтобы лента вставала ровно.
    const card = el.querySelector('li');
    const step = card ? card.getBoundingClientRect().width + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: step * direction, behavior: 'smooth' });
  };

  return (
    <section className="section-pad overflow-hidden">
      <div className="container-page">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Отзывы"
            title={
              <>
                Что говорят те, <span className="text-gradient">кто уже запустился</span>
              </>
            }
          />

          <div className="flex gap-3">
            <button
              onClick={() => scrollByCard(-1)}
              disabled={atStart}
              aria-label="Предыдущий отзыв"
              className="focus-ring grid h-12 w-12 place-items-center rounded-full border
                         border-white/10 text-white transition-colors hover:bg-white/[0.06]
                         disabled:opacity-30"
            >
              <ArrowRight className="h-5 w-5 rotate-180" />
            </button>
            <button
              onClick={() => scrollByCard(1)}
              disabled={atEnd}
              aria-label="Следующий отзыв"
              className="focus-ring grid h-12 w-12 place-items-center rounded-full border
                         border-white/10 text-white transition-colors hover:bg-white/[0.06]
                         disabled:opacity-30"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <Reveal>
        <ul
          ref={track}
          className="scroll-thin mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto
                     px-5 pb-4 sm:px-6 lg:px-[max(2.5rem,calc((100vw-1240px)/2+2.5rem))]"
        >
          {testimonials.map((item) => (
            <li
              key={item.name}
              className="w-[min(86vw,26rem)] shrink-0 snap-start"
            >
              <figure className="glass flex h-full flex-col gap-5 p-6 sm:p-7">
                <div className="flex gap-1 text-accent-cyan">
                  {Array.from({ length: item.rating }, (_, i) => (
                    <Star key={i} className="h-4 w-4" />
                  ))}
                </div>

                <blockquote className="text-[0.95rem] leading-relaxed text-slate-300">
                  {item.text}
                </blockquote>

                <figcaption className="mt-auto flex items-center gap-3 border-t border-white/[0.06] pt-5">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full
                               bg-accent-soft font-display font-bold text-white"
                  >
                    {item.name.charAt(0)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-white">{item.name}</span>
                    <span className="block truncate text-xs text-slate-500">{item.role}</span>
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
