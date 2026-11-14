import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/useI18n';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { btnPrimary, cardClass, inputClass, PageHeader } from '../components/ui';

export function Settings() {
  const { profile, resetAll } = useApp();
  const { t } = useI18n();
  const navigate = useNavigate();

  function handleDelete() {
    if (!window.confirm(t('set.delete.confirm'))) return;
    resetAll();
    navigate('/', { state: { deleted: true } });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={t('set.title')} />

      <section className={cardClass} aria-labelledby="answers-title">
        <h2 id="answers-title" className="text-lg font-bold text-brand-900">
          {t('set.answers')}
        </h2>
        {profile ? (
          <dl className="mt-3 space-y-3 text-sm">
            <div>
              <dt className="font-semibold text-brand-900">{t('onb.q.situation')}</dt>
              <dd>{t(`onb.situation.${profile.situation}`)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-brand-900">{t('onb.q.citizenship')}</dt>
              <dd>{t(`onb.citizenship.${profile.citizenship}`)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-brand-900">{t('onb.q.accommodation')}</dt>
              <dd>{t(`onb.accommodation.${profile.accommodation}`)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-brand-900">{t('onb.q.completed')}</dt>
              <dd>
                <ul className="list-disc ps-5">
                  {profile.completed.map((key) => (
                    <li key={key}>{t(`onb.completed.${key}`)}</li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-muted">{t('set.none')}</p>
        )}
        <div className="mt-4">
          <Link to="/onboarding" className={btnPrimary}>
            {t('set.edit')}
          </Link>
        </div>
      </section>

      <section className={cardClass} aria-labelledby="language-title">
        <h2 id="language-title" className="text-lg font-bold text-brand-900">
          {t('set.language')}
        </h2>
        <div className="mt-3 max-w-xs">
          <LanguageSwitcher className={inputClass} />
        </div>
      </section>

      <section className={cardClass} aria-labelledby="data-title">
        <h2 id="data-title" className="text-lg font-bold text-brand-900">
          {t('set.data.title')}
        </h2>
        <p className="mt-2 text-muted">{t('set.data.body')}</p>
        <div className="mt-4">
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex min-h-11 items-center rounded-lg border border-red-700 bg-white px-5 py-2.5 font-semibold text-red-800 hover:bg-red-50"
          >
            {t('set.delete')}
          </button>
        </div>
      </section>
    </div>
  );
}
