'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { BookOpen, Eye, Pencil, PenTool, RotateCcw, ArrowRight, Check, GripHorizontal } from 'lucide-react';
import { clsx } from 'clsx';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import Whiteboard from '../design/Whiteboard';
import Markdown from '../shared/Markdown';
import type { GoogleStore } from '../useGoogleStore';
import type { GoogleSection, PlanDay } from '@/lib/google/types';
import { theoryFor } from '@/lib/google/theory';
import { fmtDate } from '@/lib/google/plan';

interface Props {
  theme: 'dark' | 'light';
  section: GoogleSection;
  store: GoogleStore;
  schedule: Map<string, PlanDay>;
  bonus: Set<string>;
  onOpenProblem: (name: string) => void;
}

/**
 * A section's pattern notes: the built-in write-up (idea, trigger, code
 * shape, worked examples, diagrams), which the user can rewrite in place
 * and sketch under. Edits and sketches live in the state, per section.
 */
export default function TheoryView({ theme, section, store, schedule, bonus, onOpenProblem }: Props) {
  const s = store.state;
  const builtIn = theoryFor(section);
  const text = s.theory[section.id] ?? builtIn;
  const edited = section.id in s.theory;

  const [mode, setMode] = useState<'read' | 'edit'>('read');
  const [sketch, setSketch] = useState(false);
  const [prevId, setPrevId] = useState(section.id);
  if (prevId !== section.id) { setPrevId(section.id); setMode('read'); setSketch(false); }

  const save = useCallback((v: string) => store.update(st => {
    if (v === builtIn) delete st.theory[section.id]; else st.theory[section.id] = v;
  }), [store, section.id, builtIn]);
  const reset = () => {
    if (!confirm('Restore the built-in notes for this pattern? Your edits to this section will be lost.')) return;
    store.update(st => { delete st.theory[section.id]; });
    setMode('read');
  };

  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const handleScene = useCallback((json: string) => store.update(st => { st.sketches[section.id] = json; }), [store, section.id]);
  const hasSketch = !!s.sketches[section.id] && s.sketches[section.id] !== '[]';

  // Problems in plan order — the list to walk after reading
  const ordered = useMemo(() => {
    const day = (n: string) => schedule.get(n)?.day ?? Number.POSITIVE_INFINITY;
    return section.problems.map((p, i) => ({ p, i })).sort((a, b) => day(a.p.name) - day(b.p.name) || a.i - b.i).map(x => x.p);
  }, [section, schedule]);
  const mastered = ordered.filter(p => s.mastered.includes(p.name)).length;
  const next = ordered.find(p => !s.mastered.includes(p.name));

  const notes = (
    <div className="h-full overflow-y-auto">
      <div className={clsx('mx-auto px-5 py-6 md:px-8', mode === 'edit' ? 'max-w-6xl' : 'max-w-3xl')}>
        {mode === 'read' ? (
          <Markdown text={text} theme={theme} />
        ) : (
          <TheoryEditor key={section.id} value={text} theme={theme} onChange={save} />
        )}

        <div className="mt-10 gp-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="gp-label">Then solve, in this order</div>
            <span className="gp-chip gp-chip-xs ml-auto">{mastered}/{ordered.length} mastered</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ordered.map(p => {
              const done = s.mastered.includes(p.name);
              const d = schedule.get(p.name);
              return (
                <button key={p.name} onClick={() => onOpenProblem(p.name)} className={clsx('gp-item', done && 'gp-item-done', bonus.has(p.name) && !done && 'opacity-70')} title={`${p.difficulty}${d ? ` · day ${d.day + 1} · ${fmtDate(d.date)}` : ''}${bonus.has(p.name) ? ' · bonus' : ''}`}>
                  {done && <Check size={12} className="gp-green" />}
                  <span>{p.name}</span>
                  <span className={clsx('gp-diff', `gp-diff-${p.difficulty}`)}>{p.difficulty[0].toUpperCase()}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full w-full flex flex-col overflow-hidden" style={{ background: 'var(--gp-ground)' }}>
      <div className="h-12 shrink-0 border-b gp-border gp-panel flex items-center gap-2 px-3">
        <span className="w-7 h-7 rounded-lg flex items-center justify-center gp-blue shrink-0" style={{ background: 'var(--gp-blue-wash)' }}><BookOpen size={15} /></span>
        <div className="min-w-0">
          <div className="text-[13.5px] font-bold gp-t1 truncate leading-tight">{section.title}</div>
          <div className="text-[11px] gp-t3 truncate">Pattern notes · W{section.week}{edited ? ' · your version' : ''}</div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <div className="flex items-center rounded-lg border gp-border overflow-hidden">
            <button onClick={() => setMode('read')} className={clsx('gp-btn gp-btn-sm !rounded-none !border-0', mode === 'read' && 'gp-btn-active')} title="Read the notes"><Eye size={13} /><span className="hidden md:inline">Read</span></button>
            <button onClick={() => setMode('edit')} className={clsx('gp-btn gp-btn-sm !rounded-none !border-0 border-l gp-border', mode === 'edit' && 'gp-btn-active')} title="Edit the notes in your own words (markdown, saved automatically)"><Pencil size={13} /><span className="hidden md:inline">Edit</span></button>
          </div>
          <button onClick={() => setSketch(v => !v)} className={clsx('gp-btn gp-btn-sm', sketch && 'gp-btn-active')} title="A whiteboard under the notes for your own diagrams — saved with this section">
            <PenTool size={13} /><span className="hidden md:inline">Sketch</span>{hasSketch && !sketch && <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--gp-blue)' }} />}
          </button>
          {edited && (
            <button onClick={reset} className="gp-btn gp-btn-ghost gp-btn-sm gp-t3" title="Throw away your edits and restore the built-in notes"><RotateCcw size={13} /><span className="hidden lg:inline">Reset</span></button>
          )}
          {next && (
            <button onClick={() => onOpenProblem(next.name)} className="gp-btn gp-btn-primary gp-btn-sm" title={`Open ${next.name}`}>
              <span className="hidden sm:inline">Start solving</span><ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {sketch ? (
          <PanelGroup orientation="vertical" className="h-full w-full">
            <Panel id="theory-notes" defaultSize="55%" minSize="20%" className="min-h-0 overflow-hidden">{notes}</Panel>
            <PanelResizeHandle id="theory-sep" className="gp-handle shrink-0 h-1.5 w-full cursor-row-resize border-y"><GripHorizontal size={12} className="gp-t3" /></PanelResizeHandle>
            <Panel id="theory-sketch" minSize="20%" className="min-h-0 overflow-hidden">
              <Whiteboard sceneKey={`theory:${section.id}`} theme={theme} initialElements={s.sketches[section.id] ?? ''} onChange={handleScene} apiRef={apiRef} />
            </Panel>
          </PanelGroup>
        ) : notes}
      </div>
    </div>
  );
}

/** Markdown source on the left, live preview on the right (stacked on narrow screens). Saves 600 ms after the last keystroke. */
function TheoryEditor({ value, theme, onChange }: { value: string; theme: 'dark' | 'light'; onChange: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ draft, value, onChange });
  useEffect(() => { latest.current = { draft, value, onChange }; });
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    const { draft: d, value: v, onChange: fn } = latest.current;
    if (d !== v) fn(d); // leaving edit mode flushes
  }, []);
  const edit = (v: string) => {
    setDraft(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(v), 600);
  };
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 -mx-2">
      <div className="space-y-1.5">
        <div className="gp-label px-1">Markdown · saved automatically</div>
        <textarea value={draft} onChange={e => edit(e.target.value)} spellCheck={false} className="gp-input gp-md-editor w-full min-h-[70vh]" />
        <p className="text-[11px] gp-t3 px-1">Headings <code>##</code>, lists <code>-</code>, code <code>~~~js</code>, tables <code>| a | b |</code>, diagrams <code>~~~mermaid</code>. Your version replaces the built-in notes; Reset brings them back.</p>
      </div>
      <div className="hidden xl:block space-y-1.5">
        <div className="gp-label px-1">Preview</div>
        <div className="gp-card p-5 max-h-[70vh] overflow-y-auto"><Markdown text={draft} theme={theme} /></div>
      </div>
    </div>
  );
}
