import { trustLogos } from '../../site.config';

/**
 * Бегущая строка клиентов. Список дублируется, а анимация сдвигает ленту
 * ровно на половину ширины — получается бесшовная петля на чистом CSS,
 * без единого кадра JavaScript.
 */
export function TrustBar() {
  return (
    <section className="relative border-y border-white/[0.06] py-8">
      <div className="container-page mb-6">
        <p className="text-center text-xs uppercase tracking-[0.22em] text-slate-600">
          Нам доверяют
        </p>
      </div>

      <div className="mask-fade-x overflow-hidden">
        <div className="flex w-max animate-marquee gap-14 pr-14 hover:[animation-play-state:paused]">
          {[...trustLogos, ...trustLogos].map((logo, index) => (
            <span
              key={`${logo}-${index}`}
              className="whitespace-nowrap font-display text-lg font-bold tracking-[0.14em]
                         text-slate-600 transition-colors duration-300 hover:text-slate-300
                         sm:text-xl"
            >
              {logo}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
