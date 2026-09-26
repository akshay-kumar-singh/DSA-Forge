// ======================================================
// PRACTICE LAB — load / save
// Same shape as lib/google/storage.ts: cloud (MongoDB via
// /api/practice) with a localStorage mirror, newer copy wins.
// ======================================================

import { EMPTY_PRACTICE_STATE, type PracticeState, type PracticeProblem, type PracticeDesign } from './types';

const LS_KEY = 'dsa-forge-practice-v1';
const LS_STAMP = 'dsa-forge-practice-v1-stamp';

const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);

function normaliseProblem(raw: unknown): PracticeProblem | null {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<PracticeProblem>;
  if (!r.id) return null;
  const diff = r.difficulty;
  return {
    id: r.id,
    title: str(r.title),
    prompt: str(r.prompt),
    source: str(r.source),
    difficulty: diff === 'easy' || diff === 'medium' || diff === 'hard' ? diff : '',
    code: r.code && typeof r.code === 'object' ? r.code : {},
    notes: str(r.notes),
    solved: !!r.solved,
    created: str(r.created, new Date().toISOString()),
    updated: str(r.updated, new Date().toISOString()),
  };
}

function normaliseDesign(raw: unknown): PracticeDesign | null {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<PracticeDesign>;
  if (!r.id) return null;
  return {
    id: r.id,
    title: str(r.title),
    prompt: str(r.prompt),
    scene: str(r.scene),
    doc: str(r.doc),
    done: !!r.done,
    minutes: typeof r.minutes === 'number' ? r.minutes : 0,
    created: str(r.created, new Date().toISOString()),
    updated: str(r.updated, new Date().toISOString()),
  };
}

export function normalise(raw: unknown): PracticeState {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<PracticeState>;
  return {
    version: 1,
    problems: Array.isArray(r.problems) ? r.problems.map(normaliseProblem).filter((p): p is PracticeProblem => !!p) : [],
    designs: Array.isArray(r.designs) ? r.designs.map(normaliseDesign).filter((d): d is PracticeDesign => !!d) : [],
    language: r.language ?? EMPTY_PRACTICE_STATE.language,
  };
}

export function loadLocal(): { state: PracticeState; stamp: number } | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return { state: normalise(JSON.parse(raw)), stamp: Number(localStorage.getItem(LS_STAMP) || 0) };
  } catch { return null; }
}

export function saveLocal(state: PracticeState, stamp = Date.now()): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
    localStorage.setItem(LS_STAMP, String(stamp));
  } catch { /* quota or private mode — the cloud still has it */ }
}

export async function loadCloud(): Promise<{ state: PracticeState; stamp: number } | null> {
  const res = await fetch('/api/practice');
  if (!res.ok) throw new Error(`GET /api/practice → ${res.status}`);
  const { data, updatedAt } = await res.json();
  if (!data) return null;
  return { state: normalise(data), stamp: updatedAt ? new Date(updatedAt).getTime() : 0 };
}

/** keepalive lets the request outlive a closing tab (browsers cap such bodies at ~64 KB). */
export async function saveCloud(state: PracticeState, keepalive = false): Promise<void> {
  const body = JSON.stringify({ data: state });
  const res = await fetch('/api/practice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: keepalive && body.length < 60_000,
  });
  if (!res.ok) throw new Error(`POST /api/practice → ${res.status}`);
}
