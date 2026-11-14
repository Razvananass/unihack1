import { Link } from 'react-router-dom';
import { useI18n } from '../context/useI18n';

/**
 * The welcomeRo mark: an open doorway (arrival, welcome) on a deep-blue tile, with a warm yellow dot
 * (a light left on) and a small tricolour base nodding to the Romanian flag colours.
 */
export function LogoMark({ className = 'size-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="wr-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#136e9f" />
          <stop offset="1" stopColor="#0a3350" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#wr-bg)" />
      <path d="M11.5 28.5V18a8.5 8.5 0 0 1 17 0v10.5" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M16.5 28.5V19.2a3.5 3.5 0 0 1 7 0v9.3z" fill="#fff" opacity="0.18" />
      <circle cx="20" cy="19.5" r="2.1" fill="#fcd116" />
      <rect x="9" y="31" width="7.3" height="2.4" rx="1.2" fill="#2f6fd0" />
      <rect x="16.35" y="31" width="7.3" height="2.4" rx="1.2" fill="#fcd116" />
      <rect x="23.7" y="31" width="7.3" height="2.4" rx="1.2" fill="#ce1126" />
    </svg>
  );
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-extrabold tracking-tight ${className}`}>
      welcome<span className="text-sun-600">Ro</span>
    </span>
  );
}

export function Logo() {
  const { t } = useI18n();
  return (
    <Link to="/" aria-label={t('nav.home')} className="flex items-center gap-2.5 text-xl text-brand-900">
      <LogoMark />
      <Wordmark />
    </Link>
  );
}
