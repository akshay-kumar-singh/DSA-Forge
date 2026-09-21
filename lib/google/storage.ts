// ======================================================
// GOOGLE PREP — load / save
// Cloud (MongoDB via /api/google) with a localStorage mirror,
// so the track works locally without a database and survives
// a failed request. Cloud wins when both exist and it is newer.
// ======================================================

import { EMPTY_GOOGLE_STATE, type GoogleState } from './types';

const LS_KEY = 'dsa-forge-google-v1';
const LS_STAMP = 'dsa-forge-google-v1-stamp';

export function normalise(raw: unknown): GoogleState {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<GoogleState>;
  return {
    ...EMPTY_GOOGLE_STATE,
    ...r,
    version: 1,
    codeMap: r.codeMap ?? {},
    notes: r.notes ?? {},
    mastered: Array.isArray(r.mastered) ? r.mastered : [],
    lastReviewDate: r.lastReviewDate ?? {},
    reviewCount: r.reviewCount ?? {},
    designs: r.designs ?? {},
    designDocs: r.designDocs ?? {},
    stories: r.stories ?? {},
    planStart: typeof r.planStart === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.planStart) ? r.planStart : EMPTY_GOOGLE_STATE.planStart,
    planDone: r.planDone ?? {},
    mocks: Array.isArray(r.mocks) ? r.mocks : [],
    language: r.language ?? 'javascript',
    drills: Array.isArray(r.drills) ? r.drills : [],
    contacts: Array.isArray(r.contacts) ? r.contacts : [],
    applications: Array.isArray(r.applications) ? r.applications : [],
    notebook: Array.isArray(r.notebook) ? r.notebook : [],
  };
}

export function loadLocal(): { state: GoogleState; stamp: number } | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const stamp = Number(localStorage.getItem(LS_STAMP) || 0);
    return { state: normalise(JSON.parse(raw)), stamp };
  } catch { return null; }
}

export function saveLocal(state: GoogleState, stamp = Date.now()): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
    localStorage.setItem(LS_STAMP, String(stamp));
  } catch { /* quota or private mode — cloud still has it */ }
}

export async function loadCloud(): Promise<{ state: GoogleState; stamp: number } | null> {
  const res = await fetch('/api/google');
  if (!res.ok) throw new Error(`GET /api/google → ${res.status}`);
  const { data, updatedAt } = await res.json();
  if (!data) return null;
  return { state: normalise(data), stamp: updatedAt ? new Date(updatedAt).getTime() : 0 };
}

/** keepalive lets the request outlive a closing tab (browsers cap such bodies at ~64 KB). */
export async function saveCloud(state: GoogleState, keepalive = false): Promise<void> {
  const body = JSON.stringify({ data: state });
  const res = await fetch('/api/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: keepalive && body.length < 60_000,
  });
  if (!res.ok) throw new Error(`POST /api/google → ${res.status}`);
}
