'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { motion, AnimatePresence } from 'motion/react';
import { GripVertical, GripHorizontal, Network, Play, Pause, RotateCcw, FileText, Eye, Flag, X, Server, Layout, Menu, Check, Lightbulb, HelpCircle, CircleDot, Calculator } from 'lucide-react';
import { clsx } from 'clsx';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import Whiteboard from './Whiteboard';
import EstimationDrill from './EstimationDrill';
import GoogleChatPanel, { type QuickAction } from '../shared/GoogleChatPanel';
import { useChat } from '../shared/useChat';
import { useTimer, fmtClock } from '../shared/useTimer';
import type { GoogleStore } from '../useGoogleStore';
import type { AIProvider } from '@/lib/types';
import { DESIGN_PROMPTS, DESIGN_PROMPT_BY_ID, DESIGN_PHASES, DESIGN_CONCEPTS, phaseAt } from '@/lib/google/system-design';
import { buildDesignInterviewerPrompt, parseGrade, stripGradeBlock } from '@/lib/google/ai';
import { diagramToText } from '@/lib/google/diagram-text';
import { trackGoogle } from '@/lib/google/track';
import type { GoogleState } from '@/lib/google/types';

export interface DesignMockHandlers {
  promptId: string;
  onEnd: (r: { score: number | null; verdict: string; feedback: string; minutes: number; strengths?: string[]; improvements?: string[] }) => void;
  onAbort: () => void;
}

interface Props {
  theme: 'dark' | 'light';
  store: GoogleStore;
  provider: AIProvider;
  model: string;
  orientation: 'horizontal' | 'vertical';
  focus?: { n: number; id?: string };
  mock?: DesignMockHandlers;
}

const DOC_TEMPLATE = `## 1. Requirements (0–7 min)
Functional:
- 
Non-functional (scale, latency, consistency, availability):
- 

## 2. Back-of-envelope (7–12 min)
Users / DAU:
QPS (read / write):
Storage per year:
Bandwidth:

## 3. API & data model (12–18 min)
Endpoints:
- 
Entities + access patterns:
- 

## 4. High-level design (18–32 min)
(draw it on the whiteboard — then walk one request through the whole path here)

## 5. Deep dive (32–42 min)
Component:
Sharding key / cache invalidation / hot keys / failure modes:

## 6. Bottlenecks & what I'd change (42–45 min)
- 
`;

const PRACTICE_ACTIONS: QuickAction[] = [
  { label: 'Review whiteboard', icon: Eye, msg: 'Look at my whiteboard as it stands and probe it: pick one box and ask what happens when it dies, or where the hot key is.' },
  { label: 'Next phase', msg: "I'm ready to move to the next phase of the interview. Prompt me for it." },
  { label: 'Where am I weak?', icon: Lightbulb, msg: 'Practice mode: in two sentences, what is the biggest gap in my design so far?' },
];
const MOCK_ACTIONS: QuickAction[] = [
  { label: 'Review whiteboard', icon: Eye, msg: 'Here is my current whiteboard — please react to it as the interviewer.' },
  { label: 'Clarify', icon: HelpCircle, msg: 'Before I design: what scale should I assume — users, reads and writes per second, and the latency target?' },
];

export default function DesignPage({ theme, store, provider, model, orientation, focus, mock }: Props) {
  const s = store.state;
  const isMock = !!mock;
  const [promptId, setPromptId] = useState<string>(() => mock?.promptId ?? DESIGN_PROMPTS[0].id);
  const dp = DESIGN_PROMPT_BY_ID[promptId];
  const [showLeft, setShowLeft] = useState(!isMock);
  const [showRight, setShowRight] = useState(isMock); // chat opens on demand; a mock round is the interview, so it starts open
  const [showDoc, setShowDoc] = useState(false);
  const [showBrief, setShowBrief] = useState(!isMock);
  const [showEstimate, setShowEstimate] = useState(false);
  const [openTrack, setOpenTrack] = useState<Record<string, boolean>>({ backend: true, frontend: true });
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const timer = useTimer();
  const phase = phaseAt(timer.minutes);

  const greeting = isMock
    ? `**Mock system design round** — 45 minutes. Press **Start**, then say "ready" and I'll give you the prompt.`
    : `**${dp.title}** loaded. Press **Start** on the timer, then say "ready" — I'll give you the prompt the way an interviewer would. Draw on the whiteboard; I can read it.`;
  const chat = useChat(provider, model, greeting);

  const currentDiagramText = useCallback(() => {
    const els = apiRef.current?.getSceneElements() ?? (() => { try { return JSON.parse(s.designs[promptId] || '[]'); } catch { return []; } })();
    return diagramToText(els);
  }, [s.designs, promptId]);

  const buildSystem = useCallback(
    () => buildDesignInterviewerPrompt(promptId, timer.minutes, currentDiagramText(), s.designDocs[promptId] ?? '', isMock ? 'mock' : 'practice'),
    [promptId, timer.minutes, currentDiagramText, s.designDocs, isMock],
  );
  const handleSend = useCallback((text?: string) => { const t = text ?? chat.input; if (t.trim()) chat.send(t, buildSystem); }, [chat, buildSystem]);

  const selectPrompt = useCallback((id: string) => {
    if (!DESIGN_PROMPT_BY_ID[id]) return;
    setPromptId(id);
    timer.reset();
    setShowDoc(false);
    chat.reset(`**${DESIGN_PROMPT_BY_ID[id].title}** loaded. Press **Start**, then say "ready" for the prompt.`);
  }, [chat, timer]);

  // Deep link from Today / Plan
  const [prevFocusN, setPrevFocusN] = useState(focus?.n ?? 0);
  if (!isMock && focus && focus.n !== prevFocusN) {
    setPrevFocusN(focus.n);
    if (focus.id === 'estimate') setShowEstimate(true);
    else if (focus.id && focus.id !== promptId && DESIGN_PROMPT_BY_ID[focus.id]) { setPromptId(focus.id); setShowDoc(false); }
  }

  // The first stroke or sentence on a prompt is the "practised" event for the tracker.
  const practised = (st: GoogleState, id: string) => !!((st.designs[id] && st.designs[id] !== '[]') || (st.designDocs[id] ?? '').trim());
  const handleScene = useCallback((json: string) => {
    const before = practised(store.state, promptId);
    store.update(st => { st.designs[promptId] = json; });
    if (!before && practised(store.state, promptId)) trackGoogle('design', DESIGN_PROMPT_BY_ID[promptId].title);
  }, [store, promptId]);
  const doc = s.designDocs[promptId] ?? '';
  const setDoc = (v: string) => {
    const before = practised(s, promptId);
    store.update(st => { st.designDocs[promptId] = v; });
    if (!before && practised(s, promptId)) trackGoogle('design', DESIGN_PROMPT_BY_ID[promptId].title);
  };

  const [grading, setGrading] = useState(false);
  const endMock = useCallback(async () => {
    if (!mock) return;
    setGrading(true); timer.pause();
    const full = await chat.send('The interview is over. Please grade me now.', buildSystem);
    const g = parseGrade(full);
    setGrading(false);
    mock.onEnd({ score: g?.score ?? null, verdict: g?.verdict ?? 'Ungraded', feedback: stripGradeBlock(full), minutes: Math.round(timer.seconds / 60), strengths: g?.strengths, improvements: g?.improvements });
  }, [mock, chat, buildSystem, timer]);

  const isH = orientation === 'horizontal';
  const sep = clsx('gp-handle shrink-0', isH ? 'w-1.5 cursor-col-resize border-x' : 'h-1.5 w-full cursor-row-resize border-y');
  const Grip = isH ? GripVertical : GripHorizontal;
  const done = useMemo(() => new Set(DESIGN_PROMPTS.filter(d => (s.designs[d.id] && s.designs[d.id] !== '[]') || (s.designDocs[d.id] ?? '').trim()).map(d => d.id)), [s.designs, s.designDocs]);
  const phaseIdx = DESIGN_PHASES.findIndex(p => p.id === phase.id);

  return (
    <div className="h-full w-full overflow-hidden" style={{ background: 'var(--gp-ground)' }}>
      <PanelGroup orientation={orientation} className="h-full w-full">
        {showLeft && !isMock && (
          <>
            <Panel id="d-side" defaultSize="22%" minSize="210px" maxSize="36%" className="min-w-0 min-h-0 overflow-hidden">
              <div className="h-full flex flex-col gp-side border-r">
                <div className="gp-side-head shrink-0">
                  <div className="flex items-center gap-2"><span className="w-8 h-8 rounded-lg flex items-center justify-center gp-green" style={{ background: 'var(--gp-green-wash)' }}><Network size={16} /></span><div><div className="text-[14px] font-bold gp-t1">System design</div><div className="text-[11px] gp-t3">{done.size}/{DESIGN_PROMPTS.length} practised · 45 min each</div></div></div>
                  <button onClick={() => setShowLeft(false)} className="gp-btn gp-btn-ghost gp-btn-sm gp-btn-icon gp-t3" title="Close"><X size={14} /></button>
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-1">
                  {(['backend', 'frontend'] as const).map(track => (
                    <div key={track}>
                      <button onClick={() => setOpenTrack(o => ({ ...o, [track]: !o[track] }))} className="gp-side-group">
                        {track === 'backend' ? <Server size={12} className="gp-blue" /> : <Layout size={12} className="gp-green" />}
                        <span className="flex-1 text-left">{track === 'backend' ? 'Backend / distributed' : 'Frontend — your edge'}</span>
                        {openTrack[track] ? <CircleDot size={11} /> : <CircleDot size={11} className="opacity-40" />}
                      </button>
                      {openTrack[track] && DESIGN_PROMPTS.filter(d => d.track === track).map(d => (
                        <button key={d.id} onClick={() => selectPrompt(d.id)} className={clsx('gp-side-item', d.id === promptId && 'gp-side-item-active')}>
                          <span className={clsx('w-4 h-4 rounded-full flex items-center justify-center shrink-0', done.has(d.id) ? 'gp-chip-green' : 'gp-inset')}>{done.has(d.id) && <Check size={10} />}</span>
                          <span className="flex-1 min-w-0 truncate">{d.title.replace('Frontend: ', '')}</span>
                          <span className={clsx('gp-chip gp-chip-xs', d.tier === 'core' ? 'gp-chip-yellow' : '')}>{d.tier}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                  <div className="pt-3 px-1">
                    <div className="gp-label mb-1.5">Own these cold</div>
                    <div className="flex flex-wrap gap-1">{DESIGN_CONCEPTS.map(c => <span key={c} className="gp-chip gp-chip-xs">{c}</span>)}</div>
                  </div>
                </div>
              </div>
            </Panel>
            <PanelResizeHandle id="d-sep-l" className={sep}><Grip size={12} className="gp-t3" /></PanelResizeHandle>
          </>
        )}

        <Panel id="d-board" minSize="35%" className="min-w-0 min-h-0 overflow-hidden">
          <div className="h-full flex flex-col relative">
            <header className="h-14 border-b gp-border gp-panel flex items-center gap-2 px-3 shrink-0">
              {!showLeft && !isMock && <button onClick={() => setShowLeft(true)} className="gp-btn gp-btn-sm gp-btn-icon" title="Prompts"><Menu size={15} /></button>}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><h2 className="text-[15px] font-bold gp-t1 truncate">{dp.title}</h2>{isMock && <span className="gp-chip gp-chip-xs gp-chip-red">mock</span>}</div>
                <div className="text-[11px] gp-t3 truncate">{phase.label} · {phase.startMin}–{phase.endMin} min · {phase.goal}</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={clsx('gp-num text-lg w-16 text-center', timer.minutes >= 42 ? 'gp-red' : timer.minutes >= 32 ? 'gp-yellow' : 'gp-t1')}>{fmtClock(timer.seconds)}</span>
                {timer.running
                  ? <button onClick={timer.pause} className="gp-btn gp-btn-sm gp-btn-icon" title="Pause"><Pause size={14} /></button>
                  : <button onClick={timer.start} className="gp-btn gp-btn-primary gp-btn-sm gp-btn-icon" title="Start the 45 minutes"><Play size={14} /></button>}
                {!isMock && <button onClick={timer.reset} className="gp-btn gp-btn-sm gp-btn-icon" title="Reset timer"><RotateCcw size={14} /></button>}
                {!isMock && <button onClick={() => setShowBrief(v => !v)} className={clsx('gp-btn gp-btn-sm', showBrief && 'gp-btn-active')} title="Interview brief"><Eye size={14} /><span className="hidden xl:inline">Brief</span></button>}
                {!isMock && <button onClick={() => setShowEstimate(true)} className="gp-btn gp-btn-sm" title="Estimation drill: QPS, storage, bandwidth from a random scenario"><Calculator size={14} /><span className="hidden xl:inline">Estimate</span></button>}
                <button onClick={() => setShowDoc(v => !v)} className={clsx('gp-btn gp-btn-sm', showDoc && 'gp-btn-active')} title="Design doc"><FileText size={14} /><span className="hidden xl:inline">Doc</span></button>
                {isMock && <button onClick={endMock} disabled={grading} className="gp-btn gp-btn-danger gp-btn-sm"><Flag size={13} />{grading ? 'Grading…' : 'End & grade'}</button>}
                {isMock && <button onClick={mock?.onAbort} className="gp-btn gp-btn-ghost gp-btn-sm gp-t3">Abandon</button>}
                {!showRight && <button onClick={() => setShowRight(true)} className="gp-btn gp-btn-sm gp-btn-icon" title="Interviewer"><Network size={15} /></button>}
              </div>
            </header>

            {/* Phase strip */}
            <div className="h-7 shrink-0 flex border-b gp-border gp-panel">
              {DESIGN_PHASES.map((ph, i) => (
                <div key={ph.id} title={`${ph.startMin}–${ph.endMin} min · ${ph.goal}`} className={clsx('gp-phase', i === phaseIdx && timer.seconds > 0 && 'gp-phase-active', i < phaseIdx && 'gp-phase-past')} style={{ flex: ph.endMin - ph.startMin }}>
                  <span className="truncate px-1">{i < phaseIdx ? '✓ ' : ''}{ph.label}</span>
                </div>
              ))}
            </div>

            {showBrief && !isMock && (
              <div className="shrink-0 max-h-44 overflow-y-auto border-b gp-border gp-sub px-4 py-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-[12.5px] gp-t2 leading-relaxed">
                <div className="md:col-span-2"><span className="gp-label mr-2">Prompt</span><span className="gp-t1 font-medium">“{dp.prompt}”</span></div>
                <div><span className="gp-label block mb-0.5">Ask first</span>{dp.clarifiers.join(' · ')}</div>
                <div><span className="gp-label block mb-0.5">Must cover</span>{dp.mustCover.join(' · ')}</div>
                <div><span className="gp-label block mb-0.5">Expect probes on</span>{dp.deepDives.join(' · ')}</div>
                <div><span className="gp-label block mb-0.5">Reasonable numbers</span>{dp.scale.join(' · ')}</div>
                {dp.edge && <div className="md:col-span-2 gp-green"><span className="gp-label gp-green mr-2">Your edge</span>{dp.edge}</div>}
              </div>
            )}

            <div className="flex-1 min-h-0 relative">
              <Whiteboard sceneKey={promptId} theme={theme} initialElements={s.designs[promptId] ?? ''} onChange={handleScene} apiRef={apiRef} />
              <AnimatePresence>
                {showDoc && (
                  <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                    className="absolute inset-y-0 right-0 w-full md:w-[46%] z-30 flex flex-col gp-side border-l">
                    <div className="gp-side-head shrink-0">
                      <div className="flex items-center gap-2"><FileText size={16} className="gp-blue" /><div><div className="text-[14px] font-bold gp-t1">Design doc</div><div className="text-[11px] gp-t3">{dp.title}</div></div></div>
                      <div className="flex items-center gap-1">
                        {!doc.trim() && <button onClick={() => setDoc(DOC_TEMPLATE)} className="gp-btn gp-btn-sm">Insert template</button>}
                        <button onClick={() => setShowDoc(false)} className="gp-btn gp-btn-ghost gp-btn-sm gp-btn-icon gp-t3"><X size={14} /></button>
                      </div>
                    </div>
                    <textarea value={doc} onChange={e => setDoc(e.target.value)} placeholder="Requirements, numbers, API, data model, the request path, the deep dive…"
                      className="flex-1 w-full p-4 text-[13px] font-mono gp-t1 resize-none outline-none leading-relaxed" style={{ background: 'var(--gp-surface)' }} />
                    <p className="px-4 py-2 text-[11px] gp-t3 shrink-0 border-t gp-border">The interviewer reads this doc and your whiteboard automatically.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Panel>

        {showRight && (
          <>
            <PanelResizeHandle id="d-sep-r" className={sep}><Grip size={12} className="gp-t3" /></PanelResizeHandle>
            <Panel id="d-chat" defaultSize="28%" minSize="240px" maxSize="50%" className="min-w-0 min-h-0 overflow-hidden">
              <GoogleChatPanel theme={theme} title="Interviewer" subtitle={isMock ? 'Mock — no coaching until the end' : `Practice · ${phase.label}`} icon={<Network size={16} />}
                messages={chat.messages} input={chat.input} isLoading={chat.isLoading} quickActions={isMock ? MOCK_ACTIONS : PRACTICE_ACTIONS}
                placeholder="Drive the conversation: state requirements, pin numbers, propose, defend…"
                onInputChange={chat.setInput} onSend={handleSend} onStop={chat.stop}
                onClear={isMock ? undefined : () => chat.reset(`**${dp.title}** — chat cleared. Say "ready" for the prompt.`)} onClose={() => setShowRight(false)} />
            </Panel>
          </>
        )}
      </PanelGroup>
      {showEstimate && <EstimationDrill onClose={() => setShowEstimate(false)} />}
    </div>
  );
}
