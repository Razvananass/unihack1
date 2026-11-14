import { useI18n } from '../context/useI18n';
import { institutions } from '../data';
import { cardClass, linkClass, Notice, PageHeader } from '../components/ui';
import type { Institution } from '../types';

function mapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[9rem_1fr]">
      <dt className="text-sm font-semibold text-brand-900">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

function InstitutionCard({ institution }: { institution: Institution }) {
  const { t, loc } = useI18n();
  const missing = <span className="text-muted">{t('inst.notVerified')}</span>;

  return (
    <article className={cardClass} aria-labelledby={`inst-${institution.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 id={`inst-${institution.id}`} className="text-lg font-bold text-brand-900">
          {loc(institution.name)}
        </h2>
        {institution.placeholder ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">{t('inst.example')}</span>
        ) : null}
      </div>
      <p className="mt-2 text-muted">{loc(institution.description)}</p>

      <dl className="mt-4 space-y-2">
        <Row label={t('inst.services')}>
          <ul className="list-disc ps-5">
            {institution.services.map((service) => (
              <li key={service.en}>{loc(service)}</li>
            ))}
          </ul>
        </Row>
        <Row label={t('inst.address')}>
          {institution.address ? (
            <>
              {institution.address}{' '}
              <a href={mapsUrl(institution.address)} target="_blank" rel="noreferrer noopener" className={linkClass}>
                ({t('inst.maps')})
              </a>
            </>
          ) : (
            missing
          )}
        </Row>
        <Row label={t('inst.phone')}>
          {institution.phone ? (
            <a href={`tel:${institution.phone.replace(/[^\d+]/g, '')}`} className={linkClass} dir="ltr">
              {institution.phone}
            </a>
          ) : (
            missing
          )}
        </Row>
        <Row label={t('inst.email')}>
          {institution.email ? (
            <a href={`mailto:${institution.email}`} className={linkClass} dir="ltr">
              {institution.email}
            </a>
          ) : (
            missing
          )}
        </Row>
        <Row label={t('inst.hours')}>{institution.hours ? loc(institution.hours) : missing}</Row>
        <Row label={t('inst.website')}>
          <a href={institution.website} target="_blank" rel="noreferrer noopener" className={linkClass} dir="ltr">
            {institution.website.replace('https://', '')}
          </a>
        </Row>
      </dl>

      <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-muted">{loc(institution.verifiedNote)}</p>
    </article>
  );
}

export function Institutions() {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <PageHeader title={t('inst.title')} subtitle={t('inst.subtitle')} />
      <Notice>{t('inst.mapNote')}</Notice>
      <div className="grid gap-4 lg:grid-cols-2">
        {institutions.map((institution) => (
          <InstitutionCard key={institution.id} institution={institution} />
        ))}
      </div>
    </div>
  );
}
