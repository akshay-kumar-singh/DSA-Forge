'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { toast, Toaster } from 'sonner';
import { buildForgeSystemPrompt } from '@/lib/forge-ai';
import { runCode as runCodeFn } from '@/lib/code-runner';
import { getStarterCode, AI_PROVIDERS, DSA_PATTERNS } from '@/lib/problems';
import LandingPage from '@/components/landing/LandingPage';
import ForgePage from '@/components/forge/ForgePage';
import type { Message, Language, AIProvider, View } from '@/lib/types';

const TOTAL_PROBLEMS = DSA_PATTERNS.reduce((acc, p) => acc + p.problems.length, 0);
const ALL_PROBLEMS = new Set(DSA_PATTERNS.flatMap(p => p.problems));
const LANGUAGES: Language[] = ['javascript', 'python', 'java', 'cpp'];

let _msgIdCounter = 0;
function createMsgId(): string {
  return `msg-${Date.now()}-${++_msgIdCounter}`;
}

function createMessage(role: 'user' | 'assistant', content: string): Message {
  return { id: createMsgId(), role, content };
}

// Fire-and-forget tracker call (logs activity to the GitHub tracker repo)
function trackActivity(action: string, details: string) {
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, details }),
  }).catch(() => { /* silent — tracking is best-effort */ });
}

function greetingFor(problem: string): Message {
  const isTraining = problem.startsWith('Training:');
  return createMessage('assistant',
    isTraining
      ? `**${problem}** — Training loaded. 📡`
      : `**${problem}** — Mission loaded. 🎯`
  );
}

// Max messages to send to AI for context (keeps token usage reasonable)
const MAX_AI_HISTORY = 20;

// Auto-save interval for unsaved edits (code / notes)
const AUTOSAVE_MS = 60_000;

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
  const [editorFontSize, setEditorFontSize] = useState(14);
  const [editorFontFamily, setEditorFontFamily] = useState('var(--font-mono)');
  const [, setRenderTick] = useState(0); // Trigger re-renders when refs load data

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
  const selectedProblemRef = useRef(selectedProblem);
  const codeMapRef = useRef<Record<string, string>>({});
  const userNotesRef = useRef<Record<string, string>>({});
  const lastReviewRef = useRef(lastReviewDate);
  const messagesRef = useRef(messages);
  const lastEditorActivity = useRef<number>(Date.now());
  const abortControllerRef = useRef<AbortController | null>(null);
  const dirtyRef = useRef(false);          // unsaved code/notes edits
  const hydratedRef = useRef(false);       // true once localStorage prefs are restored

  // Keep state-backed refs in sync
  useEffect(() => { masteredRef.current = masteredProblems; }, [masteredProblems]);
  useEffect(() => { selectedProblemRef.current = selectedProblem; }, [selectedProblem]);
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
          if (data.code_map)          codeMapRef.current = data.code_map;
          if (data.user_notes)        userNotesRef.current = data.user_notes;
          if (data.mastered_problems) setMasteredProblems(data.mastered_problems);
          if (data.last_review_date)  setLastReviewDate(data.last_review_date);
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
  const handleSave = useCallback(async (opts?: { silent?: boolean }) => {
    const isSilent = opts?.silent === true;
    setIsSaving(true);
    const toastId = isSilent ? undefined : toast.loading('Syncing progress with S.H.I.E.L.D. servers...');

    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code_map: codeMapRef.current,
          user_notes: userNotesRef.current,
          mastered_problems: masteredRef.current,
          last_review_date: lastReviewRef.current,
        }),
      });

      if (!res.ok) throw new Error('Failed to save to MongoDB');
      dirtyRef.current = false;
      if (!isSilent) {
        toast.success('Mission progress secured in cloud database.', { id: toastId });
        trackActivity('save', selectedProblemRef.current);
      }
    } catch (error: unknown) {
      console.error('Save error:', error instanceof Error ? error.message : error);
      // Only interrupt the user for saves they explicitly asked for
      if (!isSilent && toastId) {
        toast.error('Server sync failed. Check database connection.', { id: toastId });
      }
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  }, []); // ← No deps needed — reads from refs

  // ── Auto-save: flush unsaved edits every minute ─────
  useEffect(() => {
    if (view !== 'forge') return;
    const interval = setInterval(() => {
      if (dirtyRef.current) {
        handleSave({ silent: true });
      }
    }, AUTOSAVE_MS);
    return () => clearInterval(interval);
  }, [view, handleSave]);

  // ── Problem Select (resets chat for the new problem) ─
  const handleSelectProblem = useCallback((prob: string) => {
    // Don't lose work when hopping between missions
    if (dirtyRef.current) {
      handleSave({ silent: true });
    }
    setSelectedProblem(prob);
    setOutput(null);
    setShowNotes(false);
    setMessages([greetingFor(prob)]);
    // Code population is handled by the useEffect above
  }, [handleSave]);

  // ── Restore last session (problem, language, AI + editor prefs) ──
  useEffect(() => {
    try {
      const savedProblem = localStorage.getItem('dsa-forge-problem');
      if (savedProblem && ALL_PROBLEMS.has(savedProblem)) {
        setSelectedProblem(savedProblem);
        setMessages([greetingFor(savedProblem)]);
      } else {
        setMessages([greetingFor(selectedProblemRef.current)]);
      }

      const savedLang = localStorage.getItem('dsa-forge-language') as Language | null;
      if (savedLang && LANGUAGES.includes(savedLang)) setLanguage(savedLang);

      const savedProviderId = localStorage.getItem('dsa-forge-provider');
      const provider = AI_PROVIDERS.find(p => p.id === savedProviderId);
      if (provider) {
        setSelectedProvider(provider);
        const savedModel = localStorage.getItem('dsa-forge-model');
        setSelectedModel(savedModel && provider.models.includes(savedModel) ? savedModel : provider.models[0]);
      }

      const savedFontSize = Number(localStorage.getItem('dsa-forge-font-size'));
      if (savedFontSize >= 10 && savedFontSize <= 28) setEditorFontSize(savedFontSize);
      const savedFontFamily = localStorage.getItem('dsa-forge-font-family');
      if (savedFontFamily) setEditorFontFamily(savedFontFamily);
    } catch { /* localStorage unavailable — keep defaults */ }
    hydratedRef.current = true;
  }, []);

  // ── Persist session prefs ───────────────────────────
  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      localStorage.setItem('dsa-forge-problem', selectedProblem);
      localStorage.setItem('dsa-forge-language', language);
      localStorage.setItem('dsa-forge-provider', selectedProvider.id);
      localStorage.setItem('dsa-forge-model', selectedModel);
      localStorage.setItem('dsa-forge-font-size', String(editorFontSize));
      localStorage.setItem('dsa-forge-font-family', editorFontFamily);
    } catch { /* ignore */ }
  }, [selectedProblem, language, selectedProvider, selectedModel, editorFontSize, editorFontFamily]);

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
    } catch {
      toast.error('Execution error', { id: toastId });
    } finally {
      setIsRunning(false);
    }
  }, [selectedProblem, language]);

  // ── Toggle Mastered ─────────────────────────────────
  const handleToggleMastered = useCallback((prob: string) => {
    const wasMastered = masteredRef.current.includes(prob);

    // Update refs synchronously so the immediate save sees fresh data
    const nextMastered = wasMastered
      ? masteredRef.current.filter(p => p !== prob)
      : [...masteredRef.current, prob];
    masteredRef.current = nextMastered;
    setMasteredProblems(nextMastered);

    const nextReview = { ...lastReviewRef.current, [prob]: new Date().toISOString() };
    lastReviewRef.current = nextReview;
    setLastReviewDate(nextReview);

    if (wasMastered) {
      toast.info(`Mission status updated: ${prob} is back on the active list.`);
      trackActivity('unmastered', prob);
    } else {
      toast.success('MISSION MASTERED! Status updated in S.H.I.E.L.D. database.', {
        description: `You have conquered ${prob}.`,
        duration: 5000,
      });
      trackActivity('mastered', prob);
    }

    handleSave({ silent: true });
  }, [handleSave]);

  // ── Stop AI Generation ────────────────────────────────
  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  // ── Send to AI (streams the response into the chat) ──
  const handleSend = useCallback(async (overrideInput?: string) => {
    const messageText = overrideInput || input;
    if (!messageText.trim() || isLoading) return;

    // Always read latest code/notes from refs for fresh context
    const currentCode = codeMapRef.current[`${selectedProblem}-${language}`] ?? getStarterCode(selectedProblem, language);
    const currentNotes = userNotesRef.current[selectedProblem] ?? '';

    // Don't show stuck-timer internal messages to the user
    const isInternal = messageText.startsWith('[STUCK_TIMER]');

    if (!isInternal) {
      setMessages(prev => [...prev, createMessage('user', messageText)]);
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
      currentNotes,
    );

    // Get current messages from ref (always fresh) and limit history
    const recentMessages = messagesRef.current.slice(-MAX_AI_HISTORY);

    // Incrementally build the assistant reply as chunks stream in
    let assistantId: string | null = null;
    const pushStreamed = (content: string) => {
      if (!content.trim()) return;
      if (!assistantId) {
        assistantId = createMsgId();
        const msg: Message = { id: assistantId, role: 'assistant', content };
        setMessages(prev => [...prev, msg]);
      } else {
        const id = assistantId;
        setMessages(prev => prev.map(m => (m.id === id ? { ...m, content } : m)));
      }
    };

    try {
      let acc = '';

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

        const streamResult = await model.generateContentStream({
          contents: [...apiHistory, { role: 'user', parts: [{ text: messageText }] }],
        });

        for await (const chunk of streamResult.stream) {
          if (controller.signal.aborted) break;
          acc += chunk.text();
          pushStreamed(acc);
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

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          // Non-streaming fallback shape: { text } or { error }
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          acc = data.text || '';
          pushStreamed(acc);
        } else if (res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            acc += decoder.decode(value, { stream: true });
            pushStreamed(acc);
          }
        }
      }

      // Nothing arrived and the user didn't cancel → surface a helpful notice
      if (!controller.signal.aborted && !acc.trim()) {
        setMessages(prev => [...prev, createMessage('assistant',
          "⚠️ **Empty response from the AI provider.** Check the API key and model in Settings, then try again."
        )]);
      }
    } catch (err: unknown) {
      // Silently ignore abort errors — user intentionally stopped (partial text is kept)
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const errMsg = err instanceof Error ? err.message : String(err);
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
  }, [input, isLoading, selectedProblem, language, selectedProvider, selectedModel]);

  // Keep a live reference for timers (avoids stale closures)
  const handleSendRef = useRef(handleSend);
  useEffect(() => { handleSendRef.current = handleSend; }, [handleSend]);

  // ── Stuck Timer: 10 min idle → proactive nudge ──────
  useEffect(() => {
    if (view !== 'forge') return;
    const interval = setInterval(() => {
      if (document.hidden) return; // don't burn tokens while the tab is in the background
      const idleMs = Date.now() - lastEditorActivity.current;
      if (idleMs > 10 * 60 * 1000 && !isLoading) {
        lastEditorActivity.current = Date.now(); // reset so it doesn't spam
        handleSendRef.current(`[STUCK_TIMER] The user hasn't typed anything in the editor for 10 minutes. Send a short, encouraging message and offer a gentle Level 1 hint for the current problem without them asking. Be proactive and warm.`);
      }
    }, 60_000); // check every minute
    return () => clearInterval(interval);
  }, [view, isLoading]);

  // ── Code change (memoized — fixes editor lag) ───────
  const handleCodeChange = useCallback((code: string) => {
    codeMapRef.current[`${selectedProblem}-${language}`] = code;
    dirtyRef.current = true;
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

  // ── Clear Chat (local only — no DB sync needed) ─────
  const handleClearChat = useCallback(() => {
    setMessages([greetingFor(selectedProblemRef.current)]);
    toast.success('Chat cleared.');
  }, []);

  // ── Memoized callbacks for toggles ──────────────────
  const handleToggleNotes = useCallback(() => {
    setShowNotes(s => !s);
  }, []);

  const handleEditorActivity = useCallback(() => {
    lastEditorActivity.current = Date.now();
  }, []);

  const handleNoteChange = useCallback((val: string) => {
    userNotesRef.current[selectedProblem] = val;
    dirtyRef.current = true;
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
  return (
    <>
      <Toaster theme={theme} position="top-right" closeButton richColors />
      {view === 'home' ? (
        <LandingPage
          masteredCount={masteredProblems.length}
          totalProblems={TOTAL_PROBLEMS}
          onEnter={() => setView('forge')}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />
      ) : (
        <ForgePage
          theme={theme}
          onToggleTheme={handleToggleTheme}
          selectedProblem={selectedProblem}
          masteredProblems={masteredProblems}
          lastReviewDate={lastReviewDate}
          codeMap={codeMapRef.current}
          userNotes={userNotesRef.current}
          language={language}
          editorFontSize={editorFontSize}
          editorFontFamily={editorFontFamily}
          output={output}
          outputHeight={outputHeight}
          isSaving={isSaving}
          isRunning={isRunning}
          showNotes={showNotes}
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
          onToggleNotes={handleToggleNotes}
          onOpenSettings={handleOpenSettings}
          onCloseSettings={handleCloseSettings}
          onLanguageChange={handleLanguageChange}
          onNoteChange={handleNoteChange}
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
        />
      )}
    </>
  );
}
