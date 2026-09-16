'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { streamReply, friendlyAIError } from '@/lib/google/stream';
import type { Message, AIProvider } from '@/lib/types';

let counter = 0;
export function mkMsg(role: 'user' | 'assistant', content: string): Message {
  return { id: `g-${Date.now()}-${++counter}`, role, content };
}

const MAX_HISTORY = 20;

/**
 * Chat state + streaming for one AI persona. The system prompt is built
 * per-send by the caller (so it can include live code / diagram / timer).
 */
export function useChat(provider: AIProvider, model: string, greeting?: string) {
  const [messages, setMessages] = useState<Message[]>(() => (greeting ? [mkMsg('assistant', greeting)] : []));
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesRef = useRef(messages);
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
  }, []);

  const reset = useCallback((newGreeting?: string) => {
    stop();
    setMessages(newGreeting ? [mkMsg('assistant', newGreeting)] : []);
    setInput('');
  }, [stop]);

  /** Send text; `hidden` keeps the user's turn out of the transcript (system-driven prompts). */
  const send = useCallback(async (text: string, buildSystem: () => string, opts?: { hidden?: boolean }): Promise<string> => {
    if (!text.trim() || isLoading) return '';
    if (!opts?.hidden) setMessages(prev => [...prev, mkMsg('user', text)]);
    setInput('');
    setIsLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;

    let assistantId: string | null = null;
    const push = (content: string) => {
      if (!content.trim()) return;
      if (!assistantId) {
        assistantId = `g-${Date.now()}-${++counter}`;
        setMessages(prev => [...prev, { id: assistantId!, role: 'assistant', content }]);
      } else {
        const id = assistantId;
        setMessages(prev => prev.map(m => (m.id === id ? { ...m, content } : m)));
      }
    };

    try {
      const full = await streamReply({
        provider, model,
        system: buildSystem(),
        history: messagesRef.current.slice(-MAX_HISTORY),
        userText: text,
        signal: controller.signal,
        onChunk: push,
      });
      if (!controller.signal.aborted && !full.trim()) {
        setMessages(prev => [...prev, mkMsg('assistant', '⚠️ **Empty response from the AI provider.** Check the API key and model in Settings.')]);
      }
      return full;
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return '';
      const msg = err instanceof Error ? err.message : String(err);
      if (/abort|cancel/i.test(msg)) return '';
      setMessages(prev => [...prev, mkMsg('assistant', friendlyAIError(err))]);
      return '';
    } finally {
      abortRef.current = null;
      setIsLoading(false);
    }
  }, [provider, model, isLoading]);

  return { messages, setMessages, input, setInput, isLoading, send, stop, reset };
}
