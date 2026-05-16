'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import { buildForgeSystemPrompt } from '@/lib/forge-ai';
import { runCode as runCodeFn } from '@/lib/code-runner';
import { getStarterCode, AI_PROVIDERS } from '@/lib/problems';
import LandingPage from '@/components/landing/LandingPage';
import ForgePage from '@/components/forge/ForgePage';
import type { Message, Language, AIProvider, View } from '@/lib/types';
import { DSA_PATTERNS } from '@/lib/problems';

const supabase = createClient();
const TOTAL_PROBLEMS = DSA_PATTERNS.reduce((acc, p) => acc + p.problems.length, 0);

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: `**FORGE AI online.** 🛡️

Welcome to the DSA Forge Training Facility. I'm your AI coach — I'll guide you through every problem without ever giving you the answer.

Select a mission from the left panel and start coding. Ask me for hints, code reviews, or concept explanations anytime. I'll escalate hints naturally as you ask — starting vague, getting more specific each time.

*Remember: the struggle is the point. Let's forge something.*`,
};

const USER_ID = '00000000-0000-0000-0000-000000000000';

export default function DSAForge() {
  // ... (previous state declarations)
  const [view, setView] = useState<View>('home');
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  // ── Problem State ───────────────────────────────────
  const [selectedProblem, setSelectedProblem] = useState('Two Sum');
  const [masteredProblems, setMasteredProblems] = useState<string[]>([]);
  const [lastReviewDate, setLastReviewDate] = useState<Record<string, string>>({});

  // ── Editor State ────────────────────────────────────
  const [language, setLanguage] = useState<Language>('javascript');
  const [codeMap, setCodeMap] = useState<Record<string, string>>({});
  const [userNotes, setUserNotes] = useState<Record<string, string>>({});
  const [approachBoard, setApproachBoard] = useState<Record<string, string>>({});
  const [output, setOutput] = useState<string | null>(null);
  const [outputHeight, setOutputHeight] = useState(250);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showApproach, setShowApproach] = useState(false);
  const [editorFontSize, setEditorFontSize] = useState(14);
  const [editorFontFamily, setEditorFontFamily] = useState('var(--font-mono)');

  // ── Chat State ──────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ... (Settings State)
  const [showSettings, setShowSettings] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(AI_PROVIDERS[0]);
  const [selectedModel, setSelectedModel] = useState(AI_PROVIDERS[0].models[0]);

  const lastEditorActivity = useRef<number>(Date.now());

  // Responsive orientation
  useEffect(() => {
    const update = () => setOrientation(window.innerWidth < 1024 ? 'vertical' : 'horizontal');
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // ── Supabase: Load Progress ─────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('progress')
        .select('code_map, user_notes, mastered_problems, last_review_date, approach_board, chat_history')
        .eq('user_id', USER_ID)
        .single();

      if (data) {
        if (data.code_map)         setCodeMap(data.code_map);
        if (data.user_notes)       setUserNotes(data.user_notes);
        if (data.mastered_problems) setMasteredProblems(data.mastered_problems);
        if (data.last_review_date) setLastReviewDate(data.last_review_date);
        if (data.approach_board)   setApproachBoard(data.approach_board);
        if (data.chat_history && Array.isArray(data.chat_history) && data.chat_history.length > 0) {
          setMessages(data.chat_history);
        }
      }
    };
    load();
  }, []);


  // ── Fix: Ensure starter code exists for current problem on load ──
  useEffect(() => {
    if (view === 'forge') {
      const key = `${selectedProblem}-${language}`;
      if (!codeMap[key]) {
        setCodeMap(prev => ({
          ...prev,
          [key]: getStarterCode(selectedProblem, language)
        }));
      }
    }
  }, [selectedProblem, language, view, codeMap]);

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

  // ── Save ─────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    const toastId = toast.loading('Syncing progress with S.H.I.E.L.D. servers...');
    
    try {
      const { error } = await supabase.from('progress').upsert({
        user_id: USER_ID,
        code_map: codeMap,
        user_notes: userNotes,
        mastered_problems: masteredProblems,
        last_review_date: lastReviewDate,
        approach_board: approachBoard,
        chat_history: messages,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      if (error) throw error;
      toast.success('Mission progress secured in cloud database.', { id: toastId });
    } catch (error: any) {
      console.error('Supabase save error:', error.message);
      toast.error('Server sync failed. Check database connection.', { id: toastId });
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  }, [codeMap, userNotes, masteredProblems, lastReviewDate, approachBoard, messages]);


  // ── Problem Select ───────────────────────────────────
  const handleSelectProblem = useCallback((prob: string) => {
    setSelectedProblem(prob);
    setOutput(null);
    setShowNotes(false);
    setShowApproach(false);

    const isTraining = prob.startsWith('Training:');
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: isTraining
        ? `**${prob}** — Training Module loaded. 📡\n\nI'm ready to teach this concept from the ground up. Tell me when you're ready to start, or ask me anything about this topic!`
        : `**${prob}** — Mission loaded. 🎯\n\nEditor is ready. Write your approach on the Approach Board before coding if you'd like my input on your direction. Ask for a hint anytime.`,
    }]);

    // Code population is handled by the useEffect above
  }, []);


  // ── Run Code ─────────────────────────────────────────
  const handleRun = useCallback(async () => {
    const currentCode = codeMap[`${selectedProblem}-${language}`] ?? getStarterCode(selectedProblem, language);
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
  }, [codeMap, selectedProblem, language]);

  // ── Toggle Mastered ─────────────────────────────────
  const handleToggleMastered = useCallback((prob: string) => {
    const isMastered = masteredProblems.includes(prob);
    let updated: string[];
    
    if (isMastered) {
      updated = masteredProblems.filter(p => p !== prob);
      toast.info(`Mission status updated: ${prob} is back on the active list.`);
    } else {
      updated = [...masteredProblems, prob];
      toast.success('MISSION MASTERED! Status updated in S.H.I.E.L.D. database.', {
        description: `You have conquered ${prob}.`,
        duration: 5000,
      });
    }
    
    setMasteredProblems(updated);
    setLastReviewDate(prev => ({ ...prev, [prob]: new Date().toISOString() }));
    
    // Auto-save to ensure the status is persisted immediately
    setTimeout(() => handleSave(), 100);
  }, [masteredProblems, handleSave]);

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

    const currentCode = codeMap[`${selectedProblem}-${language}`] ?? getStarterCode(selectedProblem, language);
    const currentApproach = approachBoard[selectedProblem] ?? '';

    // Don't show stuck-timer internal messages to the user
    const isInternal = messageText.startsWith('[STUCK_TIMER]');

    const userMsg: Message = { role: 'user', content: isInternal ? '' : messageText };
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

    try {
      let content = '';

      if (selectedProvider.id === 'gemini') {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) throw new Error('Gemini API key missing (NEXT_PUBLIC_GEMINI_API_KEY)');

        const ai = new GoogleGenerativeAI(apiKey);
        const rawHistory = messages.map(m => ({
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
            messages: [...messages, ...(isInternal ? [] : [userMsg])],
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

      const assistantMsg: Message = {
        role: 'assistant',
        content: content || "I'm having trouble formulating a response. Try again?",
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const isQuota = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: isQuota
          ? "⚠️ **API quota exceeded.** Please check your API billing or try a different provider in Settings."
          : `⚠️ **Connection error:**\n\`\`\`\n${errMsg}\n\`\`\`\nTry switching providers in Settings.`,
      }]);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, isLoading, codeMap, selectedProblem, language, approachBoard, selectedProvider, selectedModel, messages]);

  // ── Code change ──────────────────────────────────────
  const handleCodeChange = (code: string) => {
    setCodeMap(prev => ({ ...prev, [`${selectedProblem}-${language}`]: code }));
  };

  // ── Language change ──────────────────────────────────
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setCodeMap(prev => {
      const key = `${selectedProblem}-${lang}`;
      if (!prev[key]) return { ...prev, [key]: getStarterCode(selectedProblem, lang) };
      return prev;
    });
  };

  // ── Agent Sync ──────────────────────────────────────
  const handleResetForge = async () => {
    const confirmed = window.confirm("CAUTION: This will wipe ALL your cloud data for this mission. Proceed?");
    if (!confirmed) return;

    const { error } = await supabase.from('progress').delete().eq('user_id', USER_ID);
    if (error) {
      toast.error('Failed to clear cloud data.');
    } else {
      localStorage.clear();
      toast.info('Neural link severed. Rebooting...');
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  // ── Clear Chat ──────────────────────────────────────
  const handleClearChat = useCallback(async () => {
    const confirmed = window.confirm("Reset conversation for all missions? This will clear AI memory in the cloud.");
    if (!confirmed) return;

    setMessages([INITIAL_MESSAGE]);
    
    const toastId = toast.loading('Clearing cloud neural records...');
    try {
      const { error } = await supabase.from('progress').upsert({
        user_id: USER_ID,
        chat_history: [INITIAL_MESSAGE],
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      if (error) throw error;
      toast.success('AI memory wiped from S.H.I.E.L.D. servers.', { id: toastId });
    } catch (err) {
      toast.error('Local chat cleared, but server sync failed.', { id: toastId });
    }
  }, []);

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
      // ... (rest of props)
      selectedProblem={selectedProblem}
      masteredProblems={masteredProblems}
      lastReviewDate={lastReviewDate}
      codeMap={codeMap}
      userNotes={userNotes}
      approachBoard={approachBoard}
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
      onGoHome={() => setView('home')}
      onCodeChange={handleCodeChange}
      onSave={handleSave}
      onRun={handleRun}
      onGetIntel={handleGetIntel}
      onToggleNotes={() => {
        if (!showNotes) setShowApproach(false);
        setShowNotes(s => !s);
      }}
      onToggleApproach={() => {
        if (!showApproach) setShowNotes(false);
        setShowApproach(s => !s);
      }}
      onOpenSettings={() => setShowSettings(true)}
      onCloseSettings={() => setShowSettings(false)}
      onLanguageChange={handleLanguageChange}
      onNoteChange={(val) => setUserNotes(prev => ({ ...prev, [selectedProblem]: val }))}
      onApproachChange={(val) => setApproachBoard(prev => ({ ...prev, [selectedProblem]: val }))}
      onOutputClose={() => setOutput(null)}
      onOutputResize={setOutputHeight}
      onEditorActivity={() => { lastEditorActivity.current = Date.now(); }}
      onInputChange={setInput}
      onSend={handleSend}
      onToggleMastered={handleToggleMastered}
      onClearChat={handleClearChat}
      onProviderChange={(p) => { setSelectedProvider(p); setSelectedModel(p.models[0]); }}
      onModelChange={setSelectedModel}
      onFontSizeChange={setEditorFontSize}
      onFontFamilyChange={setEditorFontFamily}
      onResetForge={handleResetForge}
    />
  );
}
