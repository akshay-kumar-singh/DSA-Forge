'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** Count-up timer in whole seconds with start/pause/reset. */
export function useTimer() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const startedAt = useRef<number | null>(null);
  const base = useRef(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      if (startedAt.current != null) setSeconds(base.current + Math.floor((Date.now() - startedAt.current) / 1000));
    }, 500);
    return () => clearInterval(id);
  }, [running]);

  const start = useCallback(() => { if (running) return; startedAt.current = Date.now(); setRunning(true); }, [running]);
  const pause = useCallback(() => { if (!running) return; base.current = seconds; startedAt.current = null; setRunning(false); }, [running, seconds]);
  const reset = useCallback(() => { base.current = 0; startedAt.current = null; setSeconds(0); setRunning(false); }, []);

  return { seconds, minutes: Math.floor(seconds / 60), running, start, pause, reset };
}

export function fmtClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60), s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
