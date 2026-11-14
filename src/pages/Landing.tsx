import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/useI18n';
import type { MessageKey } from '../i18n';
import { LanguagePicker } from '../components/LanguagePicker';
import { Arrow, btnPrimary, cardClass, Notice, ProgressRing } from '../components/ui';
import { Icon, type IconName } from '../components/Icon';
import { LogoMark, Wordmark } from '../components/Logo';

const STEPS: Array<{ title: MessageKey; body: MessageKey }> = [
  { title: 'landing.how.1.title', body: 'landing.how.1.body' },
  { title: 'landing.how.2.title', body: 'landing.how.2.body' },
  { title: 'landing.how.3.title', body: 'landing.how.3.body' },
];

const FEATURES: Array<{ title: MessageKey; body: MessageKey; icon: IconName }> = [
  { title: 'landing.feature.checklist.title', body: 'landing.feature.checklist.body', icon: 'list' },
  { title: 'landing.feature.guides.title', body: 'landing.feature.guides.body', icon: 'globe' },
  { title: 'landing.feature.ai.title', body: 'landing.feature.ai.body', icon: 'sparkles' },
  { title: 'landing.feature.helper.title', body: 'landing.feature.helper.body', icon: 'chat' },
  { title: 'landing.feature.kit.title', body: 'landing.feature.kit.body', icon: 'printer' },
  { title: 'landing.feature.plan.title', body: 'landing.feature.plan.body', icon: 'calendar' },
  { title: 'landing.feature.sources.title', body: 'landing.feature.sources.body', icon: 'building' },
];

export function Landing() {
  const { profile } = useApp();
  const { t } = useI18n();
  const location = useLocation();
  const justDeleted = (location.state as { deleted?: boolean } | null)?.deleted === true;

  const ctaTarget = profile ? '/dashboard' : '/onboarding';
  const ctaLabel = profile ? t('landing.cta.continue') : t('landing.cta');

  return (
    <div className="space-y-16">
      <LanguagePicker />
      {justDeleted ? (
        <Notice role="status" tone="info">
          {t('set.deleted')}
        </Notice>
      ) : null}

      <section className="grid items-center gap-10 py-6 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">{t('landing.eyebrow')}</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-brand-900 sm:text-5xl">{t('app.tagline')}</h1>
          <p className="mt-5 max-w-xl text-lg text-muted">{t('landing.hero.body')}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link to={ctaTarget} className={`${btnPrimary} px-7 py-3.5 text-lg`}>
              {ctaLabel} <Arrow />
            </Link>
          </div>
          <p className="mt-4 max-w-xl text-sm text-muted">{t('landing.audience')}</p>
        </div>
        <div className="relative" aria-hidden="true">
          <div className="absolute -inset-3 -z-10 rounded-[2rem] bg-gradient-to-br from-brand-100 via-sun-100 to-white" />
          <div className={`${cardClass} shadow-xl`}>
            <div className="flex items-center gap-2">
              <LogoMark className="size-7" />
              <Wordmark className="text-brand-900" />
              <span className="ms-auto text-xs font-semibold text-muted">{t('landing.preview.title')}</span>
            </div>
            <div className="mt-4 flex items-center gap-5">
              <ProgressRing percent={33} label={t('landing.preview.title')} size={96} />
              <ul className="flex-1 space-y-2 text-sm">
                {[
                  ['check', 'bg-emerald-100 text-emerald-900', 'level.verified'],
                  ['sparkles', 'bg-brand-100 text-brand-900', 'level.recommended'],
                  ['alert', 'bg-amber-100 text-amber-900', 'level.confirm'],
                ].map(([icon, style, key]) => (
                  <li key={key} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2">
                    <span className={`grid size-7 shrink-0 place-items-center rounded-full ${style}`}>
                      <Icon name={icon as IconName} className="size-4" />
                    </span>
                    <span className="font-medium text-ink">{t(key as MessageKey)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="how-title">
        <h2 id="how-title" className="text-2xl font-bold text-brand-900">
          {t('landing.how.title')}
        </h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className={cardClass}>
              <span className="grid size-9 place-items-center rounded-full bg-brand-700 font-bold text-white">{index + 1}</span>
              <h3 className="mt-4 text-lg font-bold text-brand-900">{t(step.title)}</h3>
              <p className="mt-2 text-muted">{t(step.body)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="features-title">
        <h2 id="features-title" className="text-2xl font-bold text-brand-900">
          {t('landing.features.title')}
        </h2>
        <ul className="stagger mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <li key={feature.title} className={`${cardClass} card-lift`}>
              <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <Icon name={feature.icon} className="size-6" />
              </span>
              <h3 className="mt-3 text-lg font-bold text-brand-900">{t(feature.title)}</h3>
              <p className="mt-2 text-muted">{t(feature.body)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${cardClass} border-amber-300 bg-amber-50`}>
        <h2 className="text-xl font-bold text-amber-950">{t('landing.honesty.title')}</h2>
        <p className="mt-2 max-w-3xl text-amber-950">{t('landing.honesty.body')}</p>
      </section>

      <section className="text-center">
        <Link to={ctaTarget} className={`${btnPrimary} px-7 py-3.5 text-lg`}>
          {ctaLabel} <Arrow />
        </Link>
      </section>
    </div>
  );
}
