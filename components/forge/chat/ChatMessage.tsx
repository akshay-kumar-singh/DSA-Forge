'use client';

import ReactMarkdown from 'react-markdown';
import { Bot, User } from 'lucide-react';
import { clsx } from 'clsx';
import dynamic from 'next/dynamic';
import type { Message } from '@/lib/types';

const MermaidDiagram = dynamic(() => import('../editor/MermaidDiagram'), { ssr: false });

// Parse mermaid blocks out of message content
function parseMermaid(content: string): Array<{ type: 'text' | 'mermaid'; value: string }> {
  const parts: Array<{ type: 'text' | 'mermaid'; value: string }> = [];
  const regex = /```mermaid\n([\s\S]*?)```/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > last) {
      parts.push({ type: 'text', value: content.slice(last, match.index) });
    }
    parts.push({ type: 'mermaid', value: match[1].trim() });
    last = match.index + match[0].length;
  }
  if (last < content.length) {
    parts.push({ type: 'text', value: content.slice(last) });
  }
  return parts;
}

interface ChatMessageProps {
  message: Message;
  isLatest: boolean;
}

export default function ChatMessage({ message, isLatest }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const parts = parseMermaid(message.content);

  return (
    <div className={clsx('flex gap-3 forge-in', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div className={clsx(
        'w-8 h-8 rounded-full flex items-center justify-center shrink-0 border',
        isUser
          ? 'bg-blue-500/20 border-blue-500/40'
          : 'bg-[#141428] border-blue-500/30',
        isLatest && !isUser && 'pulse-glow'
      )}>
        {isUser
          ? <User size={14} className="text-blue-400" />
          : <Bot size={14} className="text-blue-400" />
        }
      </div>

      {/* Bubble */}
      <div className={clsx(
        'flex-1 min-w-0 rounded-lg px-4 py-3 text-sm border',
        isUser
          ? 'bg-blue-500/10 border-blue-500/25 text-[#e2e8f0]'
          : 'bg-[#0f0f1a] border-blue-500/15 text-[#e2e8f0]'
      )}>
        {parts.map((part, i) =>
          part.type === 'mermaid' ? (
            <MermaidDiagram key={i} chart={part.value} />
          ) : (
            <div key={i} className="forge-prose">
              <ReactMarkdown>{part.value}</ReactMarkdown>
            </div>
          )
        )}
      </div>
    </div>
  );
}
