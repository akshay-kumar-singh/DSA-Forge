'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Clock, ChevronRight, Sparkles, Flag, Target, Info, HelpCircle, ArrowRight, Check, Zap } from 'lucide-react';
import StatusCard from '../shared/StatusCard';
import TaskRow, { KIND, type OnTab } from './TaskRow';
import { usePlanToggle } from './usePlanToggle';
import type { GoogleStore } from '../useGoogleStore';
import type { AIProvider } from '@/lib/types';
import type { PlanDay } from '@/lib/google/types';
import { PLAN_WEEKS, phaseOf, fmtDate, isDayDone, type PlanStatus } from '@/lib/google/plan';
import { resolveTaskItems } from '@/lib/google/today';
import { GOOGLE_SECTIONS, GOOGLE_TOTAL, sectionById } from '@/lib/google/problems';
import { getDueProblems } from '@/lib/revision';
import { DESIGN_PROMPTS } from '@/lib/google/system-design';
import { STORY_SEEDS } from '@/lib/google/behavioural';

interface Props {
  theme: 'dark' | 'light';
  store: GoogleStore;
  provider: AIProvider;
  model: string;
  orientation: 'horizontal' | 'vertical';
  plan: PlanDay[];
  status: PlanStatus;
  onTab: OnTab;
}

export const GATE_EXPLAINER = 'A gate is the exit condition of a phase. You do not move on because the calendar says so — you move on when every line is true. If a gate is unmet, repeat the last two weeks. This is the difference between arriving at week 26 ready and arriving unable to do week 12\'s material.';

export default function TodayPage({ store, plan, status, onTab }: Props) {
  const s = store.state;
  const [showGateHelp, setShowGateHelp] = useState(false);
  const planToggle = usePlanToggle(store, plan);
  // A day you finish in this session stays on screen as done instead of vanishing.
  const [pinned, setPinned] = useState<number | null>(null);
  const toggle = (id: string) => {
    planToggle(id);
    const d = plan.find(x => x.tasks.some(t => t.id === id));
    if (d && isDayDone(d, s.planDone)) setPinned(d.day);
  };

  // Today = the calendar day once the plan has started (so a finished day stays
  // visible as done), but never past the first unfinished day (clear old days first).
  const base = Math.min(status.started ? Math.min(status.currentDay, Math.max(status.calendarDay, 0)) : status.currentDay, plan.length - 1);
  const curIdx = pinned != null && pinned < status.currentDay && isDayDone(plan[pinned], s.planDone) ? pinned : base;
  const cur = plan[curIdx];
  const curDone = isDayDone(cur, s.planDone);
  const next = plan[curDone ? status.currentDay : curIdx + 1];
  const aheadDays = curDone && next ? next.day - cur.day : 0;
  const curWeek = PLAN_WEEKS[cur?.week ?? 0];
  const phase = phaseOf(cur?.week ?? 0);
  const behindDays = status.started ? Math.max(0, Math.min(status.calendarDay, status.totalDays - 1) - status.currentDay) : 0;

  const due = getDueProblems(s.lastReviewDate, s.reviewCount, s.mastered);
  const designsDone = DESIGN_PROMPTS.filter(d => (s.designs[d.id] && s.designs[d.id] !== '[]') || (s.designDocs[d.id] ?? '').trim()).length;
  const storiesDone = STORY_SEEDS.filter(st => { const x = s.stories[st.id]; return x && x.situation && x.action && x.result; }).length;
  const graded = s.mocks.filter(m => m.score != null);
  const avg = graded.length ? (graded.reduce((n, m) => n + (m.score ?? 0), 0) / graded.length).toFixed(2) : '—';
  const weekSection = curWeek?.sections[0] ? sectionById(curWeek.sections[0]) : undefined;
  const weekMastered = weekSection ? weekSection.problems.filter(p => s.mastered.includes(p.name)).length : 0;
  const weekDays = plan.filter(d => d.week === cur.week);
  const weekDone = weekDays.filter(d => isDayDone(d, s.planDone)).length;
  const lastDrill = s.drills[s.drills.length - 1];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-4 md:px-6 md:py-4 space-y-4">
        <StatusCard status={status} compact />

        {!status.started && (
          <Notice tone="blue">The plan starts on <b>{fmtDate(plan[0].date, true)}</b>. Everything you tick before then counts as being ahead.</Notice>
        )}
        {behindDays > 0 && (
          <Notice tone="red">You are <b>{behindDays} day{behindDays === 1 ? '' : 's'} behind</b> the calendar. Don&apos;t skip ahead — clear Day {cur.day + 1} first; the ready date moves with you.</Notice>
        )}

        {/* Progress strip — the four counters, one line */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="DSA mastered" value={s.mastered.length} of={`/ ${GOOGLE_TOTAL}`} pct={s.mastered.length / GOOGLE_TOTAL} onClick={() => onTab('dsa')} />
          <Stat label="Designs practised" value={designsDone} of={`/ ${DESIGN_PROMPTS.length}`} pct={designsDone / DESIGN_PROMPTS.length} onClick={() => onTab('design')} />
          <Stat label="STAR stories" value={storiesDone} of={`/ ${STORY_SEEDS.length}`} pct={storiesDone / STORY_SEEDS.length} onClick={() => onTab('behavioural')} />
          <Stat label="Mocks" value={s.mocks.length} of={`· avg ${avg}`} pct={Math.min(1, s.mocks.length / 12)} onClick={() => onTab('mocks')} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
          {/* ── Main: today, then what comes next ── */}
          <div className="space-y-4 min-w-0">
            {status.finished ? (
              <div className="gp-card p-8 text-center space-y-2">
                <Sparkles className="mx-auto gp-blue" />
                <div className="gp-h2">You are ready.</div>
                <p className="text-sm gp-t2">Every plan day is done. Keep the mocks going and reread roadmap §6 the night before the loop.</p>
              </div>
            ) : (
              <DayCard day={cur} title={curDone ? 'Today — done' : 'Today'} store={store} onToggle={toggle} onTab={onTab} accent />
            )}
            {next && !status.finished && (
              curDone
                ? <DayCard day={next} title={aheadDays > 1 ? `Next up — you are ${aheadDays - 1} day${aheadDays - 1 === 1 ? '' : 's'} ahead; pull further if you have the energy` : 'Next up — pull ahead if you have the energy'} store={store} onToggle={toggle} onTab={onTab} />
                : <UpNext day={next} store={store} />
            )}
            <p className="text-[11.5px] gp-t3 leading-relaxed px-1 flex gap-1.5"><Info size={13} className="shrink-0 mt-0.5" />Every pattern week has the same shape: theory Monday, 2 problems a day easy → medium plus an optional bonus, a timed set Saturday, 2 hards Sunday. Every problem in the bank has a day — the week&apos;s core inside that week, the rest as bonuses or in maintenance weeks. Problem tasks tick themselves once the required problems under them are mastered (bonuses never block); revision ticks itself when nothing is due; tick the rest by hand. When a whole day is done, Today moves on and the ready date comes forward.</p>
          </div>

          {/* ── Side: context for the day ── */}
          <aside className="space-y-4 lg:sticky lg:top-0">
            <div className="gp-card p-4 space-y-2.5">
              <div className="gp-label flex items-center gap-1.5"><Target size={12} className="gp-blue" />This week <span className="gp-chip gp-chip-xs ml-auto">{weekDone}/{weekDays.length} days</span></div>
              <div>
                <div className="gp-h2 leading-tight">{curWeek.theme}</div>
                <div className="text-xs gp-t3 mt-0.5">Week {cur.week} · {phase.title}</div>
              </div>
              <p className="text-[13px] gp-t2 leading-relaxed">{curWeek.detail}</p>
              {weekSection && (
                <div className="space-y-1.5">
                  <div className="gp-track h-1.5"><div className="gp-bar" style={{ width: `${(weekMastered / weekSection.problems.length) * 100}%` }} /></div>
                  <button onClick={() => onTab('dsa', { section: weekSection.id })} className="w-full flex items-center justify-between text-[13px] gp-link">
                    <span>{weekSection.title} · {weekMastered}/{weekSection.problems.length}</span><ChevronRight size={14} />
                  </button>
                </div>
              )}
              <button onClick={() => onTab('dsa', { drill: true })} className="w-full gp-btn gp-btn-sm justify-between" title="Ten problems, four patterns each — name the trigger before you code">
                <span className="flex items-center gap-1.5"><Zap size={13} className="gp-yellow" />Pattern-trigger drill</span>
                <span className="text-[11px] gp-t3 font-normal">{lastDrill ? `last ${lastDrill.correct}/${lastDrill.total}` : '5 min'}</span>
              </button>
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1.5"><span className="gp-label">Pattern coverage</span><span className="text-[11px] gp-t3">{GOOGLE_SECTIONS.length} sections</span></div>
                <div className="flex gap-1">
                  {GOOGLE_SECTIONS.map(sec => {
                    const m = sec.problems.filter(p => s.mastered.includes(p.name)).length;
                    const pct = m / sec.problems.length;
                    return (
                      <button key={sec.id} onClick={() => onTab('dsa', { section: sec.id })} title={`W${sec.week} ${sec.title} — ${m}/${sec.problems.length}`}
                        className={clsx('flex-1 h-2.5 rounded-sm transition-colors', pct === 1 ? 'gp-cov-full' : pct > 0 ? 'gp-cov-part' : 'gp-cov-none', sec.id === weekSection?.id && 'gp-cov-cur')} aria-label={sec.title} />
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="gp-card p-4 space-y-2">
              <div className="gp-label flex items-center gap-1.5"><Clock size={12} className="gp-purple" />Due for revision <span className={clsx('gp-chip gp-chip-xs ml-auto', due.length ? 'gp-chip-purple' : '')}>{due.length}</span></div>
              {due.length === 0 ? (
                <p className="text-[13px] gp-t3">Nothing due. Mastered problems come back at 7 → 14 → 30 days.</p>
              ) : (
                <ul className="space-y-0.5">
                  {due.slice(0, 5).map(d => (
                    <li key={d.problem}>
                      <button onClick={() => onTab('dsa', { problem: d.problem })} className="w-full text-left text-[13px] gp-t1 hover:gp-blue truncate flex items-center gap-2">
                        <span className="truncate">{d.problem}</span>
                        <span className="text-[11px] gp-t3 shrink-0 ml-auto">{d.overdueDays > 0 ? `${d.overdueDays}d overdue` : 'today'}</span>
                      </button>
                    </li>
                  ))}
                  {due.length > 5 && <li className="text-[11px] gp-t3">+{due.length - 5} more in the DSA tab</li>}
                </ul>
              )}
            </div>

            <div className="gp-card p-4 space-y-2">
              <div className="gp-label flex items-center gap-1.5">
                <Flag size={12} className="gp-red" />Gate {phase.id.slice(1)} · {phase.title}
                <button onClick={() => setShowGateHelp(v => !v)} className={clsx('ml-auto gp-btn gp-btn-ghost gp-btn-sm normal-case tracking-normal', showGateHelp && 'gp-btn-active')} title="What do these mean and how do I do them?">
                  <HelpCircle size={12} />{showGateHelp ? 'Hide' : 'How?'}
                </button>
              </div>
              <ul className="space-y-2">
                {phase.gate.map((g, i) => {
                  const id = `gate-${phase.id}-${i}`;
                  return (
                    <li key={id} className="flex items-start gap-2">
                      <input type="checkbox" checked={!!s.planDone[id]} onChange={() => toggle(id)} className="gp-check mt-0.5" aria-label={g} />
                      <div className="min-w-0">
                        <span className={clsx('text-[13px] leading-snug', s.planDone[id] ? 'line-through gp-t3' : 'gp-t1')}>{g}</span>
                        {showGateHelp && <p className="text-[12px] gp-t2 leading-relaxed mt-1">{phase.gateHelp[i]}</p>}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="text-[11px] gp-t3 leading-snug flex gap-1.5 pt-1"><Info size={12} className="shrink-0 mt-0.5" />The exit condition of this phase — tick a line only when it is true. Full explanation in the Plan tab.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Notice({ tone, children }: { tone: 'blue' | 'red'; children: React.ReactNode }) {
  return (
    <div className="rounded-xl px-4 py-2.5 text-[13.5px] gp-t2" style={{ background: tone === 'blue' ? 'var(--gp-blue-wash)' : 'var(--gp-red-wash)' }}>
      {children}
    </div>
  );
}

export function DayCard({ day, title, store, onToggle, onTab, accent }: { day: PlanDay; title: string; store: GoogleStore; onToggle: (id: string) => void; onTab: OnTab; accent?: boolean }) {
  const s = store.state;
  const doneCount = day.tasks.filter(t => s.planDone[t.id]).length;
  const week = PLAN_WEEKS[day.week];
  const all = doneCount === day.tasks.length;
  return (
    <div className={clsx('gp-card p-1', accent && 'gp-accent-card')}>
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div>
          <div className="gp-label">{title}</div>
          <div className="gp-h1 mt-0.5">{fmtDate(day.date)}</div>
          <div className="text-xs gp-t3 mt-0.5">Day {day.day + 1} · Week {day.week} · {week.theme}</div>
        </div>
        <span className={clsx('gp-chip shrink-0', all ? 'gp-chip-green' : '')}>{all && <Check size={11} />}{doneCount}/{day.tasks.length} done</span>
      </div>
      <div className="gp-divide px-1 pb-1">
        {day.tasks.map(t => <TaskRow key={t.id} task={t} done={!!s.planDone[t.id]} items={resolveTaskItems(t, s)} onToggle={() => onToggle(t.id)} onTab={onTab} />)}
      </div>
    </div>
  );
}

/** Tomorrow at a glance — task lines only, so today stays the focus. */
function UpNext({ day, store }: { day: PlanDay; store: GoogleStore }) {
  const s = store.state;
  const week = PLAN_WEEKS[day.week];
  return (
    <div className="gp-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <ArrowRight size={13} className="gp-t3" />
        <span className="gp-label">Up next</span>
        <span className="text-[13px] font-semibold gp-t1">{fmtDate(day.date)}</span>
        <span className="text-xs gp-t3">· Day {day.day + 1} · W{day.week} {week.theme}</span>
      </div>
      <ul className="space-y-1.5">
        {day.tasks.map(t => {
          const items = resolveTaskItems(t, s).filter(it => it.link?.problem);
          return (
            <li key={t.id} className="flex items-start gap-2 text-[13px]">
              <span className={clsx('gp-chip gp-chip-xs shrink-0 mt-px', KIND[t.kind].chip)}>{KIND[t.kind].label}</span>
              <span className="gp-t2 leading-snug min-w-0">
                {t.text}
                {items.length > 0 && <span className="gp-t3"> — {items.map(i => i.label).join(', ')}</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Stat({ label, value, of, pct, onClick }: { label: string; value: number; of: string; pct: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className="gp-card gp-card-hover px-3.5 py-2.5 text-left">
      <div className="flex items-center justify-between gap-2">
        <span className="gp-label normal-case tracking-normal text-[11.5px]">{label}</span>
        <span className="flex items-baseline gap-1"><span className="gp-num text-[20px] gp-blue">{value}</span><span className="text-[11px] gp-t3">{of}</span></span>
      </div>
      <div className="gp-track h-1 mt-2"><div className={clsx('gp-bar', pct >= 1 && 'gp-bar-green')} style={{ width: `${Math.min(100, pct * 100)}%` }} /></div>
    </button>
  );
}
