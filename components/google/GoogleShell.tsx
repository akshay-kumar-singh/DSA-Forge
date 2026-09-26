'use client';

import React from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { Sun, Moon, Settings, Save, Loader2, CalendarDays, Code2, Network, Users, Timer, ListChecks, ArrowLeft, Cloud, CloudOff, Target, NotebookPen, Sparkles, FileSearch } from 'lucide-react';
import type { GoogleTab } from '@/lib/google/types';
import type { PlanStatus } from '@/lib/google/plan';

const NAV: { id: GoogleTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'today', label: 'Today', icon: CalendarDays },
  { id: 'dsa', label: 'DSA', icon: Code2 },
  { id: 'design', label: 'System Design', icon: Network },
  { id: 'behavioural', label: 'Behavioural', icon: Users },
  { id: 'mocks', label: 'Mocks', icon: Timer },
  { id: 'comprehension', label: 'Comprehension', icon: FileSearch },
  { id: 'plan', label: 'Plan', icon: ListChecks },
  { id: 'notes', label: 'Notes', icon: NotebookPen },
];

interface Props {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  tab: GoogleTab;
  onTab: (t: GoogleTab) => void;
  status: PlanStatus;
  isSaving: boolean;
  cloudOk: boolean | null;
  onSave: () => void;
  onOpenSettings: () => void;
  /** The single assistant panel; rendered as a right column (overlay on narrow screens) */
  assistant: React.ReactNode;
  assistantOpen: boolean;
  assistantTitle: string;
  onToggleAssistant: () => void;
  children: React.ReactNode;
}

export default function GoogleShell({ theme, onToggleTheme, tab, onTab, status, isSaving, cloudOk, onSave, onOpenSettings, assistant, assistantOpen, assistantTitle, onToggleAssistant, children }: Props) {
  const deltaText = !status.started ? `starts in ${-status.calendarDay}d` : status.delta === 0 ? 'on schedule' : `${status.delta > 0 ? '+' : ''}${status.delta}d`;
  const deltaCls = !status.started ? 'gp-chip-blue' : status.delta > 0 ? 'gp-chip-green' : status.delta < 0 ? 'gp-chip-red' : '';

  return (
    <div className="gp h-screen w-full flex flex-col overflow-hidden">
      <header className="h-14 shrink-0 border-b gp-border gp-panel flex items-center gap-2 px-3 md:px-4">
        <Link href="/" className="gp-btn gp-btn-ghost gp-btn-sm gp-t3 -ml-1 shrink-0" title="Back to DSA Forge">
          <ArrowLeft size={14} /><span className="hidden md:inline">Forge</span>
        </Link>
        <div className="flex items-center gap-2 pl-2 border-l gp-border shrink-0">
          <Target size={16} className="gp-blue shrink-0" aria-hidden />
          <span className="gp-display text-[15px] font-bold gp-t1 whitespace-nowrap hidden lg:inline">Interview Prep</span>
        </div>

        {/* Only the tab you are on spells itself out — eight labels never fit, and
            eight anonymous icons lose you. Everything keeps a tooltip. */}
        <nav className="flex items-center gap-0.5 ml-2 min-w-0 gp-scroll-x" aria-label="Interview prep sections">
          {NAV.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => onTab(id)}
                className={clsx('gp-tab shrink-0', active && 'gp-tab-active')}
                aria-current={active ? 'page' : undefined}
                aria-label={label}
                title={label}
              >
                <Icon size={15} />
                <span className="gp-tab-label">{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 shrink-0 pl-2">
          <div className="hidden md:flex items-center gap-1.5 pr-1.5 mr-0.5 border-r gp-border" title={`${status.daysLeft} plan days left · ${deltaText}`}>
            <span className="gp-num text-[15px] gp-blue">{status.daysLeft}d</span>
            <span className={clsx('gp-chip gp-chip-xs', deltaCls)}>{deltaText}</span>
          </div>
          <span className="gp-t3" title={cloudOk === false ? 'Cloud sync unavailable — saved in this browser' : cloudOk ? 'Cloud sync on' : 'Checking cloud…'}>
            {cloudOk === false ? <CloudOff size={15} className="gp-yellow" /> : <Cloud size={15} className={cloudOk ? 'gp-green' : ''} />}
          </span>
          <button onClick={onSave} disabled={isSaving} className={clsx('gp-btn gp-btn-sm shrink-0', isSaving && 'gp-btn-active')} title="Save now (autosaves every minute)">
            {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            <span className="hidden 2xl:inline">{isSaving ? 'Saved' : 'Save'}</span>
          </button>
          <button onClick={onToggleAssistant} className={clsx('gp-btn gp-btn-sm shrink-0', assistantOpen && 'gp-btn-primary')} title={`${assistantOpen ? 'Hide' : 'Show'} the assistant — ${assistantTitle} on this tab`} aria-pressed={assistantOpen}>
            <Sparkles size={14} />
            <span className="hidden xl:inline">{assistantTitle}</span>
          </button>
          <button onClick={onToggleTheme} className="gp-btn gp-btn-sm gp-btn-icon shrink-0" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button onClick={onOpenSettings} className="gp-btn gp-btn-sm gp-btn-icon shrink-0" title="AI & editor settings">
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
