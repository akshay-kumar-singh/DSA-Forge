'use client';

// ======================================================
// /practice — Practice Lab. Your own coding problems and your
// own system designs. A separate route with its own document
// (/api/practice); it never touches NeetCode progress or the
// Interview Prep plan. Shares only theme + AI/editor settings,
// and the Prep design system (.gp) so the app looks like one app.
// ======================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Toaster } from 'sonner';
import { Sparkles, MessageSquare, Lightbulb, Gauge, HelpCircle, Eye, ListChecks } from 'lucide-react';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { AI_PROVIDERS } from '@/lib/problems';
import type { AIProvider } from '@/lib/types';
import type { PracticeTab } from '@/lib/practice/types';
import '../prep/prep.css';
import { usePracticeStore } from '@/components/practice/usePracticeStore';
import PracticeShell from '@/components/practice/PracticeShell';
import DsaLab from '@/components/practice/DsaLab';
import DesignLab from '@/components/practice/DesignLab';
import { useLabAssistant, type LabConfig } from '@/components/practice/useLabAssistant';
import GoogleChatPanel, { type QuickAction } from '@/components/google/shared/GoogleChatPanel';
import ForgeSettings from '@/components/forge/settings/ForgeSettings';
import { buildPracticeCoachPrompt, buildPracticeInterviewerPrompt } from '@/lib/practice/ai';
import { diagramToText } from '@/lib/google/diagram-text';
import { useIsHydrated } from '@/lib/use-hydrated';

const COACH_ACTIONS: QuickAction[] = [
  { label: 'Review my code', icon: MessageSquare, msg: 'Review my current code: what is right, what breaks and on which input, and the next step — conceptually, no solution code.' },
  { label: 'Hint', icon: Lightbulb, msg: 'Give me the next hint level only.' },
  { label: 'Complexity', icon: Gauge, msg: 'Ask me for my time and space complexity, then check my answer.' },
  { label: 'Follow-up', icon: HelpCircle, msg: 'Ask me one interview-style follow-up on this problem (stream / huge input / O(1) space / concurrency / how I would test it).' },
];
const INTERVIEWER_ACTIONS: QuickAction[] = [
  { label: 'Start the round', icon: ListChecks, msg: "I'm ready — give me the prompt and ask for my requirements the way an interviewer would." },
  { label: 'Read my board', icon: Eye, msg: 'Look at my whiteboard as it stands and probe it: pick one box and ask what happens when it dies, or where the hot key is.' },
  { label: 'Where am I weak?', icon: Lightbulb, msg: 'In two sentences: what is the biggest gap in my design so far?' },
];

export default function PracticeLabPage() {
  const store = usePracticeStore();

  // ── Theme (same key as the Forge and Prep, so all three match) ──
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  const toggleTheme = useCallback(() => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('dsa-forge-theme', next); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // ── AI + editor settings (shared keys with the Forge) ──
  const [showSettings, setShowSettings] = useState(false);
  const [tab, setTab] = useState<PracticeTab>('dsa');
  const [provider, setProvider] = useState<AIProvider>(AI_PROVIDERS[0]);
  const [model, setModel] = useState(AI_PROVIDERS[0].models[0]);
  const [fontSize, setFontSize] = useState(14);
  const [fontFamily, setFontFamily] = useState('var(--font-mono)');

  // Everything remembered in localStorage is read once, on the first render after
  // hydration — not during it, or the server's HTML and the client's first render
  // would disagree. Adjusting state during render (rather than in an effect) keeps
  // it to a single extra render with no flash.
  const isHydrated = useIsHydrated();
  const [hydrated, setHydrated] = useState(false);
  if (isHydrated && !hydrated) {
    setHydrated(true);
    try {
      const savedTheme = localStorage.getItem('dsa-forge-theme');
      if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme);
      const p = AI_PROVIDERS.find(x => x.id === localStorage.getItem('dsa-forge-provider'));
      if (p) {
        setProvider(p);
        const m = localStorage.getItem('dsa-forge-model');
        setModel(m && p.models.includes(m) ? m : p.models[0]);
      }
      const fs = Number(localStorage.getItem('dsa-forge-font-size'));
      if (fs >= 10 && fs <= 28) setFontSize(fs);
      const ff = localStorage.getItem('dsa-forge-font-family');
      if (ff) setFontFamily(ff);
      const t = localStorage.getItem('dsa-forge-practice-tab');
      if (t === 'dsa' || t === 'design') setTab(t);
    } catch { /* defaults are fine */ }
  }
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem('dsa-forge-provider', provider.id);
      localStorage.setItem('dsa-forge-model', model);
      localStorage.setItem('dsa-forge-font-size', String(fontSize));
      localStorage.setItem('dsa-forge-font-family', fontFamily);
    } catch { /* ignore */ }
  }, [hydrated, provider, model, fontSize, fontFamily]);
  const handleProviderChange = useCallback((p: AIProvider) => { setProvider(p); setModel(p.models[0]); }, []);

  // ── Which item is open in each lab (both remembered) ──
  const [problemId, setProblemId] = useState<string | null>(null);
  const [designId, setDesignId] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  useEffect(() => { if (hydrated) try { localStorage.setItem('dsa-forge-practice-tab', tab); } catch { /* ignore */ } }, [tab, hydrated]);
  // Once the store has loaded, open whatever was open last (or the most recent item).
  if (isHydrated && store.loaded && !restored) {
    setRestored(true);
    const lastP = (() => { try { return localStorage.getItem('dsa-forge-practice-problem'); } catch { return null; } })();
    const lastD = (() => { try { return localStorage.getItem('dsa-forge-practice-design'); } catch { return null; } })();
    const recent = <T extends { id: string; updated: string }>(xs: T[]) => xs.slice().sort((a, b) => b.updated.localeCompare(a.updated))[0]?.id ?? null;
    setProblemId(store.state.problems.some(p => p.id === lastP) ? lastP : recent(store.state.problems));
    setDesignId(store.state.designs.some(d => d.id === lastD) ? lastD : recent(store.state.designs));
  }
  useEffect(() => { if (restored) try { localStorage.setItem('dsa-forge-practice-problem', problemId ?? ''); } catch { /* ignore */ } }, [problemId, restored]);
  useEffect(() => { if (restored) try { localStorage.setItem('dsa-forge-practice-design', designId ?? ''); } catch { /* ignore */ } }, [designId, restored]);

  // ── One assistant: Coach on the DSA tab, Interviewer on the design tab ──
  const boardRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const problem = store.state.problems.find(p => p.id === problemId) ?? null;
  const design = store.state.designs.find(d => d.id === designId) ?? null;
  const stateRef = useRef(store.state);
  useEffect(() => { stateRef.current = store.state; });
  const buildCoach = useCallback(() => {
    const p = stateRef.current.problems.find(x => x.id === problemId);
    if (!p) return '';
    const lang = stateRef.current.language;
    return buildPracticeCoachPrompt(p, lang, p.code[lang] ?? '');
  }, [problemId]);
  const buildInterviewer = useCallback(() => {
    const d = stateRef.current.designs.find(x => x.id === designId);
    if (!d) return '';
    const els = boardRef.current?.getSceneElements() ?? (() => { try { return JSON.parse(d.scene || '[]'); } catch { return []; } })();
    return buildPracticeInterviewerPrompt(d, 0, diagramToText(els));
  }, [designId]);

  const config = useMemo<LabConfig>(() => (tab === 'dsa'
    ? {
      scope: `dsa:${problemId ?? 'none'}`,
      title: 'Coach',
      subtitle: problem ? `${problem.title || 'Untitled'} — reads your question, code and notes` : 'Add a problem to start',
      greeting: problem
        ? `**${problem.title || 'Your problem'}** — paste the question in the Question panel if you have not yet, then tell me your first idea. I hint; I never hand over the answer.`
        : '**Practice Lab** — add a problem on the left, paste the question, and I will coach you through it.',
      buildSystem: buildCoach,
      quickActions: COACH_ACTIONS,
      placeholder: 'Ask the coach — your question, code and notes are attached… (Enter to send)',
    }
    : {
      scope: `design:${designId ?? 'none'}`,
      title: 'Interviewer',
      subtitle: design ? `${design.title || 'Untitled'} — reads your brief, board and doc` : 'Add a design to start',
      greeting: design
        ? `**${design.title || 'Your design'}** — press **Start** on the timer and say "ready". I will run it as a 45-minute round: requirements, numbers, API, design, deep dive. Draw on the board; I can read it.`
        : '**Practice Lab** — pick a system on the left (Instagram, Twitter, anything) and I will run it as a real design round.',
      buildSystem: buildInterviewer,
      quickActions: INTERVIEWER_ACTIONS,
      placeholder: 'Drive the round: requirements, numbers, propose, defend…',
    }), [tab, problemId, designId, problem, design, buildCoach, buildInterviewer]);

  const ai = useLabAssistant(provider, model, config);

  return (
    <>
      <Toaster theme={theme} position="top-right" closeButton richColors />
      <PracticeShell
        theme={theme}
        onToggleTheme={toggleTheme}
        tab={tab}
        onTab={setTab}
        counts={{ problems: store.state.problems.length, designs: store.state.designs.length }}
        isSaving={store.isSaving}
        cloudOk={store.cloudOk}
        onSave={() => store.save()}
        onOpenSettings={() => setShowSettings(true)}
        assistantOpen={ai.isOpen}
        assistantTitle={config.title}
        onToggleAssistant={ai.toggle}
        assistant={
          <GoogleChatPanel
            theme={theme}
            title={config.title}
            subtitle={config.subtitle}
            icon={<Sparkles size={16} />}
            messages={ai.messages}
            input={ai.input}
            isLoading={ai.isLoading}
            quickActions={config.quickActions}
            placeholder={config.placeholder}
            onInputChange={ai.setInput}
            onSend={t => { const text = t ?? ai.input; if (text.trim()) ai.send(text); }}
            onStop={ai.stop}
            onClear={ai.clear}
            onClose={() => ai.setOpen(false)}
          />
        }
      >
        <div hidden={tab !== 'dsa'} className="h-full min-h-0 gp-pane">
          <DsaLab
            theme={theme}
            store={store}
            orientation="horizontal"
            editorFontSize={fontSize}
            editorFontFamily={fontFamily}
            onToggleTheme={toggleTheme}
            onOpenSettings={() => setShowSettings(true)}
            onToggleAssistant={ai.toggle}
            selectedId={problemId}
            onSelect={setProblemId}
          />
        </div>
        <div hidden={tab !== 'design'} className="h-full min-h-0 gp-pane">
          <DesignLab
            theme={theme}
            store={store}
            orientation="horizontal"
            selectedId={designId}
            onSelect={setDesignId}
            boardRef={boardRef}
          />
        </div>
      </PracticeShell>

      <ForgeSettings
        show={showSettings}
        selectedProvider={provider}
        selectedModel={model}
        editorFontSize={fontSize}
        editorFontFamily={fontFamily}
        onClose={() => setShowSettings(false)}
        onProviderChange={handleProviderChange}
        onModelChange={setModel}
        onFontSizeChange={setFontSize}
        onFontFamilyChange={setFontFamily}
      />
    </>
  );
}
