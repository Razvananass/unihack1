import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { docCounts } from '../lib/docs';
import { Icon } from './Icon';
import { useI18n } from '../context/useI18n';
import type { ChecklistTask, Procedure, TaskNote, TaskStatus } from '../types';
import { Arrow, btnPrimary, btnSecondary, cardClass, inputClass, StatusBadge } from './ui';

const STATUSES: TaskStatus[] = ['not-started', 'in-progress', 'completed'];

interface TaskCardProps {
  task: ChecklistTask;
  status: TaskStatus;
  onStatusChange: (status: TaskStatus) => void;
  pendingDependencies: Procedure[];
}

export function TaskCard({ task, status, onStatusChange, pendingDependencies }: TaskCardProps) {
  const { t, loc } = useI18n();
  const { procedure, priority } = task;
  const selectId = `status-${procedure.id}`;
  const done = status === 'completed';
  const { docs } = useApp();
  const counts = docCounts(procedure, docs);

  // Play a small "pop" only when the task becomes completed while you are looking at it.
  const previous = useRef(status);
  const [popping, setPopping] = useState(false);
  useEffect(() => {
    if (previous.current !== 'completed' && status === 'completed') {
      setPopping(true);
      const id = window.setTimeout(() => setPopping(false), 600);
      previous.current = status;
      return () => window.clearTimeout(id);
    }
    previous.current = status;
  }, [status]);

  const priorityReason = priority?.reason ? loc(priority.reason) : priority?.reasonKey ? t(`note.${priority.reasonKey}`) : '';
  // Only "high" and "low" priorities are shown; "normal" is the default and needs no badge.
  const priorityLevel = priority?.level === 'high' || priority?.level === 'low' ? priority.level : null;
  // "verifyApplies" is shown as a badge; the other notes are plain sentences.
  const sentenceNotes = task.notes.filter((n): n is Exclude<TaskNote, 'verifyApplies'> => n !== 'verifyApplies');

  return (
    <article className={`${cardClass} ${done ? 'bg-slate-50' : ''} ${popping ? 'animate-pop' : ''}`} aria-labelledby={`title-${procedure.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 id={`title-${procedure.id}`} className={`text-lg font-bold text-brand-900 ${done ? 'opacity-80' : ''}`}>
          {loc(procedure.title)}
        </h3>
        <StatusBadge status={status} />
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {priorityLevel ? (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              priorityLevel === 'high' ? 'bg-red-100 text-red-900' : 'bg-slate-100 text-slate-800'
            }`}
          >
            {priorityLevel === 'high' ? '▲ ' : '▽ '}
            {t(`priority.${priorityLevel}`)}
          </span>
        ) : null}
        {task.relevance === 'verify' ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
            <span aria-hidden="true">? </span>
            {t('relevance.verify')}
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-muted">{loc(procedure.summary)}</p>

      {priorityLevel && priorityReason ? (
        <p className="mt-2 text-sm text-muted">{t('priority.why', { reason: priorityReason })}</p>
      ) : null}

      {sentenceNotes.length > 0 ? (
        <ul className="mt-3 space-y-1 text-sm text-brand-900">
          {sentenceNotes.map((note) => (
            <li key={note} className="rounded-lg bg-brand-50 px-3 py-2">
              {t(`note.${note}`)}
            </li>
          ))}
        </ul>
      ) : null}

      {counts.total > 0 ? (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-muted">
          <Icon name="file" className="size-4" />
          {t('docs.progress', { ready: counts.ready, total: counts.total })}
        </p>
      ) : null}

      {!done && pendingDependencies.length > 0 ? (
        <p className="mt-3 text-sm text-muted">
          {t('check.doFirst', { items: pendingDependencies.map((p) => loc(p.title)).join(', ') })}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <Link to={`/guides/${procedure.id}`} className={btnPrimary}>
          {t('check.open')} <Arrow />
        </Link>
        <Link to={`/kit/${procedure.id}`} className={btnSecondary}>
          <Icon name="printer" className="size-4" />
          {t('kit.open')}
        </Link>
        <button
          type="button"
          className={btnSecondary}
          onClick={() => onStatusChange(done ? 'not-started' : 'completed')}
        >
          {done ? t('check.reopen') : t('check.markDone')}
        </button>
        <div className="ms-auto min-w-40">
          <label htmlFor={selectId} className="mb-1 block text-xs font-semibold text-muted">
            {t('check.status')}
          </label>
          <select
            id={selectId}
            value={status}
            onChange={(event) => onStatusChange(event.target.value as TaskStatus)}
            className={inputClass}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`status.${s}`)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </article>
  );
}
