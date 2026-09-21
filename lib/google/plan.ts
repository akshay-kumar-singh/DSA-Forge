// ======================================================
// INTERVIEW PREP — the 26-week plan as a task queue
//
// The roadmap is calendar-shaped (week themes, gates). Here it
// becomes a queue of plan-days. "Today" is the first day with
// work left, not the calendar date — so finishing two days in
// one evening pulls every projection forward by a day.
//
// Week 0 is three setup days, then buffer days up to the first
// Monday; weeks 1–26 are Mon → Sun so the weekend carries the
// timed set (Sat) and the hard day + wrap-up (Sun).
//
// Every pattern week has the same shape, in order, no surprises:
//   Mon      theory 1 hr · this week's template (if any) · 2 easy · revision
//   Tue–Fri  15-min recap · 2 problems, easy → medium · revision
//   Sat      timed set — 2 unseen mediums + 1 re-solve from this week, 35 min each, graded
//   Sun      hard day — 2 hards from this pattern · template from memory · wrap-up
//
// A section's CORE (14 problems, ≤4 easy → mediums → 2 hards) fits
// inside its week. The rest are EXTRAS: one shows up each weekday of
// that week as a BONUS (never required to finish the day), and what
// is left feeds the maintenance weeks round-robin across patterns.
// Every problem in the bank lands on a day; nothing is exiled months
// away from the week that taught it.
// ======================================================

import type { PlanDay, PlanPhase, PlanTask, PlanWeek, GoogleState, TaskItem, GoogleProblem, GoogleSection } from './types';
import { GOOGLE_SECTIONS, TOOLKIT_NAMES, GOOGLE_PROBLEMS } from './problems';
import { getDueProblems } from '@/lib/revision';

export const EMPTY_START = '2026-09-20';
export const PLAN_WEEKS_TOTAL = 27; // week 0 + weeks 1–26
const DAY_MS = 86_400_000;

// ── Load ────────────────────────────────────────────
const PER_DAY = 2;        // fresh problems Mon–Fri in a pattern week
const SAT_FRESH = 2;      // unseen mediums in the Saturday timed set (+1 re-solve)
const SUN_HARD = 2;       // hards on Sunday
const MAX_EASY = 4;       // easies in a core set — enough to learn the shape, no more
const CORE = PER_DAY * 5 + SAT_FRESH + SUN_HARD; // 14
const BONUS_PER_DAY = 1;  // optional third problem Mon–Fri, from the week's own extras
const MAINT_PER_DAY = 1;  // maintenance weeks keep DSA warm, nothing more
const SETUP_DAYS = 3;

/** The template each pattern week introduces on Monday and rewrites from memory on Sunday. */
const WEEK_TEMPLATE: Record<number, string> = {
  4: 'Template: Binary Search Bounds',
  5: 'Template: O(1) Queue',
  7: 'Template: MinHeap',
  13: 'Template: UnionFind',
  14: 'Template: Memoise',
  16: 'Template: Trie',
};
const templatesLearnedBy = (week: number): string[] => Object.entries(WEEK_TEMPLATE).filter(([w]) => Number(w) <= week).map(([, n]) => n);

export const PLAN_PHASES: PlanPhase[] = [
  {
    id: 'P0', title: 'Setup', weeks: [0, 0],
    gate: ['Resume in XYZ format, a number in every bullet', 'Referral map: 25 named people, nobody contacted yet', 'You can say how mastery, revision and the plan checkboxes connect'],
    gateHelp: [
      'The company reads resumes in XYZ form: "Accomplished X, as measured by Y, by doing Z." Rewrite every bullet that way. Lead with "payment systems" not "frontend"; make the Socket.IO dispute chat a full-stack bullet; make Workzen carry the backend story. Tick this when every bullet has a number and follows XYZ.',
      'Plan tab → referral map. Twenty-five real names: college seniors now at the company, ex-colleagues who moved, maintainers of repos you contributed to, local dev-meetup regulars, engineers there who are active on LinkedIn or X. Asks start in week 18 — mapping now, contacting later.',
      'Mastered checkbox = pass 1. "Due for revision" = passes 2 and 3 (7 → 14 → 30 days). Problem tasks tick themselves when every problem under them is mastered; the rest you tick by hand. When a whole day is done, Today moves on and the ready date comes forward.',
    ],
  },
  {
    id: 'P1', title: 'Pattern foundations', weeks: [1, 8],
    gate: ['An unseen medium from patterns 1–7, solved optimally and cleanly, talking aloud, in under 30 minutes — three times in a row on different days', 'Binary-search bounds, the O(1) queue and MinHeap written from memory in under 5 minutes each'],
    gateHelp: [
      'Use the Mocks tab → coding mock with the pattern filter set to any W1–W7 section. A run counts only if the solution is optimal, the code is clean, you talked the whole time, and you finished under 30 minutes. You need three such runs on three different days, consecutively — a failed run resets the count.',
      'The three templates introduced in weeks 4, 5 and 7. Blank editor, timer, no notes. If one takes longer than five minutes, rewrite it daily until it does not.',
    ],
  },
  {
    id: 'P2', title: 'The hard core — trees, graphs, DP', weeks: [9, 16],
    gate: ['Any unseen medium from any pattern in under 30 minutes', 'Any graph problem in under 25', 'A 2-D DP problem solved without looking up the recurrence', 'UnionFind, memoise and Trie written from memory in under 5 minutes each'],
    gateHelp: [
      'Mocks tab → coding mock, "Any pattern". Same standard as Gate 1: optimal, clean, out loud, under 30 minutes.',
      'Mocks tab → coding mock filtered to W12 or W13 (Graphs I / II). Under 25 minutes including the dry run.',
      'Pick an unmastered problem from W15 (DP II) you have not seen, and write the recurrence yourself before coding — no notes, no search. If you had to look it up, it does not count.',
      'The three templates introduced in weeks 13, 14 and 16. Blank editor, timer, no notes.',
    ],
  },
  {
    id: 'P3', title: 'Design, behavioural, and the door', weeks: [17, 22],
    gate: ['A cold system-design prompt driven confidently for 45 minutes', 'Twelve STAR stories delivered in two minutes each without notes', 'Applications submitted and at least three referrals in flight'],
    gateHelp: [
      'Mocks tab → design mock (random prompt you have not practised). You drive all six phases, pin numbers, draw it, and the interviewer grades hire-level (≥ 3.0).',
      'Behavioural tab: all 12 stories written, then rehearsed aloud with the 2:00 timer, without reading them. Record yourself once and listen back.',
      'Outside the app: applications to Software Engineer II reqs are in (not before week 20), and at least three referral asks have turned into actual referrals.',
    ],
  },
  {
    id: 'P4', title: 'Interview mode', weeks: [23, 26],
    gate: ['Four consecutive mock rounds at a hire-equivalent standard, judged by someone who is not you'],
    gateHelp: [
      'The Mocks tab tracks your hire-level streak (score ≥ 3.0, four in a row). The AI interviewer counts, but a real person — a friend who interviews, or a paid mock — is the honest version. Mixed round types are fine.',
    ],
  },
];

export const PLAN_WEEKS: PlanWeek[] = [
  { week: 0, phase: 'P0', theme: 'Setup', detail: 'Three short days: learn how the app runs the plan, fix the resume, map the referral network. Week 1 starts on the first Monday after.', sections: [],
    specials: [
      { day: 0, kind: 'admin', text: 'How this app runs the plan — five minutes, then you never think about it again.', items: [
        { label: 'Mastered checkbox = pass 1', sub: 'tick it in the DSA sidebar when a problem is solved optimally, out loud', link: { tab: 'dsa' } },
        { label: '"Due for revision" = passes 2 and 3', sub: 'a mastered problem comes back after 7, then 14, then 30 days — Today lists it when due' },
        { label: 'Problem tasks tick themselves', sub: 'master every problem under a task and it completes; tick the rest by hand' },
        { label: 'Six JavaScript templates, one per pattern week', sub: 'binary-search bounds (W4), O(1) queue (W5), MinHeap (W7), UnionFind (W13), memoise (W14), Trie (W16)', link: { tab: 'dsa', section: 'toolkit' } },
      ] },
      { day: 1, kind: 'admin', text: 'Rewrite the resume in XYZ form: "Accomplished X, as measured by Y, by doing Z." (in your resume doc)', items: [
        { label: 'Lead with "payment systems", not "frontend"', sub: 'Collections, Payouts, Connected Banking, BBPS are systems' },
        { label: 'Make the Socket.IO dispute chat a full-stack bullet', sub: 'it has a server, connection state and rooms — say so' },
        { label: 'Make Workzen carry the backend story', sub: 'job pipeline, webhooks, multi-tenant isolation, external API' },
        { label: 'Every bullet gets a number', sub: '30%, 35%, 5,000 MAU — you already have them' },
      ] },
      { day: 2, kind: 'outreach', text: 'Map the referral network: 25 named people in the referral map. Do not contact anyone yet — asks start in week 18, applications in week 20 (a rejection means a 6–12 month cooldown).', link: { tab: 'plan', id: 'outreach' }, items: [
        { label: 'College seniors now at the company' }, { label: 'Ex-colleagues who moved' }, { label: 'Maintainers of repos you have contributed to' }, { label: 'Local dev-meetup regulars' }, { label: 'Engineers there who are active on LinkedIn or X' },
      ] },
    ] },
  { week: 1, phase: 'P1', theme: 'Arrays, two pointers, prefix sums', detail: 'In-place manipulation, partitioning, sorted-array pairs.', sections: ['arrays'] },
  { week: 2, phase: 'P1', theme: 'Sliding window', detail: 'Fixed and variable size. The "longest/shortest such that" family.', sections: ['sliding-window'] },
  { week: 3, phase: 'P1', theme: 'Hashing, frequency maps, strings', detail: 'Anagrams, grouping, substring problems. Very high yield.', sections: ['hashing'] },
  { week: 4, phase: 'P1', theme: 'Binary search', detail: 'Classic, on rotated arrays, and — most importantly — on the answer space. Template: lower/upper bound.', sections: ['binary-search'] },
  { week: 5, phase: 'P1', theme: 'Stacks, monotonic stack, queues', detail: 'Next-greater, histograms, parsing with a stack. Template: the O(1) queue.', sections: ['stacks'] },
  { week: 6, phase: 'P1', theme: 'Linked lists, fast & slow pointers', detail: 'Reversal, cycles, merge, reorder, LRU.', sections: ['linked-list'] },
  { week: 7, phase: 'P1', theme: 'Heaps & top-K', detail: 'K-way merge, streaming median, scheduling. Template: MinHeap.', sections: ['heaps'] },
  { week: 8, phase: 'P1', theme: 'Deload & consolidate', detail: 'No new patterns. One extra a day from weeks 1–7, clear the revision ladder, first mock interview.', sections: [], maintenance: true,
    specials: [{ day: 5, text: 'First mock interview — one 45-minute coding round.', kind: 'mock', link: { tab: 'mocks', kind: 'coding' } }, { day: 6, kind: 'admin', text: 'Gate 1 check: three unseen mediums from patterns 1–7 in under 30 minutes each, on different days; the three templates from memory.', link: { tab: 'plan' } }] },
  { week: 9, phase: 'P2', theme: 'Binary trees', detail: 'All traversals recursive and iterative, depth, path sums, diameter.', sections: ['trees'] },
  { week: 10, phase: 'P2', theme: 'BSTs & tree construction', detail: 'Validation, LCA, serialise/deserialise, build from traversals.', sections: ['bst'] },
  { week: 11, phase: 'P2', theme: 'Backtracking', detail: 'Subsets, permutations, combinations, N-queens, word search, sudoku.', sections: ['backtracking'] },
  { week: 12, phase: 'P2', theme: 'Graphs I — BFS/DFS', detail: 'Grids and adjacency lists, components, multi-source BFS. Weekly mocks start now.', sections: ['graphs-1'],
    specials: [{ day: 5, text: 'Weekly mock starts: one 45-minute coding round.', kind: 'mock', link: { tab: 'mocks', kind: 'coding' } }] },
  { week: 13, phase: 'P2', theme: 'Graphs II', detail: 'Topological sort, Union-Find, bipartite checking, Dijkstra. Template: UnionFind.', sections: ['graphs-2'],
    specials: [{ day: 5, text: 'Weekly mock: one 45-minute coding round.', kind: 'mock', link: { tab: 'mocks', kind: 'coding' } }] },
  { week: 14, phase: 'P2', theme: 'DP I — one dimension', detail: 'Climbing stairs, house robber, coin change, LIS, word break. This is where people quit. It clicks. Keep going. Template: memoise.', sections: ['dp-1'],
    specials: [{ day: 5, text: 'Weekly mock: one 45-minute coding round.', kind: 'mock', link: { tab: 'mocks', kind: 'coding' } }] },
  { week: 15, phase: 'P2', theme: 'DP II — two dimensions', detail: 'Grid paths, edit distance, LCS, knapsack, interval DP.', sections: ['dp-2'],
    specials: [{ day: 5, text: 'Weekly mock: one 45-minute coding round.', kind: 'mock', link: { tab: 'mocks', kind: 'coding' } }] },
  { week: 16, phase: 'P2', theme: 'Tries, bit manipulation, intervals — then deload', detail: 'Template: Trie. Full mock loop #1 on Saturday.', sections: ['tries-bits-intervals'],
    specials: [{ day: 5, text: 'Full mock loop #1 — 3 coding rounds + 1 behavioural, back to back.', kind: 'mock', link: { tab: 'mocks', kind: 'coding' } }, { day: 6, kind: 'admin', text: 'Gate 2 check: any unseen medium < 30 min; any graph < 25 min; a 2-D DP without looking up the recurrence; the three templates from memory.', link: { tab: 'plan' } }] },
  { week: 17, phase: 'P3', theme: 'System design fundamentals', detail: 'Every concept in §7. Estimation drills until the arithmetic is instant. DSA drops to one problem a day.', sections: [], maintenance: true,
    specials: [
      { day: 0, kind: 'design', text: 'System design: load balancing, caching & eviction, CDN — write one page of notes each.', link: { tab: 'design' } },
      { day: 1, kind: 'design', text: 'System design: SQL vs NoSQL, sharding, consistent hashing, replication.', link: { tab: 'design' } },
      { day: 2, kind: 'design', text: 'System design: CAP & consistency models, message queues, back-pressure.', link: { tab: 'design' } },
      { day: 3, kind: 'design', text: 'System design: rate limiting, idempotency, indexing, monitoring & SLOs.', link: { tab: 'design' } },
      { day: 4, kind: 'design', text: 'Estimation drills: QPS, storage/year, bandwidth for five random scenarios until the arithmetic is instant (Design tab → Estimate).', link: { tab: 'design', id: 'estimate' } },
      { day: 5, kind: 'design', text: 'Drive two design prompts end-to-end on the whiteboard, 45 minutes each.', link: { tab: 'design', id: 'url-shortener' } },
      { day: 6, kind: 'design', text: 'Write up one design properly in the design doc panel.', link: { tab: 'design', id: 'rate-limiter' } },
    ] },
  { week: 18, phase: 'P3', theme: 'Six classic backend designs', detail: 'Written up properly. Referral outreach begins — first 8 asks.', sections: [], maintenance: true,
    specials: [
      { day: 0, kind: 'design', text: 'Design: URL shortener — full 45-minute run + written design doc.', link: { tab: 'design', id: 'url-shortener' } },
      { day: 1, kind: 'design', text: 'Design: Rate limiter — full run + doc. Referral asks 1–2.', link: { tab: 'design', id: 'rate-limiter' } },
      { day: 2, kind: 'design', text: 'Design: News feed — full run + doc. Referral asks 3–4.', link: { tab: 'design', id: 'news-feed' } },
      { day: 3, kind: 'design', text: 'Design: Chat / messaging — full run + doc. Referral asks 5–6.', link: { tab: 'design', id: 'chat' } },
      { day: 4, kind: 'design', text: 'Design: Notification system — full run + doc. Referral asks 7–8.', link: { tab: 'design', id: 'notifications' } },
      { day: 5, kind: 'design', text: 'Design: Web crawler — full run + doc. Then one design mock.', link: { tab: 'design', id: 'web-crawler' } },
      { day: 6, text: 'Review all six docs. Send any referral asks still pending and log the replies.', link: { tab: 'plan', id: 'outreach' } },
    ] },
  { week: 19, phase: 'P3', theme: 'Frontend system design + vanilla-JS drills', detail: 'Three frontend design prompts, the W19 drills section in the editor (debounce, throttle, promises, emitter…), accessibility weekend. 8 more referral asks.', sections: ['frontend-drills'], maintenance: true,
    specials: [
      { day: 0, kind: 'design', text: 'Frontend design: typeahead component — full run + doc. Referral asks 9–10.', link: { tab: 'design', id: 'fe-typeahead' } },
      { day: 1, kind: 'design', text: 'Frontend design: infinite feed — full run + doc. Referral asks 11–12.', link: { tab: 'design', id: 'fe-feed' } },
      { day: 2, kind: 'design', text: 'Frontend design: chat client — full run + doc. Referral asks 13–14.', link: { tab: 'design', id: 'fe-chat' } },
      { day: 3, kind: 'design', text: 'Component drills in a scratch HTML file: modal with focus trap, accordion, toast queue, virtualised list.' },
      { day: 4, text: 'Referral asks 15–16. Log every reply in the referral map.', link: { tab: 'plan', id: 'outreach' } },
      { day: 5, kind: 'design', text: 'Accessibility weekend: semantic HTML, ARIA, focus management, keyboard-only flows. Rebuild one component accessibly.' },
      { day: 6, kind: 'design', text: 'Accessibility weekend: audit your own projects with a screen reader. Fix three things.' },
    ] },
  { week: 20, phase: 'P3', theme: 'Behavioural + applications go out', detail: 'Write and rehearse 12 STAR stories to two minutes each. Applications go out.', sections: [], maintenance: true,
    specials: [
      { day: 0, text: 'Write STAR stories 1–4: hardest problem, ambiguous requirements, disagreement, something that failed.', kind: 'behavioural', link: { tab: 'behavioural', id: 'hardest' } },
      { day: 1, text: 'Write STAR stories 5–8: beyond your role, mentoring, difficult feedback, decision without data.', kind: 'behavioural', link: { tab: 'behavioural', id: 'beyond' } },
      { day: 2, text: 'Write STAR stories 9–12: influence without authority, competing priorities, most proud of, why this company.', kind: 'behavioural', link: { tab: 'behavioural', id: 'influence' } },
      { day: 3, text: 'Rehearse all 12 to two minutes each, timed. Record yourself. Listen back.', kind: 'behavioural', link: { tab: 'behavioural' } },
      { day: 4, text: 'APPLICATIONS GO OUT: Software Engineer II reqs (Payments first). Referral + direct application in the same week — log each one.', link: { tab: 'plan', id: 'outreach' } },
      { day: 5, text: 'Behavioural mock: 4 questions with the AI interviewer. Start interviewing elsewhere — parallel funnel.', kind: 'mock', link: { tab: 'mocks', kind: 'behavioural' } },
      { day: 6, text: 'Fix the two weakest stories. Confirm every application and referral is logged in the tracker.', kind: 'behavioural', link: { tab: 'plan', id: 'outreach' } },
    ] },
  { week: 21, phase: 'P3', theme: 'Company flavour', detail: 'Open-ended problems, layered follow-ups, design-and-implement hybrids, hard problems. Design stays warm: two stretch prompts this week, starting with payments.', sections: ['google-flavour'],
    specials: [
      { day: 1, kind: 'design', text: 'Design re-run: Payment system — full 45-minute run + doc. Your day job; lead with what you have actually debugged.', link: { tab: 'design', id: 'payments' } },
      { day: 3, kind: 'design', text: 'Design re-run: Distributed cache — full 45-minute run + doc.', link: { tab: 'design', id: 'distributed-cache' } },
    ] },
  { week: 22, phase: 'P3', theme: 'Full mock loop #2 — then deload', detail: '3 coding + 1 design + 1 behavioural, with real humans. Two stretch designs early in the week.', sections: [], maintenance: true,
    specials: [
      { day: 0, kind: 'design', text: 'Design re-run: Distributed job scheduler — full 45-minute run + doc.', link: { tab: 'design', id: 'job-scheduler' } },
      { day: 1, kind: 'design', text: 'Design re-run: Search autocomplete — full 45-minute run + doc. Your Trie template, at scale.', link: { tab: 'design', id: 'autocomplete' } },
      { day: 4, text: 'Full mock loop #2, part 1: 2 coding rounds with a real person if you can, else the AI interviewer.', kind: 'mock', link: { tab: 'mocks', kind: 'coding' } },
      { day: 5, text: 'Full mock loop #2, part 2: 1 coding + 1 system design + 1 behavioural.', kind: 'mock', link: { tab: 'mocks', kind: 'design' } },
      { day: 6, kind: 'admin', text: 'Gate 3 check: cold design prompt driven for 45 min; 12 stories at two minutes without notes; applications in and ≥3 referrals in flight.', link: { tab: 'plan' } },
    ] },
  { week: 23, phase: 'P4', theme: 'Two timed problems daily', detail: '45 min each, out loud, as graded rounds. Two mocks this week, one stretch design.', sections: [], maintenance: true,
    specials: [{ day: 0, kind: 'design', text: 'Design re-run: Cloud file sync — full 45-minute run + doc.', link: { tab: 'design', id: 'file-storage' } }, { day: 2, text: 'Mock #1 this week — coding.', kind: 'mock', link: { tab: 'mocks', kind: 'coding' } }, { day: 5, text: 'Mock #2 this week — coding or design.', kind: 'mock', link: { tab: 'mocks', kind: 'design' } }] },
  { week: 24, phase: 'P4', theme: 'Company-tagged problems', detail: 'The rest of the Company-flavour section. Full spaced-repetition sweep of everything flagged. Two stretch designs.', sections: ['google-flavour'], maintenance: true,
    specials: [{ day: 1, kind: 'design', text: 'Design re-run: Metrics & monitoring — full 45-minute run + doc.', link: { tab: 'design', id: 'metrics' } }, { day: 3, kind: 'design', text: 'Design re-run: Collaborative document editing — full 45-minute run + doc.', link: { tab: 'design', id: 'collab-editing' } }, { day: 5, text: 'Mock: one coding round.', kind: 'mock', link: { tab: 'mocks', kind: 'coding' } }] },
  { week: 25, phase: 'P4', theme: 'Full mock loop #3', detail: 'Real interviews elsewhere as live reps. Refine the behavioural stories. Last stretch design.', sections: [], maintenance: true,
    specials: [{ day: 1, kind: 'design', text: 'Design re-run: Video streaming — full 45-minute run + doc.', link: { tab: 'design', id: 'video-streaming' } }, { day: 4, text: 'Full mock loop #3, part 1: 2 coding rounds.', kind: 'mock', link: { tab: 'mocks', kind: 'coding' } }, { day: 5, text: 'Full mock loop #3, part 2: 1 coding + 1 design + 1 behavioural.', kind: 'mock', link: { tab: 'mocks', kind: 'behavioural' } }, { day: 6, text: 'Refine the behavioural stories from the loop feedback.', kind: 'behavioural', link: { tab: 'behavioural' } }] },
  { week: 26, phase: 'P4', theme: 'Taper', detail: 'One problem a day, reread notes, sleep properly. You are ready.', sections: [], maintenance: true,
    specials: [
      { day: 2, kind: 'design', text: 'Reread every design doc you wrote (30 min) — the six classics and the eight stretch prompts. No new runs.', link: { tab: 'design' } },
      { day: 5, kind: 'admin', text: 'Loop-day checklist (roadmap §6) — run through it the night before every onsite.', items: [
        { label: 'Sleep 8 hours; no new material after 6 pm' },
        { label: 'Morning: two easy warm-ups from the toolkit, out loud, 10 minutes each', link: { tab: 'dsa', section: 'toolkit' } },
        { label: 'Reread your notes for the 16 patterns — trigger lines only, not solutions', link: { tab: 'dsa' } },
        { label: 'Reread the 12 STAR stories once; say the two weakest aloud', link: { tab: 'behavioural' } },
        { label: 'Three questions ready for each interviewer (team, on-call, how L3s grow)' },
        { label: 'Environment: camera, mic, quiet room, water, shared doc / editor tested' },
      ] },
      { day: 6, kind: 'admin', text: 'Gate 4 check: four consecutive mock rounds at a hire-equivalent standard, judged by someone who is not you. Reread roadmap §6.', link: { tab: 'plan' } },
    ] },
];

export function phaseOf(week: number): PlanPhase {
  return PLAN_PHASES.find(ph => week >= ph.weeks[0] && week <= ph.weeks[1]) ?? PLAN_PHASES[0];
}

// ── Date helpers (local-time, date-only) ────────────
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
export function toISODate(d: Date): string {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
export function addDays(d: Date, n: number): Date {
  const x = new Date(d); x.setDate(x.getDate() + n); return x;
}
export function startOfToday(): Date {
  const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}
export function fmtDate(d: Date, withYear = false): string {
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) });
}

// ── Core / extras split ─────────────────────────────
// Deterministic and state-free: the same start date always yields the
// same day → problems map, so Today never shuffles under you. Live
// state only decorates it (✓ when mastered) — see lib/google/today.ts.
type Slot = { p: GoogleProblem; s: GoogleSection };
const diffLabel = (d: GoogleProblem['difficulty']) => d === 'easy' ? 'E' : d === 'medium' ? 'M' : 'H';

/**
 * The 14 a pattern week schedules, laid out so the week reads easy → hard:
 * up to 4 easies, then mediums, then 2 hards (Sunday). Short sections fill
 * from more easies, then more hards. Everything else is an extra.
 */
export function splitCore(problems: GoogleProblem[]): { core: GoogleProblem[]; extras: GoogleProblem[] } {
  const easy = problems.filter(p => p.difficulty === 'easy');
  const med = problems.filter(p => p.difficulty === 'medium');
  const hard = problems.filter(p => p.difficulty === 'hard');
  let e = Math.min(easy.length, MAX_EASY);
  let h = Math.min(hard.length, SUN_HARD);
  const m = Math.min(med.length, CORE - e - h);
  e = Math.min(easy.length, e + Math.max(0, CORE - e - m - h));
  h = Math.min(hard.length, h + Math.max(0, CORE - e - m - h));
  return {
    core: [...easy.slice(0, e), ...med.slice(0, m), ...hard.slice(0, h)],
    // Bonus slots take these from the front (easy first, a quick extra rep);
    // maintenance weeks take what is left, mediums and hards before easies.
    extras: [...easy.slice(e), ...med.slice(m), ...hard.slice(h)],
  };
}

class Allocator {
  private core = new Map<string, Slot[]>();
  private extras = new Map<string, Slot[]>();
  /** Sections whose pattern week has passed — their extras are fair game. */
  private released: string[] = [];
  /** Scheduled problems by section, for re-solves. */
  private assigned = new Map<string, Slot[]>();
  private againCursor = new Map<string, number>();
  private thisWeek: Slot[] = [];
  private rr = 0;
  private rrAgain = 0;

  constructor() {
    for (const s of GOOGLE_SECTIONS) {
      if (s.id === 'toolkit') continue;
      const { core, extras } = splitCore(s.problems);
      this.core.set(s.id, core.map(p => ({ p, s })));
      this.extras.set(s.id, extras.map(p => ({ p, s })));
    }
  }

  startWeek() { this.thisWeek = []; }
  endWeek(sectionIds: string[]) { for (const id of sectionIds) if (!this.released.includes(id)) this.released.push(id); }

  /** Extras that never got a day — they stay in the DSA tab as bonus practice. */
  unscheduled(): number {
    let n = 0;
    for (const q of this.core.values()) n += q.length;
    for (const q of this.extras.values()) n += q.length;
    return n;
  }

  /**
   * n fresh problems: the section's core, then its extras, then released
   * extras round-robin across patterns (interleaved practice — each
   * maintenance week touches several patterns), mediums and hards before
   * any easy. Returns fewer when nothing fresh is left.
   */
  take(sectionId: string | undefined, n: number, extra = ''): TaskItem[] {
    const out: TaskItem[] = [];
    const pull = (q: Slot[] | undefined, fromExtras: boolean, max = n) => { while (out.length < max && q?.length) out.push(this.fresh(q.shift()!, fromExtras, extra)); };
    if (sectionId) { pull(this.core.get(sectionId), false); pull(this.extras.get(sectionId), true); }
    for (const allowEasy of [false, true]) {
      for (let tries = 0; out.length < n && tries < this.released.length; tries++) {
        const id = this.released[this.rr % this.released.length];
        this.rr++;
        const q = this.extras.get(id) ?? [];
        const i = allowEasy ? (q.length ? 0 : -1) : q.findIndex(x => x.p.difficulty !== 'easy');
        if (i < 0) continue;
        out.push(this.fresh(q.splice(i, 1)[0], true, extra));
        tries = -1; // took one — reset the empty-section counter
      }
    }
    return out;
  }

  /** One bonus problem from this section's extras (easy first) — optional, never blocks the day. */
  bonus(sectionId: string): TaskItem[] {
    const q = this.extras.get(sectionId);
    if (!q?.length) return [];
    const it = this.fresh(q.shift()!, false, '');
    return [{ ...it, sub: ['bonus', it.sub].filter(Boolean).join(' · '), optional: true }];
  }

  /**
   * n re-solves of already-scheduled mediums/hards, one per pattern in turn
   * (round-robin across released sections, each walking its own list).
   * Easies are never worth a timed re-solve.
   */
  again(n: number, extra = ''): TaskItem[] {
    const out: TaskItem[] = [];
    for (let tries = 0; out.length < n && tries < this.released.length; tries++) {
      const id = this.released[this.rrAgain % this.released.length];
      this.rrAgain++;
      const pool = (this.assigned.get(id) ?? []).filter(x => x.p.difficulty !== 'easy');
      if (!pool.length) continue;
      const cur = this.againCursor.get(id) ?? 0;
      this.againCursor.set(id, cur + 1);
      const { p, s } = pool[cur % pool.length];
      out.push({ label: p.name, sub: ['re-solve', s.title, extra].filter(Boolean).join(' · '), link: { tab: 'dsa', section: s.id, problem: p.name }, again: true });
      tries = -1;
    }
    return out;
  }

  /** One re-solve from this week — Wednesday's first medium, three days old: pass 2 under a timer. */
  againThisWeek(extra = ''): TaskItem | null {
    if (!this.thisWeek.length) return null;
    const { p, s } = this.thisWeek[Math.min(4, this.thisWeek.length - 1)];
    return { label: p.name, sub: ['re-solve from this week', extra].filter(Boolean).join(' · '), link: { tab: 'dsa', section: s.id, problem: p.name }, again: true };
  }

  private fresh(slot: Slot, fromExtras: boolean, extra: string): TaskItem {
    const list = this.assigned.get(slot.s.id) ?? [];
    list.push(slot);
    this.assigned.set(slot.s.id, list);
    this.thisWeek.push(slot);
    const { p, s } = slot;
    const sub = [diffLabel(p.difficulty), fromExtras ? s.title : (p.note ? p.note.split('. ')[0] : ''), extra].filter(Boolean).join(' · ');
    return { label: p.name, sub, link: { tab: 'dsa', section: s.id, problem: p.name } };
  }
}

// ── Task generation ─────────────────────────────────
const pad2 = (n: number) => String(n).padStart(2, '0');
/** Timed-set problems open as a coding round in the Mocks tab (timer, interviewer, no coach). */
const asTimedRounds = (items: TaskItem[]): TaskItem[] => items.map(i => (i.link?.problem ? { ...i, link: { tab: 'mocks', kind: 'coding', problem: i.link.problem } } : i));
const toolkitItem = (name: string, sub: string, again = false): TaskItem => ({ label: name, sub, link: { tab: 'dsa', section: 'toolkit', problem: name }, again });
/** Fresh items first; re-solves fill whatever fresh could not. */
const freshOrAgain = (alloc: Allocator, sectionId: string | undefined, n: number, extra = ''): TaskItem[] => {
  const items = alloc.take(sectionId, n, extra);
  return items.length < n ? [...items, ...alloc.again(n - items.length, extra)] : items;
};

/** Weeks 1–26. dayInWeek: 0 Mon … 4 Fri, 5 Sat, 6 Sun. */
function weekTemplate(week: PlanWeek, weekIdx: number, dayInWeek: number, alloc: Allocator): PlanTask[] {
  const id = (k: string) => `w${pad2(weekIdx)}d${dayInWeek}-${k}`;
  const sec = week.sections[0];
  const base = { day: 0, week: weekIdx };
  const tasks: PlanTask[] = [];
  const revise = (count: number) => tasks.push({ ...base, id: id('revise'), kind: 'revise', count, text: 'Spaced repetition — clear what is due today, from a blank editor, no notes.', link: { tab: 'dsa' } });
  const wrapUp = () => tasks.push({ ...base, id: id('admin'), kind: 'admin', text: "Wrap up the week: clear the Due-for-revision list, read next week's theme, tick the week off.", link: { tab: 'plan' } });

  if (dayInWeek === 0) alloc.startWeek();

  // ── Maintenance weeks: design / behavioural / mocks are the work; DSA just stays warm ──
  if (week.maintenance) {
    if (sec) {
      // W19 frontend drills, W24 the rest of Google flavour: 2 a day Mon–Sat from that section.
      if (dayInWeek <= 4) {
        tasks.push({ ...base, id: id('solve'), kind: 'solve', count: PER_DAY, sectionId: sec, items: freshOrAgain(alloc, sec, PER_DAY), text: `Solve 2 from "${week.theme}", out loud.`, link: { tab: 'dsa', section: sec } });
        revise(2);
      } else if (dayInWeek === 5) {
        tasks.push({ ...base, id: id('timed'), kind: 'timed', count: 2, sectionId: sec, items: asTimedRounds(freshOrAgain(alloc, sec, 2, '35 min')), text: 'Timed set — 2 problems, 35 minutes each, as graded rounds.', link: { tab: 'mocks', kind: 'coding' } });
      } else {
        revise(3);
        wrapUp();
      }
    } else if (weekIdx === 23) {
      if (dayInWeek <= 4) {
        tasks.push({ ...base, id: id('timed'), kind: 'timed', count: 2, items: asTimedRounds(freshOrAgain(alloc, undefined, 2, '45 min')), text: 'Two timed problems — 45 minutes each, out loud, as graded rounds.', link: { tab: 'mocks', kind: 'coding' } });
        revise(2);
      } else if (dayInWeek === 5) {
        tasks.push({ ...base, id: id('timed'), kind: 'timed', count: 2, items: asTimedRounds(alloc.again(2, '35 min')), text: 'Timed re-solves — 2 from earlier patterns, 35 minutes each, as graded rounds.', link: { tab: 'mocks', kind: 'coding' } });
      } else {
        revise(3);
        wrapUp();
      }
    } else if (weekIdx === 26) {
      if (dayInWeek <= 4) {
        tasks.push({ ...base, id: id('solve'), kind: 'solve', count: 1, items: freshOrAgain(alloc, undefined, 1), text: 'One problem, out loud. Then reread your notes for the pattern it used.', link: { tab: 'dsa' } });
        revise(2);
      }
    } else {
      if (dayInWeek <= 4) {
        const items = freshOrAgain(alloc, undefined, MAINT_PER_DAY);
        const fresh = items.some(i => !i.again);
        tasks.push({ ...base, id: id('solve'), kind: 'solve', count: MAINT_PER_DAY, items, text: fresh ? 'Keep DSA warm — one extra from an earlier pattern, out loud.' : 'Keep DSA warm — re-solve one from an earlier pattern, blank editor.', link: { tab: 'dsa' } });
        revise(2);
      } else if (dayInWeek === 5) {
        tasks.push({ ...base, id: id('timed'), kind: 'timed', count: 2, items: asTimedRounds(alloc.again(2, '35 min')), text: 'Timed re-solves — 2 from earlier patterns, 35 minutes each, as graded rounds.', link: { tab: 'mocks', kind: 'coding' } });
      } else {
        revise(3);
        wrapUp();
      }
    }
    return tasks;
  }

  // ── Pattern weeks: the same shape every week ──
  const template = WEEK_TEMPLATE[weekIdx];
  if (dayInWeek <= 4) {
    if (dayInWeek === 0) {
      tasks.push({ ...base, id: id('theory'), kind: 'theory', sectionId: sec, text: `Theory (1 hr) — ${week.theme}: pattern notes, the trigger condition, the shape of the code.`, link: { tab: 'dsa', section: sec } });
      if (template) {
        tasks.push({ ...base, id: id('tmpl'), kind: 'template', sectionId: 'toolkit', items: [toolkitItem(template, GOOGLE_PROBLEMS[template]?.note?.split('. ')[0] ?? '')], text: `This week's template — write ${template.replace('Template: ', '')} in the Toolkit section, then use it in every problem this week.`, link: { tab: 'dsa', section: 'toolkit', problem: template } });
      }
    } else {
      tasks.push({ ...base, id: id('theory'), kind: 'theory', sectionId: sec, text: 'Recap (15 min) — say the trigger condition out loud and sketch the code shape before the first problem.', link: { tab: 'dsa', section: sec } });
    }
    const items = [...freshOrAgain(alloc, sec, PER_DAY), ...(sec ? alloc.bonus(sec) : [])].slice(0, PER_DAY + BONUS_PER_DAY);
    const hasBonus = items.some(i => i.optional);
    tasks.push({ ...base, id: id('solve'), kind: 'solve', count: PER_DAY, sectionId: sec, items, text: `Solve 2 from "${week.theme}", in order, always out loud.${hasBonus ? ' The third is a bonus — it never blocks the day.' : ''}`, link: { tab: 'dsa', section: sec } });
    revise(2);
  } else if (dayInWeek === 5) {
    const again = alloc.againThisWeek('35 min');
    const items = asTimedRounds([...freshOrAgain(alloc, sec, SAT_FRESH, '35 min'), ...(again ? [again] : [])]);
    tasks.push({ ...base, id: id('timed'), kind: 'timed', count: items.length, sectionId: sec, items, text: 'Timed set — 2 unseen mediums + 1 re-solve from this week, 35 minutes each, out loud, no help: each pill opens a graded round.', link: { tab: 'mocks', kind: 'coding' } });
    tasks.push({ ...base, id: id('review'), kind: 'drill', text: "Post-mortem the set: for each miss, write the trigger you failed to fire in that problem's notes." });
  } else {
    tasks.push({ ...base, id: id('hard'), kind: 'solve', count: SUN_HARD, sectionId: sec, items: freshOrAgain(alloc, sec, SUN_HARD), text: 'Hard day — 2 from this pattern at full stretch. No timer: get them optimal and clean, then say the follow-up you would expect.', link: { tab: 'dsa', section: sec } });
    const learned = templatesLearnedBy(weekIdx);
    const rewrite = template ?? (learned.length ? learned[weekIdx % learned.length] : undefined);
    if (rewrite) {
      tasks.push({ ...base, id: id('tmpl'), kind: 'template', items: [toolkitItem(rewrite, 'Blank editor, no notes, under 5 minutes — then compare with your saved version', true)], text: `Rewrite ${rewrite.replace('Template: ', '')} from memory.`, link: { tab: 'dsa', section: 'toolkit', problem: rewrite } });
    }
    revise(3);
    wrapUp();
  }
  return tasks;
}

/** Days in week 0 for a given start: the setup days, then buffer days up to the first Monday. */
export function week0Length(planStartISO: string): number {
  const afterSetup = addDays(parseISODate(planStartISO), SETUP_DAYS);
  return SETUP_DAYS + ((8 - afterSetup.getDay()) % 7);
}

/** Build the full plan-day queue for a given start date. Deterministic; cheap to recompute. */
export function buildPlan(planStartISO: string): PlanDay[] {
  const start = parseISODate(planStartISO);
  const w0 = week0Length(planStartISO);
  const total = w0 + (PLAN_WEEKS_TOTAL - 1) * 7;
  const alloc = new Allocator();
  const days: PlanDay[] = [];
  const monday = addDays(start, w0);

  for (let i = 0; i < total; i++) {
    const weekIdx = i < w0 ? 0 : Math.floor((i - w0) / 7) + 1;
    const dayInWeek = weekIdx === 0 ? i : (i - w0) % 7;
    const week = PLAN_WEEKS[weekIdx];
    const date = addDays(start, i);
    let tasks: PlanTask[] = [];

    if (weekIdx === 0) {
      if (dayInWeek >= SETUP_DAYS) {
        tasks.push({ id: `w00d${dayInWeek}-buffer`, day: i, week: 0, kind: 'rest', text: `Buffer — rest, or get ahead: anything you master in the Arrays section now is already ticked when week 1 starts on ${fmtDate(monday)}.`, link: { tab: 'dsa', section: 'arrays' } });
      }
    } else {
      tasks = weekTemplate(week, weekIdx, dayInWeek, alloc).map(t => ({ ...t, day: i }));
    }

    for (const sp of week.specials ?? []) {
      if (sp.day !== dayInWeek) continue;
      const kind: PlanTask['kind'] = sp.kind ??
        (/referral|asks/i.test(sp.text) ? 'outreach' :
        /APPLICATIONS/.test(sp.text) ? 'apply' : 'special');
      tasks.push({ id: `w${pad2(weekIdx)}d${dayInWeek}-sp${tasks.length}`, day: i, week: weekIdx, kind, text: sp.text, link: sp.link, sectionId: sp.link?.section, items: sp.items });
    }
    if (tasks.length === 0) {
      tasks.push({ id: `w${pad2(weekIdx)}d${dayInWeek}-rest`, day: i, week: weekIdx, kind: 'rest', text: 'Rest day — nothing scheduled. Sleep is part of the plan.' });
    }
    days.push({ day: i, week: weekIdx, date, tasks });
    if (weekIdx >= 1 && dayInWeek === 6 && week.sections.length) alloc.endWeek(week.sections);
  }
  return days;
}

let planCache: { start: string; days: PlanDay[] } | null = null;
/** Memoised buildPlan — the plan is pure in the start date, so one copy per start is enough. */
export function planFor(planStartISO: string): PlanDay[] {
  if (!planCache || planCache.start !== planStartISO) planCache = { start: planStartISO, days: buildPlan(planStartISO) };
  return planCache.days;
}

/** problem name → the plan day it is first scheduled on (re-solves excluded). */
export function problemSchedule(days: PlanDay[]): Map<string, PlanDay> {
  const m = new Map<string, PlanDay>();
  for (const d of days) for (const t of d.tasks) for (const it of t.items ?? []) {
    const name = it.link?.problem;
    if (name && !it.again && !m.has(name)) m.set(name, d);
  }
  return m;
}

/** True when a task is a fixed set of problems with at least one required fresh one — mastery alone completes it (re-solves are trusted, bonuses ignored). */
export function isProblemTask(t: PlanTask): boolean {
  return !!t.items && t.items.length > 0 && t.items.every(it => !!it.link?.problem) && t.items.some(it => !it.again && !it.optional);
}

/** Problems that appear on the plan only as a bonus. */
export function bonusProblems(days: PlanDay[]): Set<string> {
  const b = new Set<string>();
  for (const d of days) for (const t of d.tasks) for (const it of t.items ?? []) if (it.optional && it.link?.problem) b.add(it.link.problem);
  return b;
}

/**
 * Tick what the state already proves: problem tasks whose fresh problems
 * are all mastered, buffer/rest days the calendar has passed, and the
 * revision task on any day whose other work is done when nothing is due.
 * Mastering ahead of the calendar therefore moves the ready date on its
 * own, and nothing blocks a day for no reason. Returns true when anything changed.
 */
export function autoTickPlan(days: PlanDay[], state: GoogleState, today: Date = startOfToday(), nowMs: number = Date.now()): boolean {
  const mastered = new Set(state.mastered);
  const nothingDue = getDueProblems(state.lastReviewDate, state.reviewCount, state.mastered, nowMs).length === 0;
  const now = new Date(nowMs).toISOString();
  let changed = false;
  const tick = (id: string) => { state.planDone[id] = now; changed = true; };
  for (const d of days) {
    for (const t of d.tasks) {
      if (state.planDone[t.id]) continue;
      if (isProblemTask(t) && t.items!.every(it => it.again || it.optional || mastered.has(it.link!.problem!))) tick(t.id);
      else if (t.kind === 'rest' && d.date.getTime() < today.getTime()) tick(t.id);
    }
    if (nothingDue && d.tasks.every(t => t.kind === 'revise' || state.planDone[t.id])) {
      for (const t of d.tasks) if (t.kind === 'revise' && !state.planDone[t.id]) tick(t.id);
    }
  }
  return changed;
}

// ── Progress & projections ──────────────────────────
export interface PlanStatus {
  totalDays: number;
  completedDays: number;          // fully ticked days
  totalTasks: number;
  doneTasks: number;
  /** First plan day with unfinished tasks — what "Today" shows */
  currentDay: number;
  /** Calendar day index for today (can be negative before the start) */
  calendarDay: number;
  /**
   * + ahead, − behind, 0 on schedule. Today's day is due tonight, so it counts
   * neither way: ahead only once tomorrow's day is done, behind only once
   * yesterday's is still open.
   */
  delta: number;
  daysLeft: number;
  projectedReady: Date;           // today + daysLeft
  scheduledReady: Date;           // start + totalDays
  applyWindowOpens: Date;         // start of week 20 — the hard rule
  started: boolean;
  finished: boolean;
}

export function isDayDone(day: PlanDay, planDone: Record<string, string>): boolean {
  return day.tasks.every(t => !!planDone[t.id]);
}

export function computePlanStatus(days: PlanDay[], state: Pick<GoogleState, 'planDone' | 'planStart'>, today: Date = startOfToday()): PlanStatus {
  const totalDays = days.length;
  const doneFlags = days.map(d => isDayDone(d, state.planDone));
  const completedDays = doneFlags.filter(Boolean).length;
  const totalTasks = days.reduce((n, d) => n + d.tasks.length, 0);
  const doneTasks = days.reduce((n, d) => n + d.tasks.filter(t => state.planDone[t.id]).length, 0);
  let currentDay = doneFlags.findIndex(f => !f);
  if (currentDay === -1) currentDay = totalDays;
  const start = parseISODate(state.planStart);
  const calendarDay = Math.floor((today.getTime() - start.getTime()) / DAY_MS);
  const started = calendarDay >= 0;
  const daysLeft = totalDays - completedDays;
  // Plan days due by last night, and by tonight (today's day is open until then).
  const dueYesterday = Math.min(Math.max(calendarDay, 0), totalDays);
  const dueTonight = Math.min(Math.max(calendarDay + 1, 0), totalDays);
  const delta = completedDays > dueTonight ? completedDays - dueTonight : completedDays < dueYesterday ? completedDays - dueYesterday : 0;
  // What is left runs one day per calendar day — from today, or tomorrow once today's day is done.
  const projectedReady = daysLeft === 0 ? today : addDays(started ? today : start, daysLeft + (started && completedDays > dueYesterday ? 1 : 0));
  const week20 = days.find(d => d.week === 20)?.date ?? addDays(start, 20 * 7);
  return {
    totalDays, completedDays, totalTasks, doneTasks, currentDay, calendarDay,
    delta,
    daysLeft,
    projectedReady,
    scheduledReady: addDays(start, totalDays),
    applyWindowOpens: week20,
    started,
    finished: completedDays >= totalDays,
  };
}
