import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useI18n } from '../context/useI18n';
import { getProcedure } from '../data';
import { checkAvailability, sendChat, AiError, type AiAvailability, type ChatMessage } from '../lib/ai';
import { sessionData, STORAGE_KEYS } from '../lib/storage';
import { btnPrimary, btnSecondary, inputClass, Notice, PageHeader } from '../components/ui';
import type { MessageKey } from '../i18n';

const EXAMPLES: MessageKey[] = ['ai.ex.1', 'ai.ex.2', 'ai.ex.3', 'ai.ex.4', 'ai.ex.5'];

function loadHistory(): ChatMessage[] {
  const stored = sessionData.read<unknown>(STORAGE_KEYS.chat, []);
  if (!Array.isArray(stored)) return [];
  return stored.filter(
    (m): m is ChatMessage =>
      !!m && typeof m === 'object' && ((m as ChatMessage).role === 'user' || (m as ChatMessage).role === 'assistant') && typeof (m as ChatMessage).content === 'string',
  );
}

export function Assistant() {
  const { language } = useApp();
  const { t, loc } = useI18n();
  const [params] = useSearchParams();

  const procedureId = params.get('procedure') ?? undefined;
  const procedure = procedureId ? getProcedure(procedureId) : undefined;

  const [availability, setAvailability] = useState<AiAvailability | 'checking'>('checking');
  const [messages, setMessages] = useState<ChatMessage[]>(loadHistory);
  const [input, setInput] = useState(procedure ? t('ai.explainPrompt', { title: loc(procedure.title) }) : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    checkAvailability().then((result) => {
      if (!cancelled) setAvailability(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // The conversation lives for this browser tab only (sessionStorage).
  useEffect(() => {
    sessionData.write(STORAGE_KEYS.chat, messages);
    endRef.current?.scrollIntoView?.({ block: 'end' });
  }, [messages, busy]);

  async function ask(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    const next: ChatMessage[] = [...messages, { role: 'user', content: question }];
    setMessages(next);
    setInput('');
    setError(null);
    setBusy(true);
    try {
      const reply = await sendChat({ messages: next, language, procedureId: procedure?.id });
      setMessages([...next, { role: 'assistant', content: reply }]);
    } catch (caught) {
      const code = caught instanceof AiError ? caught.code : 'failed';
      if (code === 'not_configured') setAvailability('not_configured');
      else if (code === 'unreachable') setAvailability('unreachable');
      else setError(code === 'rate_limited' ? 'ai.rateLimited' : 'ai.error');
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void ask(input);
  }

  function newConversation() {
    setMessages([]);
    setError(null);
  }

  const unavailable = availability === 'not_configured' || availability === 'unreachable';

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title={t('ai.title')} subtitle={t('ai.subtitle')} />
      <Notice>{t('ai.disclaimer')}</Notice>
      <p className="text-sm text-muted">{t('ai.privacy')}</p>

      {availability === 'checking' ? (
        <div role="status" className="space-y-2">
          <p className="text-sm text-muted">{t('ai.checking')}</p>
          <div className="skeleton h-4 w-2/3" aria-hidden="true" />
          <div className="skeleton h-4 w-1/2" aria-hidden="true" />
        </div>
      ) : null}

      {unavailable ? (
        <Notice tone="warning" title={t('ai.unavailable.title')} role="status">
          {availability === 'not_configured' ? t('ai.unavailable.body') : t('ai.unreachable.body')}
        </Notice>
      ) : null}

      {procedure ? <p className="text-sm font-semibold text-brand-800">{t('ai.aboutProcedure', { title: loc(procedure.title) })}</p> : null}

      <section aria-label={t('ai.title')} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="max-h-[28rem] min-h-40 space-y-4 overflow-y-auto pe-1" aria-live="polite">
          {messages.length === 0 ? <p className="py-8 text-center text-muted">{t('ai.empty')}</p> : null}
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-base ${
                  message.role === 'user' ? 'bg-brand-700 text-white' : 'bg-slate-100 text-ink'
                }`}
              >
                <p className="mb-1 text-xs font-semibold opacity-80">{message.role === 'user' ? t('ai.you') : t('ai.assistant')}</p>
                {message.content}
              </div>
            </div>
          ))}
          {busy ? (
            <p role="status" className="text-sm text-muted">
              {t('ai.thinking')}
            </p>
          ) : null}
          <div ref={endRef} />
        </div>

        {error ? (
          <div className="mt-3">
            <Notice tone="error" role="alert">
              {t(error)}
            </Notice>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label htmlFor="ai-input" className="sr-only">
            {t('ai.placeholder')}
          </label>
          <textarea
            id="ai-input"
            rows={2}
            maxLength={2000}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void ask(input);
              }
            }}
            placeholder={t('ai.placeholder')}
            disabled={unavailable}
            className={`${inputClass} flex-1 resize-y disabled:bg-slate-100`}
          />
          <button type="submit" className={btnPrimary} disabled={unavailable || busy || input.trim() === ''}>
            {t('common.send')}
          </button>
        </form>

        {messages.length > 0 ? (
          <div className="mt-3">
            <button type="button" className={btnSecondary} onClick={newConversation}>
              {t('ai.newChat')}
            </button>
          </div>
        ) : null}
      </section>

      <section aria-labelledby="examples-title">
        <h2 id="examples-title" className="text-base font-bold text-brand-900">
          {t('ai.examples')}
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((key) => (
            <li key={key}>
              <button
                type="button"
                disabled={unavailable || busy}
                onClick={() => void ask(t(key))}
                className="rounded-full border border-slate-400 bg-white px-4 py-2 text-start text-sm font-medium text-brand-900 hover:bg-brand-50 disabled:opacity-50"
              >
                {t(key)}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
