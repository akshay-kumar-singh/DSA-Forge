'use client';

import { Send, MessageSquare, Zap, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';

interface ChatInputProps {
  value: string;
  isLoading: boolean;
  onValueChange: (v: string) => void;
  onSend: () => void;
  onQuickAction: (msg: string) => void;
  onClearChat: () => void;
}

const QUICK_ACTIONS = [
  { label: 'Review Code', icon: MessageSquare, msg: 'Review my current code and tell me what I am doing right and what to improve.' },
];

export default function ChatInput({
  value,
  isLoading,
  onValueChange,
  onSend,
  onQuickAction,
  onClearChat,
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="border-t border-blue-500/10 p-4 space-y-3 bg-[#0f0f1a] shrink-0">
      {/* Input row */}
      <div className="flex gap-2">
        <textarea
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask FORGE AI..."
          rows={2}
          className="flex-1 bg-[#0a0a0f] border border-blue-500/20 rounded px-3 py-2 text-sm text-[#e2e8f0] placeholder:text-[#334155] resize-none outline-none focus:border-blue-500/50 transition-colors font-sans leading-relaxed"
        />
        <button
          onClick={onSend}
          disabled={isLoading || !value.trim()}
          className="forge-btn forge-btn-primary w-10 px-0 flex items-center justify-center self-stretch rounded"
          title="Send (Enter)"
        >
          <Send size={14} />
        </button>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map(({ label, icon: Icon, msg }) => (
          <button
            key={label}
            onClick={() => onQuickAction(msg)}
            disabled={isLoading}
            className="forge-btn h-8 text-[10px] gap-1.5"
          >
            <Icon size={11} />
            {label}
          </button>
        ))}

        <button
          onClick={onClearChat}
          className="forge-btn h-8 text-[10px] gap-1.5 text-[#475569] hover:text-[#94a3b8] ml-auto"
          title="Clear chat history"
        >
          <RotateCcw size={11} />
        </button>
      </div>
    </div>
  );
}
