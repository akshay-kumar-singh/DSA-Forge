// ======================================================
// GOOGLE PREP — Googleyness & Leadership
// Story bank (roadmap §10) and the question list (§6).
// ======================================================

import type { StorySeed } from './types';

export const GL_QUESTIONS: string[] = [
  'Tell me about a time you disagreed with a teammate or your manager. How did it resolve?',
  "Describe a project that failed or didn't ship. What did you learn?",
  'Tell me about difficult feedback you received. What did you do with it?',
  'Describe a decision you made without enough information.',
  'Tell me about a time you went well beyond your role.',
  "What's the most technically challenging problem you've solved? Why was it hard?",
  'How do you prioritise when everything is marked urgent?',
  'Tell me about someone you mentored. What changed for them?',
  'Tell me about a time you had to influence people with no authority over them.',
  'Tell me about a time you were wrong.',
  'Why Google? Why now?',
];

export const GL_ATTRIBUTES = [
  { name: 'General Cognitive Ability', means: 'How you think through a novel problem — not what you have memorised' },
  { name: 'Role-Related Knowledge', means: 'Do you actually know the craft — data structures, complexity, language, systems' },
  { name: 'Leadership', means: 'Emergent leadership: stepping up without being asked, then stepping back' },
  { name: 'Googleyness', means: 'Comfort with ambiguity, bias to action, intellectual humility, collaboration' },
];

export const STORY_SEEDS: StorySeed[] = [
  { id: 'hardest', title: 'Hardest technical problem', drawFrom: 'Cashfree BBPS integration — the failure modes, the reconciliation edge cases', attribute: 'Cognitive ability, role knowledge', answers: [GL_QUESTIONS[5]] },
  { id: 'ambiguous', title: 'Ambiguous requirements', drawFrom: 'Building the multi-institute LMS from scratch with 25 clients wanting different things', attribute: 'Comfort with ambiguity', answers: [GL_QUESTIONS[3]] },
  { id: 'disagreed', title: 'Disagreed with someone', drawFrom: 'An architecture or API-contract call with a backend engineer at Paywize', attribute: 'Collaboration, humility', answers: [GL_QUESTIONS[0]] },
  { id: 'failed', title: 'Something that failed', drawFrom: "A feature that shipped and broke, or a project that didn't land", attribute: 'Humility, learning', answers: [GL_QUESTIONS[1]] },
  { id: 'beyond', title: 'Went beyond your role', drawFrom: 'The 35% load-time work — did anyone ask you to do that?', attribute: 'Emergent leadership', answers: [GL_QUESTIONS[4]] },
  { id: 'mentoring', title: 'Mentoring', drawFrom: 'The junior devs you review. Pick one person and one concrete change.', attribute: 'Leadership', answers: [GL_QUESTIONS[7]] },
  { id: 'feedback', title: 'Difficult feedback', drawFrom: 'A code review that stung and was right', attribute: 'Googleyness', answers: [GL_QUESTIONS[2]] },
  { id: 'no-data', title: 'Decision without data', drawFrom: 'Choosing React Query, or the Atomic Design restructure', attribute: 'Bias to action', answers: [GL_QUESTIONS[3]] },
  { id: 'influence', title: 'Influenced without authority', drawFrom: 'Getting the team to adopt a pattern or a review standard', attribute: 'Leadership', answers: [GL_QUESTIONS[8]] },
  { id: 'priorities', title: 'Competing priorities', drawFrom: 'Four payment modules, one of you', attribute: 'Judgement', answers: [GL_QUESTIONS[6]] },
  { id: 'proud', title: 'Most proud of', drawFrom: "Workzen's AI agent pipeline — clone → analyse → code → push → PR", attribute: 'Ownership, ambition', answers: ['What are you most proud of?', GL_QUESTIONS[5]] },
  { id: 'why-google', title: 'Why Google', drawFrom: 'Specific: scale, a specific product, a specific team. Not "great culture."', attribute: 'Motivation', answers: [GL_QUESTIONS[10]] },
];

export const STAR_RULES = [
  'STAR, with the weight on A and R. Situation and Task get two sentences. Action gets the bulk. Result gets a number wherever you have one.',
  'Two minutes per story. Time yourself. Rambling is the most common failure mode.',
  '"I," not "we." Say what the team did, then say precisely what you did.',
  'Never blame anyone. Even when they deserved it — this is a direct Googleyness probe.',
  'Have a real failure ready. A polished non-failure scores worse than an honest mistake with a real lesson.',
];
