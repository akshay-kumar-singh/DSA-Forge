'use client';

// ======================================================
// /prep — Interview Prep. A separate route so the NeetCode
// Forge at / is untouched. Shares theme + AI settings via
// the same localStorage keys; progress lives in its own
// document (/api/google) and never touches /api/progress.
// ======================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster } from 'sonner';
import { AI_PROVIDERS } from '@/lib/problems';
import type { AIProvider } from '@/lib/types';
import type { GoogleTab, DeepLink } from '@/lib/google/types';
import './prep.css';
import { planFor, computePlanStatus } from '@/lib/google/plan';
import { useGoogleStore } from '@/components/google/useGoogleStore';
import GoogleShell from '@/components/google/GoogleShell';
import TodayPage from '@/components/google/plan/TodayPage';
import PlanPage from '@/components/google/plan/PlanPage';
import GoogleDSA from '@/components/google/dsa/GoogleDSA';
import DesignPage from '@/components/google/design/DesignPage';
import BehaviouralPage from '@/components/google/behavioural/BehaviouralPage';
import MocksPage from '@/components/google/mocks/MocksPage';
import ForgeSettings from '@/components/forge/settings/ForgeSettings';

const TABS: GoogleTab[] = ['today', 'dsa', 'design', 'behavioural', 'mocks', 'plan'];

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
    const order: GoogleTab[] = ['dsa', 'plan', 'mocks', 'behavioural'];
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
      >
        <div hidden={tab !== 'today'} className="h-full min-h-0 gp-pane">
          <TodayPage {...common} plan={plan} status={status} onTab={setTab} />
        </div>
        {visited.has('dsa') && (
          <div hidden={tab !== 'dsa'} className="h-full min-h-0 gp-pane">
            <GoogleDSA {...common} onToggleTheme={toggleTheme} editorFontSize={fontSize} editorFontFamily={fontFamily} onOpenSettings={() => setShowSettings(true)} focus={focusFor('dsa')} planWeek={plan[Math.min(status.currentDay, plan.length - 1)].week} />
          </div>
        )}
        {visited.has('design') && (
          <div hidden={tab !== 'design'} className="h-full min-h-0 gp-pane">
            <DesignPage {...common} focus={focusFor('design')} />
          </div>
        )}
        {visited.has('behavioural') && (
          <div hidden={tab !== 'behavioural'} className="h-full min-h-0 gp-pane">
            <BehaviouralPage {...common} focus={focusFor('behavioural')} />
          </div>
        )}
        {visited.has('mocks') && (
          <div hidden={tab !== 'mocks'} className="h-full min-h-0 gp-pane">
            <MocksPage {...common} onToggleTheme={toggleTheme} editorFontSize={fontSize} editorFontFamily={fontFamily} onOpenSettings={() => setShowSettings(true)} focus={focusFor('mocks')} />
          </div>
        )}
        {visited.has('plan') && (
          <div hidden={tab !== 'plan'} className="h-full min-h-0 gp-pane">
            <PlanPage {...common} plan={plan} status={status} onTab={setTab} focus={focusFor('plan')} />
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
