import React, { useState, useMemo } from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { GripVertical, Menu, X, Layout, MessageSquare } from 'lucide-react';
import MissionsSidebar from './sidebar/MissionsSidebar';
import EditorPanel from './editor/EditorPanel';
import ChatPanel from './chat/ChatPanel';
import ForgeSettings from './settings/ForgeSettings';
import type { Message, Language, AIProvider } from '@/lib/types';

interface ForgePageProps {
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
  onGetIntel: () => void;
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
  onToggleMastered: (prob: string) => void;
  onClearChat: () => void;
  onProviderChange: (p: AIProvider) => void;
  onModelChange: (m: string) => void;
  onFontSizeChange: (s: number) => void;
  onFontFamilyChange: (f: string) => void;
  onResetForge: () => void;
}

export default function ForgePage({
  selectedProblem, masteredProblems, lastReviewDate, codeMap, userNotes, approachBoard,
  language, editorFontSize, editorFontFamily, output, outputHeight, isSaving, isRunning, showNotes, showApproach,
  messages, input, isLoading,
  showSettings, selectedProvider, selectedModel,
  orientation,
  onSelectProblem, onGoHome,
  onCodeChange, onSave, onRun, onGetIntel, onToggleNotes, onToggleApproach, onOpenSettings, onCloseSettings,
  onLanguageChange, onNoteChange, onApproachChange, onOutputClose, onOutputResize, onEditorActivity,
  onInputChange, onSend, onToggleMastered, onClearChat,
  onProviderChange, onModelChange, onFontSizeChange, onFontFamilyChange,
  onResetForge,
}: ForgePageProps) {
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);

  // Compute derived values directly without useMemo since codeMap is a mutated ref object
  const currentCode = codeMap[`${selectedProblem}-${language}`] ?? '';
  const currentNote = userNotes[selectedProblem] ?? '';
  const currentApproach = approachBoard[selectedProblem] ?? '';
  const isMastered = masteredProblems.includes(selectedProblem);

  // Stable toggle callbacks
  const handleToggleLeftPanel = React.useCallback(() => setShowLeftPanel(s => !s), []);
  const handleToggleRightPanel = React.useCallback(() => setShowRightPanel(s => !s), []);
  const handleCloseLeft = React.useCallback(() => setShowLeftPanel(false), []);
  const handleCloseRight = React.useCallback(() => setShowRightPanel(false), []);
  const handleToggleMasteredCurrent = React.useCallback(
    () => onToggleMastered(selectedProblem),
    [onToggleMastered, selectedProblem]
  );

  return (
    <div className="h-screen w-full overflow-hidden bg-[#0a0a0f]">
      <PanelGroup orientation={orientation} className="h-full w-full">

        {/* ── LEFT SIDEBAR: Missions ──────────────────── */}
        {showLeftPanel && (
          <>
            <Panel defaultSize={25} minSize={20} className="flex">
              <MissionsSidebar
                selectedProblem={selectedProblem}
                masteredProblems={masteredProblems}
                lastReviewDate={lastReviewDate}
                codeMap={codeMap}
                onSelectProblem={onSelectProblem}
                onGoHome={onGoHome}
                onToggleMastered={onToggleMastered}
                onClose={handleCloseLeft}
              />
            </Panel>
            <PanelResizeHandle className="forge-resize-handle w-2 border-x border-blue-500/10 cursor-col-resize">
              <GripVertical size={12} className="text-[#334155]" />
            </PanelResizeHandle>
          </>
        )}

        {/* ── CENTER: Code Editor ─────────────────────── */}
        <Panel defaultSize={showLeftPanel && showRightPanel ? 45 : showLeftPanel || showRightPanel ? 70 : 100} minSize={30}>
          <EditorPanel
            problem={selectedProblem}
            language={language}
            code={currentCode}
            output={output}
            outputHeight={outputHeight}
            isSaving={isSaving}
            isRunning={isRunning}
            isAiLoading={isLoading}
            showNotes={showNotes}
            showApproach={showApproach}
            isMastered={isMastered}
            noteValue={currentNote}
            approachValue={currentApproach}
            editorFontSize={editorFontSize}
            editorFontFamily={editorFontFamily}
            onCodeChange={onCodeChange}
            onSave={onSave}
            onRun={onRun}
            onGetIntel={onGetIntel}
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
            <PanelResizeHandle className="forge-resize-handle w-2 border-x border-blue-500/10 cursor-col-resize">
              <GripVertical size={12} className="text-[#334155]" />
            </PanelResizeHandle>
            <Panel defaultSize={30} minSize={20}>
              <ChatPanel
                selectedProblem={selectedProblem}
                messages={messages}
                input={input}
                isLoading={isLoading}
                masteredProblems={masteredProblems}
                onInputChange={onInputChange}
                onSend={onSend}
                onToggleMastered={handleToggleMasteredCurrent}
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
