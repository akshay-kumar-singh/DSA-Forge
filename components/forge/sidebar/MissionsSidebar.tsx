import React from 'react';
import { Target, X } from 'lucide-react';
import ForgeStats from './ForgeStats';
import ProblemList from './ProblemList';
import SpacedRepetition from './SpacedRepetition';
import { DSA_PATTERNS } from '@/lib/problems';

interface MissionsSidebarProps {
  selectedProblem: string;
  masteredProblems: string[];
  lastReviewDate: Record<string, string>;
  onSelectProblem: (p: string) => void;
  onGoHome: () => void;
  onToggleMastered: (p: string) => void;
  onClose: () => void;
}

const TOTAL_PROBLEMS = DSA_PATTERNS.reduce((acc, p) => acc + p.problems.length, 0);

const MissionsSidebar = React.memo(function MissionsSidebar({
  selectedProblem,
  masteredProblems,
  lastReviewDate,
  onSelectProblem,
  onGoHome,
  onToggleMastered,
  onClose,
}: MissionsSidebarProps) {
  return (
    <div className="h-full w-full min-w-0 flex flex-col overflow-hidden forge-panel border-r border-border-subtle bg-bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border-subtle shrink-0">
        <button
          onClick={onGoHome}
          className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity"
          title="Back to Home"
        >
          <Target size={16} className="text-blue-400 shrink-0" />
          <span className="text-sm font-black uppercase tracking-widest text-text-primary truncate">Missions</span>
        </button>
        <button
          onClick={onClose}
          className="w-7 h-7 shrink-0 flex items-center justify-center rounded hover:bg-bg-card text-text-muted hover:text-text-secondary transition-colors"
          title="Close Sidebar"
        >
          <X size={14} />
        </button>
      </div>

      {/* Stats */}
      <ForgeStats
        masteredCount={masteredProblems.length}
        totalProblems={TOTAL_PROBLEMS}
      />

      {/* Spaced repetition — mastered problems due for review */}
      <SpacedRepetition
        lastReviewDate={lastReviewDate}
        masteredProblems={masteredProblems}
        onSelectProblem={onSelectProblem}
      />

      {/* Problem List */}
      <ProblemList
        selectedProblem={selectedProblem}
        masteredProblems={masteredProblems}
        onSelectProblem={onSelectProblem}
        onToggleMastered={onToggleMastered}
      />
    </div>
  );
});

export default MissionsSidebar;
