// Serverless endpoint used by the AI assistant and the custom Romanian message feature.
//
//   GET  /api/chat  -> { configured: boolean }   (lets the UI show "unavailable" before the user types)
//   POST /api/chat  -> { reply: string }
//
// The API key is read from process.env on the SERVER only. It is never sent to the browser.
import { getProvider, ProviderError, type ChatMessage } from './_lib/provider.js';
import { buildKnowledge, procedureTitle } from './_lib/knowledge.js';
import { buildSystemPrompt, type Language, type Mode } from './_lib/prompt.js';

const MAX_BODY_CHARS = 30_000;
const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 2_000;
const LANGUAGES: Language[] = ['en', 'ro', 'fr', 'ar'];

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function parseMessages(value: unknown): ChatMessage[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_MESSAGES) return null;
  const messages: ChatMessage[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') return null;
    const { role, content } = item as { role?: unknown; content?: unknown };
    if (role !== 'user' && role !== 'assistant') return null;
    if (typeof content !== 'string') return null;
    const trimmed = content.trim();
    if (trimmed.length === 0 || trimmed.length > MAX_MESSAGE_CHARS) return null;
    messages.push({ role, content: trimmed });
  }
  return messages[messages.length - 1].role === 'user' ? messages : null;
}

export function GET(): Response {
  return json({ configured: getProvider().isConfigured() });
}

export async function POST(request: Request): Promise<Response> {
  const provider = getProvider();
  if (!provider.isConfigured()) return json({ error: 'not_configured' }, 503);

  let payload: { mode?: unknown; language?: unknown; messages?: unknown; procedureId?: unknown };
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_CHARS) return json({ error: 'bad_request' }, 400);
    payload = JSON.parse(text);
  } catch {
    return json({ error: 'bad_request' }, 400);
  }

  const mode: Mode = payload.mode === 'phrase' ? 'phrase' : 'chat';
  const language = LANGUAGES.find((l) => l === payload.language);
  const messages = parseMessages(payload.messages);
  if (!language || !messages) return json({ error: 'bad_request' }, 400);

  const focusProcedure = typeof payload.procedureId === 'string' ? procedureTitle(payload.procedureId) : null;

  try {
    const reply = await provider.complete({
      system: buildSystemPrompt({ mode, language, knowledge: buildKnowledge(), focusProcedure }),
      messages,
      maxTokens: mode === 'phrase' ? 400 : 700,
    });
    return json({ reply });
  } catch (error) {
    // Log the kind of failure on the server. Never log keys or user messages.
    const kind = error instanceof ProviderError ? error.kind : 'upstream';
    console.error(`[api/chat] ${provider.name} failed: ${kind}`);
    if (kind === 'rate_limited') return json({ error: 'rate_limited' }, 429);
    if (kind === 'timeout') return json({ error: 'upstream_timeout' }, 504);
    return json({ error: 'upstream_error' }, 502);
  }
}
