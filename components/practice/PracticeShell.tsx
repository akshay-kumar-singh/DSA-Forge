'use client';

import React from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { Sun, Moon, Settings, Save, Loader2, Code2, Network, ArrowLeft, Cloud, CloudOff, FlaskConical, Sparkles } from 'lucide-react';
import type { PracticeTab } from '@/lib/practice/types';

const NAV: { id: PracticeTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'dsa', label: 'DSA practice', icon: Code2 },
  { id: 'design', label: 'System design', icon: Network },
];

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  tab: PracticeTab;
  onTab: (t: PracticeTab) => void;
  counts: { problems: number; designs: number };
  isSaving: boolean;
  cloudOk: boolean | null;
  onSave: () => void;
  onOpenSettings: () => void;
  /** The single assistant panel; a right column, an overlay on narrow screens */
  assistant: React.ReactNode;
  assistantOpen: boolean;
  assistantTitle: string;
  onToggleAssistant: () => void;
  children: React.ReactNode;
}

export default function PracticeShell({
  theme, onToggleTheme, tab, onTab, counts, isSaving, cloudOk, onSave, onOpenSettings,
  assistant, assistantOpen, assistantTitle, onToggleAssistant, children,
}: Props) {
  return (
    <div className="gp h-screen w-full flex flex-col overflow-hidden">
      <header className="h-14 shrink-0 border-b gp-border gp-panel flex items-center gap-2 px-3 md:px-4">
        <Link href="/" className="gp-btn gp-btn-ghost gp-btn-sm gp-t3 -ml-1 shrink-0" title="Back to DSA Forge">
          <ArrowLeft size={14} /><span className="hidden md:inline">Forge</span>
        </Link>
        <div className="flex items-center gap-2 pl-2 border-l gp-border shrink-0">
          <FlaskConical size={16} className="gp-purple shrink-0" aria-hidden />
          <span className="gp-display text-[15px] font-bold gp-t1 whitespace-nowrap hidden lg:inline">Practice Lab</span>
        </div>

        <nav className="flex items-center gap-0.5 ml-2 min-w-0 gp-scroll-x" aria-label="Practice sections">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => onTab(id)} className={clsx('gp-tab shrink-0', tab === id && 'gp-tab-active')} aria-current={tab === id ? 'page' : undefined} aria-label={label} title={label}>
              <Icon size={15} />
              <span className="gp-tab-label">{label}</span>
              <span className="gp-chip gp-chip-xs">{id === 'dsa' ? counts.problems : counts.designs}</span>
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 shrink-0 pl-2">
          <span className="gp-t3" title={cloudOk === false ? 'Cloud sync unavailable — saved in this browser' : cloudOk ? 'Cloud sync on' : 'Checking cloud…'}>
            {cloudOk === false ? <CloudOff size={15} className="gp-yellow" /> : <Cloud size={15} className={cloudOk ? 'gp-green' : ''} />}
          </span>
          <button onClick={onSave} disabled={isSaving} className={clsx('gp-btn gp-btn-sm', isSaving && 'gp-btn-active')} title="Save now (autosaves as you type)">
            {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            <span className="hidden xl:inline">{isSaving ? 'Saved' : 'Save'}</span>
          </button>
          <button onClick={onToggleAssistant} className={clsx('gp-btn gp-btn-sm', assistantOpen && 'gp-btn-primary')} title={`${assistantOpen ? 'Hide' : 'Show'} the assistant — ${assistantTitle} on this tab`} aria-pressed={assistantOpen}>
            <Sparkles size={14} />
            <span className="hidden lg:inline">{assistantTitle}</span>
          </button>
          <button onClick={onToggleTheme} className="gp-btn gp-btn-sm gp-btn-icon" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button onClick={onOpenSettings} className="gp-btn gp-btn-sm gp-btn-icon" title="AI & editor settings">
            <Settings size={14} />
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        <main className="flex-1 min-w-0 min-h-0 overflow-hidden">{children}</main>
        {assistantOpen && (
          <aside className="gp-assistant shrink-0 min-h-0 overflow-hidden" aria-label="Assistant">
            {assistant}
          </aside>
        )}
      </div>
    </div>
  );
}
