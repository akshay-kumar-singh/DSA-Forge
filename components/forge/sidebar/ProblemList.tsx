'use client';

import React, { useEffect, useRef } from 'react';
import { BookOpen, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { DSA_PATTERNS, PROBLEM_INFO } from '@/lib/problems';

interface ProblemListProps {
  selectedProblem: string;
  masteredProblems: string[];
  onSelectProblem: (p: string) => void;
  onToggleMastered: (p: string) => void;
}

const DIFF_CONFIG = {
  easy:   { label: 'E', color: 'text-green-400',  bg: 'bg-green-400/10' },
  medium: { label: 'M', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  hard:   { label: 'H', color: 'text-red-400',    bg: 'bg-red-400/10' },
};

const ProblemList = React.memo(function ProblemList({
  selectedProblem,
  masteredProblems,
  onSelectProblem,
  onToggleMastered
}: ProblemListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll the list to the selected problem (on load and on selection)
  useEffect(() => {
    const item = selectedItemRef.current;
    const container = listRef.current;
    if (!item || !container) return;

    const itemRect = item.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const fullyVisible =
      itemRect.top >= containerRect.top && itemRect.bottom <= containerRect.bottom;

    if (!fullyVisible) {
      item.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [selectedProblem]);

  return (
    <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 pb-4 space-y-3 pt-2">
      {DSA_PATTERNS.map((pattern, i) => (
        <div key={i} className="space-y-0.5">
          {/* Category header */}
          <div className="flex items-center gap-1.5 px-1 py-1.5">
            <div className="w-1 h-3 bg-blue-500 rounded-full shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400/80">
              {pattern.category}
            </span>
          </div>

          {/* Problems */}
          {pattern.problems.map((prob, j) => {
            const isSelected = selectedProblem === prob;
            const isMastered = masteredProblems.includes(prob);
            const isTraining = prob.startsWith('Training:');
            const info = PROBLEM_INFO[prob];
            const diff = info?.difficulty ? DIFF_CONFIG[info.difficulty] : null;
            const prereqs = info?.prerequisites;

            return (
              <div
                key={j}
                ref={(node) => { if (isSelected) selectedItemRef.current = node; }}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {/* Completion Checkbox */}
                  {!isTraining ? (
                    <input
                      type="checkbox"
                      checked={isMastered}
                      onChange={() => onToggleMastered(prob)}
                      className="w-3.5 h-3.5 shrink-0 rounded bg-bg-base border-border-default text-blue-500 focus:ring-0 focus:ring-offset-0 cursor-pointer transition-all hover:border-blue-500/60 ml-1.5"
                      title={isMastered ? "Mark as Incomplete" : "Mark as Completed"}
                    />
                  ) : (
                    <div className="w-3.5 h-3.5 shrink-0 ml-1.5" />
                  )}

                  <button
                    onClick={() => onSelectProblem(prob)}
                    className={clsx(
                      'flex-1 min-w-0 flex items-center gap-2 px-3 py-2.5 rounded text-left transition-all duration-150 group',
                      isSelected
                        ? 'bg-blue-500/12 border border-blue-500/40 glow-blue'
                        : 'border border-transparent hover:bg-blue-500/6 hover:border-blue-500/15'
                    )}
                  >
                    {/* Icon (training modules only) */}
                    {isTraining && (
                      <BookOpen size={14} className="shrink-0 text-blue-400/60" />
                    )}

                    {/* Label */}
                    <span className={clsx(
                      'flex-1 min-w-0 text-xs font-bold truncate tracking-wide',
                      isSelected ? 'text-blue-300' : 'text-text-secondary group-hover:text-text-primary'
                    )}>
                      {isTraining ? prob.replace('Training: ', '') : prob}
                    </span>

                    {/* Difficulty badge */}
                    {diff && !isTraining && (
                      <span className={clsx('text-[9px] font-black px-1.5 py-0.5 rounded shrink-0', diff.color, diff.bg)}>
                        {diff.label}
                      </span>
                    )}
                  </button>
                </div>

                {/* Prerequisites (shown below the row when selected) */}
                {isSelected && prereqs && prereqs.length > 0 && (
                  <div className="ml-7 mt-0.5 mb-1 space-y-0.5">
                    <div className="flex items-center gap-1 px-2 py-0.5">
                      <ChevronRight size={9} className="text-text-muted shrink-0" />
                      <span className="text-[8px] font-bold uppercase text-text-muted">Prerequisites</span>
                    </div>
                    {prereqs.map((pre, k) => (
                      <button
                        key={k}
                        onClick={() => onSelectProblem(pre)}
                        className="w-full text-left px-3 py-0.5 text-[10px] text-blue-400/70 hover:text-blue-400 hover:underline transition-colors truncate"
                      >
                        • {pre}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
});

export default ProblemList;
