'use client';

import { useEffect, useState } from 'react';
import { loadCloud, loadLocal } from '@/lib/google/storage';
import { planFor, computePlanStatus } from '@/lib/google/plan';
import { GOOGLE_TOTAL } from '@/lib/google/problems';
import { DESIGN_PROMPTS } from '@/lib/google/system-design';
import { STORY_SEEDS } from '@/lib/google/behavioural';
import type { GoogleState } from '@/lib/google/types';

export interface GoogleSummary {
  daysLeft: number;
  totalDays: number;
  pct: number;
  started: boolean;
  delta: number;
  startsIn: number;
  mastered: number;
  totalProblems: number;
  designs: number;
  totalDesigns: number;
  stories: number;
  totalStories: number;
  mocks: number;
  avg: number | null;
  readyBy: Date;
  loaded: boolean;
}

function summarise(state: GoogleState): GoogleSummary {
  const plan = planFor(state.planStart);
  const st = computePlanStatus(plan, state);
  const graded = state.mocks.filter(m => m.score != null);
  return {
    daysLeft: st.daysLeft, totalDays: st.totalDays, pct: st.completedDays / st.totalDays,
    started: st.started, delta: st.delta, startsIn: -st.calendarDay,
    mastered: state.mastered.length, totalProblems: GOOGLE_TOTAL,
    designs: DESIGN_PROMPTS.filter(d => (state.designs[d.id] && state.designs[d.id] !== '[]') || (state.designDocs[d.id] ?? '').trim()).length,
    totalDesigns: DESIGN_PROMPTS.length,
    stories: STORY_SEEDS.filter(s => { const x = state.stories[s.id]; return x && x.situation && x.action && x.result; }).length,
    totalStories: STORY_SEEDS.length,
    mocks: state.mocks.length,
    avg: graded.length ? graded.reduce((n, m) => n + (m.score ?? 0), 0) / graded.length : null,
    readyBy: st.projectedReady,
    loaded: true,
  };
}

/** Read-only snapshot of the Google track for the landing page (local mirror first, then cloud). */
export function useGoogleSummary(): GoogleSummary | null {
  // First render is null on server and client alike (no hydration mismatch);
  // the local mirror lands a microtask later, the cloud copy after that.
  const [sum, setSum] = useState<GoogleSummary | null>(null);
  useEffect(() => {
    let cancelled = false;
    const local = loadLocal();
    queueMicrotask(() => { if (!cancelled && local) setSum(summarise(local.state)); });
    loadCloud().then(cloud => {
      if (!cancelled && cloud && (!local || cloud.stamp >= local.stamp)) setSum(summarise(cloud.state));
    }).catch(() => { /* no DB locally — local mirror (if any) stands */ });
    return () => { cancelled = true; };
  }, []);
  return sum;
}
