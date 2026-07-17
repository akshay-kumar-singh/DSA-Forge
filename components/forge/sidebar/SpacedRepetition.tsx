'use client';

import { useState } from 'react';
import { Clock, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { getDueProblems } from '@/lib/revision';

interface SpacedRepetitionProps {
  lastReviewDate: Record<string, string>;
  reviewCount: Record<string, number>;
  masteredProblems: string[];
  onSelectProblem: (p: string) => void;
  onMarkRevised: (p: string) => void;
}

export default function SpacedRepetition({
  lastReviewDate,
  reviewCount,
  masteredProblems,
  onSelectProblem,
  onMarkRevised,
}: SpacedRepetitionProps) {
  // Snapshot "now" once per mount — keeps render pure; due-ness doesn't need live ticking
  const [now] = useState(() => Date.now());
  const [open, setOpen] = useState(false);

  const due = getDueProblems(lastReviewDate, reviewCount, masteredProblems, now);

  // Nothing due → no card at all. Seeing this card means there's real work.
  if (due.length === 0) return null;

  return (
    <div className="forge-card mx-2 mt-2 shrink-0 overflow-hidden">
      {/* Header — click to expand/collapse */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-blue-500/5 transition-colors"
        title={open ? 'Collapse' : 'Expand'}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Clock size={11} className="text-red-400 shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary truncate">
            Due for Revision
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400">
            {due.length}
          </span>
          {open
            ? <ChevronDown size={12} className="text-text-muted" />
            : <ChevronRight size={12} className="text-text-muted" />
          }
        </div>
      </button>

      {/* Due problems */}
      {open && (
        <div className="px-2 pb-2 space-y-1 max-h-48 overflow-y-auto">
          {due.map(({ problem, daysSince }) => (
            <div key={problem} className="flex items-center gap-1 min-w-0">
              <button
                onClick={() => onSelectProblem(problem)}
                className="flex-1 min-w-0 flex items-center justify-between px-2 py-1.5 rounded bg-bg-base hover:bg-blue-500/8 border border-transparent hover:border-blue-500/20 transition-all text-left"
                title={`Open ${problem}`}
              >
                <span className="text-[10px] font-medium text-text-secondary truncate">{problem}</span>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded shrink-0 ml-2 bg-red-500/15 text-red-400">
                  {daysSince}d
                </span>
              </button>
              <button
                onClick={() => onMarkRevised(problem)}
                className="w-6 h-6 shrink-0 flex items-center justify-center rounded border border-transparent text-text-muted hover:text-green-400 hover:border-green-500/40 hover:bg-green-500/10 transition-all"
                title="Mark revised — schedules the next review"
              >
                <Check size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
