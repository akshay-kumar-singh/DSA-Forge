'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import Editor from '@monaco-editor/react';
import { GripVertical, GripHorizontal, FileSearch, Play, Pause, RotateCcw, Lock, Check, Flag, AlertTriangle, Eye, FileCode2, Menu, Lightbulb, HelpCircle, Gauge, Timer as TimerIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import type { QuickAction } from '../shared/GoogleChatPanel';
import type { AssistantHandle } from '../shared/useAssistant';
import { useTimer, fmtClock } from '../shared/useTimer';
import type { GoogleStore } from '../useGoogleStore';
import type { AIProvider } from '@/lib/types';
import { COMPREHENSION, COMPREHENSION_BY_ID, exerciseLines, type ComprehensionExercise } from '@/lib/google/comprehension';
import { buildComprehensionInterviewerPrompt, parseGrade, stripGradeBlock } from '@/lib/google/ai';
import { trackGoogle } from '@/lib/google/track';

interface Props {
  theme: 'dark' | 'light';
  store: GoogleStore;
  provider: AIProvider;
  model: string;
  orientation: 'horizontal' | 'vertical';
  editorFontSize: number;
  editorFontFamily: string;
  /** The shared assistant — this tab registers the Interviewer */
  ai: AssistantHandle;
  focus?: { n: number; id?: string };
}

const ROUND_MIN = 60;

const LOCKED_ACTIONS: QuickAction[] = [
  { label: 'What is this round?', icon: HelpCircle, msg: 'What exactly is this round testing, and how should I spend the 60 minutes?' },
];
const OPEN_ACTIONS: QuickAction[] = [
  { label: 'Check my hypothesis', icon: Check, msg: 'Here is my hypothesis as submitted. Is the mechanism I described possible in this code? Answer only about what I wrote — do not tell me the bug.' },
  { label: 'Explain this function', icon: FileCode2, msg: 'Walk me through what this function does line by line, without commenting on whether it is correct: ' },
  { label: 'What would this input do?', icon: Gauge, msg: 'If I call it with this input, what does it return? Trace it, do not judge it: ' },
  { label: 'Follow-up & optimise', icon: Lightbulb, msg: 'My fix is in. What feature would you ask me to add next, and what would you ask me to make faster?' },
];

/**
 * The code comprehension round: an unfamiliar codebase, one planted bug, 60
 * minutes. The flow is deliberately gated — you commit to a written hypothesis
 * before the assistant will discuss the code at all, because forming it yourself
 * is most of what this round scores.
 */
export default function ComprehensionPage({ theme, store, orientation, editorFontSize, editorFontFamily, ai, focus }: Props) {
  const s = store.state;

  const [exerciseId, setExerciseId] = useState<string>(() => COMPREHENSION[0].id);
  const ex: ComprehensionExercise = COMPREHENSION_BY_ID[exerciseId] ?? COMPREHENSION[0];
  const run = s.comprehension[ex.id];

  const [showLeft, setShowLeft] = useState(true);
  const [fileName, setFileName] = useState(ex.files[0].name);
  const [draft, setDraft] = useState('');           // the hypothesis being typed
  const [grading, setGrading] = useState(false);
  const timer = useTimer();

  // Switching exercise: reset the view to that exercise's first file and its own draft.
  const [prevId, setPrevId] = useState(exerciseId);
  if (prevId !== exerciseId) {
    setPrevId(exerciseId);
    setFileName(ex.files[0].name);
    setDraft('');
    timer.reset();
  }

  // Deep link from Today / Plan
  const [prevFocusN, setPrevFocusN] = useState(focus?.n ?? 0);
  if (focus && focus.n !== prevFocusN) {
    setPrevFocusN(focus.n);
    if (focus.id && COMPREHENSION_BY_ID[focus.id]) setExerciseId(focus.id);
  }

  const submitted = !!run?.hypothesis;
  const revealed = !!run?.revealed;
  const graded = run?.score != null;

  // The candidate's edited source, falling back to the shipped file.
  const sourceOf = useCallback((name: string) => {
    const saved = s.comprehension[ex.id]?.code?.[name];
    return saved ?? (ex.files.find(f => f.name === name)?.code ?? '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex, store.tick]);
  const filesNow = useCallback(() => ex.files.map(f => ({ name: f.name, code: sourceOf(f.name) })), [ex, sourceOf]);

  const patchRun = useCallback((fields: Partial<NonNullable<typeof run>>) => {
    store.update(st => {
      const prev = st.comprehension[ex.id] ?? { hypothesis: '', code: {}, score: null, minutes: 0, date: new Date().toISOString() };
      st.comprehension[ex.id] = { ...prev, ...fields };
    });
  }, [store, ex.id]);

  // Code edits are a hot path — written straight through without a re-render.
  const handleCode = useCallback((value: string | undefined) => {
    if (value == null) return;
    store.update(st => {
      const prev = st.comprehension[ex.id] ?? { hypothesis: '', code: {}, score: null, minutes: 0, date: new Date().toISOString() };
      st.comprehension[ex.id] = { ...prev, code: { ...prev.code, [fileName]: value } };
    });
  }, [store, ex.id, fileName]);

  const submitHypothesis = () => {
    const text = draft.trim();
    if (text.length < 40) { toast.error('Be specific — name the file, the mechanism, and an input that would fail.'); return; }
    patchRun({ hypothesis: text, date: new Date().toISOString(), minutes: Math.round(timer.seconds / 60) });
    store.save({ silent: true });
    ai.open();
    toast.success('Hypothesis locked in. The assistant is open.');
  };

  const reveal = () => {
    if (!confirm('Reveal the root cause and the fix? Do this only after your own attempt — you cannot unsee it.')) return;
    patchRun({ revealed: true });
  };

  // ── The assistant wears the Interviewer hat here; the prompt reads the live files ──
  const stageRef = useRef<'locked' | 'debug' | 'grade'>('locked');
  const minutesRef = useRef(0);
  useEffect(() => { stageRef.current = submitted ? 'debug' : 'locked'; minutesRef.current = timer.minutes; });
  const buildSystem = useCallback(
    () => buildComprehensionInterviewerPrompt(ex, minutesRef.current, s.comprehension[ex.id]?.hypothesis ?? '', filesNow(), stageRef.current),
    [ex, s, filesNow],
  );
  useEffect(() => {
    ai.register({
      scope: `comprehension:${ex.id}`,
      title: 'Interviewer',
      subtitle: `${ex.title} — answers what you ask, never names the bug`,
      greeting: `**${ex.title}** — ${ex.files.length} files, ${exerciseLines(ex)} lines, 60 minutes.\n\nRead the code and write your own hypothesis first; I will not discuss this codebase until you have. Then ask me precise questions — what a function does, what an input produces — and I will answer exactly that.`,
      buildSystem,
      quickActions: submitted ? OPEN_ACTIONS : LOCKED_ACTIONS,
      placeholder: submitted ? 'Ask something specific about the code…' : 'Locked — submit your hypothesis in step 1 first',
      clearable: true,
    });
    return () => ai.register(null);
  }, [ai, ex, buildSystem, submitted]);

  const endRound = useCallback(async () => {
    setGrading(true);
    timer.pause();
    stageRef.current = 'grade';
    ai.open();
    const full = await ai.send('The round is over. Grade me now on code reading, hypothesis quality, fix correctness and prompt precision.');
    const g = parseGrade(full);
    stageRef.current = submitted ? 'debug' : 'locked';
    setGrading(false);
    patchRun({
      score: g?.score ?? null,
      feedback: stripGradeBlock(full),
      minutes: Math.round(timer.seconds / 60),
      date: new Date().toISOString(),
      revealed: true,
    });
    store.save({ silent: true });
    if (g?.score != null) trackGoogle('comprehension', `${ex.title} · ${g.score.toFixed(1)} ${g.verdict}`);
  }, [ai, timer, patchRun, store, ex.title, submitted]);

  const isH = orientation === 'horizontal';
  const sep = clsx('gp-handle shrink-0', isH ? 'w-1.5 cursor-col-resize border-x' : 'h-1.5 w-full cursor-row-resize border-y');
  const Grip = isH ? GripVertical : GripHorizontal;
  const done = COMPREHENSION.filter(e => s.comprehension[e.id]?.score != null).length;

  return (
    <div className="h-full w-full overflow-hidden flex" style={{ background: 'var(--gp-ground)' }}>
      <PanelGroup orientation={orientation} className="h-full w-full">
        {showLeft && (
          <>
            <Panel id="cx-side" defaultSize="21%" minSize="200px" maxSize="36%" className="min-w-0 min-h-0 overflow-hidden">
              <div className="h-full w-full flex flex-col overflow-hidden gp-side border-r">
                <div className="gp-side-head shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center gp-red shrink-0" style={{ background: 'var(--gp-red-wash)' }}><FileSearch size={16} /></span>
                    <div className="min-w-0">
                      <div className="text-[14px] font-bold gp-t1 truncate">Comprehension</div>
                      <div className="text-[11px] gp-t3">{done}/{COMPREHENSION.length} rounds done</div>
                    </div>
                  </div>
                  <button onClick={() => setShowLeft(false)} className="gp-btn gp-btn-ghost gp-btn-sm gp-btn-icon gp-t3" title="Close the list">&times;</button>
                </div>
                <div className="px-3 py-2.5 text-[11.5px] gp-t3 leading-snug border-b gp-border">
                  An unfamiliar codebase, one planted bug, 60 minutes: read it, write your hypothesis, fix it, then add the feature and make it faster. The assistant stays locked until your hypothesis is in.
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-1">
                  {COMPREHENSION.map(e => {
                    const r = s.comprehension[e.id];
                    return (
                      <button
                        key={e.id}
                        onClick={() => setExerciseId(e.id)}
                        className={clsx('w-full text-left px-3 py-2.5 rounded-[10px] border transition-colors', e.id === ex.id ? 'gp-accent-card' : 'border-transparent hover:bg-[var(--gp-surface-2)]')}
                      >
                        <div className="flex items-center gap-1.5">
                          {r?.score != null && <Check size={12} className="gp-green shrink-0" />}
                          <span className={clsx('flex-1 min-w-0 truncate text-[13px] font-semibold', e.id === ex.id ? 'gp-blue' : 'gp-t1')}>{e.title}</span>
                          <span className={clsx('gp-diff', `gp-diff-${e.difficulty}`)}>{e.difficulty[0].toUpperCase()}</span>
                        </div>
                        <div className="text-[11px] gp-t3 mt-0.5">
                          {e.files.length} files · {exerciseLines(e)} lines{r?.score != null ? ` · ${r.score.toFixed(1)}` : r?.hypothesis ? ' · in progress' : ''}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </Panel>
            <PanelResizeHandle id="cx-sep-l" className={sep}><Grip size={12} className="gp-t3" /></PanelResizeHandle>
          </>
        )}

        {/* ── The codebase ── */}
        <Panel id="cx-code" minSize="30%" className="min-w-0 min-h-0 overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="h-12 shrink-0 border-b gp-border gp-panel flex items-center gap-2 px-3">
              {!showLeft && <button onClick={() => setShowLeft(true)} className="gp-btn gp-btn-sm gp-btn-icon" title="Exercises"><Menu size={15} /></button>}
              <div className="flex items-center gap-1 overflow-x-auto min-w-0">
                {ex.files.map(f => (
                  <button
                    key={f.name}
                    onClick={() => setFileName(f.name)}
                    className={clsx('gp-tab !h-8 shrink-0 font-mono !text-[11.5px] normal-case', fileName === f.name && 'gp-tab-active')}
                    title={f.name}
                  >
                    {f.name}
                    {s.comprehension[ex.id]?.code?.[f.name] != null && <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--gp-yellow)' }} title="edited" />}
                  </button>
                ))}
              </div>
              <span className="ml-auto text-[11px] gp-t3 shrink-0 hidden lg:inline">{exerciseLines(ex)} lines</span>
            </div>
            <div className="flex-1 min-h-0">
              <Editor
                key={`${ex.id}:${fileName}`}
                height="100%"
                language={fileName.endsWith('.jsx') ? 'javascript' : 'javascript'}
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                value={sourceOf(fileName)}
                onChange={handleCode}
                options={{
                  fontSize: editorFontSize,
                  fontFamily: editorFontFamily,
                  minimap: { enabled: true },
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'off',
                  renderLineHighlight: 'line',
                }}
              />
            </div>
          </div>
        </Panel>

        <PanelResizeHandle id="cx-sep-r" className={sep}><Grip size={12} className="gp-t3" /></PanelResizeHandle>

        {/* ── The round: brief, three steps, grade ── */}
        <Panel id="cx-flow" defaultSize="30%" minSize="260px" maxSize="46%" className="min-w-0 min-h-0 overflow-hidden">
          <div className="h-full flex flex-col gp-side border-l">
            <div className="h-12 shrink-0 border-b gp-border flex items-center gap-2 px-3">
              <TimerIcon size={14} className={clsx(timer.minutes >= 52 ? 'gp-red' : timer.minutes >= 40 ? 'gp-yellow' : 'gp-blue')} />
              <span className={clsx('gp-num text-lg', timer.minutes >= 52 ? 'gp-red' : 'gp-t1')}>{fmtClock(timer.seconds)}</span>
              <span className="text-[11px] gp-t3 whitespace-nowrap truncate min-w-0 hidden lg:inline">
                / {ROUND_MIN} min · {timer.minutes < 20 ? 'read & hypothesise' : timer.minutes < 40 ? 'fix & verify' : timer.minutes < 52 ? 'follow-up' : 'optimise'}
              </span>
              <div className="ml-auto flex items-center gap-1.5 shrink-0">
                {timer.running
                  ? <button onClick={timer.pause} className="gp-btn gp-btn-sm gp-btn-icon" title="Pause"><Pause size={13} /></button>
                  : <button onClick={timer.start} className="gp-btn gp-btn-primary gp-btn-sm gp-btn-icon" title="Start the 60 minutes"><Play size={13} /></button>}
                <button onClick={timer.reset} className="gp-btn gp-btn-sm gp-btn-icon" title="Reset the timer"><RotateCcw size={13} /></button>
                <button onClick={endRound} disabled={grading || !submitted} className="gp-btn gp-btn-danger gp-btn-sm" title={submitted ? 'End the round and get graded' : 'Submit your hypothesis first'}>
                  <Flag size={12} />{grading ? 'Grading…' : 'End & grade'}
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
              {/* The ticket */}
              <div className="gp-card p-3 space-y-1.5">
                <div className="gp-label flex items-center gap-1.5"><AlertTriangle size={12} className="gp-yellow" />The bug report</div>
                <p className="text-[13px] gp-t1 leading-relaxed">{ex.symptom}</p>
                <p className="text-[11.5px] gp-t3">{ex.brief} · {ex.files.length} files · {exerciseLines(ex)} lines</p>
              </div>

              {/* Step 1 — hypothesis */}
              <Step n={1} title="Your hypothesis" done={submitted}>
                {submitted ? (
                  <div className="space-y-2">
                    <p className="text-[13px] gp-t1 whitespace-pre-wrap gp-inset p-2.5">{run!.hypothesis}</p>
                    <p className="text-[11.5px] gp-t3"><b className="gp-t2">A strong one names:</b> {ex.hypothesisHint}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[12.5px] gp-t2">Read the files first. Write what you think is wrong, in which file, by what mechanism, and an input that would show it. The assistant stays locked until this is in.</p>
                    <textarea
                      value={draft}
                      onChange={e => setDraft(e.target.value)}
                      rows={5}
                      placeholder="I think the defect is in lib/…: it does X, so when Y happens the value Z is wrong. With input … I would expect … but it returns …"
                      className="gp-input gp-textarea w-full text-[13px]"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] gp-t3">{draft.trim().length} characters</span>
                      <button onClick={submitHypothesis} className="gp-btn gp-btn-primary gp-btn-sm ml-auto"><Lock size={12} />Submit & unlock the assistant</button>
                    </div>
                  </div>
                )}
              </Step>

              {/* Step 2 — fix */}
              <Step n={2} title="Fix it in the editor" done={Object.keys(run?.code ?? {}).length > 0}>
                <p className="text-[12.5px] gp-t2">Edit the files on the left. Your edits are saved with this exercise; the originals are one click away if you want to start over.</p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => { if (confirm('Discard your edits and restore the original files?')) patchRun({ code: {} }); }}
                    disabled={Object.keys(run?.code ?? {}).length === 0}
                    className="gp-btn gp-btn-sm"
                  >
                    <RotateCcw size={12} />Restore originals
                  </button>
                  <span className="text-[11px] gp-t3">{Object.keys(run?.code ?? {}).length} file(s) edited</span>
                </div>
              </Step>

              {/* Step 3 — reveal & compare */}
              <Step n={3} title="Root cause & compare" done={revealed}>
                {revealed ? (
                  <div className="space-y-2 text-[13px] gp-t1 leading-relaxed">
                    <p><span className="gp-chip gp-chip-xs gp-chip-red mr-1.5">{ex.bug}</span></p>
                    <p><b className="gp-t2">Root cause.</b> {ex.rootCause}</p>
                    <p><b className="gp-t2">The fix.</b> {ex.fix}</p>
                    <p><b className="gp-t2">Follow-up feature.</b> {ex.followUp}</p>
                    <p><b className="gp-t2">Optimisation.</b> {ex.optimise}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[12.5px] gp-t2">Only after your own attempt — and ideally after the interviewer has graded you.</p>
                    <button onClick={reveal} disabled={!submitted} className="gp-btn gp-btn-sm" title={submitted ? 'Reveal' : 'Submit your hypothesis first'}>
                      <Eye size={12} />Reveal the root cause
                    </button>
                  </div>
                )}
              </Step>

              {/* The grade */}
              {graded && (
                <div className="gp-card gp-accent-card p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="gp-label">Graded</span>
                    <span className={clsx('gp-chip gp-chip-xs ml-auto', (run!.score ?? 0) >= 3 ? 'gp-chip-green' : (run!.score ?? 0) >= 2.6 ? 'gp-chip-yellow' : 'gp-chip-red')}>
                      {run!.score!.toFixed(1)}
                    </span>
                    <span className="text-[11px] gp-t3">{run!.minutes} min</span>
                  </div>
                  {run!.feedback && <p className="text-[12.5px] gp-t2 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">{run!.feedback}</p>}
                </div>
              )}
            </div>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}

function Step({ n, title, done, children }: { n: number; title: string; done: boolean; children: React.ReactNode }) {
  return (
    <div className="gp-card p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className={clsx('w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0', done ? 'gp-green' : 'gp-t3')} style={{ background: done ? 'var(--gp-green-wash)' : 'var(--gp-surface-2)' }}>
          {done ? <Check size={12} /> : n}
        </span>
        <span className="text-[13px] font-semibold gp-t1">{title}</span>
      </div>
      {children}
    </div>
  );
}
