'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, X, Send, Square, Trash2 } from 'lucide-react';
import ChatMessage from '@/components/forge/chat/ChatMessage';
import type { Message } from '@/lib/types';

export interface QuickAction { label: string; msg: string; icon?: React.ComponentType<{ size?: number; className?: string }> }

interface Props {
  theme: 'dark' | 'light';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  messages: Message[];
  input: string;
  isLoading: boolean;
  quickActions?: QuickAction[];
  placeholder?: string;
  onInputChange: (v: string) => void;
  onSend: (text?: string) => void;
  onStop: () => void;
  onClear?: () => void;
  onClose?: () => void;
  headerExtra?: React.ReactNode;
}

const GoogleChatPanel = React.memo(function GoogleChatPanel({
  theme, title, subtitle, icon, messages, input, isLoading, quickActions = [], placeholder,
  onInputChange, onSend, onStop, onClear, onClose, headerExtra,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const last = messages[messages.length - 1];
  const showTyping = isLoading && last?.role !== 'assistant';

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 160) el.scrollTop = el.scrollHeight;
  }, [messages, isLoading]);

  const submit = () => { if (input.trim() && !isLoading) onSend(); };

  return (
    <div className="flex flex-col h-full w-full min-w-0 gp-side border-l">
      <div className="gp-side-head shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center gp-blue" style={{ background: 'var(--gp-blue-wash)' }}>{icon}</span>
          <div className="min-w-0">
            <div className="text-[14px] font-bold gp-t1 truncate">{title}</div>
            <div className="text-[11px] gp-t3 truncate">{subtitle}</div>
          </div>
        </div>
        {onClose && <button onClick={onClose} className="gp-btn gp-btn-ghost gp-btn-sm gp-btn-icon gp-t3" title="Close panel"><X size={14} /></button>}
      </div>
      {headerExtra}

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map(m => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <ChatMessage theme={theme} message={m} isLatest={m.id === last?.id} />
            </motion.div>
          ))}
        </AnimatePresence>
        {showTyping && (
          <div className="flex gap-3 items-center">
            <div className="w-8 h-8 rounded-full gp-inset flex items-center justify-center"><Loader2 size={12} className="gp-blue animate-spin" /></div>
            <div className="px-3 py-1.5 rounded-lg gp-inset text-[11px] gp-t3">thinking…</div>
          </div>
        )}
      </div>

      <div className="border-t gp-border p-3 space-y-2 shrink-0">
        {(quickActions.length > 0 || onClear) && (
          <div className="flex flex-wrap gap-1.5">
            {quickActions.map(q => (
              <button key={q.label} onClick={() => onSend(q.msg)} disabled={isLoading} className="gp-btn gp-btn-sm">
                {q.icon && <q.icon size={12} />}{q.label}
              </button>
            ))}
            {onClear && <button onClick={onClear} disabled={isLoading} className="gp-btn gp-btn-ghost gp-btn-sm ml-auto gp-t3" title="Clear chat"><Trash2 size={12} />Clear</button>}
          </div>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={e => onInputChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
            placeholder={placeholder ?? 'Talk to the interviewer… (Enter to send, Shift+Enter for a new line)'}
            rows={2}
            className="gp-input gp-textarea flex-1 min-w-0 !resize-none"
          />
          {isLoading
            ? <button onClick={onStop} className="gp-btn gp-btn-danger gp-btn-icon" title="Stop"><Square size={14} /></button>
            : <button onClick={submit} disabled={!input.trim()} className="gp-btn gp-btn-primary gp-btn-icon" title="Send"><Send size={14} /></button>}
        </div>
      </div>
    </div>
  );
});

export default GoogleChatPanel;
