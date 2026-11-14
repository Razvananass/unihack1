// App-wide state: language, profile, progress. Everything is saved to localStorage when it changes.
// To add accounts/a database later, replace the reads/writes in this file (and lib/storage.ts); pages stay the same.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { procedures } from '../data';
import { DEFAULT_LANG, directionOf, isLang } from '../i18n';
import { buildChecklist, sanitizeProgress, summarize, type ProgressSummary } from '../lib/checklist';
import { sanitizeDocs, toggleDoc as toggleDocIn, type DocsMap } from '../lib/docs';
import { sanitizeDates, type PlanDates } from '../lib/plan';
import { isProfile } from '../lib/profile';
import { clearAllData, localData, STORAGE_KEYS } from '../lib/storage';
import type { ChecklistTask, Lang, Profile, ProgressMap, TaskStatus } from '../types';

interface AppContextValue {
  language: Lang;
  setLanguage: (lang: Lang) => void;
  /** False until the visitor has picked a language (used to show the language picker first). */
  languageChosen: boolean;
  profile: Profile | null;
  completeOnboarding: (profile: Profile) => void;
  progress: ProgressMap;
  setTaskStatus: (procedureId: string, status: TaskStatus) => void;
  /** Documents the user has ticked as ready, per procedure. */
  docs: DocsMap;
  toggleDoc: (procedureId: string, docName: string) => void;
  dates: PlanDates;
  setDates: (dates: PlanDates) => void;
  tasks: ChecklistTask[];
  summary: ProgressSummary;
  resetAll: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function loadLanguage(): Lang {
  const stored = localData.read<unknown>(STORAGE_KEYS.language, DEFAULT_LANG);
  return isLang(stored) ? stored : DEFAULT_LANG;
}

function loadProfile(): Profile | null {
  const stored = localData.read<unknown>(STORAGE_KEYS.profile, null);
  return isProfile(stored) ? stored : null;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Lang>(loadLanguage);
  const [languageChosen, setLanguageChosen] = useState<boolean>(() => isLang(localData.read<unknown>(STORAGE_KEYS.language, null)));
  const [profile, setProfile] = useState<Profile | null>(loadProfile);
  const [progress, setProgress] = useState<ProgressMap>(() => sanitizeProgress(localData.read<unknown>(STORAGE_KEYS.progress, {})));

  const [docs, setDocs] = useState<DocsMap>(() => sanitizeDocs(localData.read<unknown>(STORAGE_KEYS.docs, {})));
  const [dates, setDatesState] = useState<PlanDates>(() => sanitizeDates(localData.read<unknown>(STORAGE_KEYS.dates, {})));

  // Keep the page's language and reading direction (left-to-right / right-to-left) in sync.
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = directionOf(language);
  }, [language]);

  const setLanguage = useCallback((lang: Lang) => {
    setLanguageState(lang);
    setLanguageChosen(true);
    localData.write(STORAGE_KEYS.language, lang);
  }, []);

  const completeOnboarding = useCallback((next: Profile) => {
    setProfile(next);
    localData.write(STORAGE_KEYS.profile, next);
  }, []);

  const setTaskStatus = useCallback((procedureId: string, status: TaskStatus) => {
    setProgress((current) => {
      const next = { ...current, [procedureId]: status };
      localData.write(STORAGE_KEYS.progress, next);
      return next;
    });
  }, []);

  const toggleDoc = useCallback((procedureId: string, docName: string) => {
    setDocs((current) => {
      const next = toggleDocIn(current, procedureId, docName);
      localData.write(STORAGE_KEYS.docs, next);
      return next;
    });
  }, []);

  const setDates = useCallback((next: PlanDates) => {
    setDatesState(next);
    localData.write(STORAGE_KEYS.dates, next);
  }, []);

  const resetAll = useCallback(() => {
    clearAllData();
    setProfile(null);
    setProgress({});
    setDocs({});
    setDatesState({ arrival: '', expiry: '' });
    setLanguageState(DEFAULT_LANG);
    setLanguageChosen(false);
  }, []);

  const tasks = useMemo(() => (profile ? buildChecklist(procedures, profile) : []), [profile]);
  const summary = useMemo(() => summarize(tasks, progress), [tasks, progress]);

  const value = useMemo<AppContextValue>(
    () => ({ language, setLanguage, languageChosen, profile, completeOnboarding, progress, setTaskStatus, docs, toggleDoc, dates, setDates, tasks, summary, resetAll }),
    [language, setLanguage, languageChosen, profile, completeOnboarding, progress, setTaskStatus, docs, toggleDoc, dates, setDates, tasks, summary, resetAll],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
