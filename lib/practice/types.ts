// ======================================================
// PRACTICE LAB — your own problems and your own designs.
// Completely separate from NeetCode Forge and Interview Prep:
// its own collection (`practicelabs`), its own localStorage
// mirror, nothing shared but the theme and AI settings.
// ======================================================

import type { Language } from '@/lib/types';

export type PracticeTab = 'dsa' | 'design';

/** A coding problem the user brought in: an interview question, a recruiter assignment, anything. */
export interface PracticeProblem {
  id: string;
  title: string;
  /** The question as they pasted it (markdown). The coach reads this. */
  prompt: string;
  /** Where it came from — "Amazon phone screen", "LeetCode 1234", a URL… */
  source: string;
  difficulty: 'easy' | 'medium' | 'hard' | '';
  /** `${language}` → code */
  code: Record<string, string>;
  /** Their own notes: approach, complexity, what tripped them up */
  notes: string;
  solved: boolean;
  created: string;
  updated: string;
}

/** A system design the user wants to practise: Instagram, Twitter, their own product — anything. */
export interface PracticeDesign {
  id: string;
  title: string;
  /** Requirements / the prompt as they'd hear it, plus any constraints they set themselves */
  prompt: string;
  /** Excalidraw scene elements, JSON */
  scene: string;
  /** The written design doc */
  doc: string;
  done: boolean;
  /** Minutes spent, accumulated across sessions (the header timer) */
  minutes: number;
  created: string;
  updated: string;
}

export interface PracticeState {
  version: 1;
  problems: PracticeProblem[];
  designs: PracticeDesign[];
  language: Language;
}

export const EMPTY_PRACTICE_STATE: PracticeState = {
  version: 1,
  problems: [],
  designs: [],
  language: 'javascript',
};

export const newProblem = (title = ''): PracticeProblem => {
  const now = new Date().toISOString();
  return { id: `p-${Date.now()}`, title, prompt: '', source: '', difficulty: '', code: {}, notes: '', solved: false, created: now, updated: now };
};

export const newDesign = (title = ''): PracticeDesign => {
  const now = new Date().toISOString();
  return { id: `d-${Date.now()}`, title, prompt: '', scene: '', doc: '', done: false, minutes: 0, created: now, updated: now };
};
