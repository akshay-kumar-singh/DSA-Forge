import { Save, Play, Settings, StickyNote, Loader2, Menu, MessageSquare, Sun, Moon, Eye } from 'lucide-react';
import { clsx } from 'clsx';
import type { Language } from '@/lib/types';

interface EditorToolbarProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  problem: string;
  language: Language;
  isSaving: boolean;
  isRunning: boolean;
  showNotes: boolean;
  showApproach: boolean;
  showLeftPanel: boolean;
  showRightPanel: boolean;
  onSave: () => void;
  onRun: () => void;
  onToggleNotes: () => void;
  onToggleApproach: () => void;
  onOpenSettings: () => void;
  onLanguageChange: (lang: Language) => void;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
}

export default function EditorToolbar({
  theme,
  onToggleTheme,
  problem,
  language,
  isSaving,
  isRunning,
  showNotes,
  showApproach,
  showLeftPanel,
  showRightPanel,
  onSave,
  onRun,
  onToggleNotes,
  onToggleApproach,
  onOpenSettings,
  onLanguageChange,
  onToggleLeftPanel,
  onToggleRightPanel,
}: EditorToolbarProps) {
  return (
    <header className="h-14 border-b border-border-subtle flex items-center justify-between px-4 shrink-0 bg-bg-surface gap-2">
      {/* Problem name */}
      <div className="flex items-center gap-3 min-w-0">
        {!showLeftPanel && (
          <button
            onClick={onToggleLeftPanel}
            className="forge-btn w-9 h-9 px-0 shrink-0 flex items-center justify-center border-border-default text-blue-400"
            title="Open Missions"
          >
            <Menu size={16} />
          </button>
        )}
        <h2 className="font-black text-sm uppercase tracking-tight text-text-primary truncate">
          {problem}
        </h2>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Save */}
        <button
          onClick={onSave}
          disabled={isSaving}
          className={clsx('forge-btn h-9', isSaving && 'text-green-400 border-green-400/40')}
          title="Save (Ctrl+S)"
        >
          <Save size={14} />
          <span className="hidden xl:inline">{isSaving ? 'Saved' : 'Save'}</span>
        </button>

        {/* Approach Board — plan before you code */}
        <button
          onClick={onToggleApproach}
          className={clsx('forge-btn h-9', showApproach && 'border-blue-500/60 text-blue-400')}
          title="Approach Board — plan your strategy, AI reads it"
        >
          <Eye size={14} />
          <span className="hidden xl:inline">Approach</span>
        </button>

        {/* Field Notes */}
        <button
          onClick={onToggleNotes}
          className={clsx('forge-btn h-9', showNotes && 'border-blue-500/60 text-blue-400')}
          title="Field Notes"
        >
          <StickyNote size={14} />
          <span className="hidden xl:inline">Notes</span>
        </button>

        {/* Run Code */}
        <button
          onClick={onRun}
          disabled={isRunning}
          className="forge-btn forge-btn-primary h-9"
          title="Run Code (Ctrl+Enter)"
        >
          {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} className="fill-current" />}
          <span className="hidden sm:inline">{isRunning ? 'Running' : 'Run'}</span>
        </button>

        {/* Language selector */}
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value as Language)}
          aria-label="Language"
          className="h-9 px-2 text-[11px] font-black uppercase bg-bg-elevated border border-border-default text-text-secondary rounded outline-none cursor-pointer hover:border-blue-500/40 transition-colors hidden sm:block"
        >
          <option value="javascript">JS</option>
          <option value="python">PY</option>
          <option value="java">JAVA</option>
          <option value="cpp">C++</option>
        </select>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="forge-btn h-9 w-9 px-0 flex items-center justify-center border-border-default text-text-secondary"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="forge-btn h-9 w-9 px-0 flex items-center justify-center"
          title="Settings"
        >
          <Settings size={16} />
        </button>

        {/* Chat Toggle */}
        {!showRightPanel && (
          <button
            onClick={onToggleRightPanel}
            className="forge-btn h-9 w-9 px-0 flex items-center justify-center border-border-default text-blue-400"
            title="Open AI Chat"
          >
            <MessageSquare size={16} />
          </button>
        )}
      </div>
    </header>
  );
}
