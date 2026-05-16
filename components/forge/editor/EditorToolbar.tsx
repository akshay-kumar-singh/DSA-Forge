'use client';

import { Save, Play, Settings, StickyNote, Cpu, Eye, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import type { Language } from '@/lib/types';

interface EditorToolbarProps {
  problem: string;
  language: Language;
  isSaving: boolean;
  isRunning: boolean;
  isAiLoading: boolean;
  showNotes: boolean;
  showApproach: boolean;
  onSave: () => void;
  onRun: () => void;
  onGetIntel: () => void;
  onToggleNotes: () => void;
  onToggleApproach: () => void;
  onOpenSettings: () => void;
  onLanguageChange: (lang: Language) => void;
}

export default function EditorToolbar({
  problem,
  language,
  isSaving,
  isRunning,
  isAiLoading,
  showNotes,
  showApproach,
  onSave,
  onRun,
  onGetIntel,
  onToggleNotes,
  onToggleApproach,
  onOpenSettings,
  onLanguageChange,
}: EditorToolbarProps) {
  return (
    <header className="h-14 border-b border-blue-500/10 flex items-center justify-between px-4 shrink-0 bg-[#0f0f1a]">
      {/* Problem name + AI watching indicator */}
      <div className="flex items-center gap-3 min-w-0">
        <h2 className="font-black text-sm uppercase tracking-tight text-[#e2e8f0] truncate max-w-[220px]">
          {problem}
        </h2>
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/8 border border-blue-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 dot-blink" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-blue-400/80">
            AI Monitoring
          </span>
        </div>
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

        {/* Approach Board */}
        <button
          onClick={onToggleApproach}
          className={clsx('forge-btn h-9', showApproach && 'border-blue-500/60 text-blue-400')}
          title="Approach Board"
        >
          <Eye size={14} />
          <span className="hidden xl:inline">Approach</span>
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

        {/* Deploy (Run Code) */}
        <button
          onClick={onRun}
          disabled={isRunning}
          className="forge-btn forge-btn-primary h-9"
          title="Deploy (Ctrl+Enter)"
        >
          {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} className="fill-current" />}
          <span className="hidden sm:inline">{isRunning ? 'Running' : 'Deploy'}</span>
        </button>

        {/* Get Intel */}
        <button
          onClick={onGetIntel}
          disabled={isAiLoading}
          className="forge-btn h-9 border-yellow-500/40 text-yellow-400 hover:border-yellow-400 hover:shadow-[0_0_8px_rgba(234,179,8,0.2)]"
          title="Get Intel — AI reviews your current approach"
        >
          <Cpu size={14} />
          <span className="hidden xl:inline">Get Intel</span>
        </button>

        {/* Language selector */}
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value as Language)}
          aria-label="Language"
          className="h-9 px-2 text-[11px] font-black uppercase bg-[#141428] border border-blue-500/20 text-[#94a3b8] rounded outline-none cursor-pointer hover:border-blue-500/40 transition-colors hidden sm:block"
        >
          <option value="javascript">JS</option>
          <option value="python">PY</option>
          <option value="java">JAVA</option>
          <option value="cpp">C++</option>
        </select>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="forge-btn h-9 w-9 px-0 flex items-center justify-center"
          title="Settings"
        >
          <Settings size={14} />
        </button>
      </div>
    </header>
  );
}
