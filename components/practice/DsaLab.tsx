'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { GripVertical, GripHorizontal, Code2, Menu, FileQuestion, Check, X } from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import EditorPanel from '@/components/forge/editor/EditorPanel';
import LabList from './LabList';
import type { PracticeStore } from './usePracticeStore';
import type { Language } from '@/lib/types';
import { newProblem, type PracticeProblem } from '@/lib/practice/types';
import { runCode } from '@/lib/code-runner';

const LANGS: Language[] = ['javascript', 'python', 'java', 'cpp'];
const DIFFS: PracticeProblem['difficulty'][] = ['', 'easy', 'medium', 'hard'];

const starterFor = (title: string, lang: Language): string => {
  const head = `Practice: ${title || 'Untitled'}`;
  switch (lang) {
    case 'python': return `# ${head}\n\ndef solve():\n    # Write your code here\n    pass\n\n\nprint(solve())\n`;
    case 'java': return `// ${head}\n\npublic class Main {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}\n`;
    case 'cpp': return `// ${head}\n\n#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}\n`;
    default: return `/**\n * ${head}\n */\nfunction solve() {\n  // Write your code here\n}\n\n// Run your own cases:\nconsole.log(solve());\n`;
  }
};

interface Props {
  theme: 'dark' | 'light';
  store: PracticeStore;
  orientation: 'horizontal' | 'vertical';
  editorFontSize: number;
  editorFontFamily: string;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onToggleAssistant: () => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

/** Your own coding problems: paste the question, solve it, keep the code and the notes. */
export default function DsaLab({ theme, store, orientation, editorFontSize, editorFontFamily, onToggleTheme, onOpenSettings, onToggleAssistant, selectedId, onSelect }: Props) {
  const s = store.state;
  const language = s.language;
  const problem = s.problems.find(p => p.id === selectedId) ?? null;

  const [showLeft, setShowLeft] = useState(true);
  const [showPrompt, setShowPrompt] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [outputHeight, setOutputHeight] = useState(250);
  const [isRunning, setIsRunning] = useState(false);

  const patch = useCallback((id: string, fields: Partial<PracticeProblem>) => {
    store.update(st => {
      st.problems = st.problems.map(p => (p.id === id ? { ...p, ...fields, updated: new Date().toISOString() } : p));
    });
  }, [store]);

  const add = () => {
    const p = newProblem();
    store.update(st => { st.problems = [...st.problems, p]; });
    onSelect(p.id);
    setShowPrompt(true);
    setOutput(null);
  };
  const remove = (id: string) => {
    const p = s.problems.find(x => x.id === id);
    if (!confirm(`Delete "${p?.title || 'Untitled'}"? The code and notes go with it.`)) return;
    store.update(st => { st.problems = st.problems.filter(x => x.id !== id); });
    if (selectedId === id) onSelect(null);
  };

  // Until they type, the editor shows a starter for the current language; nothing
  // is persisted for a language they never open. Keystrokes go through `touch`,
  // so Monaco is never re-rendered by the store.
  const code = problem ? (problem.code[language] ?? starterFor(problem.title, language)) : '';
  const codeRef = useRef(code);
  useEffect(() => { codeRef.current = code; }, [code]);
  const handleCodeChange = useCallback((c: string) => {
    if (!problem) return;
    codeRef.current = c;
    store.touch(st => {
      const p = st.problems.find(x => x.id === problem.id);
      if (p) { p.code[language] = c; p.updated = new Date().toISOString(); }
    });
  }, [store, problem, language]);

  const handleRun = useCallback(async () => {
    if (!problem) return;
    setIsRunning(true);
    const id = toast.loading('Executing…');
    try {
      // `__practice__` is unknown to the runner, so nothing is auto-injected —
      // your own console.log / print calls are the test.
      const r = await runCode(codeRef.current, language, '__practice__');
      setOutput(r);
      if (r.includes('❌')) toast.error('Execution failed', { id }); else toast.success('Execution complete', { id });
    } catch { toast.error('Execution error', { id }); } finally { setIsRunning(false); }
  }, [problem, language]);

  const items = useMemo(() => s.problems.map(p => ({
    id: p.id,
    title: p.title,
    sub: [p.difficulty, p.source].filter(Boolean).join(' · ') || (p.prompt.trim().slice(0, 60)),
    done: p.solved,
    updated: p.updated,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  })), [store.tick]);

  const isH = orientation === 'horizontal';
  const sep = clsx('gp-handle shrink-0', isH ? 'w-1.5 cursor-col-resize border-x' : 'h-1.5 w-full cursor-row-resize border-y');
  const Grip = isH ? GripVertical : GripHorizontal;

  return (
    <div className="h-full w-full overflow-hidden flex" style={{ background: 'var(--gp-ground)' }}>
      <PanelGroup orientation={orientation} className="h-full w-full">
        {showLeft && (
          <>
            <Panel id="pl-side" defaultSize="24%" minSize="220px" maxSize="40%" className="min-w-0 min-h-0 overflow-hidden">
              <LabList
                icon={<Code2 size={16} />}
                heading="My problems"
                noun="problem"
                items={items}
                selectedId={selectedId}
                onSelect={id => { onSelect(id); setOutput(null); setShowNotes(false); }}
                onNew={add}
                onDelete={remove}
                onClose={() => setShowLeft(false)}
                hint="Nothing here yet. Add the question you were asked in an interview, a recruiter assignment, or anything you want to keep."
              />
            </Panel>
            <PanelResizeHandle id="pl-sep" className={sep}><Grip size={12} className="gp-t3" /></PanelResizeHandle>
          </>
        )}

        <Panel id="pl-main" minSize="35%" className="min-w-0 min-h-0 overflow-hidden">
          {!problem ? (
            <Empty onNew={add} showLeft={showLeft} onOpenList={() => setShowLeft(true)} />
          ) : (
            <div className="h-full flex flex-col">
              {/* Title bar — everything about this problem, editable in place */}
              <div className="h-14 shrink-0 border-b gp-border gp-panel flex items-center gap-2 px-3">
                {!showLeft && <button onClick={() => setShowLeft(true)} className="gp-btn gp-btn-sm gp-btn-icon" title="My problems"><Menu size={15} /></button>}
                <input
                  value={problem.title}
                  onChange={e => patch(problem.id, { title: e.target.value })}
                  placeholder="Problem title — e.g. “Merge overlapping meetings (phone screen)”"
                  className="flex-1 min-w-0 bg-transparent outline-none text-[15px] font-bold gp-t1 placeholder:font-normal placeholder:gp-t3"
                  aria-label="Problem title"
                />
                <select
                  value={problem.difficulty}
                  onChange={e => patch(problem.id, { difficulty: e.target.value as PracticeProblem['difficulty'] })}
                  className="gp-input gp-select gp-input-sm shrink-0"
                  aria-label="Difficulty"
                >
                  {DIFFS.map(d => <option key={d || 'none'} value={d}>{d ? d[0].toUpperCase() + d.slice(1) : 'Difficulty'}</option>)}
                </select>
                <button
                  onClick={() => patch(problem.id, { solved: !problem.solved })}
                  className={clsx('gp-btn gp-btn-sm shrink-0', problem.solved && 'gp-btn-active gp-green')}
                  title={problem.solved ? 'Mark as not solved' : 'Mark as solved'}
                >
                  <Check size={13} /><span className="hidden lg:inline">{problem.solved ? 'Solved' : 'Mark solved'}</span>
                </button>
                <button onClick={() => setShowPrompt(v => !v)} className={clsx('gp-btn gp-btn-sm shrink-0', showPrompt && 'gp-btn-active')} title="The question">
                  <FileQuestion size={13} /><span className="hidden lg:inline">Question</span>
                </button>
              </div>

              {showPrompt && (
                <div className="shrink-0 border-b gp-border gp-sub px-3 py-2.5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="gp-label">The question — paste it here</span>
                    <input
                      value={problem.source}
                      onChange={e => patch(problem.id, { source: e.target.value })}
                      placeholder="Where from? (company, round, link)"
                      className="gp-input gp-input-sm ml-auto w-[240px] max-w-[45%]"
                      aria-label="Source"
                    />
                    <button onClick={() => setShowPrompt(false)} className="gp-btn gp-btn-ghost gp-btn-sm gp-btn-icon gp-t3" title="Hide"><X size={13} /></button>
                  </div>
                  <textarea
                    value={problem.prompt}
                    onChange={e => patch(problem.id, { prompt: e.target.value })}
                    rows={problem.prompt ? Math.min(10, Math.max(3, problem.prompt.split('\n').length)) : 3}
                    placeholder={'Given an array of meeting intervals, return the minimum number of rooms…\n\nInput / output, constraints, and anything the interviewer said. The coach reads this.'}
                    className="gp-input gp-textarea w-full text-[13px]"
                  />
                </div>
              )}

              <div className="flex-1 min-h-0">
                <EditorPanel
                  theme={theme}
                  onToggleTheme={onToggleTheme}
                  problem={problem.title || 'Practice'}
                  language={language}
                  code={code}
                  output={output}
                  outputHeight={outputHeight}
                  isSaving={store.isSaving}
                  isRunning={isRunning}
                  showNotes={showNotes}
                  noteValue={problem.notes}
                  editorFontSize={editorFontSize}
                  editorFontFamily={editorFontFamily}
                  onCodeChange={handleCodeChange}
                  onSave={() => store.save()}
                  onRun={handleRun}
                  onToggleNotes={() => setShowNotes(v => !v)}
                  onOpenSettings={onOpenSettings}
                  onLanguageChange={l => { if (LANGS.includes(l)) store.update(st => { st.language = l; }); }}
                  onNoteChange={v => patch(problem.id, { notes: v })}
                  onOutputClose={() => setOutput(null)}
                  onOutputResize={setOutputHeight}
                  onEditorActivity={() => { /* autosave covers it */ }}
                  showLeftPanel={showLeft}
                  showRightPanel
                  onToggleLeftPanel={() => setShowLeft(v => !v)}
                  onToggleRightPanel={onToggleAssistant}
                  minimal
                />
              </div>
            </div>
          )}
        </Panel>
      </PanelGroup>
    </div>
  );
}

function Empty({ onNew, showLeft, onOpenList }: { onNew: () => void; showLeft: boolean; onOpenList: () => void }) {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="max-w-md text-center space-y-3">
        <span className="w-12 h-12 rounded-xl flex items-center justify-center gp-purple mx-auto" style={{ background: 'var(--gp-purple-wash)' }}><Code2 size={22} /></span>
        <div className="gp-h2">Your own problems live here</div>
        <p className="text-[13.5px] gp-t2 leading-relaxed">
          Paste a question you were actually asked, write the code in any of the four languages, run it, and keep your notes with it.
          The coach reads the question and your code — it hints, it never hands you the answer.
        </p>
        <div className="flex items-center justify-center gap-2 pt-1">
          <button onClick={onNew} className="gp-btn gp-btn-primary gp-btn-sm">New problem</button>
          {!showLeft && <button onClick={onOpenList} className="gp-btn gp-btn-sm">Show my problems</button>}
        </div>
      </div>
    </div>
  );
}

export { starterFor };
