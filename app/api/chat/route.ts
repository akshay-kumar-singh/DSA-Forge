import { createOpenAI } from '@ai-sdk/openai';
import { createMistral } from '@ai-sdk/mistral';
import { generateText } from 'ai';

export async function POST(req: Request) {
  try {
    const { messages, provider, model, systemInstruction } = await req.json();

    let aiModel: ReturnType<typeof createOpenAI | typeof createMistral>;

    if (provider === 'mistral') {
      const mistral = createMistral({ apiKey: process.env.MISTRAL_API_KEY || '' });
      aiModel = mistral(model) as any;
    } else if (provider === 'groq') {
      const groq = createOpenAI({ baseURL: 'https://api.groq.com/openai/v1', apiKey: process.env.GROQ_API_KEY });
      aiModel = groq(model) as any;
    } else if (provider === 'openrouter') {
      const openrouter = createOpenAI({ baseURL: 'https://openrouter.ai/api/v1', apiKey: process.env.OPENROUTER_API_KEY });
      aiModel = openrouter(model) as any;
    } else {
      return new Response(JSON.stringify({ error: 'Invalid provider' }), { status: 400 });
    }

    // Clean messages — ensure valid role alternation
    const cleanedMessages = messages
      .map((m: { role: string; content: unknown }) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      }))
      .filter((m: { role: string; content: string }) => m.content?.trim());

    const firstUserIndex = cleanedMessages.findIndex((m: { role: string }) => m.role === 'user');
    const finalMessages = firstUserIndex !== -1
      ? cleanedMessages.slice(firstUserIndex)
      : cleanedMessages;

    // Inject Forge system instruction into first user message
    if (systemInstruction && finalMessages.length > 0) {
      finalMessages[0].content = `[FORGE AI SYSTEM INSTRUCTION]\n${systemInstruction}\n\n[USER MESSAGE]\n${finalMessages[0].content}`;
    }

    const { text } = await generateText({ model: aiModel as any, messages: finalMessages });
    return new Response(JSON.stringify({ text }), { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Forge AI API Error:', msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}
