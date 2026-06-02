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
    <div className="h-full flex flex-col forge-panel border-r border-blue-500/10">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-blue-500/10 shrink-0">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-blue-400" />
          <span className="text-sm font-black uppercase tracking-widest text-[#e2e8f0]">Missions</span>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/5 text-[#475569] hover:text-[#94a3b8] transition-colors"
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
