'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, ChevronRight, Loader2 } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import type { Message } from '@/lib/types';
import { PROBLEM_INFO } from '@/lib/problems';

interface ChatPanelProps {
  selectedProblem: string;
  messages: Message[];
  input: string;
  isLoading: boolean;
  masteredProblems: string[];
  onInputChange: (v: string) => void;
  onSend: (override?: string) => void;
  onMarkMastered: () => void;
  onClearChat: () => void;
  onSelectProblem: (p: string) => void;
}

export default function ChatPanel({
  selectedProblem,
  messages,
  input,
  isLoading,
  masteredProblems,
  onInputChange,
  onSend,
  onMarkMastered,
  onClearChat,
  onSelectProblem,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMastered = masteredProblems.includes(selectedProblem);
  const prereqs = PROBLEM_INFO[selectedProblem]?.prerequisites;
  const isTraining = selectedProblem.startsWith('Training:');

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleQuickAction = (msg: string) => {
    onSend(msg);
  };

  return (
    <div className="flex flex-col h-full forge-panel border-l border-blue-500/10">
      {/* Header */}
      <div className="px-4 py-3 border-b border-blue-500/10 shrink-0 space-y-2 bg-[#0f0f1a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-blue-400" />
            <div>
              <div className="text-sm font-black uppercase tracking-widest text-[#e2e8f0]">
                Forge AI
              </div>
              <div className="text-[9px] text-blue-400/60 uppercase tracking-wider">
                {isTraining ? 'Training Module Active' : 'Forge Mode • No Solutions'}
              </div>
            </div>
          </div>
          {isMastered && (
            <span className="text-[9px] font-black px-2 py-1 rounded bg-blue-500/15 border border-blue-500/30 text-blue-400 uppercase tracking-wider">
              ⚡ Mastered
            </span>
          )}
        </div>

        {/* Prerequisites */}
        {prereqs && prereqs.length > 0 && (
          <div className="p-2 rounded bg-[#0a0a0f] border border-blue-500/15 space-y-1">
            <div className="flex items-center gap-1 text-[9px] font-bold uppercase text-[#475569]">
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

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChatMessage
                message={msg}
                isLatest={idx === messages.length - 1}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3 items-center forge-in">
            <div className="w-8 h-8 rounded-full bg-[#141428] border border-blue-500/30 flex items-center justify-center">
              <Loader2 size={12} className="text-blue-400 animate-spin" />
            </div>
            <div className="px-4 py-2 rounded-lg bg-[#0f0f1a] border border-blue-500/15">
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
        isMastered={isMastered}
        onValueChange={onInputChange}
        onSend={() => onSend()}
        onQuickAction={handleQuickAction}
        onMarkMastered={onMarkMastered}
        onClearChat={onClearChat}
      />
    </div>
  );
}
