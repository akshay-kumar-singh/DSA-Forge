'use client';

// ======================================================
// /prep — Interview Prep. A separate route so the NeetCode
// Forge at / is untouched. Shares theme + AI settings via
// the same localStorage keys; progress lives in its own
// document (/api/google) and never touches /api/progress.
// ======================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster } from 'sonner';
import { AI_PROVIDERS } from '@/lib/problems';
import type { AIProvider } from '@/lib/types';
import type { GoogleTab, DeepLink, PlanTask, TaskItem } from '@/lib/google/types';
import './prep.css';
import { planFor, computePlanStatus, phaseOf, PLAN_WEEKS } from '@/lib/google/plan';
import { resolveTaskItems } from '@/lib/google/today';
import { useGoogleStore } from '@/components/google/useGoogleStore';
import GoogleShell from '@/components/google/GoogleShell';
import TodayPage from '@/components/google/plan/TodayPage';
import PlanPage from '@/components/google/plan/PlanPage';
import GoogleDSA from '@/components/google/dsa/GoogleDSA';
import DesignPage from '@/components/google/design/DesignPage';
import BehaviouralPage from '@/components/google/behavioural/BehaviouralPage';
import MocksPage from '@/components/google/mocks/MocksPage';
import NotesPage from '@/components/google/notes/NotesPage';
import GoogleChatPanel, { type QuickAction } from '@/components/google/shared/GoogleChatPanel';
import { useAssistant, type AssistantConfig } from '@/components/google/shared/useAssistant';
import { buildGuidePrompt } from '@/lib/google/ai';
import { Sparkles } from 'lucide-react';
import ForgeSettings from '@/components/forge/settings/ForgeSettings';

const TABS: GoogleTab[] = ['today', 'dsa', 'design', 'behavioural', 'mocks', 'plan', 'notes'];

const GUIDE_ACTIONS: QuickAction[] = [
  { label: 'Explain today', msg: "Explain each of today's tasks: what it means, exactly what I do, and where in the app." },
  { label: 'What now?', msg: 'Looking at my day, what is the single next thing I should do right now, and how?' },
  { label: 'This phase', msg: 'What is this phase for, what does its gate mean, and how will I know I have passed it?' },
];

export interface Focus extends Partial<DeepLink> { n: number }

export default function InterviewPrepPage() {
  const store = useGoogleStore();

  // ── Theme (same key as the Forge, so both tracks match) ──
  // Only the toggle writes to storage: an effect that wrote on mount would race
  // StrictMode's double-run in dev and flip a saved 'light' back to 'dark'.
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  useEffect(() => {
    const saved = localStorage.getItem('dsa-forge-theme') as 'dark' | 'light' | null;
    if (saved === 'light' || saved === 'dark') setTheme(saved);
  }, []);
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
  const [provider, setProvider] = useState<AIProvider>(AI_PROVIDERS[0]);
  const [model, setModel] = useState(AI_PROVIDERS[0].models[0]);
  const [fontSize, setFontSize] = useState(14);
  const [fontFamily, setFontFamily] = useState('var(--font-mono)');
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const pid = localStorage.getItem('dsa-forge-provider');
      const p = AI_PROVIDERS.find(x => x.id === pid);
      if (p) {
        setProvider(p);
        const m = localStorage.getItem('dsa-forge-model');
        setModel(m && p.models.includes(m) ? m : p.models[0]);
      }
      const fs = Number(localStorage.getItem('dsa-forge-font-size'));
      if (fs >= 10 && fs <= 28) setFontSize(fs);
      const ff = localStorage.getItem('dsa-forge-font-family');
      if (ff) setFontFamily(ff);
    } catch { /* defaults */ }
    setHydrated(true);
  }, []);
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

  // ── Tabs (remembered) + deep links (section / problem / prompt / story / mock kind) ──
  const [tab, setTabState] = useState<GoogleTab>('today');
  const [visited, setVisited] = useState<Set<GoogleTab>>(() => new Set(['today']));
  const [focus, setFocus] = useState<Focus>({ n: 0 });
  useEffect(() => {
    const t = localStorage.getItem('dsa-forge-google-tab') as GoogleTab | null;
    if (t && TABS.includes(t)) { setTabState(t); setVisited(v => new Set(v).add(t)); }
  }, []);
  const applyTab = useCallback((t: GoogleTab) => {
    setTabState(t);
    setVisited(v => (v.has(t) ? v : new Set(v).add(t)));
    try { localStorage.setItem('dsa-forge-google-tab', t); } catch { /* ignore */ }
  }, []);
  const setTab = useCallback((t: GoogleTab, link?: Omit<DeepLink, 'tab'>) => {
    if (t !== window.history.state?.tab) {
      try { window.history.pushState({ gp: 'tab', tab: t }, ''); } catch { /* ignore */ }
    }
    applyTab(t);
    if (link && (link.section || link.problem || link.id || link.kind || link.drill)) setFocus(f => ({ n: f.n + 1, tab: t, ...link }));
  }, [applyTab]);

  // ── Browser Back: previous tab, and from the first tab → the landing page ──
  // A sentinel "root" entry sits under the first tab entry so Back never leaves the site.
  const router = useRouter();
  useEffect(() => {
    // Seed on the next tick: Next's app router patches history.pushState in its own
    // (parent) effect, which runs after this one. Entries pushed before the patch lack
    // Next's marker and make its popstate handler reload the page.
    const seed = setTimeout(() => {
      if (window.history.state?.gp) return;
      const saved = localStorage.getItem('dsa-forge-google-tab') as GoogleTab | null;
      const first: GoogleTab = saved && TABS.includes(saved) ? saved : 'today';
      try {
        window.history.replaceState({ gp: 'root' }, '');
        window.history.pushState({ gp: 'tab', tab: first }, '');
      } catch { /* ignore */ }
    }, 0);
    const onPop = (e: PopStateEvent) => {
      const st = e.state as { gp?: string; tab?: GoogleTab } | null;
      if (st?.gp === 'tab' && st.tab && TABS.includes(st.tab)) applyTab(st.tab);
      // Leaving: run after Next's own popstate restore (registered after this listener) so it cannot override us.
      else if (!st || st.gp === 'root') setTimeout(() => router.replace('/'), 0);
    };
    window.addEventListener('popstate', onPop);
    return () => { clearTimeout(seed); window.removeEventListener('popstate', onPop); };
  }, [applyTab, router]);
  const focusFor = (t: GoogleTab): Focus => (focus.tab === t ? focus : { n: 0 });

  // Warm the heavier tabs in the background once the first paint is done, so the
  // first click on DSA / Plan / Mocks is instant. Design (Excalidraw) stays lazy.
  useEffect(() => {
    const order: GoogleTab[] = ['dsa', 'plan', 'mocks', 'behavioural', 'notes'];
    const timers: ReturnType<typeof setTimeout>[] = [];
    order.forEach((t, i) => timers.push(setTimeout(() => setVisited(v => (v.has(t) ? v : new Set(v).add(t))), 1200 + i * 700)));
    return () => timers.forEach(clearTimeout);
  }, []);

  // ── Responsive orientation (same breakpoint as the Forge) ──
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  useEffect(() => {
    const u = () => setOrientation(window.innerWidth < 1024 ? 'vertical' : 'horizontal');
    u(); window.addEventListener('resize', u); return () => window.removeEventListener('resize', u);
  }, []);

  // ── Plan (recomputed when the start date or completion map changes) ──
  const plan = useMemo(() => planFor(store.state.planStart), [store.state.planStart]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const status = useMemo(() => computePlanStatus(plan, store.state), [plan, store.tick]);

  // ── The single assistant. Guide hat here; DSA / Design / Behavioural / Mocks register their own hat. ──
  const tabRef = useRef(tab); tabRef.current = tab;
  const statusRef = useRef(status); statusRef.current = status;
  const planRef = useRef(plan); planRef.current = plan;
  const buildGuideContext = useCallback(() => {
    const s = store.state, st = statusRef.current, days = planRef.current;
    const day = days[Math.min(st.currentDay, days.length - 1)];
    const week = PLAN_WEEKS[day.week];
    const ph = phaseOf(day.week);
    const tasks = day.tasks.map((t, i) => {
      const items = resolveTaskItems(t, s).map(it => `${it.label}${it.sub ? ` (${it.sub})` : ''}${it.done ? ' ✓' : ''}${it.optional ? ' [bonus]' : ''}`).join('; ');
      return `${i + 1}. [${t.kind}] ${t.text}${s.planDone[t.id] ? ' — DONE' : ''}${items ? `\n   items: ${items}` : ''}`;
    }).join('\n');
    const gate = ph.gate.map((g, i) => `- ${g}${s.planDone[`gate-${ph.id}-${i}`] ? ' ✓' : ''}\n  how: ${ph.gateHelp[i]}`).join('\n');
    const progress = `DSA mastered: ${s.mastered.length}. Mocks done: ${s.mocks.length}. STAR stories written: ${Object.values(s.stories).filter(x => x && x.situation && x.action && x.result).length}/12. Notebook entries: ${s.notebook.length}.`;
    return `Open tab: ${tabRef.current}. Plan day ${day.day + 1} of ${st.totalDays} (${st.started ? (st.delta === 0 ? 'on schedule' : `${st.delta > 0 ? '+' : ''}${st.delta} days`) : `starts in ${-st.calendarDay} days`}, ${st.daysLeft} days left). Week ${day.week} — ${week.theme} · Phase ${ph.id} ${ph.title}. ${week.detail}\n${progress}\n\nTODAY'S TASKS\n${tasks}\n\nGATE FOR THIS PHASE\n${gate}`;
  }, [store]);
  const guide = useMemo<AssistantConfig>(() => ({
    scope: 'guide',
    title: 'Guide',
    subtitle: 'Ask anything — tasks, the plan, resumes, stories',
    greeting: "**Guide** — ask me anything: what a task means, what to do next, how a tab works, or paste a resume bullet / STAR draft for review. On DSA I become your coach; on Design, Behavioural and Mocks, your interviewer.",
    buildSystem: () => buildGuidePrompt(buildGuideContext()),
    quickActions: GUIDE_ACTIONS,
    placeholder: 'Ask anything… (Enter to send, Shift+Enter for a new line)',
    clearable: true,
  }), [buildGuideContext]);
  const ai = useAssistant(provider, model, tab, guide);
  const askAbout = useCallback((task: PlanTask, items: TaskItem[]) => {
    const list = items.filter(i => i.label).map(i => `- ${i.label}${i.sub ? ` (${i.sub})` : ''}`).join('\n');
    ai.setOpen(true);
    ai.send(`Explain this task — what does it mean, exactly what do I do, and where in the app?\n\n**${task.text}**${list ? `\n${list}` : ''}`);
  }, [ai]);

  const common = { theme, store, provider, model, orientation };

  return (
    <>
      <Toaster theme={theme} position="top-right" closeButton richColors />
      <GoogleShell
        theme={theme}
        onToggleTheme={toggleTheme}
        tab={tab}
        onTab={setTab}
        status={status}
        isSaving={store.isSaving}
        cloudOk={store.cloudOk}
        onSave={() => store.save()}
        onOpenSettings={() => setShowSettings(true)}
        assistantOpen={ai.isOpen}
        assistantTitle={ai.active.title}
        onToggleAssistant={() => ai.setOpen(o => !o)}
        assistant={
          <GoogleChatPanel
            theme={theme}
            title={ai.active.title}
            subtitle={ai.active.subtitle}
            icon={<Sparkles size={16} />}
            messages={ai.messages}
            input={ai.input}
            isLoading={ai.isLoading}
            quickActions={ai.active.quickActions}
            placeholder={ai.active.placeholder}
            onInputChange={ai.setInput}
            onSend={t => { const text = t ?? ai.input; if (text.trim()) ai.send(text); }}
            onStop={ai.stop}
            onClear={ai.active.clearable === false ? undefined : ai.clear}
            onClose={() => ai.setOpen(false)}
          />
        }
      >
        <div hidden={tab !== 'today'} className="h-full min-h-0 gp-pane">
          <TodayPage {...common} plan={plan} status={status} onTab={setTab} onAsk={askAbout} />
        </div>
        {visited.has('dsa') && (
          <div hidden={tab !== 'dsa'} className="h-full min-h-0 gp-pane">
            <GoogleDSA {...common} ai={ai.handles.dsa} onToggleTheme={toggleTheme} editorFontSize={fontSize} editorFontFamily={fontFamily} onOpenSettings={() => setShowSettings(true)} focus={focusFor('dsa')} planWeek={plan[Math.min(status.currentDay, plan.length - 1)].week} />
          </div>
        )}
        {visited.has('design') && (
          <div hidden={tab !== 'design'} className="h-full min-h-0 gp-pane">
            <DesignPage {...common} ai={ai.handles.design} focus={focusFor('design')} />
          </div>
        )}
        {visited.has('behavioural') && (
          <div hidden={tab !== 'behavioural'} className="h-full min-h-0 gp-pane">
            <BehaviouralPage {...common} ai={ai.handles.behavioural} focus={focusFor('behavioural')} />
          </div>
        )}
        {visited.has('mocks') && (
          <div hidden={tab !== 'mocks'} className="h-full min-h-0 gp-pane">
            <MocksPage {...common} ai={ai.handles.mocks} onToggleTheme={toggleTheme} editorFontSize={fontSize} editorFontFamily={fontFamily} onOpenSettings={() => setShowSettings(true)} focus={focusFor('mocks')} />
          </div>
        )}
        {visited.has('plan') && (
          <div hidden={tab !== 'plan'} className="h-full min-h-0 gp-pane">
            <PlanPage {...common} plan={plan} status={status} onTab={setTab} onAsk={askAbout} focus={focusFor('plan')} />
          </div>
        )}
        {visited.has('notes') && (
          <div hidden={tab !== 'notes'} className="h-full min-h-0 gp-pane">
            <NotesPage store={store} currentWeek={plan[Math.min(status.currentDay, plan.length - 1)].week} />
          </div>
        )}
      </GoogleShell>

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
