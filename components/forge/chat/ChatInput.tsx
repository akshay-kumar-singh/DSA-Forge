'use client';

import { Send, Square, MessageSquare, RotateCcw } from 'lucide-react';

interface ChatInputProps {
  value: string;
  isLoading: boolean;
  onValueChange: (v: string) => void;
  onSend: () => void;
  onStop: () => void;
  onQuickAction: (msg: string) => void;
  onClearChat: () => void;
}

const QUICK_ACTIONS = [
  { label: 'Review Code', icon: MessageSquare, msg: 'Analyze my current code. Check what is correct, what is wrong, and where I am making mistakes. Provide the correct direction and next steps/approach. Keep it short, focused, and conceptual without giving away the full solution.' },
];

export default function ChatInput({
  value,
  isLoading,
  onValueChange,
  onSend,
  onStop,
  onQuickAction,
  onClearChat,
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isLoading) {
        onStop();
      } else {
        onSend();
      }
    }
  };

  return (
    <div className="border-t border-border-subtle p-4 space-y-3 bg-bg-surface shrink-0">
      {/* Input row */}
      <div className="flex gap-2">
        <textarea
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask FORGE AI..."
          rows={2}
          className="flex-1 bg-bg-base border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted resize-none outline-none focus:border-blue-500/50 transition-colors font-sans leading-relaxed"
        />

        {/* Send / Stop button */}
        {isLoading ? (
          <button
            onClick={onStop}
            className="forge-btn w-10 px-0 flex items-center justify-center self-stretch rounded-lg border-red-500/40 text-red-400 hover:border-red-500 hover:bg-red-500/10 hover:shadow-[0_0_8px_rgba(239,68,68,0.2)]"
            title="Stop generating (Enter)"
          >
            <Square size={14} className="fill-current" />
          </button>
        ) : (
          <button
            onClick={onSend}
            disabled={!value.trim()}
            className="forge-btn forge-btn-primary w-10 px-0 flex items-center justify-center self-stretch rounded-lg"
            title="Send (Enter)"
          >
            <Send size={14} />
          </button>
        )}
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
          className="forge-btn h-8 text-[10px] gap-1.5 text-text-muted hover:text-text-secondary ml-auto"
          title="Clear chat history"
        >
          <RotateCcw size={11} />
        </button>
      </div>
    </div>
  );
}
