import { Save, Play, Settings, StickyNote, Loader2, Menu, MessageSquare, Sun, Moon } from 'lucide-react';
import { clsx } from 'clsx';
import type { Language } from '@/lib/types';

interface EditorToolbarProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  problem: string;
  language: Language;
  isSaving: boolean;
  isRunning: boolean;
  isAiLoading: boolean;
  showNotes: boolean;
  showLeftPanel: boolean;
  showRightPanel: boolean;
  onSave: () => void;
  onRun: () => void;
  onToggleNotes: () => void;
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
  isAiLoading,
  showNotes,
  showLeftPanel,
  showRightPanel,
  onSave,
  onRun,
  onToggleNotes,
  onOpenSettings,
  onLanguageChange,
  onToggleLeftPanel,
  onToggleRightPanel,
}: EditorToolbarProps) {
  return (
    <header className="h-14 border-b border-border-subtle flex items-center justify-between px-4 shrink-0 bg-bg-surface">
      {/* Problem name */}
      <div className="flex items-center gap-3 min-w-0">
        {!showLeftPanel && (
          <button
            onClick={onToggleLeftPanel}
            className="forge-btn w-9 h-9 px-0 flex items-center justify-center border-border-default text-blue-400"
            title="Open Missions"
          >
            <Menu size={16} />
          </button>
        )}
        <h2 className="font-black text-sm uppercase tracking-tight text-text-primary truncate max-w-[220px]">
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

        {/* Field Notes / TlDraw */}
        <button
          onClick={onToggleNotes}
          className={clsx('forge-btn h-9', showNotes && 'border-blue-500/60 text-blue-400')}
          title="Field Notes & Whiteboard"
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

        {/* Theme Toggle — bigger icon */}
        <button
          onClick={onToggleTheme}
          className="forge-btn h-10 w-10 px-0 flex items-center justify-center border-border-default text-text-secondary"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Settings — bigger icon */}
        <button
          onClick={onOpenSettings}
          className="forge-btn h-10 w-10 px-0 flex items-center justify-center"
          title="Settings"
        >
          <Settings size={20} />
        </button>

        {/* Chat Toggle — bigger icon */}
        {!showRightPanel && (
          <button
            onClick={onToggleRightPanel}
            className="forge-btn h-10 w-10 px-0 flex items-center justify-center border-border-default text-blue-400"
            title="Open AI Chat"
          >
            <MessageSquare size={20} />
          </button>
        )}
      </div>
    </header>
  );
}
