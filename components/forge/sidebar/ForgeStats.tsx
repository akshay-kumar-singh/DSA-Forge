'use client';

import { Shield } from 'lucide-react';

interface ForgeStatsProps {
  masteredCount: number;
  totalProblems: number;
}

export default function ForgeStats({ masteredCount, totalProblems }: ForgeStatsProps) {
  const pct = Math.min((masteredCount / totalProblems) * 100, 100);

  const rank =
    masteredCount >= 40 ? 'COMMANDER' :
    masteredCount >= 25 ? 'SPECIALIST' :
    masteredCount >= 10 ? 'AGENT' :
    masteredCount >= 3  ? 'RECRUIT' : 'INITIATE';

  return (
    <div className="p-3 forge-card space-y-2.5 mx-2 mt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Shield size={12} className="text-blue-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">
            Forge Stats
          </span>
        </div>
        <span className="text-[10px] font-black text-blue-400 tracking-widest">{rank}</span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="w-full h-1.5 bg-bg-base rounded-full overflow-hidden border border-border-subtle">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] font-bold text-text-muted uppercase">
          <span>Initiate</span>
          <span>Commander</span>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-1 pt-1">
        {[
          { label: 'Mastered', value: masteredCount, color: 'text-blue-400' },
          { label: 'Total', value: totalProblems, color: 'text-text-muted' },
        ].map(({ label, value, color }) => (
          <div key={label} className="text-center">
            <div className={`text-base font-black ${color}`}>{value}</div>
            <div className="text-[8px] font-bold uppercase text-text-muted">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
