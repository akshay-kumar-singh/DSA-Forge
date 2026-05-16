'use client';

import { Zap, BookOpen, ChevronRight } from 'lucide-react';
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

export default function ProblemList({ 
  selectedProblem, 
  masteredProblems, 
  onSelectProblem,
  onToggleMastered 
}: ProblemListProps) {
  return (
    <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-3 pt-2">
      {DSA_PATTERNS.map((pattern, i) => (
        <div key={i} className="space-y-0.5">
          {/* Category header */}
          <div className="flex items-center gap-1.5 px-1 py-1.5">
            <div className="w-1 h-3 bg-blue-500 rounded-full" />
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
              <div key={j} className="flex items-center gap-1.5">
                {/* Completion Checkbox */}
                {!isTraining && (
                  <input
                    type="checkbox"
                    checked={isMastered}
                    onChange={() => onToggleMastered(prob)}
                    className="w-3.5 h-3.5 rounded bg-[#0a0a0f] border-blue-500/30 text-blue-500 focus:ring-0 focus:ring-offset-0 cursor-pointer transition-all hover:border-blue-500/60 ml-1.5"
                    title={isMastered ? "Mark as Incomplete" : "Mark as Completed"}
                  />
                )}
                {isTraining && <div className="w-3.5 h-3.5 ml-1.5" />}

                <button
                  onClick={() => onSelectProblem(prob)}
                  className={clsx(
                    'flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded text-left transition-all duration-150 group',
                    isSelected
                      ? 'bg-blue-500/12 border border-blue-500/40 glow-blue'
                      : 'border border-transparent hover:bg-blue-500/6 hover:border-blue-500/15'
                  )}
                >
                  {/* Icon */}
                  <span className="shrink-0 text-[14px]">
                    {isTraining && (
                      <BookOpen size={14} className="text-blue-400/60" />
                    )}
                  </span>

                  {/* Label */}
                  <span className={clsx(
                    'flex-1 text-xs font-bold truncate tracking-wide',
                    isSelected ? 'text-blue-300' : 'text-[#94a3b8] group-hover:text-[#cbd5e1]'
                  )}>
                    {isTraining ? prob.replace('Training: ', '') : prob}
                  </span>

                  {/* Right side badges */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {diff && !isTraining && (
                      <span className={clsx('text-[9px] font-black px-1.5 py-0.5 rounded', diff.color, diff.bg)}>
                        {diff.label}
                      </span>
                    )}
                  </div>
                </button>

                {/* Prerequisites (shown when selected) */}
                {isSelected && prereqs && prereqs.length > 0 && (
                  <div className="ml-4 mt-0.5 space-y-0.5">
                    <div className="flex items-center gap-1 px-2 py-0.5">
                      <ChevronRight size={9} className="text-[#475569]" />
                      <span className="text-[8px] font-bold uppercase text-[#475569]">Prerequisites</span>
                    </div>
                    {prereqs.map((pre, k) => (
                      <button
                        key={k}
                        onClick={(e) => { e.stopPropagation(); onSelectProblem(pre); }}
                        className="w-full text-left px-3 py-0.5 text-[10px] text-blue-400/70 hover:text-blue-400 hover:underline transition-colors"
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
}
