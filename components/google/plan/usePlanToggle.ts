'use client';

import { useCallback } from 'react';
import type { GoogleStore } from '../useGoogleStore';
import type { PlanDay } from '@/lib/google/types';
import { PLAN_PHASES, PLAN_WEEKS, fmtDate, isDayDone } from '@/lib/google/plan';
import { trackGoogle } from '@/lib/google/track';

/**
 * Tick / untick a plan task or gate line. Completing a whole day, or a gate
 * line, is an event worth a commit in the tracker repo.
 */
export function usePlanToggle(store: GoogleStore, plan: PlanDay[]) {
  return useCallback((id: string) => {
    let nowDone = false;
    store.update(st => {
      if (st.planDone[id]) delete st.planDone[id];
      else { st.planDone[id] = new Date().toISOString(); nowDone = true; }
    });
    if (!nowDone) return;
    if (id.startsWith('gate-')) {
      const [, phaseId, idx] = id.split('-');
      const ph = PLAN_PHASES.find(p => p.id === phaseId);
      const line = ph?.gate[Number(idx)];
      if (line) trackGoogle('gate', `Gate ${phaseId.slice(1)} · ${line}`);
      return;
    }
    const day = plan.find(d => d.tasks.some(t => t.id === id));
    if (day && isDayDone(day, store.state.planDone)) {
      trackGoogle('day', `Day ${day.day + 1} · ${fmtDate(day.date)} · W${day.week} ${PLAN_WEEKS[day.week].theme}`);
    }
  }, [store, plan]);
}
