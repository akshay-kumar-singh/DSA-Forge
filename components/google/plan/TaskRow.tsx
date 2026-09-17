'use client';

import { clsx } from 'clsx';
import { ArrowUpRight, Check, RotateCcw } from 'lucide-react';
import type { PlanTask, TaskItem, DeepLink, GoogleTab } from '@/lib/google/types';

export const KIND: Record<PlanTask['kind'], { label: string; chip: string }> = {
  theory: { label: 'Theory', chip: 'gp-chip-blue' },
  solve: { label: 'Solve', chip: 'gp-chip-blue' },
  revise: { label: 'Revise', chip: 'gp-chip-purple' },
  timed: { label: 'Timed set', chip: 'gp-chip-yellow' },
  drill: { label: 'Drill', chip: 'gp-chip-yellow' },
  template: { label: 'Template', chip: 'gp-chip-purple' },
  admin: { label: 'Admin', chip: '' },
  design: { label: 'Design', chip: 'gp-chip-green' },
  behavioural: { label: 'Behavioural', chip: 'gp-chip-purple' },
  mock: { label: 'Mock', chip: 'gp-chip-red' },
  outreach: { label: 'Referrals', chip: 'gp-chip-yellow' },
  apply: { label: 'Apply', chip: 'gp-chip-red' },
  special: { label: 'Setup', chip: '' },
  rest: { label: 'Rest', chip: '' },
};

export type OnTab = (t: GoogleTab, link?: Omit<DeepLink, 'tab'>) => void;

interface Props {
  task: PlanTask;
  done: boolean;
  items?: TaskItem[];
  onToggle: () => void;
  onTab?: OnTab;
  dense?: boolean;
}

export default function TaskRow({ task, done, items = [], onToggle, onTab, dense }: Props) {
  const k = KIND[task.kind];
  const go = (l?: DeepLink) => { if (l && onTab) { const { tab, ...rest } = l; onTab(tab, rest); } };
  return (
    <div className={clsx('gp-row', done && 'gp-row-done', dense && 'py-2')}>
      <input type="checkbox" checked={done} onChange={onToggle} className="gp-check mt-0.5" aria-label={task.text} />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start gap-2">
          <span className={clsx('gp-chip gp-chip-xs shrink-0 mt-0.5', k.chip)}>{k.label}</span>
          <span className="gp-row-text text-[13.5px] gp-t1 leading-snug">{task.text}</span>
          {task.link && onTab && (
            <button onClick={() => go(task.link)} className="ml-auto shrink-0 gp-t3 hover:gp-blue transition-colors" title={`Open ${task.link.tab}`}>
              <ArrowUpRight size={14} />
            </button>
          )}
        </div>
        {items.length > 0 && !done && (
          <div className="gp-pill-list pl-0.5">
            {items.map((it, i) => it.link ? (
              <button key={i} onClick={() => go(it.link)} className={clsx('gp-item', it.done && 'gp-item-done', it.optional && !it.done && 'opacity-70')} title={it.optional ? `Bonus — optional. ${it.sub ?? ''}` : it.sub}>
                {it.done && <Check size={12} className="gp-green" />}
                {it.again && <RotateCcw size={11} className="gp-t3" />}
                <span>{it.label}</span>
                {it.sub && <span className="gp-t3 font-normal text-[11px] truncate max-w-[220px]">· {it.sub}</span>}
              </button>
            ) : (
              <span key={i} className="gp-item cursor-default" title={it.sub}>
                <span>{it.label}</span>
                {it.sub && <span className="gp-t3 font-normal text-[11px] truncate max-w-[260px]">· {it.sub}</span>}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
