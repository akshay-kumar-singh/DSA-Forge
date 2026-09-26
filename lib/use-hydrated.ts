'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => { /* never changes after hydration */ };

/**
 * False while rendering on the server and during the hydration render, true
 * afterwards. Use it to gate reads of browser-only state (localStorage) so the
 * first client render still matches the server's HTML — the alternative, reading
 * storage during the first render, is a hydration mismatch.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
