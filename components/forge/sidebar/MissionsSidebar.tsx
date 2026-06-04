import React from 'react';
import { Target, X } from 'lucide-react';
import ForgeStats from './ForgeStats';
import ProblemList from './ProblemList';
import { DSA_PATTERNS } from '@/lib/problems';

interface MissionsSidebarProps {
  selectedProblem: string;
  masteredProblems: string[];
  lastReviewDate: Record<string, string>;
  codeMap: Record<string, string>;
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
  codeMap,
  onSelectProblem,
  onGoHome,
  onToggleMastered,
  onClose,
}: MissionsSidebarProps) {
  return (
    <div className="h-full flex flex-col forge-panel border-r border-border-subtle bg-bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-blue-400" />
          <span className="text-sm font-black uppercase tracking-widest text-text-primary">Missions</span>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-bg-card text-text-muted hover:text-text-secondary transition-colors"
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
