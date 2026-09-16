'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { EMPTY_GOOGLE_STATE, type GoogleState } from '@/lib/google/types';
import { loadCloud, loadLocal, saveCloud, saveLocal, normalise } from '@/lib/google/storage';
import { autoTickPlan, planFor } from '@/lib/google/plan';

const AUTOSAVE_MS = 60_000;       // safety net
const CLOUD_DEBOUNCE_MS = 6_000;  // a burst of edits → one cloud write
const LOCAL_DEBOUNCE_MS = 1_000;

export interface GoogleStore {
  /** Live, mutable snapshot — read it in render; mutate only through update/touchCode */
  state: GoogleState;
  tick: number;
  loaded: boolean;
  isSaving: boolean;
  cloudOk: boolean | null;
  update: (fn: (s: GoogleState) => void) => void;
  touchCode: (key: string, code: string) => void;
  save: (opts?: { silent?: boolean }) => Promise<void>;
}

/**
 * Single source of truth for the Google track. Mirrors the pattern in
 * app/page.tsx (refs for hot paths, explicit save) but keeps everything in
 * one object so the whole state can be persisted as one JSON payload.
 *
 * Persistence: every change lands in localStorage within a second and in
 * MongoDB (/api/google) a few seconds later; mastering, mocks and the Save
 * button write to the cloud immediately; leaving the tab flushes what is
 * pending. On load the newer of the two copies wins and, if that is the
 * local mirror, it is pushed up so other devices catch up.
 */
export function useGoogleStore(): GoogleStore {
  const stateRef = useRef<GoogleState>({ ...EMPTY_GOOGLE_STATE });
  const [tick, setTick] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cloudOk, setCloudOk] = useState<boolean | null>(null);
  const dirtyRef = useRef(false);
  const localTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cloudTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(async (opts?: { silent?: boolean; keepalive?: boolean }) => {
    const silent = opts?.silent === true;
    if (cloudTimer.current) { clearTimeout(cloudTimer.current); cloudTimer.current = null; }
    setIsSaving(true);
    saveLocal(stateRef.current);
    const id = silent ? undefined : toast.loading('Syncing Google prep…');
    try {
      await saveCloud(stateRef.current, opts?.keepalive);
      dirtyRef.current = false;
      setCloudOk(true);
      if (!silent) toast.success('Google prep saved to the cloud.', { id });
    } catch (err) {
      setCloudOk(false);
      if (!silent) toast.error('Cloud sync failed — saved in this browser only.', { id });
      else console.warn('Google prep cloud save failed:', err instanceof Error ? err.message : err);
    } finally {
      setTimeout(() => setIsSaving(false), 400);
    }
  }, []);

  const scheduleLocal = useCallback(() => {
    if (localTimer.current) clearTimeout(localTimer.current);
    localTimer.current = setTimeout(() => saveLocal(stateRef.current), LOCAL_DEBOUNCE_MS);
  }, []);
  const scheduleCloud = useCallback(() => {
    if (cloudTimer.current) clearTimeout(cloudTimer.current);
    cloudTimer.current = setTimeout(() => { if (dirtyRef.current) save({ silent: true }); }, CLOUD_DEBOUNCE_MS);
  }, [save]);

  // ── Load: local first (instant), then cloud; the newer copy wins ──
  useEffect(() => {
    const local = loadLocal();
    if (local) {
      stateRef.current = local.state;
      autoTickPlan(planFor(local.state.planStart), local.state);
      setTick(t => t + 1);
    }
    setLoaded(true);
    (async () => {
      try {
        const cloud = await loadCloud();
        setCloudOk(true);
        if (cloud && (!local || cloud.stamp >= local.stamp)) {
          stateRef.current = normalise(cloud.state);
          autoTickPlan(planFor(stateRef.current.planStart), stateRef.current);
          saveLocal(stateRef.current, cloud.stamp);
          setTick(t => t + 1);
        } else if (local) {
          // The browser mirror is ahead of the cloud (a save was cut short) — push it up.
          dirtyRef.current = true;
          save({ silent: true });
        }
      } catch {
        setCloudOk(false); // no DB locally — expected; localStorage carries it
      }
    })();
  }, [save]);

  const update = useCallback((fn: (s: GoogleState) => void) => {
    fn(stateRef.current);
    autoTickPlan(planFor(stateRef.current.planStart), stateRef.current);
    dirtyRef.current = true;
    scheduleLocal();
    scheduleCloud();
    setTick(t => t + 1);
  }, [scheduleLocal, scheduleCloud]);

  const touchCode = useCallback((key: string, code: string) => {
    stateRef.current.codeMap[key] = code;
    dirtyRef.current = true;
    scheduleLocal();
    scheduleCloud();
  }, [scheduleLocal, scheduleCloud]);

  // ── Autosave safety net + flush when the tab is hidden or closed ──
  useEffect(() => {
    const iv = setInterval(() => { if (dirtyRef.current) save({ silent: true }); }, AUTOSAVE_MS);
    const flush = () => { saveLocal(stateRef.current); if (dirtyRef.current) save({ silent: true, keepalive: true }); };
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    return () => {
      clearInterval(iv);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
      if (localTimer.current) clearTimeout(localTimer.current);
      if (cloudTimer.current) clearTimeout(cloudTimer.current);
    };
  }, [save]);

  return { state: stateRef.current, tick, loaded, isSaving, cloudOk, update, touchCode, save };
}
