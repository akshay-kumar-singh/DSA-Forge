import { createOpenAI } from '@ai-sdk/openai';
import { createMistral } from '@ai-sdk/mistral';
import { streamText } from 'ai';

// Allow long generations on Vercel (default function timeout is too short for LLM responses)
export const maxDuration = 60;

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req: Request) {
  try {
    const { messages, provider, model, systemInstruction } = await req.json();

    let aiModel;

    if (provider === 'mistral') {
      const apiKey = process.env.MISTRAL_API_KEY;
      if (!apiKey) return jsonError('MISTRAL_API_KEY is not configured on the server.', 500);
      aiModel = createMistral({ apiKey })(model);
    } else if (provider === 'groq') {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) return jsonError('GROQ_API_KEY is not configured on the server.', 500);
      aiModel = createOpenAI({ baseURL: 'https://api.groq.com/openai/v1', apiKey })(model);
    } else if (provider === 'openrouter') {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) return jsonError('OPENROUTER_API_KEY is not configured on the server.', 500);
      aiModel = createOpenAI({ baseURL: 'https://openrouter.ai/api/v1', apiKey })(model);
    } else {
      return jsonError(`Invalid provider: ${provider}`, 400);
    }

    // Normalize roles and drop empty messages
    const cleanedMessages = (messages as { role: string; content: unknown }[])
      .map((m) => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      }))
      .filter((m) => m.content?.trim());

    // Conversations must start with a user message
    const firstUserIndex = cleanedMessages.findIndex((m) => m.role === 'user');
    const finalMessages = firstUserIndex !== -1
      ? cleanedMessages.slice(firstUserIndex)
      : cleanedMessages;

    if (finalMessages.length === 0) {
      return jsonError('No message content provided.', 400);
    }

    const result = streamText({
      model: aiModel,
      system: systemInstruction || undefined,
      messages: finalMessages,
    });

    return result.toTextStreamResponse();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Forge AI API Error:', msg);
    return jsonError(msg, 500);
  }
}
