'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { GripVertical, GripHorizontal, Shield, Timer as TimerIcon, Flag, Play, Pause, MessageSquare, Lightbulb, Gauge, HelpCircle, Menu } from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { trackGoogle } from '@/lib/google/track';
import EditorPanel from '@/components/forge/editor/EditorPanel';
import GoogleSidebar, { pickUnseen } from './GoogleSidebar';
import TriggerDrill from './TriggerDrill';
import GoogleChatPanel, { type QuickAction } from '../shared/GoogleChatPanel';
import { useChat } from '../shared/useChat';
import { useTimer, fmtClock } from '../shared/useTimer';
import type { GoogleStore } from '../useGoogleStore';
import type { AIProvider, Language } from '@/lib/types';
import { GOOGLE_PROBLEMS, GOOGLE_SECTION_OF, GOOGLE_SECTIONS } from '@/lib/google/problems';
import { getGoogleStarterCode } from '@/lib/google/starter';
import { runGoogleCode } from '@/lib/google/runner';
import { buildGoogleCoachPrompt, buildCodingInterviewerPrompt, parseGrade, stripGradeBlock } from '@/lib/google/ai';
import { getIntervalDays, isDueForRevision } from '@/lib/revision';
import { planFor, problemSchedule } from '@/lib/google/plan';

export interface MockHandlers {
  problem: string;
  onEnd: (r: { score: number | null; verdict: string; feedback: string; minutes: number; strengths?: string[]; improvements?: string[] }) => void;
  onAbort: () => void;
}

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  store: GoogleStore;
  provider: AIProvider;
  model: string;
  orientation: 'horizontal' | 'vertical';
  editorFontSize: number;
  editorFontFamily: string;
  onOpenSettings: () => void;
  focus?: { n: number; section?: string; problem?: string; drill?: boolean };
  mock?: MockHandlers;
  /** Current plan week — bounds the pattern-trigger drill to patterns studied so far */
  planWeek?: number;
}

const LANGS: Language[] = ['javascript', 'python', 'java', 'cpp'];
const DEFAULT_PROBLEM = GOOGLE_SECTIONS[0].problems[0].name;

const COACH_ACTIONS: QuickAction[] = [
  { label: 'Review code', icon: MessageSquare, msg: 'Review my current code: what is right, what breaks and on which input, and the next step — conceptually, no solution code.' },
  { label: 'Hint', icon: Lightbulb, msg: 'Give me the next hint level only.' },
  { label: 'Complexity', icon: Gauge, msg: 'Ask me for my time and space complexity and then check my answer.' },
  { label: 'Follow-up', icon: HelpCircle, msg: 'Ask me one Google-style follow-up for this problem (stream / 10^12 elements / distributed / O(1) space / thread-safe / testing).' },
];
const MOCK_ACTIONS: QuickAction[] = [
  { label: 'Clarify', icon: HelpCircle, msg: 'Before I start: what are the constraints on input size and values, and can I assume the input fits in memory?' },
];

export default function GoogleDSA({ theme, onToggleTheme, store, provider, model, orientation, editorFontSize, editorFontFamily, onOpenSettings, focus, mock, planWeek }: Props) {
  const s = store.state;
  const isMock = !!mock;

  // ── Selection ──
  const [selected, setSelected] = useState<string>(() => mock?.problem ?? DEFAULT_PROBLEM);
  useEffect(() => {
    if (isMock) return;
    try {
      const saved = localStorage.getItem('dsa-forge-google-problem');
      if (saved && GOOGLE_PROBLEMS[saved]) setSelected(saved);
    } catch { /* ignore */ }
  }, [isMock]);
  useEffect(() => { if (!isMock) try { localStorage.setItem('dsa-forge-google-problem', selected); } catch { /* ignore */ } }, [selected, isMock]);

  const language = s.language;
  const codeKey = `${selected}-${language}`;
  const schedule = useMemo(() => problemSchedule(planFor(s.planStart)), [s.planStart]);
  if (!s.codeMap[codeKey]) s.codeMap[codeKey] = getGoogleStarterCode(selected, language); // ensure starter (no rerender needed)
  const code = s.codeMap[codeKey];
  const note = s.notes[selected] ?? '';

  // ── Panels ──
  const [showLeft, setShowLeft] = useState(!isMock);
  const [showRight, setShowRight] = useState(isMock); // chat opens on demand; a mock round is the interview, so it starts open
  const [showNotes, setShowNotes] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [outputHeight, setOutputHeight] = useState(250);
  const [isRunning, setIsRunning] = useState(false);
  const lastActivity = useRef(Date.now());

  // ── Chat ──
  const greeting = isMock
    ? `**Mock coding round** — 45 minutes. I'll state the problem; you drive. Press **Start** when you're ready and say "hi" to begin.`
    : `**${selected}** — Mission loaded. 🎯 Say the pattern trigger out loud before you code.`;
  const chat = useChat(provider, model, greeting);
  const timer = useTimer();

  const codeRef = useRef(code);
  codeRef.current = code;
  const buildSystem = useCallback(() => {
    const c = s.codeMap[`${selected}-${language}`] ?? '';
    return isMock
      ? buildCodingInterviewerPrompt(selected, language, c, timer.minutes)
      : buildGoogleCoachPrompt(selected, language, c, s.notes[selected] ?? '');
  }, [s, selected, language, isMock, timer.minutes]);

  const handleSend = useCallback((text?: string) => { const t = text ?? chat.input; if (t.trim()) chat.send(t, buildSystem); }, [chat, buildSystem]);

  // Deep link to a specific problem (from Today / Plan)
  const [drillOpen, setDrillOpen] = useState(false);
  const [prevFocusN, setPrevFocusN] = useState(focus?.n ?? 0);
  if (!isMock && focus && focus.n !== prevFocusN) {
    setPrevFocusN(focus.n);
    if (focus.problem && GOOGLE_PROBLEMS[focus.problem] && focus.problem !== selected) {
      setSelected(focus.problem);
      setOutput(null);
      setShowNotes(false);
    }
    if (focus.drill) setDrillOpen(true);
  }

  // ── Problem select ──
  const handleSelect = useCallback((p: string) => {
    if (!GOOGLE_PROBLEMS[p]) return;
    setSelected(p);
    setOutput(null);
    setShowNotes(false);
    chat.reset(`**${p}** — Mission loaded. 🎯 Say the pattern trigger out loud before you code.`);
  }, [chat]);

  // ── Mastered / revised (same ladder as the Forge: 7 → 14 → 30) ──
  const handleToggleMastered = useCallback((p: string) => {
    const was = s.mastered.includes(p);
    store.update(st => {
      st.mastered = was ? st.mastered.filter(x => x !== p) : [...st.mastered, p];
      st.lastReviewDate[p] = new Date().toISOString();
      if (!was) st.reviewCount[p] = 0;
    });
    if (was) toast.info(`${p} is back on the active list.`);
    else toast.success('Mastered — Google track.', { description: p, duration: 4000 });
    store.save({ silent: true });
    trackGoogle(was ? 'unmastered' : 'mastered', p);
  }, [s, store]);

  const handleMarkRevised = useCallback((p: string) => {
    let next = 0;
    store.update(st => {
      next = (st.reviewCount[p] ?? 0) + 1;
      st.reviewCount[p] = next;
      st.lastReviewDate[p] = new Date().toISOString();
    });
    toast.success(`Revision logged: ${p}`, { description: `Next review in ${getIntervalDays(next)} days.` });
    store.save({ silent: true });
    trackGoogle('revised', p);
  }, [store]);

  // ── Editor callbacks ──
  const handleCodeChange = useCallback((c: string) => { store.touchCode(`${selected}-${language}`, c); }, [store, selected, language]);
  const handleNoteChange = useCallback((v: string) => { store.update(st => { st.notes[selected] = v; }); }, [store, selected]);
  const handleLanguageChange = useCallback((l: Language) => {
    if (!LANGS.includes(l)) return;
    store.update(st => { st.language = l; if (!st.codeMap[`${selected}-${l}`]) st.codeMap[`${selected}-${l}`] = getGoogleStarterCode(selected, l); });
  }, [store, selected]);
  const handleRun = useCallback(async () => {
    setIsRunning(true);
    const id = toast.loading('Executing…');
    try {
      const r = await runGoogleCode(s.codeMap[`${selected}-${language}`] ?? '', language, selected);
      setOutput(r);
      if (r.includes('❌')) toast.error('Execution failed', { id }); else toast.success('Execution complete', { id });
    } catch { toast.error('Execution error', { id }); } finally { setIsRunning(false); }
  }, [s, selected, language]);
  const handleSave = useCallback(() => {
    if (!isMock) trackGoogle('save', selected);
    store.save().then(() => {
      if (!isMock && isDueForRevision(selected, s.lastReviewDate, s.reviewCount, s.mastered)) {
        toast(`"${selected}" is due for revision — finished revising it?`, { action: { label: '✓ Mark revised', onClick: () => handleMarkRevised(selected) }, duration: 12000 });
      }
    });
  }, [store, isMock, selected, s, handleMarkRevised]);
  const handleRandom = useCallback(() => handleSelect(pickUnseen(s.mastered)), [handleSelect, s.mastered]);

  // ── Mock: end & grade ──
  const [grading, setGrading] = useState(false);
  const endMock = useCallback(async () => {
    if (!mock) return;
    setGrading(true);
    timer.pause();
    const full = await chat.send('The interview is over. Please grade me now.', buildSystem);
    const g = parseGrade(full);
    setGrading(false);
    mock.onEnd({ score: g?.score ?? null, verdict: g?.verdict ?? 'Ungraded', feedback: stripGradeBlock(full), minutes: Math.round(timer.seconds / 60), strengths: g?.strengths, improvements: g?.improvements });
  }, [mock, chat, buildSystem, timer]);

  const section = GOOGLE_SECTION_OF[selected];
  const info = GOOGLE_PROBLEMS[selected];
  const isH = orientation === 'horizontal';
  const sep = clsx('gp-handle shrink-0', isH ? 'w-1.5 cursor-col-resize border-x' : 'h-1.5 w-full cursor-row-resize border-y');
  const Grip = isH ? GripVertical : GripHorizontal;

  const mockBar = useMemo(() => isMock ? (
    <div className="h-12 shrink-0 border-b gp-border gp-panel flex items-center gap-3 px-3">
      <span className="gp-chip gp-chip-red">Mock · coding round</span>
      <TimerIcon size={14} className={clsx(timer.minutes >= 40 ? 'gp-red' : timer.minutes >= 33 ? 'gp-yellow' : 'gp-blue')} />
      <span className={clsx('gp-num text-lg', timer.minutes >= 40 ? 'gp-red' : 'gp-t1')}>{fmtClock(timer.seconds)}</span>
      <span className="text-[12px] gp-t3 hidden md:inline">
        {timer.minutes < 4 ? 'Clarify' : timer.minutes < 10 ? 'Brute force → improve' : timer.minutes < 14 ? 'Agree approach + complexity' : timer.minutes < 33 ? 'Code, narrating' : timer.minutes < 40 ? 'Dry run' : 'Follow-ups & wrap'}
      </span>
      {timer.running
        ? <button onClick={timer.pause} className="gp-btn gp-btn-sm"><Pause size={12} />Pause</button>
        : <button onClick={timer.start} className="gp-btn gp-btn-primary gp-btn-sm"><Play size={12} />{timer.seconds ? 'Resume' : 'Start'}</button>}
      <button onClick={endMock} disabled={grading} className="gp-btn gp-btn-danger gp-btn-sm ml-auto"><Flag size={12} />{grading ? 'Grading…' : 'End & grade'}</button>
      <button onClick={mock?.onAbort} className="gp-btn gp-btn-ghost gp-btn-sm gp-t3">Abandon</button>
    </div>
  ) : null, [isMock, timer, endMock, grading, mock]);

  return (
    <div className="h-full w-full overflow-hidden flex flex-col" style={{ background: 'var(--gp-ground)' }}>
      {mockBar}
      <div className="flex-1 min-h-0">
        <PanelGroup orientation={orientation} className="h-full w-full">
          {showLeft && !isMock && (
            <>
              <Panel id="g-side" defaultSize="24%" minSize="220px" maxSize="40%" className="min-w-0 min-h-0 overflow-hidden">
                <GoogleSidebar
                  selectedProblem={selected}
                  schedule={schedule}
                  mastered={s.mastered}
                  lastReviewDate={s.lastReviewDate}
                  reviewCount={s.reviewCount}
                  focus={focus}
                  onSelect={handleSelect}
                  onToggleMastered={handleToggleMastered}
                  onDrill={() => setDrillOpen(true)}
                  onMarkRevised={handleMarkRevised}
                  onRandomUnseen={handleRandom}
                  onClose={() => setShowLeft(false)}
                />
              </Panel>
              <PanelResizeHandle id="g-sep-l" className={sep}><Grip size={12} className="gp-t3" /></PanelResizeHandle>
            </>
          )}

          <Panel id="g-editor" minSize="30%" className="min-w-0 min-h-0 overflow-hidden">
            <EditorPanel
              theme={theme}
              onToggleTheme={onToggleTheme}
              problem={selected}
              language={language}
              code={code}
              output={output}
              outputHeight={outputHeight}
              isSaving={store.isSaving}
              isRunning={isRunning}
              showNotes={showNotes}
              noteValue={note}
              editorFontSize={editorFontSize}
              editorFontFamily={editorFontFamily}
              onCodeChange={handleCodeChange}
              onSave={handleSave}
              onRun={handleRun}
              onToggleNotes={() => setShowNotes(v => !v)}
              onOpenSettings={onOpenSettings}
              onLanguageChange={handleLanguageChange}
              onNoteChange={handleNoteChange}
              onOutputClose={() => setOutput(null)}
              onOutputResize={setOutputHeight}
              onEditorActivity={() => { lastActivity.current = Date.now(); }}
              showLeftPanel={showLeft || isMock}
              showRightPanel={showRight}
              onToggleLeftPanel={() => setShowLeft(v => !v)}
              onToggleRightPanel={() => setShowRight(v => !v)}
            />
          </Panel>

          {showRight && (
            <>
              <PanelResizeHandle id="g-sep-r" className={sep}><Grip size={12} className="gp-t3" /></PanelResizeHandle>
              <Panel id="g-chat" defaultSize="28%" minSize="240px" maxSize="50%" className="min-w-0 min-h-0 overflow-hidden">
                <GoogleChatPanel
                  theme={theme}
                  title={isMock ? 'Interviewer' : 'Forge AI · Google'}
                  subtitle={isMock ? 'Mock coding round — evaluating, not coaching' : `${section?.title ?? ''}${info ? ` · ${info.difficulty}` : ''}`}
                  icon={<Shield size={18} />}
                  messages={chat.messages}
                  input={chat.input}
                  isLoading={chat.isLoading}
                  quickActions={isMock ? MOCK_ACTIONS : COACH_ACTIONS}
                  placeholder={isMock ? 'Talk to the interviewer… (Enter to send, Shift+Enter for a new line)' : 'Ask the coach — your code and notes are attached automatically… (Enter to send)'}
                  onInputChange={chat.setInput}
                  onSend={handleSend}
                  onStop={chat.stop}
                  onClear={isMock ? undefined : () => chat.reset(`**${selected}** — chat cleared.`)}
                  onClose={() => setShowRight(false)}
                />
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>
      {!showLeft && !isMock && (
        <button onClick={() => setShowLeft(true)} className="absolute bottom-4 left-4 gp-btn gp-btn-icon lg:hidden" title="Open problems"><Menu size={16} /></button>
      )}
      {drillOpen && !isMock && (
        <TriggerDrill store={store} planWeek={planWeek ?? 4} onClose={() => setDrillOpen(false)} onOpenProblem={name => handleSelect(name)} />
      )}
    </div>
  );
}
