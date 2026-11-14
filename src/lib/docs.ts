// Which documents the user has gathered, per procedure. Stored in this browser only.
// A document is identified by its English name, so editing the JSON text resets only that one tick.
import type { Procedure } from '../types';

export type DocsMap = Record<string, string[]>;

export function sanitizeDocs(raw: unknown): DocsMap {
  const out: DocsMap = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(value)) out[id] = value.filter((v): v is string => typeof v === 'string').slice(0, 50);
  }
  return out;
}

export function toggleDoc(map: DocsMap, procedureId: string, docName: string): DocsMap {
  const current = map[procedureId] ?? [];
  const next = current.includes(docName) ? current.filter((n) => n !== docName) : [...current, docName];
  return { ...map, [procedureId]: next };
}

export function isDocReady(map: DocsMap, procedureId: string, docName: string): boolean {
  return (map[procedureId] ?? []).includes(docName);
}

/** Counts only documents that still exist in the procedure (stale ticks are ignored). */
export function docCounts(procedure: Procedure, map: DocsMap): { ready: number; total: number } {
  const total = procedure.documents.length;
  const ready = procedure.documents.filter((d) => isDocReady(map, procedure.id, d.name.en)).length;
  return { ready, total };
}
