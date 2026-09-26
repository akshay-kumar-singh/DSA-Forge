'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChat, mkMsg } from './useChat';
import type { QuickAction } from './GoogleChatPanel';
import type { Message, AIProvider } from '@/lib/types';
import type { GoogleTab } from '@/lib/google/types';

/**
 * ONE assistant for the whole Prep track. It lives in the shell, and each tab
 * tells it which hat to wear: Guide (Today / Plan / Notes), Coach (DSA — sees
 * the code), Interviewer (design, behavioural, and every mock round).
 * Conversations are kept per scope, so switching tabs or problems brings the
 * right thread back instead of wiping it.
 */
export interface AssistantConfig {
  /** Conversation identity — `dsa:Two Sum`, `design:url-shortener`, `mock:…`, `guide` */
  scope: string;
  title: string;
  subtitle: string;
  greeting: string;
  buildSystem: () => string;
  quickActions?: QuickAction[];
  placeholder?: string;
  /** Mock rounds read the graded reply themselves */
  onReply?: (full: string) => void;
  /** Mocks cannot be cleared mid-round */
  clearable?: boolean;
}

/** What a tab gets: register its persona, talk, open the panel. Stable — safe in effect deps. */
export interface AssistantHandle {
  register: (cfg: AssistantConfig | null) => void;
  send: (text: string, opts?: { hidden?: boolean }) => Promise<string>;
  stop: () => void;
  open: () => void;
  toggle: () => void;
}

const ALL_TABS: GoogleTab[] = ['today', 'dsa', 'design', 'behavioural', 'mocks', 'comprehension', 'plan', 'notes'];

export function useAssistant(provider: AIProvider, model: string, activeTab: GoogleTab, guide: AssistantConfig) {
  const [configs, setConfigs] = useState<Partial<Record<GoogleTab, AssistantConfig>>>({});
  const active: AssistantConfig = configs[activeTab] ?? guide;

  const chat = useChat(provider, model, active.greeting);

  // Latest values for the stable callbacks below (written in an effect, read at event time).
  const activeRef = useRef(guide);
  const chatRef = useRef(chat);
  useEffect(() => { activeRef.current = active; chatRef.current = chat; });

  // ── One thread per scope: park the current one, restore (or greet) the next ──
  const [threads, setThreads] = useState<Record<string, Message[]>>({});
  const [scope, setScope] = useState(active.scope);
  if (active.scope !== scope) {
    const parked = chat.messages;
    setThreads(t => ({ ...t, [scope]: parked }));
    setScope(active.scope);
    chat.setMessages(threads[active.scope] ?? [mkMsg('assistant', active.greeting)]);
  }
  useEffect(() => { chatRef.current.stop(); }, [scope]); // a reply still streaming for the previous scope is cut

  // ── Open / closed — starts closed; a mock round opens it ──
  const [isOpen, setOpen] = useState(false);

  // Stable callbacks — tabs keep these in effect deps without re-registering every render.
  const send = useCallback(async (text: string, opts?: { hidden?: boolean }) => {
    const cfg = activeRef.current;
    const full = await chatRef.current.send(text, cfg.buildSystem, opts);
    if (full) cfg.onReply?.(full);
    return full;
  }, []);
  const stop = useCallback(() => chatRef.current.stop(), []);
  const clear = useCallback(() => {
    const cfg = activeRef.current;
    setThreads(t => { const next = { ...t }; delete next[cfg.scope]; return next; });
    chatRef.current.reset(cfg.greeting);
  }, []);

  /** Handles bound to each tab — what the tab pages receive. */
  const handles = useMemo(() => Object.fromEntries(ALL_TABS.map(tab => [tab, {
    register: (cfg: AssistantConfig | null) => setConfigs(prev => {
      if (cfg) return { ...prev, [tab]: cfg };
      if (!(tab in prev)) return prev;
      const next = { ...prev }; delete next[tab]; return next;
    }),
    send,
    stop,
    open: () => setOpen(true),
    toggle: () => setOpen(o => !o),
  } satisfies AssistantHandle])) as Record<GoogleTab, AssistantHandle>, [send, stop]);

  return {
    active,
    isOpen, setOpen,
    messages: chat.messages, input: chat.input, setInput: chat.setInput, isLoading: chat.isLoading,
    send, stop, clear,
    handles,
  };
}
