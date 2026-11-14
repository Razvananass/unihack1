// One place that loads the JSON files and gives them proper types.
// To update administrative information, edit the JSON files in this folder. No component changes needed.
import proceduresJson from './procedures.json';
import institutionsJson from './institutions.json';
import phrasesJson from './phrases.json';
import sourcesJson from './sources.json';
import kitJson from './kit.json';
import type { Institution, Phrase, Procedure, Source } from '../types';

export const procedures = proceduresJson as unknown as Procedure[];
export const institutions = institutionsJson as unknown as Institution[];
export const phrases = phrasesJson as unknown as Phrase[];
/** Questions worth asking at any office (used by the printable appointment kit). */
export const kitQuestions = kitJson as unknown as Phrase[];
export const sources = sourcesJson as unknown as Record<string, Source>;

export function getProcedure(id: string): Procedure | undefined {
  return procedures.find((p) => p.id === id);
}

export function getInstitution(id: string): Institution | undefined {
  return institutions.find((i) => i.id === id);
}

export function getSources(ids: string[] | undefined): Source[] {
  return (ids ?? []).map((id) => sources[id]).filter((s): s is Source => Boolean(s));
}
