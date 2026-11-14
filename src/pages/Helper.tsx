import { useEffect, useState, type FormEvent } from 'react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/useI18n';
import { phrases } from '../data';
import { AiError, checkAvailability, generatePhrase, type AiAvailability, type GeneratedPhrase } from '../lib/ai';
import { btnPrimary, CopyButton, cardClass, inputClass, Notice, PageHeader, SpeakButtons, useSpeechSupport } from '../components/ui';
import type { MessageKey } from '../i18n';
import type { Phrase } from '../types';

function PhraseCard({ phrase }: { phrase: Phrase }) {
  const { t, loc, lang } = useI18n();
  const english = phrase.meaning.en;
  const own = lang === 'en' ? null : phrase.meaning[lang];
  const hasBrackets = /\[[^\]]+\]/.test(phrase.ro);

  return (
    <article className={cardClass} aria-labelledby={`phrase-${phrase.id}`}>
      <h2 id={`phrase-${phrase.id}`} className="text-base font-bold text-brand-900">
        {loc(phrase.label)}
      </h2>

      <div className="mt-3 rounded-xl bg-brand-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">{t('help.romanian')}</p>
        <p lang="ro" dir="ltr" className="mt-1 whitespace-pre-wrap text-lg font-semibold text-ink">
          {phrase.ro}
        </p>
      </div>

      {phrase.pron ? (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t('help.pron')}</p>
          <p dir="ltr" className="mt-1 text-base italic text-ink">
            {phrase.pron}
          </p>
        </div>
      ) : null}

      <div className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t('help.meaning')}</p>
        <p lang="en" dir="ltr" className="mt-1 whitespace-pre-wrap text-base">
          {english}
        </p>
        {own ? (
          <p lang={lang} className="mt-2 whitespace-pre-wrap border-s-4 border-brand-200 ps-3 text-base">
            {own}
          </p>
        ) : null}
      </div>

      {hasBrackets ? <p className="mt-3 text-sm text-amber-900">{t('help.brackets')}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <SpeakButtons text={phrase.ro} />
        <CopyButton text={phrase.ro} />
      </div>
    </article>
  );
}

function CustomMessage() {
  const { language } = useApp();
  const { t } = useI18n();
  const [availability, setAvailability] = useState<AiAvailability | 'checking'>('checking');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<GeneratedPhrase | null>(null);
  const [error, setError] = useState<MessageKey | null>(null);

  useEffect(() => {
    let cancelled = false;
    checkAvailability().then((a) => {
      if (!cancelled) setAvailability(a);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = description.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await generatePhrase({ description: text, language }));
    } catch (caught) {
      const code = caught instanceof AiError ? caught.code : 'failed';
      if (code === 'not_configured' || code === 'unreachable') setAvailability(code);
      else setError(code === 'rate_limited' ? 'ai.rateLimited' : 'help.custom.error');
    } finally {
      setBusy(false);
    }
  }

  const unavailable = availability === 'not_configured' || availability === 'unreachable';

  return (
    <section className={cardClass} aria-labelledby="custom-title">
      <h2 id="custom-title" className="text-lg font-bold text-brand-900">
        {t('help.custom.title')}
      </h2>
      <p className="mt-1 text-muted">{t('help.custom.body')}</p>

      {unavailable ? (
        <div className="mt-4">
          <Notice tone="warning" role="status">
            {t('help.custom.unavailable')}
          </Notice>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label htmlFor="custom-description" className="sr-only">
            {t('help.custom.title')}
          </label>
          <textarea
            id="custom-description"
            rows={3}
            maxLength={1000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t('help.custom.placeholder')}
            className={`${inputClass} resize-y`}
          />
          <button type="submit" className={btnPrimary} disabled={busy || description.trim() === ''}>
            {busy ? t('ai.thinking') : t('help.custom.generate')}
          </button>
        </form>
      )}

      {error ? (
        <div className="mt-3">
          <Notice tone="error" role="alert">
            {t(error)}
          </Notice>
        </div>
      ) : null}

      {result ? (
        <div className="mt-4 space-y-3" aria-live="polite">
          <div className="rounded-xl bg-brand-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">{t('help.custom.result')}</p>
            <p lang="ro" dir="ltr" className="mt-1 whitespace-pre-wrap text-lg font-semibold">
              {result.romanian}
            </p>
          </div>
          {result.pronunciation ? (
            <p dir="ltr" className="italic">
              {result.pronunciation}
            </p>
          ) : null}
          {result.translation ? <p className="whitespace-pre-wrap">{result.translation}</p> : null}
          <div className="flex flex-wrap gap-2">
            <SpeakButtons text={result.romanian} />
            <CopyButton text={result.romanian} />
          </div>
          <p className="text-sm text-muted">{t('help.custom.review')}</p>
        </div>
      ) : null}
    </section>
  );
}

export function Helper() {
  const { t } = useI18n();
  const support = useSpeechSupport();
  return (
    <div className="space-y-6">
      <PageHeader title={t('help.title')} subtitle={t('help.subtitle')} />
      {support !== 'ready' ? (
        <Notice tone="warning" role="status">
          {t(support === 'unsupported' ? 'help.speech.unsupported' : 'help.speech.noVoice')}
        </Notice>
      ) : (
        <p className="text-sm text-muted">{t('help.speech.note')}</p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {phrases.map((phrase) => (
          <PhraseCard key={phrase.id} phrase={phrase} />
        ))}
      </div>
      <CustomMessage />
    </div>
  );
}
