'use client';

import { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import EditorToolbar from './EditorToolbar';
import ForgeOutput from './ForgeOutput';
import ApproachBoard from './ApproachBoard';
import FieldNotes from './FieldNotes';
import type { Language } from '@/lib/types';

interface EditorPanelProps {
  problem: string;
  language: Language;
  code: string;
  output: string | null;
  outputHeight: number;
  isSaving: boolean;
  isRunning: boolean;
  isAiLoading: boolean;
  showNotes: boolean;
  showApproach: boolean;
  isMastered: boolean;
  noteValue: string;
  approachValue: string;
  editorFontSize: number;
  editorFontFamily: string;
  onCodeChange: (code: string) => void;
  onSave: () => void;
  onRun: () => void;
  onGetIntel: () => void;
  onToggleNotes: () => void;
  onToggleApproach: () => void;
  onOpenSettings: () => void;
  onLanguageChange: (lang: Language) => void;
  onNoteChange: (val: string) => void;
  onApproachChange: (val: string) => void;
  onOutputClose: () => void;
  onOutputResize: (h: number) => void;
  onEditorActivity: () => void;
  showLeftPanel: boolean;
  showRightPanel: boolean;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
}

export default function EditorPanel({
  problem,
  language,
  code,
  output,
  outputHeight,
  isSaving,
  isRunning,
  isAiLoading,
  showNotes,
  showApproach,
  isMastered,
  noteValue,
  approachValue,
  editorFontSize,
  editorFontFamily,
  onCodeChange,
  onSave,
  onRun,
  onGetIntel,
  onToggleNotes,
  onToggleApproach,
  onOpenSettings,
  onLanguageChange,
  onNoteChange,
  onApproachChange,
  onOutputClose,
  onOutputResize,
  onEditorActivity,
  showLeftPanel,
  showRightPanel,
  onToggleLeftPanel,
  onToggleRightPanel,
}: EditorPanelProps) {
  const editorRef = useRef<unknown>(null);

  // Ctrl+S save shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onSave]);

  return (
    <div className="flex flex-col h-full min-w-0 bg-[#0a0a0f]">
      <EditorToolbar
        problem={problem}
        language={language}
        isSaving={isSaving}
        isRunning={isRunning}
        isAiLoading={isAiLoading}
        showNotes={showNotes}
        showApproach={showApproach}
        onSave={onSave}
        onRun={onRun}
        onGetIntel={onGetIntel}
        onToggleNotes={onToggleNotes}
        onToggleApproach={onToggleApproach}
        onOpenSettings={onOpenSettings}
        onLanguageChange={onLanguageChange}
        showLeftPanel={showLeftPanel}
        showRightPanel={showRightPanel}
        onToggleLeftPanel={onToggleLeftPanel}
        onToggleRightPanel={onToggleRightPanel}
      />

      {/* Editor + overlays */}
      <div className="flex-1 relative overflow-hidden">
        <Editor
          height="100%"
          language={language}
          value={code}
          theme="vs-dark"
          onChange={(v) => {
            onCodeChange(v || '');
            onEditorActivity();
          }}
          onMount={(editor, monaco) => {
            editorRef.current = editor;
            // Ctrl+Enter → Run
            editor.addCommand(
              monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
              () => onRun()
            );
          }}
          options={{
            minimap: { enabled: false },
            fontSize: editorFontSize,
            fontFamily: editorFontFamily,
            lineHeight: editorFontSize * 1.6,
            padding: { top: 16, bottom: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorStyle: 'line',
            cursorSmoothCaretAnimation: 'on',
            formatOnPaste: true,
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            fastScrollSensitivity: 5,
            mouseWheelZoom: true,
            wordWrap: 'off',
            scrollbar: { vertical: 'visible', horizontal: 'visible' },
            quickSuggestions: { other: true, comments: true, strings: true },
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            tabCompletion: 'on',
            parameterHints: { enabled: true },
            wordBasedSuggestions: 'allDocuments',
            snippetSuggestions: 'top',
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            folding: true,
            glyphMargin: false,
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            selectionHighlight: true,
          }}
        />

        {/* Output terminal */}
        {output !== null && (
          <ForgeOutput
            output={output}
            height={outputHeight}
            onClose={onOutputClose}
            onResize={onOutputResize}
          />
        )}

        {/* Approach Board overlay */}
        <ApproachBoard
          show={showApproach}
          problem={problem}
          value={approachValue}
          onChange={onApproachChange}
          onClose={onToggleApproach}
        />

        {/* Field Notes / Whiteboard overlay */}
        <FieldNotes
          show={showNotes}
          problem={problem}
          noteValue={noteValue}
          onNoteChange={onNoteChange}
          onClose={onToggleNotes}
        />
      </div>
    </div>
  );
}
