import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../lib/api';
import { Credits } from '../components/layout/Credits';
import {
  adminApi,
  formatDate,
  SOURCE_LABEL,
  STATUS_LABEL,
  STATUS_STYLE,
  type Lead,
  type LeadFilters,
  type LeadStatus,
  type Stats,
} from './adminApi';
import { LoginForm } from './LoginForm';
import { LeadDrawer } from './LeadDrawer';
import { TemperatureBadge } from './QualificationBlock';

const EMPTY_FILTERS: LeadFilters = { status: 'all', source: 'all', query: '' };

const STATUS_TABS: { value: LeadStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'new', label: 'Новые' },
  { value: 'in_work', label: 'В работе' },
  { value: 'won', label: 'Успех' },
  { value: 'lost', label: 'Отказ' },
];

/**
 * Скрытая панель управления заявками.
 * Маршрут не линкуется с сайта и закрыт в robots.txt; доступ — по паролю,
 * который проверяется на бэкенде, а не в браузере.
 */
export default function SuperAdminPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filters, setFilters] = useState<LeadFilters>(EMPTY_FILTERS);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(false);

  // Заголовок и запрет индексации ставим на самом маршруте: страницы больше нигде нет.
  useEffect(() => {
    document.title = 'ORBIT · Панель управления';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex,nofollow';
    document.head.appendChild(meta);
    return () => {
      meta.remove();
    };
  }, []);

  useEffect(() => {
    adminApi
      .session()
      .then(() => setAuthorized(true))
      .catch(() => setAuthorized(false));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsResponse, statsResponse] = await Promise.all([
        adminApi.leads(filters),
        adminApi.stats(),
      ]);
      setLeads(leadsResponse.leads);
      setStats(statsResponse);
    } catch (error) {
      // Токен мог протухнуть, пока вкладка была открыта — возвращаем на вход.
      if (error instanceof ApiError && error.status === 401) setAuthorized(false);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (authorized) void load();
  }, [authorized, load]);

  if (authorized === null) {
    return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Проверяем доступ…</div>;
  }

  if (!authorized) return <LoginForm onSuccess={() => setAuthorized(true)} />;

  const applyChange = (updated: Lead) => {
    setLeads((prev) => prev.map((lead) => (lead.id === updated.id ? updated : lead)));
    setSelected(updated);
    void adminApi.stats().then(setStats).catch(() => undefined);
  };

  const applyDelete = (id: string) => {
    setLeads((prev) => prev.filter((lead) => lead.id !== id));
    setSelected(null);
    void adminApi.stats().then(setStats).catch(() => undefined);
  };

  return (
    <div className="flex min-h-screen flex-col pb-8">
      <header className="border-b border-white/[0.07] bg-ink-950/80 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-line text-sm font-extrabold text-ink-950">
              O
            </span>
            <span className="font-display font-extrabold text-white">Панель управления</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="focus-ring rounded-full border border-white/10 px-4 py-2 text-xs
                         text-slate-300 transition-colors hover:bg-white/[0.06]"
            >
              На сайт
            </Link>
            <a
              href={adminApi.exportUrl(filters)}
              className="focus-ring rounded-full border border-white/10 px-4 py-2 text-xs
                         text-slate-300 transition-colors hover:bg-white/[0.06]"
            >
              Экспорт CSV
            </a>
            <button
              onClick={() => adminApi.logout().finally(() => setAuthorized(false))}
              className="focus-ring rounded-full px-4 py-2 text-xs text-slate-500 transition-colors hover:text-white"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="container-page flex-1 pt-8">
        {stats && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Всего заявок" value={stats.total} />
            <StatCard label="Сегодня" value={stats.today} accent />
            <StatCard label="В работе" value={stats.byStatus.in_work} />
            <StatCard label="Собрал ИИ" value={`${stats.aiShare}%`} accent />
          </div>
        )}

        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="scroll-thin flex gap-2 overflow-x-auto pb-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilters((prev) => ({ ...prev, status: tab.value }))}
                className={`focus-ring shrink-0 rounded-full border px-4 py-2 text-xs font-medium
                            transition-colors ${
                              filters.status === tab.value
                                ? 'border-white/25 bg-white/[0.08] text-white'
                                : 'border-white/10 text-slate-400 hover:text-white'
                            }`}
              >
                {tab.label}
                {stats && tab.value !== 'all' && (
                  <span className="ml-1.5 text-slate-600">{stats.byStatus[tab.value]}</span>
                )}
              </button>
            ))}
          </div>

          <input
            value={filters.query}
            onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
            placeholder="Поиск по имени, контакту, комментарию"
            aria-label="Поиск по заявкам"
            className="w-full rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5
                       text-sm text-white outline-none transition-colors
                       placeholder:text-slate-600 focus:border-accent-cyan/60 lg:w-80"
          />
        </div>

        <div className="glass mt-5 overflow-hidden">
          {loading && leads.length === 0 ? (
            <p className="p-10 text-center text-sm text-slate-500">Загружаем заявки…</p>
          ) : leads.length === 0 ? (
            <p className="p-10 text-center text-sm text-slate-500">
              Заявок пока нет. Как только придёт первая — она появится здесь и в Telegram.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[46rem] text-left text-sm">
                <thead className="border-b border-white/[0.07] text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-medium">Дата</th>
                    <th className="px-5 py-4 font-medium">Имя</th>
                    <th className="px-5 py-4 font-medium">Контакт</th>
                    <th className="px-5 py-4 font-medium">Источник</th>
                    <th className="px-5 py-4 font-medium">Статус</th>
                    <th className="px-5 py-4 font-medium">Метка</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => setSelected(lead)}
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') setSelected(lead);
                      }}
                      className="cursor-pointer border-b border-white/[0.04] transition-colors
                                 last:border-0 hover:bg-white/[0.04] focus:bg-white/[0.06] focus:outline-none"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                        {formatDate(lead.createdAt)}
                      </td>
                      <td className="px-5 py-4 font-medium text-white">{lead.name}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-300">{lead.contact}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-400">
                        {SOURCE_LABEL[lead.source]}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block whitespace-nowrap rounded-full border px-3 py-1
                                      text-xs font-medium ${STATUS_STYLE[lead.status]}`}
                        >
                          {STATUS_LABEL[lead.status]}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <TemperatureBadge temperature={lead.qualification?.temperature} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <footer className="container-page mt-12 border-t border-white/[0.07] pt-6 text-xs text-slate-600">
        <Credits />
      </footer>

      <LeadDrawer
        lead={selected}
        onClose={() => setSelected(null)}
        onChanged={applyChange}
        onDeleted={applyDelete}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div className="glass p-5">
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p
        className={`mt-2 font-display text-3xl font-extrabold ${
          accent ? 'text-gradient' : 'text-white'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
