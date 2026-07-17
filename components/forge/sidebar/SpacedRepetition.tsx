'use client';

import { useState } from 'react';
import { Clock } from 'lucide-react';
import { clsx } from 'clsx';

interface SpacedRepetitionProps {
  lastReviewDate: Record<string, string>;
  masteredProblems: string[];
  onSelectProblem: (p: string) => void;
}

export default function SpacedRepetition({ lastReviewDate, masteredProblems, onSelectProblem }: SpacedRepetitionProps) {
  // Snapshot "now" once per mount — keeps render pure, day counts don't need live ticking
  const [now] = useState(() => Date.now());

  // Only mastered problems are candidates for review, oldest review first
  const entries = Object.entries(lastReviewDate)
    .filter(([prob]) => masteredProblems.includes(prob))
    .sort(([, a], [, b]) => new Date(a).getTime() - new Date(b).getTime())
    .slice(0, 4);

  if (entries.length === 0) return null;

  return (
    <div className="p-3 forge-card space-y-2 mx-2 mt-2 shrink-0">
      <div className="flex items-center gap-1.5">
        <Clock size={11} className="text-blue-400 shrink-0" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
          Due for Review
        </span>
      </div>
      <div className="space-y-1">
        {entries.map(([prob, date]) => {
          const days = Math.floor((now - new Date(date).getTime()) / 86400000);
          const overdue = days > 3;
          return (
            <button
              key={prob}
              onClick={() => onSelectProblem(prob)}
              className="w-full min-w-0 flex items-center justify-between px-2 py-1.5 rounded bg-bg-base hover:bg-blue-500/8 border border-transparent hover:border-blue-500/20 transition-all text-left"
            >
              <span className="text-[10px] font-medium text-text-secondary truncate">{prob}</span>
              <span className={clsx(
                'text-[9px] font-black px-1.5 py-0.5 rounded shrink-0 ml-2',
                overdue ? 'bg-red-500/15 text-red-400' : 'bg-green-500/15 text-green-400'
              )}>
                {days}d
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
