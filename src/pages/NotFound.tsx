import { Link } from 'react-router-dom';
import { useI18n } from '../context/useI18n';
import { btnPrimary } from '../components/ui';

export function NotFound() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="text-3xl font-bold text-brand-900">{t('nf.title')}</h1>
      <p className="mt-2 text-muted">{t('nf.body')}</p>
      <Link to="/" className={`${btnPrimary} mt-6`}>
        {t('nf.home')}
      </Link>
    </div>
  );
}
