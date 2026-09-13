import { company, hints, legal, nav, services } from '../../site.config';
import { Hint } from '../ui/Hint';
import { Credits } from './Credits';

export function Footer() {
  return (
    <footer className="relative border-t border-white/[0.07] pt-16">
      <div className="container-page pb-10">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-line text-sm font-extrabold text-ink-950">
                O
              </span>
              <span className="font-display text-lg font-extrabold text-white">{company.name}</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-slate-500">
              {company.tagline}. Проектируем и разрабатываем сайты и веб-сервисы для бизнеса
              с {company.since} года.
            </p>
          </div>

          <nav className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Разделы
            </h3>
            {nav.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="focus-ring w-fit rounded text-sm text-slate-400 transition-colors hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Услуги
            </h3>
            {services.slice(0, 5).map((service) => (
              <a
                key={service.id}
                href="#services"
                className="focus-ring w-fit rounded text-sm text-slate-400 transition-colors hover:text-white"
              >
                {service.title}
              </a>
            ))}
          </div>

          {/* Контакты вымышленной студии: без ссылок, с подсказками при наведении. */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Контакты
            </h3>
            <Hint text={hints.phone} align="start" className="w-fit">
              <span className="font-display text-lg font-bold text-white">{company.phone}</span>
            </Hint>
            <p className="text-sm text-slate-400">{company.email}</p>
            <p className="text-sm text-slate-400">Telegram {company.telegram}</p>
            <Hint text={hints.address} align="start" className="w-fit">
              <span className="text-sm text-slate-500">{company.address}</span>
            </Hint>
            <p className="text-sm text-slate-500">{company.workHours}</p>
          </div>
        </div>

        <div className="hairline my-8" />

        <div className="flex flex-col gap-3 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <Credits className="w-fit" />
          <p className="max-w-md sm:text-right">
            Цены указаны в сумах и не являются публичной офертой. {legal.priceNote}
          </p>
        </div>
      </div>
    </footer>
  );
}
