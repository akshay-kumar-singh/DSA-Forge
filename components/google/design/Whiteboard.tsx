'use client';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import '@excalidraw/excalidraw/index.css';

// Excalidraw touches window at import time → client-only, loaded on demand.
const Excalidraw = dynamic(async () => (await import('@excalidraw/excalidraw')).Excalidraw, {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-[10px] font-mono uppercase tracking-widest text-text-muted">
      loading whiteboard…
    </div>
  ),
});

interface Props {
  /** Remount key — a new prompt gets a fresh scene */
  sceneKey: string;
  theme: 'dark' | 'light';
  initialElements: string;                 // JSON array (may be "" / "[]")
  onChange: (elementsJSON: string) => void; // debounced
  apiRef: React.MutableRefObject<ExcalidrawImperativeAPI | null>;
}

export default function Whiteboard({ sceneKey, theme, initialElements, onChange, apiRef }: Props) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastJSON = useRef(initialElements);

  const initialData = useMemo(() => {
    let elements: unknown[] = [];
    try { const parsed = JSON.parse(initialElements || '[]'); if (Array.isArray(parsed)) elements = parsed; } catch { /* fresh scene */ }
    return { elements: elements as never[], appState: { viewBackgroundColor: 'transparent' }, scrollToContent: true };
  }, [initialElements]);

  const handleChange = useCallback((elements: readonly unknown[]) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const json = JSON.stringify(elements.filter((e) => !(e as { isDeleted?: boolean }).isDeleted));
      if (json !== lastJSON.current) { lastJSON.current = json; onChange(json); }
    }, 600);
  }, [onChange]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <div className="h-full w-full google-whiteboard" data-theme={theme}>
      <Excalidraw
        key={sceneKey}
        theme={theme}
        initialData={initialData}
        onChange={handleChange}
        excalidrawAPI={(api) => { apiRef.current = api; }}
        UIOptions={{ canvasActions: { loadScene: false, saveToActiveFile: false, export: false, saveAsImage: true, toggleTheme: false } }}
        name="system-design"
      />
    </div>
  );
}
