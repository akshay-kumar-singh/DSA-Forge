'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { motion, AnimatePresence } from 'motion/react';
import { GripVertical, GripHorizontal, Network, Menu, FileText, Play, Pause, RotateCcw, Check, X, ClipboardList } from 'lucide-react';
import { clsx } from 'clsx';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import Whiteboard from '@/components/google/design/Whiteboard';
import { useTimer, fmtClock } from '@/components/google/shared/useTimer';
import LabList from './LabList';
import type { PracticeStore } from './usePracticeStore';
import { newDesign, type PracticeDesign } from '@/lib/practice/types';

export const DOC_TEMPLATE = `## 1. Requirements
Functional:
-
Non-functional (scale, latency, consistency, availability):
-

## 2. Back-of-envelope
Users / DAU:
QPS (read / write):
Storage per year:
Bandwidth:

## 3. API & data model
Endpoints:
-
Entities + access patterns:
-

## 4. High-level design
(draw it on the whiteboard — then walk one request through the whole path here)

## 5. Deep dive
Component:
Sharding key / cache invalidation / hot keys / failure modes:

## 6. Bottlenecks & what I'd change
-
`;

/** A few titles to start from — one click each, and they are only suggestions. */
const SUGGESTIONS = ['Instagram', 'Twitter / X', 'WhatsApp', 'YouTube', 'Uber', 'Google Docs', 'Ticket booking', 'Payment gateway', 'Food delivery', 'Dropbox', 'Zoom', 'Leaderboard'];

interface Props {
  theme: 'dark' | 'light';
  store: PracticeStore;
  orientation: 'horizontal' | 'vertical';
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Lets the design tell the assistant what is on the board right now */
  boardRef: React.MutableRefObject<ExcalidrawImperativeAPI | null>;
}

/** Your own system designs: pick any product, draw it, write the doc, come back to it. */
export default function DesignLab({ theme, store, orientation, selectedId, onSelect, boardRef }: Props) {
  const s = store.state;
  const design = s.designs.find(d => d.id === selectedId) ?? null;

  const [showLeft, setShowLeft] = useState(true);
  const [showDoc, setShowDoc] = useState(false);
  const [showBrief, setShowBrief] = useState(true);
  const timer = useTimer();

  const patch = useCallback((id: string, fields: Partial<PracticeDesign>) => {
    store.update(st => {
      st.designs = st.designs.map(d => (d.id === id ? { ...d, ...fields, updated: new Date().toISOString() } : d));
    });
  }, [store]);

  const add = (title = '') => {
    const d = newDesign(title);
    store.update(st => { st.designs = [...st.designs, d]; });
    onSelect(d.id);
    setShowBrief(true);
    timer.reset();
  };
  const remove = (id: string) => {
    const d = s.designs.find(x => x.id === id);
    if (!confirm(`Delete "${d?.title || 'Untitled'}"? The drawing and the doc go with it.`)) return;
    store.update(st => { st.designs = st.designs.filter(x => x.id !== id); });
    if (selectedId === id) onSelect(null);
  };

  // Whiteboard and doc are hot paths — persisted without re-rendering the canvas.
  const handleScene = useCallback((json: string) => {
    if (!design) return;
    store.touch(st => {
      const d = st.designs.find(x => x.id === design.id);
      if (d) { d.scene = json; d.updated = new Date().toISOString(); }
    });
  }, [store, design]);
  const handleDoc = useCallback((v: string) => {
    if (!design) return;
    store.touch(st => {
      const d = st.designs.find(x => x.id === design.id);
      if (d) { d.doc = v; d.updated = new Date().toISOString(); }
    });
  }, [store, design]);

  // Local draft for the doc so typing never round-trips through the store's re-render.
  const [doc, setDoc] = useState(design?.doc ?? '');
  const [docId, setDocId] = useState(design?.id ?? null);
  if ((design?.id ?? null) !== docId) { setDocId(design?.id ?? null); setDoc(design?.doc ?? ''); }
  const docRef = useRef({ doc, handleDoc });
  useEffect(() => { docRef.current = { doc, handleDoc }; });
  useEffect(() => {
    const t = setTimeout(() => docRef.current.handleDoc(docRef.current.doc), 500);
    return () => clearTimeout(t);
  }, [doc]);

  // Minutes spent accumulate across sessions, so "45 min on this one" stays honest.
  const secondsRef = useRef(0);
  useEffect(() => { secondsRef.current = timer.seconds; }, [timer.seconds]);
  const idRef = useRef(design?.id);
  useEffect(() => {
    const prev = idRef.current;
    idRef.current = design?.id;
    const spent = Math.round(secondsRef.current / 60);
    if (prev && prev !== design?.id && spent > 0) {
      store.touch(st => { const d = st.designs.find(x => x.id === prev); if (d) d.minutes += spent; });
    }
    if (prev !== design?.id) timer.reset();
  }, [design?.id, store, timer]);

  const items = useMemo(() => s.designs.map(d => ({
    id: d.id,
    title: d.title,
    sub: [d.minutes ? `${d.minutes} min` : '', d.scene && d.scene !== '[]' ? 'drawing' : '', d.doc.trim() ? 'doc' : ''].filter(Boolean).join(' · ') || d.prompt.slice(0, 60),
    done: d.done,
    updated: d.updated,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  })), [store.tick]);

  const isH = orientation === 'horizontal';
  const sep = clsx('gp-handle shrink-0', isH ? 'w-1.5 cursor-col-resize border-x' : 'h-1.5 w-full cursor-row-resize border-y');
  const Grip = isH ? GripVertical : GripHorizontal;

  return (
    <div className="h-full w-full overflow-hidden flex" style={{ background: 'var(--gp-ground)' }}>
      <PanelGroup orientation={orientation} className="h-full w-full">
        {showLeft && (
          <>
            <Panel id="dl-side" defaultSize="24%" minSize="220px" maxSize="40%" className="min-w-0 min-h-0 overflow-hidden">
              <LabList
                icon={<Network size={16} />}
                heading="My designs"
                noun="design"
                items={items}
                selectedId={selectedId}
                onSelect={id => onSelect(id)}
                onNew={() => add()}
                onDelete={remove}
                onClose={() => setShowLeft(false)}
                hint="Nothing here yet. Pick any product — Instagram, Twitter, something from your own work — and design it."
              />
            </Panel>
            <PanelResizeHandle id="dl-sep" className={sep}><Grip size={12} className="gp-t3" /></PanelResizeHandle>
          </>
        )}

        <Panel id="dl-main" minSize="35%" className="min-w-0 min-h-0 overflow-hidden">
          {!design ? (
            <Empty onNew={add} showLeft={showLeft} onOpenList={() => setShowLeft(true)} />
          ) : (
            <div className="h-full flex flex-col relative">
              <div className="h-14 shrink-0 border-b gp-border gp-panel flex items-center gap-2 px-3">
                {!showLeft && <button onClick={() => setShowLeft(true)} className="gp-btn gp-btn-sm gp-btn-icon" title="My designs"><Menu size={15} /></button>}
                <input
                  value={design.title}
                  onChange={e => patch(design.id, { title: e.target.value })}
                  placeholder="What are you designing? — e.g. “Instagram”"
                  className="flex-1 min-w-0 bg-transparent outline-none text-[15px] font-bold gp-t1 placeholder:font-normal placeholder:gp-t3"
                  aria-label="Design title"
                />
                <span className={clsx('gp-num text-lg w-16 text-center shrink-0', timer.minutes >= 42 ? 'gp-red' : timer.minutes >= 32 ? 'gp-yellow' : 'gp-t1')}>{fmtClock(timer.seconds)}</span>
                {timer.running
                  ? <button onClick={timer.pause} className="gp-btn gp-btn-sm gp-btn-icon shrink-0" title="Pause"><Pause size={14} /></button>
                  : <button onClick={timer.start} className="gp-btn gp-btn-primary gp-btn-sm gp-btn-icon shrink-0" title="Start the 45 minutes"><Play size={14} /></button>}
                <button onClick={timer.reset} className="gp-btn gp-btn-sm gp-btn-icon shrink-0" title="Reset the timer"><RotateCcw size={14} /></button>
                <button onClick={() => setShowBrief(v => !v)} className={clsx('gp-btn gp-btn-sm shrink-0', showBrief && 'gp-btn-active')} title="Requirements you wrote">
                  <ClipboardList size={13} /><span className="hidden lg:inline">Brief</span>
                </button>
                <button onClick={() => setShowDoc(v => !v)} className={clsx('gp-btn gp-btn-sm shrink-0', showDoc && 'gp-btn-active')} title="Design doc">
                  <FileText size={13} /><span className="hidden lg:inline">Doc</span>
                </button>
                <button
                  onClick={() => patch(design.id, { done: !design.done })}
                  className={clsx('gp-btn gp-btn-sm shrink-0', design.done && 'gp-btn-active gp-green')}
                  title={design.done ? 'Mark as not done' : 'Mark this design as done'}
                >
                  <Check size={13} /><span className="hidden xl:inline">{design.done ? 'Done' : 'Mark done'}</span>
                </button>
              </div>

              {showBrief && (
                <div className="shrink-0 border-b gp-border gp-sub px-3 py-2.5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="gp-label">Requirements & constraints — your brief</span>
                    <span className="text-[11px] gp-t3 ml-auto">{design.minutes ? `${design.minutes} min logged` : 'first session'}</span>
                    <button onClick={() => setShowBrief(false)} className="gp-btn gp-btn-ghost gp-btn-sm gp-btn-icon gp-t3" title="Hide"><X size={13} /></button>
                  </div>
                  <textarea
                    value={design.prompt}
                    onChange={e => patch(design.id, { prompt: e.target.value })}
                    rows={design.prompt ? Math.min(8, Math.max(2, design.prompt.split('\n').length)) : 2}
                    placeholder={'Design a photo-sharing app: upload, feed, follow. 500M DAU, feed p99 < 200 ms, images up to 10 MB…\n\nThe interviewer reads this, your board and your doc.'}
                    className="gp-input gp-textarea w-full text-[13px]"
                  />
                </div>
              )}

              <div className="flex-1 min-h-0 relative">
                <Whiteboard sceneKey={design.id} theme={theme} initialElements={design.scene} onChange={handleScene} apiRef={boardRef} />
                <AnimatePresence>
                  {showDoc && (
                    <motion.div
                      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                      className="absolute inset-y-0 right-0 w-full md:w-[46%] z-30 flex flex-col gp-side border-l"
                    >
                      <div className="gp-side-head shrink-0">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="gp-blue" />
                          <div><div className="text-[14px] font-bold gp-t1">Design doc</div><div className="text-[11px] gp-t3 truncate max-w-[180px]">{design.title || 'Untitled'}</div></div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!doc.trim() && <button onClick={() => setDoc(DOC_TEMPLATE)} className="gp-btn gp-btn-sm">Insert template</button>}
                          <button onClick={() => setShowDoc(false)} className="gp-btn gp-btn-ghost gp-btn-sm gp-btn-icon gp-t3"><X size={14} /></button>
                        </div>
                      </div>
                      <textarea
                        value={doc}
                        onChange={e => setDoc(e.target.value)}
                        placeholder="Requirements, numbers, API, data model, the request path, the deep dive…"
                        className="flex-1 w-full p-4 text-[13px] font-mono gp-t1 resize-none outline-none leading-relaxed"
                        style={{ background: 'var(--gp-surface)' }}
                      />
                      <p className="px-4 py-2 text-[11px] gp-t3 shrink-0 border-t gp-border">Saved as you type. The interviewer reads this and your whiteboard.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </Panel>
      </PanelGroup>
    </div>
  );
}

function Empty({ onNew, showLeft, onOpenList }: { onNew: (title?: string) => void; showLeft: boolean; onOpenList: () => void }) {
  return (
    <div className="h-full overflow-y-auto flex items-center justify-center p-8">
      <div className="max-w-lg text-center space-y-3">
        <span className="w-12 h-12 rounded-xl flex items-center justify-center gp-purple mx-auto" style={{ background: 'var(--gp-purple-wash)' }}><Network size={22} /></span>
        <div className="gp-h2">Design anything you like</div>
        <p className="text-[13.5px] gp-t2 leading-relaxed">
          Whiteboard, design doc and a 45-minute timer — for any system you want to practise, not just the ones on the plan.
          Everything is saved, so you can come back to it a month later and read your own reasoning.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
          {SUGGESTIONS.map(t => (
            <button key={t} onClick={() => onNew(t)} className="gp-item" title={`Start a design for ${t}`}>{t}</button>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 pt-2">
          <button onClick={() => onNew()} className="gp-btn gp-btn-primary gp-btn-sm">Blank design</button>
          {!showLeft && <button onClick={onOpenList} className="gp-btn gp-btn-sm">Show my designs</button>}
        </div>
      </div>
    </div>
  );
}
