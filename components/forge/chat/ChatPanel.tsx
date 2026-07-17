'use client';

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, ChevronRight, Loader2, X } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import type { Message } from '@/lib/types';
import { PROBLEM_INFO } from '@/lib/problems';

interface ChatPanelProps {
  theme: 'dark' | 'light';
  selectedProblem: string;
  messages: Message[];
  input: string;
  isLoading: boolean;
  onInputChange: (v: string) => void;
  onSend: (override?: string) => void;
  onStop: () => void;
  onClearChat: () => void;
  onSelectProblem: (p: string) => void;
  onClose: () => void;
}

const ChatPanel = React.memo(function ChatPanel({
  theme,
  selectedProblem,
  messages,
  input,
  isLoading,
  onInputChange,
  onSend,
  onStop,
  onClearChat,
  onSelectProblem,
  onClose,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prereqs = PROBLEM_INFO[selectedProblem]?.prerequisites;
  const isTraining = selectedProblem.startsWith('Training:');

  const lastMessage = messages[messages.length - 1];
  // While waiting for the first streamed token, show the typing indicator;
  // once assistant text starts arriving, the growing bubble replaces it.
  const showTypingIndicator = isLoading && lastMessage?.role !== 'assistant';

  // Auto-scroll — but only when the user is already near the bottom,
  // so reading older messages during streaming isn't hijacked.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 160;
    if (nearBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleQuickAction = (msg: string) => {
    onSend(msg);
  };

  return (
    <div className="flex flex-col h-full w-full min-w-0 forge-panel border-l border-border-subtle bg-bg-surface">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border-subtle shrink-0 space-y-2 bg-bg-surface">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Shield size={18} className="text-blue-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-black uppercase tracking-widest text-text-primary truncate">
                Forge AI
              </div>
              <div className="text-[9px] text-blue-400/60 uppercase tracking-wider truncate">
                {isTraining ? 'Training Module Active' : 'Forge Mode • No Solutions'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 shrink-0 flex items-center justify-center rounded hover:bg-bg-card text-text-muted hover:text-text-secondary transition-colors"
            title="Close Panel"
          >
            <X size={14} />
          </button>
        </div>

        {/* Prerequisites */}
        {prereqs && prereqs.length > 0 && (
          <div className="p-2 rounded bg-bg-base border border-border-subtle space-y-1">
            <div className="flex items-center gap-1 text-[9px] font-bold uppercase text-text-muted">
              <ChevronRight size={9} />
              Prerequisites
            </div>
            <div className="flex flex-wrap gap-1">
              {prereqs.map((pre, i) => (
                <button
                  key={i}
                  onClick={() => onSelectProblem(pre)}
                  className="text-[10px] text-blue-400/70 hover:text-blue-400 px-1.5 py-0.5 rounded bg-blue-500/8 hover:bg-blue-500/15 border border-blue-500/15 transition-all"
                >
                  {pre}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Messages — uses message.id for stable keys */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChatMessage
                theme={theme}
                message={msg}
                isLatest={msg.id === lastMessage?.id}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator (before first streamed token) */}
        {showTypingIndicator && (
          <div className="flex gap-3 items-center forge-in">
            <div className="w-8 h-8 rounded-full bg-bg-elevated border border-border-default flex items-center justify-center">
              <Loader2 size={12} className="text-blue-400 animate-spin" />
            </div>
            <div className="px-4 py-2 rounded-lg bg-bg-surface border border-border-subtle">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-blue-400 dot-blink"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-mono text-blue-400/70 uppercase tracking-wider">
                  FORGE AI Processing
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput
        value={input}
        isLoading={isLoading}
        onValueChange={onInputChange}
        onSend={() => onSend()}
        onStop={onStop}
        onQuickAction={handleQuickAction}
        onClearChat={onClearChat}
      />
    </div>
  );
});

export default ChatPanel;
