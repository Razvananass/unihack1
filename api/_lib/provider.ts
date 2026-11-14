// AI provider layer. The rest of the server code only knows the `AiProvider` interface,
// so switching to another model provider later means adding one object here and changing getProvider().

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CompleteArgs {
  system: string;
  messages: ChatMessage[];
  maxTokens: number;
}

export interface AiProvider {
  name: string;
  /** True when the secret key for this provider is present in the server environment. */
  isConfigured(): boolean;
  complete(args: CompleteArgs): Promise<string>;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly kind: 'timeout' | 'rate_limited' | 'upstream',
  ) {
    super(message);
  }
}

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/** Sends one JSON request and turns every failure into a ProviderError with a safe, generic message. */
async function postJson(url: string, headers: Record<string, string>, body: unknown): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(25_000),
    });
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
    throw new ProviderError(timedOut ? 'Request timed out' : 'Network error', timedOut ? 'timeout' : 'upstream');
  }
  if (response.status === 429) throw new ProviderError('Rate limited', 'rate_limited');
  if (!response.ok) throw new ProviderError(`Provider responded with status ${response.status}`, 'upstream');
  try {
    return await response.json();
  } catch {
    throw new ProviderError('Invalid response', 'upstream');
  }
}

function nonEmpty(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) throw new ProviderError('Empty response', 'upstream');
  return trimmed;
}

// ---- Anthropic (paid) ------------------------------------------------------------------------
const anthropicProvider: AiProvider = {
  name: 'anthropic',

  isConfigured() {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  },

  async complete({ system, messages, maxTokens }) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new ProviderError('Missing API key', 'upstream');
    const data = (await postJson(
      ANTHROPIC_URL,
      { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      { model: process.env.AI_MODEL || 'claude-sonnet-5-5', max_tokens: maxTokens, system, messages },
    )) as { content?: Array<{ type: string; text?: string }> };
    return nonEmpty(
      (data.content ?? [])
        .filter((block) => block.type === 'text' && typeof block.text === 'string')
        .map((block) => block.text)
        .join('\n'),
    );
  },
};

// ---- Google Gemini (has a free tier, no credit card) -------------------------------------------
const geminiProvider: AiProvider = {
  name: 'gemini',

  isConfigured() {
    return Boolean(process.env.GEMINI_API_KEY);
  },

  async complete({ system, messages, maxTokens }) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new ProviderError('Missing API key', 'upstream');
    const model = process.env.AI_MODEL || 'gemini-2.5-flash';
    const generationConfig: Record<string, unknown> = { maxOutputTokens: maxTokens, temperature: 0.3 };
    // Gemini 2.5 Flash "thinks" first and the thinking uses up the output budget; switch it off for short answers.
    if (model.startsWith('gemini-2.5-flash')) generationConfig.thinkingConfig = { thinkingBudget: 0 };
    const data = (await postJson(
      `${GEMINI_BASE}/${encodeURIComponent(model)}:generateContent`,
      { 'x-goog-api-key': apiKey }, // sent as a header, so the key never appears in a URL or log line
      {
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        generationConfig,
      },
    )) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> } }> };
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    return nonEmpty(
      parts
        .filter((part) => typeof part.text === 'string' && !part.thought)
        .map((part) => part.text)
        .join(''),
    );
  },
};

// ---- Groq (has a free tier; OpenAI-compatible API) ---------------------------------------------
const groqProvider: AiProvider = {
  name: 'groq',

  isConfigured() {
    return Boolean(process.env.GROQ_API_KEY);
  },

  async complete({ system, messages, maxTokens }) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new ProviderError('Missing API key', 'upstream');
    const model = process.env.AI_MODEL || 'openai/gpt-oss-120b';
    const body: Record<string, unknown> = {
      model,
      messages: [{ role: 'system', content: system }, ...messages],
      max_completion_tokens: maxTokens,
      temperature: 0.3,
    };
    // gpt-oss models reason before answering; keep that short so the answer is not cut off.
    if (model.includes('gpt-oss')) body.reasoning_effort = 'low';
    const data = (await postJson(GROQ_URL, { authorization: `Bearer ${apiKey}` }, body)) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    return nonEmpty(data.choices?.[0]?.message?.content ?? '');
  },
};

const PROVIDERS: Record<string, AiProvider> = { gemini: geminiProvider, groq: groqProvider, anthropic: anthropicProvider };

/**
 * Choose the provider.
 * - AI_PROVIDER=gemini | groq | anthropic picks one explicitly.
 * - Otherwise the first one that has a key is used, free options first: gemini, groq, anthropic.
 * With no key at all the (unconfigured) Gemini provider is returned, so the app reports "not available".
 */
export function getProvider(): AiProvider {
  const wanted = (process.env.AI_PROVIDER ?? '').trim().toLowerCase();
  if (wanted && PROVIDERS[wanted]) return PROVIDERS[wanted];
  return Object.values(PROVIDERS).find((provider) => provider.isConfigured()) ?? geminiProvider;
}
