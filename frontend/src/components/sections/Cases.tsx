import { captions, cases } from '../../site.config';
import { SectionHeading } from '../ui/SectionHeading';
import { Reveal } from '../ui/Reveal';
import { Card3D } from '../ui/Card3D';
import { FootnoteMark } from '../layout/Credits';

export function Cases() {
  return (
    <section id="cases" className="section-pad">
      <div className="container-page">
        <SectionHeading
          eyebrow="Кейсы"
          title={
            <>
              Проекты, где <span className="text-gradient">цифры выросли</span>
              <FootnoteMark large />
            </>
          }
          description="Три показательных примера из разных ниш. Метрики — из аналитики клиентов через полгода после запуска."
        />
        <p className="mt-4 max-w-xl text-xs text-slate-600">{captions.cases}</p>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {cases.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.08}>
              <Card3D className="h-full" tilt={5}>
                <article className="glass flex h-full flex-col gap-6 overflow-hidden p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-2xl font-extrabold text-white">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">
                        {item.industry}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed text-slate-400">{item.task}</p>

                  <div className="grid grid-cols-2 gap-4 rounded-2xl bg-white/[0.03] p-5">
                    {item.result.map((metric) => (
                      <div key={metric.label} className="flex flex-col gap-1">
                        <span className="font-display text-2xl font-extrabold text-gradient">
                          {metric.value}
                        </span>
                        <span className="text-xs leading-snug text-slate-500">{metric.label}</span>
                      </div>
                    ))}
                  </div>

                  <ul className="mt-auto flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full border border-white/[0.08] px-3 py-1 text-xs text-slate-400"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </article>
              </Card3D>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
