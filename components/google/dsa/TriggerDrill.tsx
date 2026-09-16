'use client';

// ======================================================
// Pattern-trigger drill — "which pattern does this want?"
// The skill the roadmap says decides interviews: seeing the
// trigger before touching the keyboard. Ten problem names from
// the patterns learned so far, four candidate patterns each,
// the section's trigger line as the explanation.
// ======================================================

import React, { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { X, Zap, Check, ArrowRight, RotateCcw, ExternalLink } from 'lucide-react';
import type { GoogleStore } from '../useGoogleStore';
import type { GoogleSection } from '@/lib/google/types';
import { GOOGLE_SECTIONS } from '@/lib/google/problems';
import { trackGoogle } from '@/lib/google/track';

const ROUND = 10;

interface Q { name: string; difficulty: string; answer: GoogleSection; options: GoogleSection[] }

function shuffle<T>(a: T[]): T[] { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; }

function buildRound(planWeek: number): Q[] {
  // Patterns studied so far (at least the first four so the options are meaningful), excluding the toolkit.
  const pool = GOOGLE_SECTIONS.filter(s => s.id !== 'toolkit' && s.week <= Math.max(planWeek, 4));
  const qs: Q[] = [];
  const probs = shuffle(pool.flatMap(s => s.problems.map(p => ({ p, s })))).slice(0, ROUND);
  for (const { p, s } of probs) {
    const others = shuffle(pool.filter(x => x.id !== s.id)).slice(0, 3);
    qs.push({ name: p.name, difficulty: p.difficulty, answer: s, options: shuffle([s, ...others]) });
  }
  return qs;
}

interface Props { store: GoogleStore; planWeek: number; onClose: () => void; onOpenProblem: (name: string, section: string) => void }

export default function TriggerDrill({ store, planWeek, onClose, onOpenProblem }: Props) {
  const [round, setRound] = useState(() => buildRound(planWeek));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [saved, setSaved] = useState(false);
  const q = round[i];
  const done = i >= round.length;
  const history = store.state.drills;
  const best = useMemo(() => history.reduce((b, d) => Math.max(b, d.total ? d.correct / d.total : 0), 0), [history]);

  const pick = (id: string) => {
    if (picked) return;
    setPicked(id);
    if (id === q.answer.id) setCorrect(c => c + 1);
  };
  const next = () => {
    const ni = i + 1;
    setI(ni); setPicked(null);
    if (ni >= round.length && !saved) {
      setSaved(true);
      const total = round.length;
      store.update(st => { st.drills = [...st.drills, { date: new Date().toISOString(), correct, total }].slice(-50); });
      trackGoogle('drill', `${correct}/${total} pattern triggers`);
    }
  };
  const again = () => { setRound(buildRound(planWeek)); setI(0); setPicked(null); setCorrect(0); setSaved(false); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <div className="gp-card w-full max-w-xl p-5 space-y-4" onClick={e => e.stopPropagation()} role="dialog" aria-label="Pattern trigger drill">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center gp-yellow" style={{ background: 'var(--gp-yellow-wash)' }}><Zap size={15} /></span>
          <div className="min-w-0">
            <div className="gp-h2 leading-tight">Which pattern?</div>
            <div className="text-[11.5px] gp-t3">Name the trigger before you touch the keyboard · patterns up to W{Math.max(planWeek, 4)}</div>
          </div>
          <span className="ml-auto gp-chip gp-chip-xs">{Math.min(i + 1, round.length)} / {round.length}</span>
          <button onClick={onClose} className="gp-btn gp-btn-ghost gp-btn-sm gp-btn-icon" aria-label="Close"><X size={14} /></button>
        </div>

        {!done ? (
          <>
            <div className="gp-inset p-4">
              <div className="gp-label mb-1">Problem</div>
              <div className="gp-display text-lg font-bold gp-t1">{q.name}</div>
              <div className="text-[11.5px] gp-t3 mt-0.5">{q.difficulty}</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {q.options.map(o => {
                const isAns = o.id === q.answer.id;
                const isPick = picked === o.id;
                return (
                  <button key={o.id} onClick={() => pick(o.id)} disabled={!!picked}
                    className={clsx('gp-item justify-start text-left !py-2.5 !px-3', picked && isAns && '!border-[var(--gp-green)] !bg-[var(--gp-green-wash)]', picked && isPick && !isAns && '!border-[var(--gp-red)] !bg-[var(--gp-red-wash)]')}>
                    <span className="gp-chip gp-chip-xs shrink-0">W{o.week}</span>
                    <span className="min-w-0 truncate">{o.title}</span>
                    {picked && isAns && <Check size={13} className="gp-green ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>
            {picked && (
              <div className="rounded-xl p-3 text-[13px] leading-relaxed" style={{ background: picked === q.answer.id ? 'var(--gp-green-wash)' : 'var(--gp-red-wash)' }}>
                <div className="font-semibold gp-t1 mb-0.5">{picked === q.answer.id ? 'Right.' : `No — it is ${q.answer.title}.`}</div>
                <div className="gp-t2">Reach for it when: {q.answer.trigger}</div>
                <button onClick={() => { onOpenProblem(q.name, q.answer.id); onClose(); }} className="mt-1.5 inline-flex items-center gap-1 text-[12px] gp-link">Open the problem <ExternalLink size={11} /></button>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[12px] gp-t3">Score {correct} / {i + (picked ? 1 : 0)}{best > 0 && ` · best round ${Math.round(best * 100)}%`}</span>
              <button onClick={next} disabled={!picked} className="gp-btn gp-btn-primary gp-btn-sm">{i + 1 < round.length ? 'Next' : 'Finish'} <ArrowRight size={13} /></button>
            </div>
          </>
        ) : (
          <div className="text-center space-y-3 py-2">
            <div className="gp-num text-[44px] gp-blue">{correct}<span className="text-lg gp-t3"> / {round.length}</span></div>
            <p className="text-[13px] gp-t2">{correct === round.length ? 'Perfect. Do it again tomorrow — the reflex has to survive a bad night.' : correct >= 8 ? 'Solid. The misses are the patterns to reread before the next timed set.' : 'The trigger lines are the fix: reread the "Reach for it when" of every pattern you missed, then run again.'}</p>
            {history.length > 0 && <div className="text-[11.5px] gp-t3">Rounds so far: {history.length} · best {Math.round(best * 100)}%</div>}
            <div className="flex justify-center gap-2">
              <button onClick={again} className="gp-btn gp-btn-primary gp-btn-sm"><RotateCcw size={13} />Another round</button>
              <button onClick={onClose} className="gp-btn gp-btn-sm">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
