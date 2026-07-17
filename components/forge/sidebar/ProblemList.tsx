'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, ChevronRight, ChevronDown } from 'lucide-react';
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

function categoryOf(problem: string): string | undefined {
  return DSA_PATTERNS.find(p => p.problems.includes(problem))?.category;
}

const ProblemList = React.memo(function ProblemList({
  selectedProblem,
  masteredProblems,
  onSelectProblem,
  onToggleMastered
}: ProblemListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLDivElement | null>(null);

  // Accordion state — only the section of the current problem starts open
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const cat = categoryOf(selectedProblem);
    return cat ? { [cat]: true } : {};
  });

  const toggleSection = (category: string) => {
    setOpenSections(prev => ({ ...prev, [category]: !prev[category] }));
  };

  // Selecting a problem (sidebar, prerequisites, due-for-revision card,
  // restored session) always opens its section. State is adjusted during
  // render so the row is in the DOM before the scroll effect runs.
  const [prevSelected, setPrevSelected] = useState(selectedProblem);
  if (prevSelected !== selectedProblem) {
    setPrevSelected(selectedProblem);
    const cat = categoryOf(selectedProblem);
    if (cat && !openSections[cat]) {
      setOpenSections({ ...openSections, [cat]: true });
    }
  }

  // Auto-scroll the list to the selected problem (runs again once its
  // section has opened, since the row only exists in the DOM when open)
  useEffect(() => {
    const item = selectedItemRef.current;
    const container = listRef.current;
    if (!item || !container || !item.isConnected) return;

    const itemRect = item.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const fullyVisible =
      itemRect.top >= containerRect.top && itemRect.bottom <= containerRect.bottom;

    if (!fullyVisible) {
      item.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [selectedProblem, openSections]);

  return (
    <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 pb-4 space-y-1 pt-2">
      {DSA_PATTERNS.map((pattern) => {
        const isOpen = !!openSections[pattern.category];
        const realProblems = pattern.problems.filter(p => !p.startsWith('Training:'));
        const masteredInSection = realProblems.filter(p => masteredProblems.includes(p)).length;

        return (
          <div key={pattern.category}>
            {/* Category header — click to expand/collapse */}
            <button
              onClick={() => toggleSection(pattern.category)}
              className="w-full flex items-center gap-1.5 px-1 py-2 rounded hover:bg-blue-500/5 transition-colors group"
              title={isOpen ? 'Collapse section' : 'Expand section'}
            >
              <div className="w-1 h-3 bg-blue-500 rounded-full shrink-0" />
              <span className="flex-1 min-w-0 text-left text-[10px] font-black uppercase tracking-widest text-blue-400/80 group-hover:text-blue-400 truncate">
                {pattern.category}
              </span>
              {realProblems.length > 0 && (
                <span className={clsx(
                  'text-[9px] font-bold shrink-0',
                  masteredInSection === realProblems.length ? 'text-green-400' : 'text-text-muted'
                )}>
                  {masteredInSection}/{realProblems.length}
                </span>
              )}
              {isOpen
                ? <ChevronDown size={12} className="text-text-muted shrink-0" />
                : <ChevronRight size={12} className="text-text-muted shrink-0" />
              }
            </button>

            {/* Problems */}
            {isOpen && (
              <div className="space-y-0.5 pb-2">
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
            )}
          </div>
        );
      })}
    </div>
  );
});

export default ProblemList;
