// ======================================================
// GOOGLE PREP — provider-agnostic streaming
// Same transport as app/page.tsx (Gemini in the browser,
// everything else via /api/chat) — ported here so the
// existing page stays untouched.
// ======================================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Message, AIProvider } from '@/lib/types';

export interface StreamArgs {
  provider: AIProvider;
  model: string;
  system: string;
  history: Message[];
  userText: string;
  signal: AbortSignal;
  onChunk: (accumulated: string) => void;
}

/** Streams a reply; resolves with the full text. Throws on transport errors (not on abort). */
export async function streamReply({ provider, model, system, history, userText, signal, onChunk }: StreamArgs): Promise<string> {
  let acc = '';

  if (provider.id === 'gemini') {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) throw new Error('Gemini API key missing (NEXT_PUBLIC_GEMINI_API_KEY)');
    const ai = new GoogleGenerativeAI(apiKey);
    const raw = history.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }));
    const firstUser = raw.findIndex(m => m.role === 'user');
    const apiHistory = firstUser !== -1 ? raw.slice(firstUser) : [];
    const gm = ai.getGenerativeModel({ model, systemInstruction: system });
    const result = await gm.generateContentStream({ contents: [...apiHistory, { role: 'user', parts: [{ text: userText }] }] });
    for await (const chunk of result.stream) {
      if (signal.aborted) break;
      acc += chunk.text();
      onChunk(acc);
    }
    return acc;
  }

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [...history, { role: 'user', content: userText }],
      provider: provider.id,
      model,
      systemInstruction: system,
    }),
    signal,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    acc = data.text || '';
    onChunk(acc);
    return acc;
  }
  if (!res.body) return acc;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    acc += decoder.decode(value, { stream: true });
    onChunk(acc);
  }
  return acc;
}

export function friendlyAIError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/429|RESOURCE_EXHAUSTED|quota/i.test(msg)) return '⚠️ **API quota exceeded.** Check billing or switch provider in Settings.';
  return `⚠️ **Connection error:**\n\`\`\`\n${msg}\n\`\`\`\nTry switching providers in Settings.`;
}
