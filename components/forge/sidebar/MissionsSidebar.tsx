'use client';

import { Target, Home } from 'lucide-react';
import ForgeStats from './ForgeStats';
import SpacedRepetition from './SpacedRepetition';
import ProblemList from './ProblemList';
import { DSA_PATTERNS } from '@/lib/problems';

interface MissionsSidebarProps {
  selectedProblem: string;
  masteredProblems: string[];
  lastReviewDate: Record<string, string>;
  codeMap: Record<string, string>;
  onSelectProblem: (p: string) => void;
  onGoHome: () => void;
}

const TOTAL_PROBLEMS = DSA_PATTERNS.reduce((acc, p) => acc + p.problems.length, 0);

export default function MissionsSidebar({
  selectedProblem,
  masteredProblems,
  lastReviewDate,
  codeMap,
  onSelectProblem,
  onGoHome,
}: MissionsSidebarProps) {
  const attemptedCount = Object.keys(codeMap).length;

  return (
    <div className="h-full flex flex-col forge-panel border-r border-blue-500/10">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-blue-500/10 shrink-0">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-blue-400" />
          <span className="text-sm font-black uppercase tracking-widest text-[#e2e8f0]">Missions</span>
        </div>
        <button
          onClick={onGoHome}
          className="forge-btn h-7 px-2 text-[9px]"
          title="Back to Home"
        >
          <Home size={12} />
          <span className="hidden xl:inline">Home</span>
        </button>
      </div>

      {/* Stats */}
      <ForgeStats
        masteredCount={masteredProblems.length}
        totalProblems={TOTAL_PROBLEMS}
        attemptedCount={attemptedCount}
      />

      {/* Spaced Repetition */}
      <SpacedRepetition
        lastReviewDate={lastReviewDate}
        onSelectProblem={onSelectProblem}
      />

      {/* Problem List */}
      <ProblemList
        selectedProblem={selectedProblem}
        masteredProblems={masteredProblems}
        onSelectProblem={onSelectProblem}
      />
    </div>
  );
}
