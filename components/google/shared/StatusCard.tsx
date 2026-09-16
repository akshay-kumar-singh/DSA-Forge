'use client';

import { Flag, CalendarClock } from 'lucide-react';
import { clsx } from 'clsx';
import { fmtDate, type PlanStatus } from '@/lib/google/plan';

/** Hero status — the four numbers that matter, plus the progress ring. `compact` is the one-line variant for Today. */
export default function StatusCard({ status, compact = false }: { status: PlanStatus; compact?: boolean }) {
  const pct = status.completedDays / status.totalDays;
  const size = compact ? 60 : 76, r = compact ? 24 : 30, sw = compact ? 6 : 7, c = 2 * Math.PI * r;
  const deltaText = !status.started
    ? `Starts in ${-status.calendarDay} day${-status.calendarDay === 1 ? '' : 's'}`
    : status.finished ? 'Plan complete'
    : status.delta === 0 ? 'On schedule'
    : `${Math.abs(status.delta)} day${Math.abs(status.delta) === 1 ? '' : 's'} ${status.delta > 0 ? 'ahead' : 'behind'}`;
  const deltaChip = !status.started ? 'gp-chip-blue' : status.delta > 0 || status.finished ? 'gp-chip-green' : status.delta < 0 ? 'gp-chip-red' : '';

  return (
    <div className={clsx('gp-card', compact ? 'px-5 py-3' : 'p-5')}>
      <div className={clsx('flex flex-wrap items-center', compact ? 'gap-x-6 gap-y-3' : 'gap-5')}>
        <div className="relative shrink-0">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="gp-ring">
            <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={sw} fill="none" className="gp-ring-track" />
            <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={sw} fill="none" className="gp-ring-bar" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={clsx('gp-num gp-t1', compact ? 'text-[13px]' : 'text-base')}>{Math.round(pct * 100)}%</span>
          </div>
        </div>

        <div className={compact ? 'min-w-[96px]' : 'min-w-[120px]'}>
          <div className="gp-label flex items-center gap-1.5"><CalendarClock size={12} className="gp-blue" />Days left</div>
          <div className={clsx('gp-num gp-blue', compact ? 'text-[30px] mt-0.5' : 'text-[40px] mt-1')}>{status.daysLeft}</div>
          {!compact && <div className="text-xs gp-t3">of {status.totalDays} plan days</div>}
        </div>

        <div className={clsx('grid grid-cols-2 md:grid-cols-3 flex-1 min-w-[260px]', compact ? 'gap-x-6 gap-y-2' : 'gap-x-8 gap-y-3')}>
          <div>
            <div className="gp-label">Ready by</div>
            <div className={clsx('gp-display font-bold gp-t1 mt-0.5', compact ? 'text-[15px]' : 'text-lg')}>{fmtDate(status.projectedReady)}</div>
            <div className="text-xs gp-t3">{status.finished ? 'done' : `on schedule: ${fmtDate(status.scheduledReady)}`}</div>
          </div>
          <div>
            <div className="gp-label flex items-center gap-1"><Flag size={11} className="gp-red" />Apply window</div>
            <div className={clsx('gp-display font-bold gp-t1 mt-0.5', compact ? 'text-[15px]' : 'text-lg')}>{fmtDate(status.applyWindowOpens)}</div>
            <div className="text-xs gp-t3">week 20 — never before</div>
          </div>
          <div>
            <div className="gp-label">Status</div>
            <div className="mt-1"><span className={clsx('gp-chip', deltaChip)}>{deltaText}</span></div>
            <div className="text-xs gp-t3 mt-1">Day {Math.min(status.currentDay + 1, status.totalDays)} of {status.totalDays} · {status.doneTasks}/{status.totalTasks} tasks</div>
          </div>
        </div>
      </div>

      <div className={clsx('gp-track h-1.5', compact ? 'mt-3' : 'mt-4')}><div className="gp-bar" style={{ width: `${pct * 100}%` }} /></div>
    </div>
  );
}
