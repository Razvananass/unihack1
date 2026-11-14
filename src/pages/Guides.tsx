import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/useI18n';
import { procedures } from '../data';
import { effectiveStatus } from '../lib/checklist';
import { Arrow, cardClass, PageHeader, StatusBadge } from '../components/ui';
import type { Procedure } from '../types';

export function Guides() {
  const { tasks, progress } = useApp();
  const { t, loc } = useI18n();

  const relevantIds = new Set(tasks.map((task) => task.procedure.id));
  const relevant = procedures.filter((p) => relevantIds.has(p.id)).sort((a, b) => a.order - b.order);
  const other = procedures.filter((p) => !relevantIds.has(p.id)).sort((a, b) => a.order - b.order);

  function renderList(list: Procedure[], showStatus: boolean) {
    return (
      <ul className="grid gap-4 md:grid-cols-2">
        {list.map((procedure) => {
          const task = tasks.find((item) => item.procedure.id === procedure.id);
          return (
            <li key={procedure.id}>
              <Link to={`/guides/${procedure.id}`} className={`${cardClass} block h-full hover:border-brand-500`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-lg font-bold text-brand-900">{loc(procedure.title)}</h3>
                  {showStatus && task ? <StatusBadge status={effectiveStatus(task, progress)} /> : null}
                </div>
                <p className="mt-2 text-muted">{loc(procedure.summary)}</p>
                <p className="mt-3 font-semibold text-brand-700">
                  {t('check.open')} <Arrow />
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title={t('guides.title')} subtitle={t('guides.subtitle')} />
      {relevant.length > 0 ? (
        <section aria-labelledby="relevant-title" className="space-y-4">
          <h2 id="relevant-title" className="text-xl font-bold text-brand-900">
            {t('guides.relevant')}
          </h2>
          {renderList(relevant, true)}
        </section>
      ) : null}
      {other.length > 0 ? (
        <section aria-labelledby="other-title" className="space-y-4">
          <h2 id="other-title" className="text-xl font-bold text-brand-900">
            {t('guides.other')}
          </h2>
          {renderList(other, false)}
        </section>
      ) : null}
    </div>
  );
}
