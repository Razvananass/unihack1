import { useCallback } from 'react';
import { localize, translate, type MessageKey, type Params } from '../i18n';
import type { Localized } from '../types';
import { useApp } from './AppContext';

/** Use t(...) for interface text and loc(...) for text that lives in the JSON data files. */
export function useI18n() {
  const { language } = useApp();
  const t = useCallback((key: MessageKey, params?: Params) => translate(language, key, params), [language]);
  const loc = useCallback((value: Localized | undefined) => localize(value, language).text, [language]);
  const isFallback = useCallback((value: Localized | undefined) => localize(value, language).fallback, [language]);
  return { t, loc, isFallback, lang: language };
}
