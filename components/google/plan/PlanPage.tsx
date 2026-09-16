'use client';

import React, { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { ChevronDown, ChevronRight, LocateFixed, Flag, Check, Info } from 'lucide-react';
import StatusCard from '../shared/StatusCard';
import TaskRow, { type OnTab } from './TaskRow';
import { GATE_EXPLAINER } from './TodayPage';
import type { GoogleStore } from '../useGoogleStore';
import type { AIProvider } from '@/lib/types';
import type { PlanDay, PlanPhase } from '@/lib/google/types';
import { PLAN_PHASES, PLAN_WEEKS, fmtDate, isDayDone, phaseOf, type PlanStatus } from '@/lib/google/plan';
import { resolveTaskItems } from '@/lib/google/today';
import { usePlanToggle } from './usePlanToggle';
import OutreachCard, { outreachSummary } from './OutreachCard';

interface Props {
  theme: 'dark' | 'light';
  store: GoogleStore;
  provider: AIProvider;
  model: string;
  orientation: 'horizontal' | 'vertical';
  plan: PlanDay[];
  status: PlanStatus;
  onTab: OnTab;
  focus?: { n: number; id?: string };
}

export default function PlanPage({ store, plan, status, onTab, focus }: Props) {
  const s = store.state;
  const toggle = usePlanToggle(store, plan);
  const curWeek = plan[Math.min(status.currentDay, plan.length - 1)].week;
  const curPhase = phaseOf(curWeek);
  const [openWeeks, setOpenWeeks] = useState<Record<number, boolean>>({ [curWeek]: true });
  const [openDays, setOpenDays] = useState<Record<number, boolean>>({});
  const [outreachOpen, setOutreachOpen] = useState(false);
  const outreach = outreachSummary(s.contacts, s.applications);

  // Deep link from a task: open the referral map and bring it into view
  const [prevFocusN, setPrevFocusN] = useState(focus?.n ?? 0);
  if (focus && focus.n !== prevFocusN) {
    setPrevFocusN(focus.n);
    if (focus.id === 'outreach') {
      setOutreachOpen(true);
      setTimeout(() => document.getElementById('gp-outreach')?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 60);
    }
  }
  const byWeek = useMemo(() => PLAN_WEEKS.map(w => plan.filter(d => d.week === w.week)), [plan]);

  const gateDone = (ph: PlanPhase) => ph.gate.every((_, i) => !!s.planDone[`gate-${ph.id}-${i}`]);
  const phaseDays = (ph: PlanPhase) => plan.filter(d => d.week >= ph.weeks[0] && d.week <= ph.weeks[1]);
  const phasePct = (ph: PlanPhase) => { const ds = phaseDays(ph); return ds.filter(d => isDayDone(d, s.planDone)).length / ds.length; };

  const jumpToCurrent = () => {
    setOpenWeeks(o => ({ ...o, [curWeek]: true }));
    setOpenDays(o => ({ ...o, [status.currentDay]: true }));
    setTimeout(() => document.getElementById(`plan-day-${status.currentDay}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 50);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-5">
        <StatusCard status={status} />

        {/* Phase stepper */}
        <div className="gp-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="gp-label">Five phases · 27 weeks</div>
            <button onClick={jumpToCurrent} className="gp-btn gp-btn-sm"><LocateFixed size={13} />Jump to today</button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {PLAN_PHASES.map(ph => {
              const pct = phasePct(ph);
              const isCur = ph.id === curPhase.id;
              const passed = gateDone(ph);
              return (
                <div key={ph.id} className={clsx('rounded-xl p-3 border', isCur ? 'gp-accent-card' : 'gp-border')}>
                  <div className="flex items-center justify-between">
                    <span className={clsx('text-[11px] font-bold', isCur ? 'gp-blue' : 'gp-t3')}>{ph.id}</span>
                    {passed ? <span className="gp-chip gp-chip-xs gp-chip-green"><Check size={10} />gate</span> : <span className="text-[10px] gp-t3">W{ph.weeks[0]}–{ph.weeks[1]}</span>}
                  </div>
                  <div className="text-[13px] font-semibold gp-t1 mt-1 leading-tight line-clamp-2">{ph.title}</div>
                  <div className="gp-track h-1 mt-2"><div className={clsx('gp-bar', pct === 1 && 'gp-bar-green')} style={{ width: `${pct * 100}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gate explainer + start date */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-stretch">
          <div className="gp-card p-4 flex gap-3">
            <Flag size={16} className="gp-red shrink-0 mt-0.5" />
            <div>
              <div className="gp-h2 mb-1">What a gate is</div>
              <p className="text-[13.5px] gp-t2 leading-relaxed">{GATE_EXPLAINER}</p>
              <p className="text-[12px] gp-t3 mt-2 flex items-start gap-1.5"><Info size={12} className="shrink-0 mt-0.5" />Each phase below ends with its gate. Tick a line only when you have actually done it (e.g. solved three unseen mediums under 30 minutes on three different days) — the app cannot check it for you. Problem tasks, on the other hand, tick themselves once every problem listed under them is mastered.</p>
            </div>
          </div>
          <div className="gp-card p-4 space-y-2 md:w-64">
            <div className="gp-label">Plan start</div>
            <input type="date" value={s.planStart} onChange={e => { if (e.target.value) store.update(st => { st.planStart = e.target.value; }); }} className="gp-input w-full" />
            <p className="text-[11.5px] gp-t3">Ends {fmtDate(status.scheduledReady, true)} on schedule. Finishing days early pulls it forward.</p>
          </div>
        </div>

        <OutreachCard store={store} open={outreachOpen} onToggle={() => setOutreachOpen(o => !o)} />

        {PLAN_PHASES.map(ph => (
          <section key={ph.id} className="space-y-3">
            <div className="flex items-baseline gap-3 pt-2">
              <span className={clsx('gp-chip', ph.id === curPhase.id ? 'gp-chip-blue' : '')}>{ph.id}</span>
              <h2 className="gp-h1">{ph.title}</h2>
              <span className="text-xs gp-t3">weeks {ph.weeks[0]}–{ph.weeks[1]}</span>
            </div>

            {PLAN_WEEKS.filter(w => w.phase === ph.id).map(w => {
              const days = byWeek[w.week];
              const done = days.filter(d => isDayDone(d, s.planDone)).length;
              const open = !!openWeeks[w.week];
              const isCur = w.week === curWeek;
              return (
                <div key={w.week} className={clsx('gp-card', isCur && 'gp-accent-card')}>
                  <button onClick={() => setOpenWeeks(o => ({ ...o, [w.week]: !o[w.week] }))} className="w-full flex items-center gap-3 px-4 py-3 text-left">
                    {open ? <ChevronDown size={15} className="gp-t3" /> : <ChevronRight size={15} className="gp-t3" />}
                    <span className={clsx('gp-chip gp-chip-xs w-10 justify-center', isCur ? 'gp-chip-blue' : '')}>W{w.week}</span>
                    <span className="flex-1 min-w-0 text-[14px] font-semibold gp-t1 truncate">{w.theme}</span>
                    <span className="text-xs gp-t3 hidden sm:inline">{fmtDate(days[0].date)} → {fmtDate(days[days.length - 1].date)}</span>
                    <span className={clsx('gp-chip gp-chip-xs', done === days.length ? 'gp-chip-green' : '')}>{done}/{days.length} days</span>
                  </button>
                  {open && (
                    <div className="px-4 pb-4 space-y-2">
                      <p className="text-[13px] gp-t2">{w.detail}</p>
                      {w.sections.length > 0 && (
                        <button onClick={() => onTab('dsa', { section: w.sections[0] })} className="text-[13px] gp-link">Open this week&apos;s problems →</button>
                      )}
                      <div className="space-y-1.5 pt-1">
                        {days.map(d => {
                          const dd = isDayDone(d, s.planDone);
                          const dOpen = openDays[d.day] ?? (d.day === status.currentDay);
                          const n = d.tasks.filter(t => s.planDone[t.id]).length;
                          return (
                            <div key={d.day} id={`plan-day-${d.day}`} className={clsx('rounded-xl border', d.day === status.currentDay ? 'gp-accent-card' : 'gp-border')}>
                              <button onClick={() => setOpenDays(o => ({ ...o, [d.day]: !dOpen }))} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left">
                                {dOpen ? <ChevronDown size={13} className="gp-t3" /> : <ChevronRight size={13} className="gp-t3" />}
                                <span className="text-[13px] font-semibold gp-t1">{fmtDate(d.date)}</span>
                                <span className="text-[11px] gp-t3">day {d.day + 1}</span>
                                <span className={clsx('ml-auto gp-chip gp-chip-xs', dd ? 'gp-chip-green' : '')}>{dd ? <Check size={10} /> : null}{n}/{d.tasks.length}</span>
                              </button>
                              {dOpen && (
                                <div className="gp-divide px-1 pb-1">
                                  {d.tasks.map(t => <TaskRow key={t.id} task={t} done={!!s.planDone[t.id]} items={resolveTaskItems(t, s)} onToggle={() => toggle(t.id)} onTab={onTab} dense />)}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="rounded-xl p-4 space-y-2 border border-dashed" style={{ borderColor: 'color-mix(in srgb, var(--gp-red) 50%, transparent)', background: 'var(--gp-red-wash)' }}>
              <div className="flex items-center gap-2"><Flag size={14} className="gp-red" /><span className="text-[13px] font-bold gp-t1">Gate {ph.id.slice(1)} — exit condition for {ph.title.toLowerCase()}</span>{gateDone(ph) && <span className="gp-chip gp-chip-xs gp-chip-green ml-auto"><Check size={10} />passed</span>}</div>
              {ph.gate.map((g, i) => {
                const id = `gate-${ph.id}-${i}`;
                return (
                  <div key={id} className="flex items-start gap-2.5">
                    <input type="checkbox" checked={!!s.planDone[id]} onChange={() => toggle(id)} className="gp-check mt-0.5" id={id} />
                    <div className="min-w-0">
                      <label htmlFor={id} className={clsx('block text-[13.5px] font-semibold leading-snug cursor-pointer', s.planDone[id] ? 'line-through gp-t3' : 'gp-t1')}>{g}</label>
                      <p className="text-[12.5px] gp-t2 leading-relaxed mt-1"><span className="gp-label mr-1.5">How</span>{ph.gateHelp[i]}</p>
                      {ph.id === 'P3' && i === 2 && (
                        <button onClick={() => { setOutreachOpen(true); setTimeout(() => document.getElementById('gp-outreach')?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 60); }} className="mt-1 text-[12px] gp-link">
                          Now: {outreach.inFlight} in flight · {outreach.referred} referred · {outreach.applications} application{outreach.applications === 1 ? '' : 's'} — open the tracker →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        <p className="text-[11px] gp-t3 text-center pb-6">Today is {fmtDate(new Date(), true)} · plan day {status.calendarDay + 1} by the calendar</p>
      </div>
    </div>
  );
}
