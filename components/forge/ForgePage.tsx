import React, { useState } from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { GripVertical, GripHorizontal } from 'lucide-react';
import { clsx } from 'clsx';
import MissionsSidebar from './sidebar/MissionsSidebar';
import EditorPanel from './editor/EditorPanel';
import ChatPanel from './chat/ChatPanel';
import ForgeSettings from './settings/ForgeSettings';
import type { Message, Language, AIProvider } from '@/lib/types';


interface ForgePageProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  selectedProblem: string;
  masteredProblems: string[];
  lastReviewDate: Record<string, string>;
  codeMap: Record<string, string>;
  userNotes: Record<string, string>;
  approachBoard: Record<string, string>;
  language: Language;
  editorFontSize: number;
  editorFontFamily: string;
  output: string | null;
  outputHeight: number;
  isSaving: boolean;
  isRunning: boolean;
  showNotes: boolean;
  showApproach: boolean;
  messages: Message[];
  input: string;
  isLoading: boolean;
  showSettings: boolean;
  selectedProvider: AIProvider;
  selectedModel: string;
  orientation: 'horizontal' | 'vertical';
  onSelectProblem: (p: string) => void;
  onGoHome: () => void;
  onCodeChange: (code: string) => void;
  onSave: () => void;
  onRun: () => void;
  onToggleNotes: () => void;
  onToggleApproach: () => void;
  onOpenSettings: () => void;
  onCloseSettings: () => void;
  onLanguageChange: (lang: Language) => void;
  onNoteChange: (val: string) => void;
  onApproachChange: (val: string) => void;
  onOutputClose: () => void;
  onOutputResize: (h: number) => void;
  onEditorActivity: () => void;
  onInputChange: (v: string) => void;
  onSend: (override?: string) => void;
  onStop: () => void;
  onToggleMastered: (prob: string) => void;
  onClearChat: () => void;
  onProviderChange: (p: AIProvider) => void;
  onModelChange: (m: string) => void;
  onFontSizeChange: (s: number) => void;
  onFontFamilyChange: (f: string) => void;
  onResetForge: () => void;
}

export default function ForgePage({
  theme, onToggleTheme,
  selectedProblem, masteredProblems, lastReviewDate, codeMap, userNotes, approachBoard,
  language, editorFontSize, editorFontFamily, output, outputHeight, isSaving, isRunning, showNotes, showApproach,
  messages, input, isLoading,
  showSettings, selectedProvider, selectedModel,
  orientation,
  onSelectProblem, onGoHome,
  onCodeChange, onSave, onRun, onToggleNotes, onToggleApproach, onOpenSettings, onCloseSettings,
  onLanguageChange, onNoteChange, onApproachChange, onOutputClose, onOutputResize, onEditorActivity,
  onInputChange, onSend, onStop, onToggleMastered, onClearChat,
  onProviderChange, onModelChange, onFontSizeChange, onFontFamilyChange,
  onResetForge,
}: ForgePageProps) {
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);

  // Compute derived values directly without useMemo since codeMap is a mutated ref object
  const currentCode = codeMap[`${selectedProblem}-${language}`] ?? '';
  const currentNote = userNotes[selectedProblem] ?? '';
  const currentApproach = approachBoard[selectedProblem] ?? '';

  // Stable toggle callbacks
  const handleToggleLeftPanel = React.useCallback(() => setShowLeftPanel(s => !s), []);
  const handleToggleRightPanel = React.useCallback(() => setShowRightPanel(s => !s), []);
  const handleCloseLeft = React.useCallback(() => setShowLeftPanel(false), []);
  const handleCloseRight = React.useCallback(() => setShowRightPanel(false), []);

  const isHorizontal = orientation === 'horizontal';
  const separatorClass = clsx(
    'forge-resize-handle border-border-subtle shrink-0',
    isHorizontal ? 'w-1.5 cursor-col-resize border-x' : 'h-1.5 w-full cursor-row-resize border-y'
  );
  const GripIcon = isHorizontal ? GripVertical : GripHorizontal;

  return (
    <div className="h-screen w-full overflow-hidden bg-bg-base">
      <PanelGroup orientation={orientation} className="h-full w-full">

        {/* ── LEFT SIDEBAR: Missions ──────────────────── */}
        {showLeftPanel && (
          <>
            <Panel id="forge-missions" defaultSize="22%" minSize="200px" maxSize="40%" className="min-w-0 min-h-0 overflow-hidden">
              <MissionsSidebar
                selectedProblem={selectedProblem}
                masteredProblems={masteredProblems}
                lastReviewDate={lastReviewDate}
                onSelectProblem={onSelectProblem}
                onGoHome={onGoHome}
                onToggleMastered={onToggleMastered}
                onClose={handleCloseLeft}
              />
            </Panel>
            <PanelResizeHandle id="forge-sep-left" className={separatorClass}>
              <GripIcon size={12} className="text-text-muted" />
            </PanelResizeHandle>
          </>
        )}

        {/* ── CENTER: Code Editor ─────────────────────── */}
        <Panel id="forge-editor" minSize="30%" className="min-w-0 min-h-0 overflow-hidden">
          <EditorPanel
            theme={theme}
            onToggleTheme={onToggleTheme}
            problem={selectedProblem}
            language={language}
            code={currentCode}
            output={output}
            outputHeight={outputHeight}
            isSaving={isSaving}
            isRunning={isRunning}
            showNotes={showNotes}
            showApproach={showApproach}
            noteValue={currentNote}
            approachValue={currentApproach}
            editorFontSize={editorFontSize}
            editorFontFamily={editorFontFamily}
            onCodeChange={onCodeChange}
            onSave={onSave}
            onRun={onRun}
            onToggleNotes={onToggleNotes}
            onToggleApproach={onToggleApproach}
            onOpenSettings={onOpenSettings}
            onLanguageChange={onLanguageChange}
            onNoteChange={onNoteChange}
            onApproachChange={onApproachChange}
            onOutputClose={onOutputClose}
            onOutputResize={onOutputResize}
            onEditorActivity={onEditorActivity}
            // Toggle controls for panels
            showLeftPanel={showLeftPanel}
            showRightPanel={showRightPanel}
            onToggleLeftPanel={handleToggleLeftPanel}
            onToggleRightPanel={handleToggleRightPanel}
          />
        </Panel>

        {/* ── RIGHT: Chat Panel ───────────────────────── */}
        {showRightPanel && (
          <>
            <PanelResizeHandle id="forge-sep-right" className={separatorClass}>
              <GripIcon size={12} className="text-text-muted" />
            </PanelResizeHandle>
            <Panel id="forge-chat" defaultSize="28%" minSize="240px" maxSize="50%" className="min-w-0 min-h-0 overflow-hidden">
              <ChatPanel
                theme={theme}
                selectedProblem={selectedProblem}
                messages={messages}
                input={input}
                isLoading={isLoading}
                onInputChange={onInputChange}
                onSend={onSend}
                onStop={onStop}
                onClearChat={onClearChat}
                onSelectProblem={onSelectProblem}
                onClose={handleCloseRight}
              />
            </Panel>
          </>
        )}
      </PanelGroup>

      {/* Settings Modal */}
      <ForgeSettings
        show={showSettings}
        selectedProvider={selectedProvider}
        selectedModel={selectedModel}
        editorFontSize={editorFontSize}
        editorFontFamily={editorFontFamily}
        onClose={onCloseSettings}
        onProviderChange={onProviderChange}
        onModelChange={onModelChange}
        onFontSizeChange={onFontSizeChange}
        onFontFamilyChange={onFontFamilyChange}
        onResetForge={onResetForge}
      />
    </div>
  );
}
