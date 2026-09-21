'use client';

import React, { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { Timer, Code2, Network, Users, Trophy, ChevronDown, ChevronRight, Trash2, Info, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import GoogleDSA from '../dsa/GoogleDSA';
import DesignPage from '../design/DesignPage';
import BehaviouralPage from '../behavioural/BehaviouralPage';
import { pickUnseen } from '../dsa/GoogleSidebar';
import type { GoogleStore } from '../useGoogleStore';
import type { AIProvider } from '@/lib/types';
import type { MockKind, MockResult } from '@/lib/google/types';
import { GOOGLE_SECTIONS, GOOGLE_PROBLEMS } from '@/lib/google/problems';
import { DESIGN_PROMPTS } from '@/lib/google/system-design';
import { GL_QUESTIONS } from '@/lib/google/behavioural';
import { trackGoogle } from '@/lib/google/track';

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  store: GoogleStore;
  provider: AIProvider;
  model: string;
  orientation: 'horizontal' | 'vertical';
  editorFontSize: number;
  editorFontFamily: string;
  onOpenSettings: () => void;
  focus?: { n: number; kind?: MockKind; problem?: string };
}

type Active = { kind: 'coding'; problem: string } | { kind: 'design'; promptId: string } | { kind: 'behavioural'; questions: string[] };

const BANDS = [
  { min: 3.3, label: 'Strong hire', chip: 'gp-chip-green', text: 'gp-green' },
  { min: 3.0, label: 'Hire', chip: 'gp-chip-green', text: 'gp-green' },
  { min: 2.6, label: 'Lean no hire', chip: 'gp-chip-yellow', text: 'gp-yellow' },
  { min: 2.0, label: 'No hire', chip: 'gp-chip-red', text: 'gp-red' },
  { min: 0, label: 'Strong no hire', chip: 'gp-chip-red', text: 'gp-red' },
];
const band = (score: number | null) => score == null ? { label: 'Ungraded', chip: '', text: 'gp-t3' } : BANDS.find(b => score >= b.min)!;

export default function MocksPage(props: Props) {
  const { store, theme, onToggleTheme, provider, model, orientation, editorFontSize, editorFontFamily, onOpenSettings, focus } = props;
  const s = store.state;
  const [active, setActive] = useState<Active | null>(null);
  const [section, setSection] = useState<string>('any');
  const [track, setTrack] = useState<'any' | 'backend' | 'frontend'>('any');
  const [openId, setOpenId] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<MockKind | null>(null);

  // A timed-set pill on Today sends the exact problem: the round runs on it instead of a random pick.
  const [preset, setPreset] = useState<string | null>(null);
  const [prevFocusN, setPrevFocusN] = useState(focus?.n ?? 0);
  if (focus && focus.n !== prevFocusN) {
    setPrevFocusN(focus.n);
    if (focus.kind) setHighlight(focus.kind);
    if (focus.problem && GOOGLE_PROBLEMS[focus.problem]) setPreset(focus.problem);
  }

  const record = (kind: MockKind, subject: string) => (r: { score: number | null; verdict: string; feedback: string; minutes: number; strengths?: string[]; improvements?: string[] }) => {
    const res: MockResult = { id: `m-${Date.now()}`, kind, subject, date: new Date().toISOString(), minutes: r.minutes, score: r.score, verdict: r.verdict, feedback: r.feedback, strengths: r.strengths, improvements: r.improvements };
    store.update(st => { st.mocks = [...st.mocks, res]; });
    store.save({ silent: true });
    trackGoogle('mock', `${kind} · ${subject} · ${r.score != null ? r.score.toFixed(1) : 'ungraded'} ${r.verdict}`);
    setActive(null);
    setOpenId(res.id);
  };

  const startCoding = () => setActive({ kind: 'coding', problem: preset ?? pickUnseen(s.mastered, section === 'any' ? undefined : section) });
  const startDesign = () => { const pool = DESIGN_PROMPTS.filter(d => track === 'any' || d.track === track); setActive({ kind: 'design', promptId: pool[Math.floor(Math.random() * pool.length)].id }); };
  const startBehavioural = () => setActive({ kind: 'behavioural', questions: [...GL_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 4) });

  const graded = s.mocks.filter(m => m.score != null);
  const avg = graded.length ? graded.reduce((n, m) => n + (m.score ?? 0), 0) / graded.length : null;
  const streak = useMemo(() => { let n = 0; for (let i = s.mocks.length - 1; i >= 0; i--) { const sc = s.mocks[i].score; if (sc != null && sc >= 3.0) n++; else break; } return n; }, [s.mocks]);
  const byKind = (k: MockKind) => { const g = s.mocks.filter(m => m.kind === k && m.score != null); return g.length ? (g.reduce((n, m) => n + (m.score ?? 0), 0) / g.length).toFixed(2) : '—'; };

  if (active?.kind === 'coding') {
    return <GoogleDSA theme={theme} onToggleTheme={onToggleTheme} store={store} provider={provider} model={model} orientation={orientation} editorFontSize={editorFontSize} editorFontFamily={editorFontFamily} onOpenSettings={onOpenSettings}
      mock={{ problem: active.problem, onEnd: record('coding', active.problem), onAbort: () => setActive(null) }} />;
  }
  if (active?.kind === 'design') {
    const dp = DESIGN_PROMPTS.find(d => d.id === active.promptId)!;
    return <DesignPage theme={theme} store={store} provider={provider} model={model} orientation={orientation} mock={{ promptId: active.promptId, onEnd: record('design', dp.title), onAbort: () => setActive(null) }} />;
  }
  if (active?.kind === 'behavioural') {
    return <BehaviouralPage theme={theme} store={store} provider={provider} model={model} orientation={orientation} mock={{ questions: active.questions, onEnd: record('behavioural', `${active.questions.length} G&L questions`), onAbort: () => setActive(null) }} />;
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-5">
        <div className="gp-card p-5">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl flex items-center justify-center gp-yellow" style={{ background: 'var(--gp-yellow-wash)' }}><Trophy size={18} /></span>
              <div><div className="gp-h2">Mock loop</div><div className="text-[12px] gp-t3">Interviewer persona · graded 1.0–4.0</div></div>
            </div>
            <Stat label="Mocks" value={String(s.mocks.length)} />
            <Stat label="Average" value={avg == null ? '—' : avg.toFixed(2)} cls={band(avg).text} />
            <Stat label="Coding" value={byKind('coding')} />
            <Stat label="Design" value={byKind('design')} />
            <Stat label="Behavioural" value={byKind('behavioural')} />
            <Stat label="Hire streak · Gate 4" value={`${streak} / 4`} cls={streak >= 4 ? 'gp-green' : undefined} />
          </div>
          <p className="text-[12.5px] gp-t2 mt-4 flex items-start gap-2"><Info size={13} className="shrink-0 mt-0.5 gp-t3" />Target: average ≥ 3.0 with no strong negatives. Most prepared candidates land at 2.6–2.9 — the gap is speed, clean code and saying your reasoning out loud. Gate 4 needs four hire-level rounds in a row.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MockCard hl={highlight === 'coding'} icon={<Code2 size={18} />} tone="blue" title="Coding round" desc="A problem you haven't mastered, stated vaguely. The interviewer answers clarifying questions, probes, follows up, and grades.">
            {preset ? (
              <div className="gp-inset px-3 h-[38px] flex items-center gap-2 text-[12.5px]">
                <span className="gp-chip gp-chip-xs gp-chip-yellow shrink-0">From the plan</span>
                <span className="truncate font-semibold gp-t1">{preset}</span>
                <button onClick={() => setPreset(null)} className="ml-auto gp-t3 hover:gp-t1 shrink-0" title="Pick a random problem instead"><X size={13} /></button>
              </div>
            ) : (
              <select value={section} onChange={e => setSection(e.target.value)} className="gp-input gp-select w-full">
                <option value="any">Any pattern</option>
                {GOOGLE_SECTIONS.map(sec => <option key={sec.id} value={sec.id}>W{sec.week} · {sec.title}</option>)}
              </select>
            )}
            <button onClick={startCoding} className="gp-btn gp-btn-primary w-full"><Timer size={14} />{preset ? 'Start the timed round' : 'Start coding mock'}</button>
          </MockCard>
          <MockCard hl={highlight === 'design'} icon={<Network size={18} />} tone="green" title="System design" desc="A random prompt. Whiteboard + design doc; the interviewer reads both and grades the L3/L4 boundary.">
            <select value={track} onChange={e => setTrack(e.target.value as typeof track)} className="gp-input gp-select w-full">
              <option value="any">Backend or frontend</option><option value="backend">Backend / distributed</option><option value="frontend">Frontend</option>
            </select>
            <button onClick={startDesign} className="gp-btn gp-btn-primary w-full"><Timer size={14} />Start design mock</button>
          </MockCard>
          <MockCard hl={highlight === 'behavioural'} icon={<Users size={18} />} tone="purple" title="Culture & Leadership" desc="Four questions from the real list, probed like a sceptical interviewer. Your story bank is visible to it.">
            <div className="h-[38px] flex items-center text-[12px] gp-t3">4 random questions · 45 min</div>
            <button onClick={startBehavioural} className="gp-btn gp-btn-primary w-full"><Timer size={14} />Start behavioural mock</button>
          </MockCard>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline gap-3 pt-2"><h2 className="gp-h1">History</h2><span className="text-xs gp-t3">newest first · click a row for the debrief</span></div>
          {s.mocks.length === 0 && <div className="gp-card p-6 text-center text-[13px] gp-t3">No mocks yet. The plan&apos;s first one is in week 8, then weekly from week 12.</div>}
          {[...s.mocks].reverse().map(m => {
            const b = band(m.score);
            const open = openId === m.id;
            return (
              <div key={m.id} className="gp-card">
                <button onClick={() => setOpenId(open ? null : m.id)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
                  {open ? <ChevronDown size={14} className="gp-t3" /> : <ChevronRight size={14} className="gp-t3" />}
                  <span className={clsx('gp-chip gp-chip-xs w-24 justify-center', m.kind === 'coding' ? 'gp-chip-blue' : m.kind === 'design' ? 'gp-chip-green' : 'gp-chip-purple')}>{m.kind}</span>
                  <span className="flex-1 min-w-0 text-[13.5px] font-semibold gp-t1 truncate">{m.subject}</span>
                  <span className="text-[11.5px] gp-t3 hidden sm:inline">{new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {m.minutes} min</span>
                  <span className={clsx('gp-num text-xl w-10 text-right', b.text)}>{m.score == null ? '—' : m.score.toFixed(1)}</span>
                  <span className={clsx('gp-chip gp-chip-xs w-28 justify-center', b.chip)}>{b.label}</span>
                </button>
                {open && (
                  <div className="px-5 pb-5 space-y-3 border-t gp-border pt-4">
                    <div className="forge-prose text-sm"><ReactMarkdown>{m.feedback}</ReactMarkdown></div>
                    {((m.strengths?.length ?? 0) > 0 || (m.improvements?.length ?? 0) > 0) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(m.strengths?.length ?? 0) > 0 && (
                          <div className="rounded-xl p-3" style={{ background: 'var(--gp-green-wash)' }}>
                            <div className="gp-label gp-green mb-1">Strengths</div>
                            <ul className="space-y-1">{m.strengths!.map((x, i) => <li key={i} className="text-[13px] gp-t1">• {x}</li>)}</ul>
                          </div>
                        )}
                        {(m.improvements?.length ?? 0) > 0 && (
                          <div className="rounded-xl p-3" style={{ background: 'var(--gp-red-wash)' }}>
                            <div className="gp-label gp-red mb-1">Fix next</div>
                            <ul className="space-y-1">{m.improvements!.map((x, i) => <li key={i} className="text-[13px] gp-t1">• {x}</li>)}</ul>
                          </div>
                        )}
                      </div>
                    )}
                    <button onClick={() => { store.update(st => { st.mocks = st.mocks.filter(x => x.id !== m.id); }); }} className="gp-btn gp-btn-danger gp-btn-sm"><Trash2 size={12} />Delete</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, cls }: { label: string; value: string; cls?: string }) {
  return (
    <div className="min-w-[64px]">
      <div className={clsx('gp-num text-2xl', cls ?? 'gp-t1')}>{value}</div>
      <div className="text-[11px] gp-t3 mt-0.5">{label}</div>
    </div>
  );
}

function MockCard({ icon, tone, title, desc, hl, children }: { icon: React.ReactNode; tone: 'blue' | 'green' | 'purple'; title: string; desc: string; hl?: boolean; children: React.ReactNode }) {
  return (
    <div className={clsx('gp-card p-5 space-y-3 flex flex-col', hl && 'gp-accent-card')}>
      <div className="flex items-center gap-3">
        <span className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', `gp-${tone}`)} style={{ background: `var(--gp-${tone}-wash)` }}>{icon}</span>
        <div><div className="text-[15px] font-bold gp-t1">{title}</div><div className="text-[11px] gp-t3">45 minutes</div></div>
      </div>
      <p className="text-[13px] gp-t2 leading-relaxed flex-1">{desc}</p>
      {children}
    </div>
  );
}
