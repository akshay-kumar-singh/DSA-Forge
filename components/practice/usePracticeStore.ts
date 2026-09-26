'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { EMPTY_PRACTICE_STATE, type PracticeState } from '@/lib/practice/types';
import { loadCloud, loadLocal, saveCloud, saveLocal, normalise } from '@/lib/practice/storage';

const AUTOSAVE_MS = 60_000;       // safety net
const CLOUD_DEBOUNCE_MS = 6_000;  // a burst of edits → one cloud write
const LOCAL_DEBOUNCE_MS = 1_000;

export interface PracticeStore {
  /** Live, mutable snapshot — read it in render; mutate only through update/touch */
  state: PracticeState;
  tick: number;
  loaded: boolean;
  isSaving: boolean;
  cloudOk: boolean | null;
  update: (fn: (s: PracticeState) => void) => void;
  /** Hot path (every keystroke in the editor): persists without a re-render */
  touch: (fn: (s: PracticeState) => void) => void;
  save: (opts?: { silent?: boolean }) => Promise<void>;
}

/** Same persistence contract as the Interview Prep store, over /api/practice. */
export function usePracticeStore(): PracticeStore {
  const stateRef = useRef<PracticeState>({ ...EMPTY_PRACTICE_STATE });
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
    const id = silent ? undefined : toast.loading('Saving Practice Lab…');
    try {
      await saveCloud(stateRef.current, opts?.keepalive);
      dirtyRef.current = false;
      setCloudOk(true);
      if (!silent) toast.success('Practice Lab saved to the cloud.', { id });
    } catch (err) {
      setCloudOk(false);
      if (!silent) toast.error('Cloud sync failed — saved in this browser only.', { id });
      else console.warn('Practice Lab cloud save failed:', err instanceof Error ? err.message : err);
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
    if (local) { stateRef.current = local.state; setTick(t => t + 1); }
    setLoaded(true);
    (async () => {
      try {
        const cloud = await loadCloud();
        setCloudOk(true);
        if (cloud && (!local || cloud.stamp >= local.stamp)) {
          stateRef.current = normalise(cloud.state);
          saveLocal(stateRef.current, cloud.stamp);
          setTick(t => t + 1);
        } else if (local) {
          dirtyRef.current = true;
          save({ silent: true });   // the browser mirror is ahead — push it up
        }
      } catch {
        setCloudOk(false); // no DB reachable — localStorage carries it
      }
    })();
  }, [save]);

  const touch = useCallback((fn: (s: PracticeState) => void) => {
    fn(stateRef.current);
    dirtyRef.current = true;
    scheduleLocal();
    scheduleCloud();
  }, [scheduleLocal, scheduleCloud]);

  const update = useCallback((fn: (s: PracticeState) => void) => {
    touch(fn);
    setTick(t => t + 1);
  }, [touch]);

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

  return { state: stateRef.current, tick, loaded, isSaving, cloudOk, update, touch, save };
}
