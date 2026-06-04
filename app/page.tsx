'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { toast } from 'sonner';
import { buildForgeSystemPrompt } from '@/lib/forge-ai';
import { runCode as runCodeFn } from '@/lib/code-runner';
import { getStarterCode, AI_PROVIDERS } from '@/lib/problems';
import LandingPage from '@/components/landing/LandingPage';
import ForgePage from '@/components/forge/ForgePage';
import type { Message, Language, AIProvider, View } from '@/lib/types';
import { DSA_PATTERNS } from '@/lib/problems';

const TOTAL_PROBLEMS = DSA_PATTERNS.reduce((acc, p) => acc + p.problems.length, 0);

let _msgIdCounter = 0;
function createMsgId(): string {
  return `msg-${Date.now()}-${++_msgIdCounter}`;
}

function createMessage(role: 'user' | 'assistant', content: string): Message {
  return { id: createMsgId(), role, content };
}

const USER_ID = '00000000-0000-0000-0000-000000000000';

// Max messages to send to AI for context (keeps token usage reasonable)
const MAX_AI_HISTORY = 20;

export default function DSAForge() {
  const [view, setView] = useState<View>('home');
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Load theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('dsa-forge-theme') as 'dark' | 'light' | null;
    if (saved) {
      setTheme(saved);
    }
  }, []);

  // Update theme class / attribute on root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dsa-forge-theme', theme);
  }, [theme]);

  const handleToggleTheme = useCallback(() => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }, []);

  // ── Problem State ───────────────────────────────────
  const [selectedProblem, setSelectedProblem] = useState("Training: Custom Sandbox");
  const [masteredProblems, setMasteredProblems] = useState<string[]>([]);
  const [lastReviewDate, setLastReviewDate] = useState<Record<string, string>>({});

  // ── Editor State ────────────────────────────────────
  const [language, setLanguage] = useState<Language>('javascript');
  const [output, setOutput] = useState<string | null>(null);
  const [outputHeight, setOutputHeight] = useState(250);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showApproach, setShowApproach] = useState(false);
  const [editorFontSize, setEditorFontSize] = useState(14);
  const [editorFontFamily, setEditorFontFamily] = useState('var(--font-mono)');
  const [renderTick, setRenderTick] = useState(0); // Trigger re-renders when refs load data

  // ── Chat State (ephemeral — NOT saved to DB) ───────
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ── Settings State ─────────────────────────────────
  const [showSettings, setShowSettings] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(AI_PROVIDERS[0]);
  const [selectedModel, setSelectedModel] = useState(AI_PROVIDERS[0].models[0]);

  // ── Refs for latest state (solves stale closure bugs & stops re-renders on typing) ──
  const masteredRef = useRef(masteredProblems);
  const codeMapRef = useRef<Record<string, string>>({});
  const userNotesRef = useRef<Record<string, string>>({});
  const approachBoardRef = useRef<Record<string, string>>({});
  const lastReviewRef = useRef(lastReviewDate);
  const messagesRef = useRef(messages);
  const lastEditorActivity = useRef<number>(Date.now());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Keep state-backed refs in sync
  useEffect(() => { masteredRef.current = masteredProblems; }, [masteredProblems]);
  useEffect(() => { lastReviewRef.current = lastReviewDate; }, [lastReviewDate]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Responsive orientation
  useEffect(() => {
    const update = () => setOrientation(window.innerWidth < 1024 ? 'vertical' : 'horizontal');
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // ── Database: Load Progress (MongoDB) ──────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/progress');
        if (!res.ok) throw new Error('Failed to fetch progress');
        
        const { data } = await res.json();

        if (data) {
          if (data.code_map)         codeMapRef.current = data.code_map;
          if (data.user_notes)       userNotesRef.current = data.user_notes;
          if (data.approach_board)   approachBoardRef.current = data.approach_board;
          if (data.mastered_problems) setMasteredProblems(data.mastered_problems);
          if (data.last_review_date) setLastReviewDate(data.last_review_date);
          setRenderTick(t => t + 1); // trigger render for the loaded refs
        }
      } catch (error) {
        console.error('Error loading data from MongoDB:', error);
      }
    };
    load();
  }, []);


  // ── Fix: Ensure starter code exists for current problem on load ──
  useEffect(() => {
    if (view === 'forge') {
      const key = `${selectedProblem}-${language}`;
      if (!codeMapRef.current[key]) {
        codeMapRef.current[key] = getStarterCode(selectedProblem, language);
        setRenderTick(t => t + 1);
      }
    }
  }, [selectedProblem, language, view]);

  // ── Save (uses refs for always-fresh state, saves to MongoDB) ─────────
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    const toastId = toast.loading('Syncing progress with S.H.I.E.L.D. servers...');
    
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code_map: codeMapRef.current,
          user_notes: userNotesRef.current,
          mastered_problems: masteredRef.current,
          last_review_date: lastReviewRef.current,
          approach_board: approachBoardRef.current,
        }),
      });

      if (!res.ok) throw new Error('Failed to save to MongoDB');
      toast.success('Mission progress secured in cloud database.', { id: toastId });
    } catch (error: any) {
      console.error('Save error:', error.message);
      toast.error('Server sync failed. Check database connection.', { id: toastId });
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  }, []); // ← No deps needed — reads from refs


  // ── Problem Select (resets chat for the new problem) ─
  const handleSelectProblem = useCallback((prob: string) => {
    setSelectedProblem(prob);
    setOutput(null);
    setShowNotes(false);
    setShowApproach(false);

    const isTraining = prob.startsWith('Training:');
    
    // Reset chat to fresh state for the new problem
    setMessages([
      createMessage('assistant',
        isTraining
          ? `**${prob}** — Training loaded. 📡`
          : `**${prob}** — Mission loaded. 🎯`
      ),
    ]);

    // Code population is handled by the useEffect above
  }, []);


  // ── Run Code ─────────────────────────────────────────
  const handleRun = useCallback(async () => {
    const currentCode = codeMapRef.current[`${selectedProblem}-${language}`] ?? getStarterCode(selectedProblem, language);
    setIsRunning(true);
    const toastId = toast.loading('Executing mission code...');
    try {
      const result = await runCodeFn(currentCode, language, selectedProblem);
      setOutput(result);
      if (result.includes('❌')) {
        toast.error('Execution failed', { id: toastId });
      } else {
        toast.success('Execution complete', { id: toastId });
      }
    } catch (err) {
      toast.error('Execution error', { id: toastId });
    } finally {
      setIsRunning(false);
    }
  }, [selectedProblem, language]);

  // ── Toggle Mastered ─────────────────────────────────
  const handleToggleMastered = useCallback((prob: string) => {
    setMasteredProblems(prev => {
      const isMastered = prev.includes(prob);
      let updated: string[];
      
      if (isMastered) {
        updated = prev.filter(p => p !== prob);
        toast.info(`Mission status updated: ${prob} is back on the active list.`);
      } else {
        updated = [...prev, prob];
        toast.success('MISSION MASTERED! Status updated in S.H.I.E.L.D. database.', {
          description: `You have conquered ${prob}.`,
          duration: 5000,
        });
      }
      
      return updated;
    });
    
    setLastReviewDate(prev => ({ ...prev, [prob]: new Date().toISOString() }));
    
    // Auto-save — uses refs so it always has the latest state
    // Small delay to let React batch the state updates first
    setTimeout(() => handleSave(), 50);
  }, [handleSave]);

  // ── Stop AI Generation ────────────────────────────────
  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  // ── Send to AI ───────────────────────────────────────
  const handleSend = useCallback(async (overrideInput?: string) => {
    const messageText = overrideInput || input;
    if (!messageText.trim() || isLoading) return;

    // Always read latest code from ref for fresh context
    const currentCode = codeMapRef.current[`${selectedProblem}-${language}`] ?? getStarterCode(selectedProblem, language);
    const currentApproach = approachBoardRef.current[selectedProblem] ?? '';

    // Don't show stuck-timer internal messages to the user
    const isInternal = messageText.startsWith('[STUCK_TIMER]');

    const userMsg = createMessage('user', isInternal ? '' : messageText);
    if (!isInternal) {
      setMessages(prev => [...prev, userMsg]);
    }
    if (!overrideInput) setInput('');
    setIsLoading(true);

    // Create a fresh AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const systemPrompt = buildForgeSystemPrompt(
      selectedProblem,
      language,
      currentCode,
      currentApproach,
    );

    // Get current messages from ref (always fresh) and limit history
    const currentMessages = messagesRef.current;
    const recentMessages = currentMessages.slice(-MAX_AI_HISTORY);

    try {
      let content = '';

      if (selectedProvider.id === 'gemini') {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) throw new Error('Gemini API key missing (NEXT_PUBLIC_GEMINI_API_KEY)');

        const ai = new GoogleGenerativeAI(apiKey);
        const rawHistory = recentMessages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        }));
        const firstUser = rawHistory.findIndex(m => m.role === 'user');
        const apiHistory = firstUser !== -1 ? rawHistory.slice(firstUser) : [];

        const model = ai.getGenerativeModel({
          model: selectedModel,
          systemInstruction: systemPrompt,
        });

        // Use streaming for Gemini so we can abort mid-generation
        const streamResult = await model.generateContentStream({
          contents: [...apiHistory, { role: 'user', parts: [{ text: messageText }] }],
        });

        // Collect streamed chunks, abort-aware
        for await (const chunk of streamResult.stream) {
          if (controller.signal.aborted) break;
          content += chunk.text();
        }
      } else {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...recentMessages, { role: 'user', content: messageText }],
            provider: selectedProvider.id,
            model: selectedModel,
            systemInstruction: systemPrompt,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        content = data.text;
      }

      // Only add message if not aborted
      if (!controller.signal.aborted && content.trim()) {
        const assistantMsg = createMessage('assistant',
          content || "I'm having trouble formulating a response. Try again?"
        );
        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch (err: unknown) {
      // Silently ignore abort errors — user intentionally stopped
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const errMsg = err instanceof Error ? err.message : String(err);
      // Also ignore abort-like errors from Gemini SDK
      if (errMsg.includes('abort') || errMsg.includes('cancel')) return;
      const isQuota = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota');
      setMessages(prev => [...prev, createMessage('assistant',
        isQuota
          ? "⚠️ **API quota exceeded.** Please check your API billing or try a different provider in Settings."
          : `⚠️ **Connection error:**\n\`\`\`\n${errMsg}\n\`\`\`\nTry switching providers in Settings.`
      )]);
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, isLoading, selectedProblem, language, selectedProvider, selectedModel]);

  // ── Review Code ──────────────────────────────────────
  const handleReviewCode = useCallback(() => {
    handleSend(
      `Analyze my current code for ${selectedProblem}. Check what is correct, what is wrong, and where I am making mistakes. Provide the correct direction and next steps/approach. Keep it short, focused, and conceptual without giving away the full solution.`
    );
  }, [selectedProblem, handleSend]);

  // ── Stuck Timer: 10 min idle → proactive nudge ──────
  useEffect(() => {
    if (view !== 'forge') return;
    const interval = setInterval(() => {
      const idleMs = Date.now() - lastEditorActivity.current;
      if (idleMs > 10 * 60 * 1000 && !isLoading) {
        lastEditorActivity.current = Date.now(); // reset so it doesn't spam
        handleSend(`[STUCK_TIMER] The user hasn't typed anything in the editor for 10 minutes. Send a short, encouraging message and offer a gentle Level 1 hint for the current problem without them asking. Be proactive and warm.`);
      }
    }, 60_000); // check every minute
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, isLoading]);

  // ── Code change (memoized — fixes editor lag) ───────
  const handleCodeChange = useCallback((code: string) => {
    codeMapRef.current[`${selectedProblem}-${language}`] = code;
    // NO setRenderTick here — typing doesn't trigger React renders!
  }, [selectedProblem, language]);

  // ── Language change ──────────────────────────────────
  const handleLanguageChange = useCallback((lang: Language) => {
    setLanguage(lang);
    const key = `${selectedProblem}-${lang}`;
    if (!codeMapRef.current[key]) {
      codeMapRef.current[key] = getStarterCode(selectedProblem, lang);
      setRenderTick(t => t + 1);
    }
  }, [selectedProblem]);

  // ── Agent Sync ──────────────────────────────────────
  const handleResetForge = useCallback(async () => {
    const confirmed = window.confirm("CAUTION: This will wipe ALL your cloud data for this mission. Proceed?");
    if (!confirmed) return;

    try {
      const res = await fetch('/api/progress', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to clear data');

      localStorage.clear();
      toast.info('Neural link severed. Rebooting...');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      toast.error('Failed to clear cloud data.');
    }
  }, []);

  // ── Clear Chat (local only — no DB sync needed) ─────
  const handleClearChat = useCallback(() => {
    setMessages([]);
    toast.success('Chat cleared.');
  }, []);

  // ── Memoized callbacks for toggles ──────────────────
  const handleToggleNotes = useCallback(() => {
    setShowApproach(false);
    setShowNotes(s => !s);
  }, []);

  const handleToggleApproach = useCallback(() => {
    setShowNotes(false);
    setShowApproach(s => !s);
  }, []);

  const handleEditorActivity = useCallback(() => {
    lastEditorActivity.current = Date.now();
  }, []);

  const handleNoteChange = useCallback((val: string) => {
    userNotesRef.current[selectedProblem] = val;
    setRenderTick(t => t + 1);
  }, [selectedProblem]);

  const handleApproachChange = useCallback((val: string) => {
    approachBoardRef.current[selectedProblem] = val;
    setRenderTick(t => t + 1);
  }, [selectedProblem]);

  const handleProviderChange = useCallback((p: AIProvider) => {
    setSelectedProvider(p);
    setSelectedModel(p.models[0]);
  }, []);

  const handleGoHome = useCallback(() => setView('home'), []);
  const handleOpenSettings = useCallback(() => setShowSettings(true), []);
  const handleCloseSettings = useCallback(() => setShowSettings(false), []);
  const handleOutputClose = useCallback(() => setOutput(null), []);

  // ── Render ───────────────────────────────────────────
  if (view === 'home') {
    return (
      <LandingPage
        masteredCount={masteredProblems.length}
        totalProblems={TOTAL_PROBLEMS}
        onEnter={() => setView('forge')}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  return (
    <ForgePage
      theme={theme}
      onToggleTheme={handleToggleTheme}
      selectedProblem={selectedProblem}
      masteredProblems={masteredProblems}
      lastReviewDate={lastReviewDate}
      codeMap={codeMapRef.current}
      userNotes={userNotesRef.current}
      approachBoard={approachBoardRef.current}
      language={language}
      editorFontSize={editorFontSize}
      editorFontFamily={editorFontFamily}
      output={output}
      outputHeight={outputHeight}
      isSaving={isSaving}
      isRunning={isRunning}
      showNotes={showNotes}
      showApproach={showApproach}
      messages={messages}
      input={input}
      isLoading={isLoading}
      showSettings={showSettings}
      selectedProvider={selectedProvider}
      selectedModel={selectedModel}
      orientation={orientation}
      onSelectProblem={handleSelectProblem}
      onGoHome={handleGoHome}
      onCodeChange={handleCodeChange}
      onSave={handleSave}
      onRun={handleRun}
      onReviewCode={handleReviewCode}
      onToggleNotes={handleToggleNotes}
      onToggleApproach={handleToggleApproach}
      onOpenSettings={handleOpenSettings}
      onCloseSettings={handleCloseSettings}
      onLanguageChange={handleLanguageChange}
      onNoteChange={handleNoteChange}
      onApproachChange={handleApproachChange}
      onOutputClose={handleOutputClose}
      onOutputResize={setOutputHeight}
      onEditorActivity={handleEditorActivity}
      onInputChange={setInput}
      onSend={handleSend}
      onStop={handleStop}
      onToggleMastered={handleToggleMastered}
      onClearChat={handleClearChat}
      onProviderChange={handleProviderChange}
      onModelChange={setSelectedModel}
      onFontSizeChange={setEditorFontSize}
      onFontFamilyChange={setEditorFontFamily}
      onResetForge={handleResetForge}
    />
  );
}
