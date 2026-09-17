'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronRight, ChevronDown, ExternalLink, X, Code2, Shuffle, CalendarDays, Zap } from 'lucide-react';
import { clsx } from 'clsx';
import SpacedRepetition from '@/components/forge/sidebar/SpacedRepetition';
import { GOOGLE_SECTIONS, GOOGLE_TOTAL, GOOGLE_PROBLEMS, GOOGLE_SECTION_OF, leetcodeSlug } from '@/lib/google/problems';
import { fmtDate } from '@/lib/google/plan';
import type { PlanDay } from '@/lib/google/types';

export interface SidebarFocus { n: number; section?: string; problem?: string }

interface Props {
  selectedProblem: string;
  mastered: string[];
  lastReviewDate: Record<string, string>;
  reviewCount: Record<string, number>;
  focus?: SidebarFocus;
  onSelect: (p: string) => void;
  onToggleMastered: (p: string) => void;
  onDrill?: () => void;
  /** problem → plan day it is scheduled on (from lib/google/plan) */
  schedule?: Map<string, PlanDay>;
  /** problems that are on the plan only as an optional bonus */
  bonus?: Set<string>;
  onMarkRevised: (p: string) => void;
  onRandomUnseen: () => void;
  onClose: () => void;
}

const GoogleSidebar = React.memo(function GoogleSidebar({
  selectedProblem, mastered, lastReviewDate, reviewCount, focus, onSelect, onToggleMastered, onMarkRevised, onRandomUnseen, onClose, schedule, bonus, onDrill,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const selRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const sec = GOOGLE_SECTION_OF[selectedProblem];
    return sec ? { [sec.id]: true } : {};
  });

  const [prevSel, setPrevSel] = useState(selectedProblem);
  if (prevSel !== selectedProblem) {
    setPrevSel(selectedProblem);
    const sec = GOOGLE_SECTION_OF[selectedProblem];
    if (sec && !open[sec.id]) setOpen({ ...open, [sec.id]: true });
  }

  // Deep link (section or problem) — open during render, scroll after commit
  const [prevFocusN, setPrevFocusN] = useState(focus?.n ?? 0);
  if (focus && focus.n !== prevFocusN) {
    setPrevFocusN(focus.n);
    const secId = focus.section ?? (focus.problem ? GOOGLE_SECTION_OF[focus.problem]?.id : undefined);
    if (secId && !open[secId]) setOpen({ ...open, [secId]: true });
  }
  useEffect(() => {
    if (!focus?.section || focus.problem) return;
    const id = setTimeout(() => document.getElementById(`gsec-${focus.section}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 50);
    return () => clearTimeout(id);
  }, [focus]);

  useEffect(() => {
    const item = selRef.current, c = listRef.current;
    if (!item || !c || !item.isConnected) return;
    const r = item.getBoundingClientRect(), cr = c.getBoundingClientRect();
    if (r.top < cr.top || r.bottom > cr.bottom) item.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [selectedProblem, open]);

  const pct = Math.min((mastered.length / GOOGLE_TOTAL) * 100, 100);
  const rank = mastered.length >= 300 ? 'L4 ready' : mastered.length >= 200 ? 'L3 ready' : mastered.length >= 100 ? 'Phone-screen ready' : mastered.length >= 30 ? 'Warming up' : 'Day one';

  return (
    <div className="h-full w-full min-w-0 flex flex-col overflow-hidden gp-side border-r">
      <div className="gp-side-head shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center gp-blue" style={{ background: 'var(--gp-blue-wash)' }}><Code2 size={16} /></span>
          <div className="min-w-0"><div className="text-[14px] font-bold gp-t1 truncate">Google DSA</div><div className="text-[11px] gp-t3">14 patterns · {GOOGLE_SECTIONS.length} sections</div></div>
        </div>
        <div className="flex items-center gap-1">
          {onDrill && <button onClick={onDrill} className="gp-btn gp-btn-ghost gp-btn-sm gp-btn-icon gp-yellow" title="Pattern-trigger drill: which pattern does this problem want?"><Zap size={14} /></button>}
          <button onClick={onRandomUnseen} className="gp-btn gp-btn-ghost gp-btn-sm gp-btn-icon gp-t3" title="Random unseen problem"><Shuffle size={14} /></button>
          <button onClick={onClose} className="gp-btn gp-btn-ghost gp-btn-sm gp-btn-icon gp-t3" title="Close sidebar"><X size={14} /></button>
        </div>
      </div>

      <div className="mx-3 mt-3 gp-inset p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold gp-t2">{mastered.length} <span className="gp-t3 font-normal">/ {GOOGLE_TOTAL} mastered</span></span>
          <span className="gp-chip gp-chip-xs gp-chip-blue">{rank}</span>
        </div>
        <div className="gp-track h-1.5"><div className="gp-bar" style={{ width: `${pct}%` }} /></div>
      </div>

      <div className="[&_.forge-card]:!bg-[var(--gp-surface-2)] [&_.forge-card]:!border-[var(--gp-border)]">
        <SpacedRepetition lastReviewDate={lastReviewDate} reviewCount={reviewCount} masteredProblems={mastered} onSelectProblem={onSelect} onMarkRevised={onMarkRevised} />
      </div>

      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 pb-4 pt-2 space-y-0.5">
        {GOOGLE_SECTIONS.map(sec => {
          const isOpen = !!open[sec.id];
          const m = sec.problems.filter(p => mastered.includes(p.name)).length;
          return (
            <div key={sec.id} id={`gsec-${sec.id}`}>
              <button onClick={() => setOpen(o => ({ ...o, [sec.id]: !o[sec.id] }))} className="gp-side-group" title={sec.trigger}>
                <span className="gp-chip gp-chip-xs w-8 justify-center" title={`Plan week ${sec.week}`}>W{sec.week}</span>
                <span className="flex-1 min-w-0 text-left truncate normal-case tracking-normal text-[12.5px] font-semibold gp-t1">{sec.title}</span>
                <span className={clsx('text-[11px] font-semibold shrink-0 normal-case tracking-normal', m === sec.problems.length ? 'gp-green' : 'gp-t3')}>{m}/{sec.problems.length}</span>
                {isOpen ? <ChevronDown size={13} className="gp-t3 shrink-0" /> : <ChevronRight size={13} className="gp-t3 shrink-0" />}
              </button>
              {isOpen && (
                <div className="pb-2 space-y-0.5">
                  <div className="px-2 pb-1 text-[11px] gp-t3 leading-snug">Reach for it when: {sec.trigger}</div>
                  {sec.problems.map(pr => {
                    const isSel = pr.name === selectedProblem;
                    const isM = mastered.includes(pr.name);
                    const slug = leetcodeSlug(pr.name);
                    return (
                      <div key={pr.name} ref={n => { if (isSel) selRef.current = n; }}>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <input type="checkbox" checked={isM} onChange={() => onToggleMastered(pr.name)} className="gp-check !w-4 !h-4 ml-1" title={isM ? 'Mark as not mastered' : 'Mark as mastered'} />
                          <button onClick={() => onSelect(pr.name)} className={clsx('gp-side-item', isSel && 'gp-side-item-active')}>
                            <span className="flex-1 min-w-0 truncate">{pr.name}</span>
                            {pr.design && <span className="gp-chip gp-chip-xs gp-chip-purple">design</span>}
                            <span className={clsx('gp-diff', `gp-diff-${pr.difficulty}`)}>{pr.difficulty[0].toUpperCase()}</span>
                          </button>
                        </div>
                        {isSel && (
                          <div className="ml-8 mt-1 mb-1.5 pr-2 space-y-1">
                            {pr.note && <p className="text-[11.5px] gp-t2 leading-snug">{pr.note}</p>}
                            {schedule?.get(pr.name) && (() => { const d = schedule.get(pr.name)!; return <p className="text-[11px] gp-t3 flex items-center gap-1"><CalendarDays size={10} />Plan: day {d.day + 1} · {fmtDate(d.date)} · W{d.week}{bonus?.has(pr.name) ? ' · bonus' : ''}</p>; })()}
                            {schedule && !schedule.get(pr.name) && <p className="text-[11px] gp-t3 flex items-center gap-1"><CalendarDays size={10} />Extra — not on the plan.</p>}
                            {slug && <a href={`https://leetcode.com/problems/${slug}/`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11.5px] gp-link">Problem statement on LeetCode <ExternalLink size={10} /></a>}
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
    </div>
  );
});

export default GoogleSidebar;

/** Random problem that isn't mastered yet (optionally within a section). */
export function pickUnseen(mastered: string[], sectionId?: string): string {
  const pool = (sectionId ? GOOGLE_SECTIONS.filter(s => s.id === sectionId) : GOOGLE_SECTIONS)
    .flatMap(s => s.problems.map(p => p.name))
    .filter(n => !mastered.includes(n));
  const all = Object.keys(GOOGLE_PROBLEMS);
  const src = pool.length ? pool : all;
  return src[Math.floor(Math.random() * src.length)];
}
