// Browser-side client for the AI endpoint (/api/chat). It never sees the API key.
// If you change the AI provider later, only the server files in /api need to change.
import type { Lang } from '../types';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type AiErrorCode = 'not_configured' | 'unreachable' | 'rate_limited' | 'failed';

export class AiError extends Error {
  constructor(public readonly code: AiErrorCode) {
    super(code);
  }
}

export type AiAvailability = 'ready' | 'not_configured' | 'unreachable';

async function readJson(response: Response): Promise<Record<string, unknown> | null> {
  const type = response.headers.get('content-type') ?? '';
  if (!type.includes('application/json')) return null; // e.g. the dev server returning index.html for /api
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Ask the server whether an AI key is configured. */
export async function checkAvailability(): Promise<AiAvailability> {
  try {
    const response = await fetch('/api/chat', { method: 'GET' });
    const data = await readJson(response);
    if (!response.ok || !data || typeof data.configured !== 'boolean') return 'unreachable';
    return data.configured ? 'ready' : 'not_configured';
  } catch {
    return 'unreachable';
  }
}

async function post(body: unknown): Promise<string> {
  let response: Response;
  try {
    response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AiError('unreachable');
  }
  const data = await readJson(response);
  if (!data) throw new AiError('unreachable');
  if (response.status === 503) throw new AiError('not_configured');
  if (response.status === 429) throw new AiError('rate_limited');
  if (!response.ok || typeof data.reply !== 'string') throw new AiError('failed');
  return data.reply;
}

/** Normal chat. `messages` is the conversation so far (the last one must be from the user). */
export function sendChat(args: { messages: ChatMessage[]; language: Lang; procedureId?: string }): Promise<string> {
  return post({ mode: 'chat', language: args.language, messages: args.messages.slice(-12), procedureId: args.procedureId });
}

export interface GeneratedPhrase {
  romanian: string;
  translation: string;
  pronunciation: string;
}

/** Turn a description of a situation into a short Romanian message. */
export async function generatePhrase(args: { description: string; language: Lang }): Promise<GeneratedPhrase> {
  const reply = await post({
    mode: 'phrase',
    language: args.language,
    messages: [{ role: 'user', content: args.description }],
  });
  const parsed = parsePhraseReply(reply);
  if (!parsed) throw new AiError('failed');
  return parsed;
}

/** The model is asked for JSON. Be forgiving about extra text around it. */
export function parsePhraseReply(reply: string): GeneratedPhrase | null {
  const start = reply.indexOf('{');
  const end = reply.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    const data = JSON.parse(reply.slice(start, end + 1)) as Record<string, unknown>;
    if (typeof data.romanian !== 'string' || data.romanian.trim() === '') return null;
    return {
      romanian: data.romanian,
      translation: typeof data.translation === 'string' ? data.translation : '',
      pronunciation: typeof data.pronunciation === 'string' ? data.pronunciation : '',
    };
  } catch {
    return null;
  }
}
