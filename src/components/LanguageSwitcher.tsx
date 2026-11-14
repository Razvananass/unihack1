import { useApp } from '../context/AppContext';
import { useI18n } from '../context/useI18n';
import { isLang, LANGUAGES } from '../i18n';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage } = useApp();
  const { t } = useI18n();
  return (
    <select
      aria-label={t('nav.language')}
      value={language}
      onChange={(event) => {
        if (isLang(event.target.value)) setLanguage(event.target.value);
      }}
      className={
        className ?? 'min-h-10 rounded-lg border border-slate-400 bg-white px-2 py-1.5 text-sm font-medium text-ink'
      }
    >
      {LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code} lang={lang.code}>
          {lang.nativeName}
        </option>
      ))}
    </select>
  );
}
