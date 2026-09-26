// ======================================================
// GOOGLE PREP — shared types
// Lives entirely under lib/google; nothing here is imported
// by the existing NeetCode Forge code.
// ======================================================

import type { Language } from '@/lib/types';

export type GoogleTab = 'today' | 'dsa' | 'design' | 'behavioural' | 'mocks' | 'comprehension' | 'plan' | 'notes';

export type Difficulty = 'easy' | 'medium' | 'hard';

/** A "design and implement" problem — the editor gets a class skeleton, not a function. */
export interface DesignSpec {
  cls: string;
  ctor: string[];
  methods: [name: string, params: string[]][];
}

export interface GoogleProblem {
  name: string;
  difficulty: Difficulty;
  params: string[];
  /** "nums = [2,7], target = 9 -> [0,1]" — same grammar as NeetCode Forge, drives auto-tests */
  example?: string;
  /** leetcode.com/problems/<slug>; derived from the name unless overridden */
  slug?: string | null;
  design?: DesignSpec;
  /** One line: why Google likes this one / what the follow-up usually is */
  note?: string;
}

export interface GoogleSection {
  id: string;
  title: string;
  /** "Reach for it when…" — the trigger condition from the roadmap */
  trigger: string;
  weight: 'Very high' | 'High' | 'Medium';
  /** Plan week this section is scheduled in (0-based, matches the roadmap) */
  week: number;
  problems: GoogleProblem[];
}

// ── System design ───────────────────────────────────
export type DesignTrack = 'backend' | 'frontend';

export interface DesignPrompt {
  id: string;
  title: string;
  track: DesignTrack;
  /** core = the six classics everyone gets; stretch = Google-flavoured or payments */
  tier: 'core' | 'stretch';
  /** The deliberately vague opener, verbatim as an interviewer would say it */
  prompt: string;
  clarifiers: string[];
  scale: string[];
  mustCover: string[];
  deepDives: string[];
  edge?: string;
}

export interface DesignPhase {
  id: string;
  label: string;
  startMin: number;
  endMin: number;
  goal: string;
}

// ── Behavioural ─────────────────────────────────────
export interface StorySeed {
  id: string;
  title: string;
  drawFrom: string;
  attribute: string;
  /** The interview question(s) this story answers */
  answers: string[];
}

export interface StarStory {
  situation: string;
  task: string;
  action: string;
  result: string;
}

// ── Plan ────────────────────────────────────────────
export type PhaseId = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';

export interface PlanWeek {
  week: number;
  phase: PhaseId;
  theme: string;
  detail: string;
  /** DSA section ids to draw new problems from this week (empty = maintenance only) */
  sections: string[];
  /** Extra one-off tasks for the week (mocks, outreach, applications…) */
  specials?: { day: number; text: string; link?: DeepLink; kind?: TaskKind; items?: TaskItem[] }[];
  /** True → coding drops to maintenance (90 min spaced repetition, no new patterns) */
  maintenance?: boolean;
}

export interface PlanPhase {
  id: PhaseId;
  title: string;
  weeks: [number, number];
  gate: string[];
  /** One entry per gate line: what it means and exactly how to do it in this app */
  gateHelp: string[];
}

/** Where a task or item points inside the app. */
export interface DeepLink {
  tab: GoogleTab;
  section?: string;      // DSA section id
  problem?: string;      // DSA problem name (mocks tab: run this exact problem as the round)
  id?: string;           // design prompt id / story id / 'outreach' on the plan tab
  kind?: MockKind;       // mocks tab: preselect a round
  drill?: boolean;       // dsa tab: open the pattern-trigger drill
  theory?: boolean;      // dsa tab: open the section's pattern notes instead of a problem
}

export type TaskKind = 'theory' | 'solve' | 'revise' | 'timed' | 'drill' | 'template' | 'admin' | 'design' | 'behavioural' | 'mock' | 'comprehension' | 'outreach' | 'apply' | 'special' | 'rest';

export interface PlanTask {
  id: string;
  day: number;          // 0-based day index from plan start
  week: number;
  text: string;
  kind: TaskKind;
  /** Deep link into the app */
  link?: DeepLink;
  /** For solve/timed/theory: which section and how many problems */
  sectionId?: string;
  count?: number;
  /**
   * Concrete items. Problem tasks get theirs at build time (every problem is
   * assigned to exactly one day — see buildPlan); setup tasks carry static
   * explanations; the rest (revision due, designs, stories, mocks) are
   * resolved from live state in lib/google/today.ts.
   */
  items?: TaskItem[];
}

/** A concrete, clickable line under a task: "Solve: Two Sum II" */
export interface TaskItem {
  label: string;
  sub?: string;
  link?: DeepLink;
  done?: boolean;
  /** A re-solve of something already scheduled earlier (never auto-ticked from mastery) */
  again?: boolean;
  /** A bonus problem: shown on the day, never required to complete it */
  optional?: boolean;
}

export interface PlanDay {
  day: number;
  week: number;
  date: Date;
  tasks: PlanTask[];
}

// ── Mocks ───────────────────────────────────────────
export type MockKind = 'coding' | 'design' | 'behavioural';

export interface MockResult {
  id: string;
  kind: MockKind;
  subject: string;         // problem / prompt / "4 questions"
  date: string;            // ISO
  minutes: number;
  score: number | null;    // 1.0 – 4.0
  verdict: string;         // "Hire" etc.
  feedback: string;        // markdown debrief from the interviewer (grade block stripped)
  strengths?: string[];
  improvements?: string[];
}

// ── Drills & outreach ───────────────────────────────
/** One round of the pattern-trigger drill (which pattern does this problem want?). */
export interface DrillResult { date: string; correct: number; total: number }

export type ContactStatus = 'mapped' | 'asked' | 'replied' | 'referred' | 'declined';
/** `link` is their LinkedIn / X profile (optional — older entries have none). */
export interface Contact { id: string; name: string; via: string; status: ContactStatus; note: string; link?: string; updated: string }

export type ApplicationStatus = 'applied' | 'recruiter' | 'phone' | 'onsite' | 'offer' | 'rejected';
export interface Application { id: string; role: string; date: string; status: ApplicationStatus; note: string }

// ── Code comprehension ──────────────────────────────
/** One attempt at a comprehension exercise. `code` is file name → the user's edited source. */
export interface ComprehensionRun {
  hypothesis: string;
  code: Record<string, string>;
  score: number | null;
  minutes: number;
  date: string;
  /** The interviewer's written debrief, kept for revision */
  feedback?: string;
  /** Set once the root cause has been revealed — the exercise cannot be "unseen" */
  revealed?: boolean;
}

// ── Notebook ────────────────────────────────────────
/** A free-form note the user writes (a question + their answer, theory, anything). */
export interface NotebookNote { id: string; title: string; body: string; week: number; created: string; updated: string }

// ── Persisted state (one document, JSON payload) ────
export interface GoogleState {
  version: 1;
  codeMap: Record<string, string>;         // `${problem}-${lang}`
  notes: Record<string, string>;           // problem / prompt id / story id → text
  mastered: string[];
  lastReviewDate: Record<string, string>;
  reviewCount: Record<string, number>;
  designs: Record<string, string>;         // prompt id → excalidraw elements JSON
  designDocs: Record<string, string>;      // prompt id → written design doc
  stories: Record<string, StarStory>;      // story id → STAR
  planStart: string;                       // ISO date (yyyy-mm-dd)
  planDone: Record<string, string>;        // task id → ISO datetime completed
  mocks: MockResult[];
  language: Language;
  drills: DrillResult[];
  contacts: Contact[];                     // referral map
  applications: Application[];
  notebook: NotebookNote[];                // the Notes tab
  comprehension: Record<string, ComprehensionRun>; // exercise id → the attempt
  theory: Record<string, string>;          // section id → pattern notes as the user rewrote them (absent = the built-in notes)
  sketches: Record<string, string>;        // section id → excalidraw scene drawn under the pattern notes
}

export const EMPTY_GOOGLE_STATE: GoogleState = {
  version: 1,
  codeMap: {},
  notes: {},
  mastered: [],
  lastReviewDate: {},
  reviewCount: {},
  designs: {},
  designDocs: {},
  stories: {},
  planStart: '2026-09-20',
  planDone: {},
  mocks: [],
  language: 'javascript',
  drills: [],
  contacts: [],
  applications: [],
  notebook: [],
  comprehension: {},
  theory: {},
  sketches: {},
};
