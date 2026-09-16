'use client';

// ======================================================
// Back-of-the-envelope drill — QPS, storage, bandwidth from a
// random scenario, checked to ±25%. Week 17 says "until the
// arithmetic is instant"; this is the rep. Nothing is stored.
// ======================================================

import React, { useState } from 'react';
import { clsx } from 'clsx';
import { X, Calculator, Check, RotateCcw, Eye } from 'lucide-react';

interface Scenario { dau: number; writesPerUser: number; readRatio: number; payload: number; retentionYears: number; label: string }

const DAU = [1e6, 5e6, 1e7, 5e7, 1e8, 5e8];
const WRITES = [1, 2, 5, 10, 20];
const RATIO = [10, 20, 100, 1000];
const PAYLOAD = [200, 500, 1024, 5 * 1024, 100 * 1024, 1024 * 1024];
const LABELS = ['messaging app', 'photo feed', 'URL shortener', 'ride-hailing GPS pings', 'payment ledger', 'notification service', 'code-search index', 'news feed'];
const pickOne = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

function makeScenario(): Scenario {
  return { dau: pickOne(DAU), writesPerUser: pickOne(WRITES), readRatio: pickOne(RATIO), payload: pickOne(PAYLOAD), retentionYears: pickOne([1, 5]), label: pickOne(LABELS) };
}

export const fmtNum = (n: number): string => n >= 1e9 ? `${+(n / 1e9).toFixed(1)} B` : n >= 1e6 ? `${+(n / 1e6).toFixed(1)} M` : n >= 1e3 ? `${+(n / 1e3).toFixed(1)} k` : `${Math.round(n)}`;
export const fmtBytes = (b: number): string => {
  const u = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']; let i = 0; let v = b;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${+v.toFixed(v >= 100 ? 0 : 1)} ${u[i]}`;
};
/** Accepts "580", "1.2k", "3 M", "2.5 TB", "300 MB/s", "1e6". */
export function parseHuman(raw: string): number | null {
  const t = raw.trim().toLowerCase().replace(/\/s|ps|per second|bytes?|qps/g, '').replace(/\s+/g, '');
  const m = t.match(/^([\d.]+(?:e[+-]?\d+)?)([kmgtpb]?)/);
  if (!m) return null;
  const n = Number(m[1]); if (!Number.isFinite(n)) return null;
  const mult: Record<string, number> = { '': 1, k: 1e3, m: 1e6, g: 1e9, b: 1e9, t: 1e12, p: 1e15 };
  // Storage/bandwidth answers use binary units; the 2.4% difference is far inside the tolerance.
  return n * (mult[m[2]] ?? 1);
}

interface Q { key: string; label: string; unit: string; answer: number; fmt: (n: number) => string; working: string }

function questions(sc: Scenario): Q[] {
  const writesPerDay = sc.dau * sc.writesPerUser;
  const writeQps = writesPerDay / 86_400;
  const readQps = writeQps * sc.readRatio;
  const storageYear = writesPerDay * sc.payload * 365;
  const ingress = writeQps * sc.payload;
  return [
    { key: 'w', label: 'Average write QPS', unit: 'writes / s', answer: writeQps, fmt: fmtNum, working: `${fmtNum(sc.dau)} DAU × ${sc.writesPerUser} writes ÷ 86,400 s (≈ 10⁵) ≈ ${fmtNum(writeQps)} · peak ≈ 3× = ${fmtNum(writeQps * 3)}` },
    { key: 'r', label: 'Average read QPS', unit: 'reads / s', answer: readQps, fmt: fmtNum, working: `${fmtNum(writeQps)} × ${sc.readRatio}:1 read ratio ≈ ${fmtNum(readQps)} — this number decides the cache and the replica count` },
    { key: 's', label: `Storage per year (${sc.retentionYears}-yr retention → ×${sc.retentionYears})`, unit: 'bytes', answer: storageYear, fmt: fmtBytes, working: `${fmtNum(writesPerDay)} writes/day × ${fmtBytes(sc.payload)} × 365 ≈ ${fmtBytes(storageYear)} / year · ${fmtBytes(storageYear * sc.retentionYears)} over ${sc.retentionYears} yr` },
    { key: 'b', label: 'Write ingress bandwidth', unit: 'bytes / s', answer: ingress, fmt: (n) => `${fmtBytes(n)}/s`, working: `${fmtNum(writeQps)} writes/s × ${fmtBytes(sc.payload)} ≈ ${fmtBytes(ingress)}/s` },
  ];
}

export default function EstimationDrill({ onClose }: { onClose: () => void }) {
  const [sc, setSc] = useState<Scenario>(() => makeScenario());
  const [vals, setVals] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [reveal, setReveal] = useState(false);
  const qs = questions(sc);
  const grade = (q: Q) => { const v = parseHuman(vals[q.key] ?? ''); if (v == null) return null; return Math.abs(v - q.answer) / q.answer <= 0.25; };
  const score = qs.filter(q => grade(q) === true).length;
  const reset = () => { setSc(makeScenario()); setVals({}); setChecked(false); setReveal(false); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <div className="gp-card w-full max-w-xl p-5 space-y-4" onClick={e => e.stopPropagation()} role="dialog" aria-label="Estimation drill">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center gp-green" style={{ background: 'var(--gp-green-wash)' }}><Calculator size={15} /></span>
          <div className="min-w-0"><div className="gp-h2 leading-tight">Estimation drill</div><div className="text-[11.5px] gp-t3">Back-of-the-envelope · answers within ±25% count · 1 day ≈ 10⁵ s</div></div>
          <button onClick={onClose} className="ml-auto gp-btn gp-btn-ghost gp-btn-sm gp-btn-icon" aria-label="Close"><X size={14} /></button>
        </div>

        <div className="gp-inset p-4 text-[13.5px] gp-t1 leading-relaxed">
          A <b>{sc.label}</b> has <b>{fmtNum(sc.dau)} DAU</b>. Each user writes <b>{sc.writesPerUser}×/day</b>; reads are <b>{sc.readRatio}:1</b> against writes; a write is <b>{fmtBytes(sc.payload)}</b>; data is kept <b>{sc.retentionYears} year{sc.retentionYears > 1 ? 's' : ''}</b>.
        </div>

        <div className="space-y-2">
          {qs.map(q => {
            const g = checked ? grade(q) : null;
            return (
              <div key={q.key} className="space-y-1">
                <div className="grid grid-cols-[minmax(0,1fr)_150px] gap-2 items-center">
                  <label className="text-[13px] gp-t1" htmlFor={`est-${q.key}`}>{q.label} <span className="gp-t3 text-[11px]">({q.unit})</span></label>
                  <div className="relative">
                    <input id={`est-${q.key}`} value={vals[q.key] ?? ''} onChange={e => setVals(v => ({ ...v, [q.key]: e.target.value }))} placeholder="e.g. 1.2k / 3 TB" className={clsx('gp-input gp-input-sm w-full pr-7', g === true && '!border-[var(--gp-green)]', g === false && '!border-[var(--gp-red)]')} />
                    {g === true && <Check size={13} className="gp-green absolute right-2 top-1/2 -translate-y-1/2" />}
                    {g === false && <X size={13} className="gp-red absolute right-2 top-1/2 -translate-y-1/2" />}
                  </div>
                </div>
                {(reveal || (checked && g === false)) && <p className="text-[12px] gp-t2 pl-1"><b className="gp-t1">{q.fmt(q.answer)}</b> — {q.working}</p>}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setChecked(true)} className="gp-btn gp-btn-primary gp-btn-sm"><Check size={13} />Check</button>
          <button onClick={() => setReveal(r => !r)} className={clsx('gp-btn gp-btn-sm', reveal && 'gp-btn-active')}><Eye size={13} />{reveal ? 'Hide working' : 'Show working'}</button>
          <button onClick={reset} className="gp-btn gp-btn-sm ml-auto"><RotateCcw size={13} />New scenario</button>
          {checked && <span className={clsx('gp-chip', score === qs.length ? 'gp-chip-green' : score >= 2 ? 'gp-chip-yellow' : 'gp-chip-red')}>{score}/{qs.length}</span>}
        </div>
        <p className="text-[11.5px] gp-t3">Say the numbers out loud in the interview: state the assumption, do the arithmetic in powers of ten, round, and name what the number changes (cache? shard? CDN?).</p>
      </div>
    </div>
  );
}
