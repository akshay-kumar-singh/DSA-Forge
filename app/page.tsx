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

const INITIAL_MESSAGE: Message = {
  id: 'initial-welcome',
  role: 'assistant',
  content: `**FORGE AI online.** 🛡️

Welcome to the DSA Forge Training Facility. I'm your AI coach — I'll guide you through every problem without ever giving you the answer.

Select a mission from the left panel and start coding. Ask me for hints, code reviews, or concept explanations anytime. I'll escalate hints naturally as you ask — starting vague, getting more specific each time.

*Remember: the struggle is the point. Let's forge something.*`,
};

const USER_ID = '00000000-0000-0000-0000-000000000000';

// Max messages to send to AI for context (keeps token usage reasonable)
const MAX_AI_HISTORY = 20;

export default function DSAForge() {
  const [view, setView] = useState<View>('home');
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

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
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
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
      INITIAL_MESSAGE,
      createMessage('assistant',
        isTraining
          ? `**${prob}** — Training Module loaded. 📡\n\nI'm ready to teach this concept from the ground up. Tell me when you're ready to start, or ask me anything about this topic!`
          : `**${prob}** — Mission loaded. 🎯\n\nEditor is ready. Write your approach on the Approach Board before coding if you'd like my input on your direction. Ask for a hint anytime.`
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

  // ── Get Intel ────────────────────────────────────────
  const handleGetIntel = useCallback(() => {
    handleSend(
      `Analyze my current code for ${selectedProblem}. Tell me: (1) what I'm doing conceptually right so far, and (2) what's the most important thing I should think about next. Do NOT give me any code — only conceptual direction.`
    );
  }, [selectedProblem]);

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

        const result = await model.generateContent({
          contents: [...apiHistory, { role: 'user', parts: [{ text: messageText }] }],
        });
        content = result.response.text();
      } else {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // Fix: Always send the user message to the API, even if it's internal
            messages: [...recentMessages, { role: 'user', content: messageText }],
            provider: selectedProvider.id,
            model: selectedModel,
            systemInstruction: systemPrompt,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        content = data.text;
      }

      const assistantMsg = createMessage('assistant',
        content || "I'm having trouble formulating a response. Try again?"
      );
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const isQuota = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota');
      setMessages(prev => [...prev, createMessage('assistant',
        isQuota
          ? "⚠️ **API quota exceeded.** Please check your API billing or try a different provider in Settings."
          : `⚠️ **Connection error:**\n\`\`\`\n${errMsg}\n\`\`\`\nTry switching providers in Settings.`
      )]);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, isLoading, selectedProblem, language, selectedProvider, selectedModel]);

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
    setMessages([INITIAL_MESSAGE]);
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
      />
    );
  }

  return (
    <ForgePage
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
      onGetIntel={handleGetIntel}
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
