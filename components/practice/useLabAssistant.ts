'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChat, mkMsg } from '@/components/google/shared/useChat';
import type { QuickAction } from '@/components/google/shared/GoogleChatPanel';
import type { Message, AIProvider } from '@/lib/types';

/**
 * One assistant for the Practice Lab, same contract as the Interview Prep one:
 * the open tab registers which hat it wears, and each item (problem / design)
 * keeps its own thread so switching back restores the conversation.
 */
export interface LabConfig {
  /** Conversation identity — `dsa:<problem id>`, `design:<design id>` */
  scope: string;
  title: string;
  subtitle: string;
  greeting: string;
  buildSystem: () => string;
  quickActions?: QuickAction[];
  placeholder?: string;
}

export function useLabAssistant(provider: AIProvider, model: string, config: LabConfig) {
  const chat = useChat(provider, model, config.greeting);

  // Latest values for the stable callbacks below (written in an effect, read at event time).
  const cfgRef = useRef(config);
  const chatRef = useRef(chat);
  useEffect(() => { cfgRef.current = config; chatRef.current = chat; });

  // ── One thread per scope: park the current one, restore (or greet) the next ──
  const [threads, setThreads] = useState<Record<string, Message[]>>({});
  const [scope, setScope] = useState(config.scope);
  if (config.scope !== scope) {
    const parked = chat.messages;
    setThreads(t => ({ ...t, [scope]: parked }));
    setScope(config.scope);
    chat.setMessages(threads[config.scope] ?? [mkMsg('assistant', config.greeting)]);
  }
  useEffect(() => { chatRef.current.stop(); }, [scope]); // cut a reply still streaming for the previous item

  const [isOpen, setOpen] = useState(false);

  const send = useCallback(async (text: string) => chatRef.current.send(text, cfgRef.current.buildSystem), []);
  const stop = useCallback(() => chatRef.current.stop(), []);
  const clear = useCallback(() => {
    const cfg = cfgRef.current;
    setThreads(t => { const next = { ...t }; delete next[cfg.scope]; return next; });
    chatRef.current.reset(cfg.greeting);
  }, []);
  const toggle = useCallback(() => setOpen(o => !o), []);

  return useMemo(() => ({
    isOpen, setOpen, toggle,
    messages: chat.messages, input: chat.input, setInput: chat.setInput, isLoading: chat.isLoading,
    send, stop, clear,
  }), [isOpen, toggle, chat.messages, chat.input, chat.setInput, chat.isLoading, send, stop, clear]);
}
