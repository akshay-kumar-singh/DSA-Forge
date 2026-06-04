'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import EditorToolbar from './EditorToolbar';
import ForgeOutput from './ForgeOutput';
import FieldNotes from './FieldNotes';
import type { Language } from '@/lib/types';

interface EditorPanelProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  problem: string;
  language: Language;
  code: string;
  output: string | null;
  outputHeight: number;
  isSaving: boolean;
  isRunning: boolean;
  isAiLoading: boolean;
  showNotes: boolean;
  isMastered: boolean;
  noteValue: string;
  editorFontSize: number;
  editorFontFamily: string;
  onCodeChange: (code: string) => void;
  onSave: () => void;
  onRun: () => void;
  onToggleNotes: () => void;
  onOpenSettings: () => void;
  onLanguageChange: (lang: Language) => void;
  onNoteChange: (val: string) => void;
  onOutputClose: () => void;
  onOutputResize: (h: number) => void;
  onEditorActivity: () => void;
  showLeftPanel: boolean;
  showRightPanel: boolean;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
}

const EditorPanel = React.memo(function EditorPanel({
  theme,
  onToggleTheme,
  problem,
  language,
  code,
  output,
  outputHeight,
  isSaving,
  isRunning,
  isAiLoading,
  isMastered,
  showNotes,
  noteValue,
  editorFontSize,
  editorFontFamily,
  onCodeChange,
  onSave,
  onRun,
  onToggleNotes,
  onOpenSettings,
  onLanguageChange,
  onNoteChange,
  onOutputClose,
  onOutputResize,
  onEditorActivity,
  showLeftPanel,
  showRightPanel,
  onToggleLeftPanel,
  onToggleRightPanel,
}: EditorPanelProps) {
  const editorRef = useRef<unknown>(null);
  const onCodeChangeRef = useRef(onCodeChange);
  const onEditorActivityRef = useRef(onEditorActivity);

  // Keep callback refs fresh without causing Monaco to re-render
  useEffect(() => { onCodeChangeRef.current = onCodeChange; }, [onCodeChange]);
  useEffect(() => { onEditorActivityRef.current = onEditorActivity; }, [onEditorActivity]);

  // Stable onChange handler that reads from refs — never changes identity
  const stableOnChange = useCallback((v: string | undefined) => {
    onCodeChangeRef.current(v || '');
    onEditorActivityRef.current();
  }, []);

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

  // Stable onMount handler — never changes identity
  const handleEditorMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor;
    // Ctrl+Enter → Run
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      () => onRun()
    );
  }, [onRun]);

  // Memoize editor options to prevent unnecessary Monaco re-renders
  const editorOptions = React.useMemo(() => ({
    minimap: { enabled: false },
    fontSize: editorFontSize,
    fontFamily: editorFontFamily,
    lineHeight: editorFontSize * 1.6,
    padding: { top: 16, bottom: 16 },
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    cursorBlinking: 'smooth' as const,
    cursorStyle: 'line' as const,
    cursorSmoothCaretAnimation: 'on' as const,
    formatOnPaste: true,
    overviewRulerLanes: 0,
    hideCursorInOverviewRuler: true,
    fastScrollSensitivity: 5,
    mouseWheelZoom: true,
    wordWrap: 'off' as const,
    scrollbar: { vertical: 'visible' as const, horizontal: 'visible' as const },
    quickSuggestions: { other: true, comments: true, strings: true },
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: 'on' as const,
    tabCompletion: 'on' as const,
    parameterHints: { enabled: true },
    wordBasedSuggestions: 'allDocuments' as const,
    snippetSuggestions: 'top' as const,
    autoClosingBrackets: 'always' as const,
    autoClosingQuotes: 'always' as const,
    folding: true,
    glyphMargin: false,
    lineNumbers: 'on' as const,
    renderLineHighlight: 'line' as const,
    selectionHighlight: true,
  }), [editorFontSize, editorFontFamily]);

  return (
    <div className="flex flex-col h-full min-w-0 bg-bg-base">
      <EditorToolbar
        theme={theme}
        onToggleTheme={onToggleTheme}
        problem={problem}
        language={language}
        isSaving={isSaving}
        isRunning={isRunning}
        isAiLoading={isAiLoading}
        showNotes={showNotes}
        onSave={onSave}
        onRun={onRun}
        onToggleNotes={onToggleNotes}
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
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          onChange={stableOnChange}
          onMount={handleEditorMount}
          options={editorOptions}
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
});

export default EditorPanel;
