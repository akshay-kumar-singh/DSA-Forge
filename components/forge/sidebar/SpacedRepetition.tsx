'use client';

import { Clock } from 'lucide-react';
import { clsx } from 'clsx';

interface SpacedRepetitionProps {
  lastReviewDate: Record<string, string>;
  onSelectProblem: (p: string) => void;
}

export default function SpacedRepetition({ lastReviewDate, onSelectProblem }: SpacedRepetitionProps) {
  if (Object.keys(lastReviewDate).length === 0) return null;

  const entries = Object.entries(lastReviewDate)
    .sort(([, a], [, b]) => new Date(a).getTime() - new Date(b).getTime())
    .slice(0, 4);

  return (
    <div className="p-3 forge-card space-y-2 mx-2 mt-2">
      <div className="flex items-center gap-1.5">
        <Clock size={11} className="text-blue-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">
          Due for Review
        </span>
      </div>
      <div className="space-y-1">
        {entries.map(([prob, date]) => {
          const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
          const overdue = days > 3;
          return (
            <button
              key={prob}
              onClick={() => onSelectProblem(prob)}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded bg-[#0a0a0f] hover:bg-blue-500/8 border border-transparent hover:border-blue-500/20 transition-all text-left"
            >
              <span className="text-[10px] font-medium text-[#94a3b8] truncate">{prob}</span>
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
