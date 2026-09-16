// ======================================================
// GOOGLE PREP — the 26-week plan as a task queue
//
// The roadmap is calendar-shaped (week themes, gates). Here it
// becomes a queue of plan-days. "Today" is the first day with
// work left, not the calendar date — so finishing two days in
// one evening pulls every projection forward by a day.
//
// Week 0 holds the seven setup days and then runs to the first
// Monday; weeks 1–26 are Mon → Sun so the weekend carries the
// timed set (Sat) and the wrap-up (Sun), as in the roadmap.
//
// Every problem in every section is assigned to exactly one plan
// day at build time (see Allocator): the week's own problems first,
// then whatever a section could not fit spills into the next
// maintenance week. Nothing is left unscheduled.
// ======================================================

import type { PlanDay, PlanPhase, PlanTask, PlanWeek, GoogleState, TaskItem, GoogleProblem, GoogleSection } from './types';
import { GOOGLE_SECTIONS, TOOLKIT_NAMES } from './problems';

export const EMPTY_START = '2026-09-20';
export const PLAN_WEEKS_TOTAL = 27; // week 0 + weeks 1–26
const DAY_MS = 86_400_000;

export const PLAN_PHASES: PlanPhase[] = [
  {
    id: 'P0', title: 'Baseline & setup', weeks: [0, 0],
    gate: ['Toolkit (6 JavaScript templates) written from memory in under 30 minutes', 'Tracker live', 'Resume in XYZ format'],
    gateHelp: [
      'The toolkit is six small data structures JavaScript does not ship with, so you must be able to type them without thinking: MinHeap, UnionFind, Trie, an O(1) queue, a memoise helper, and binary-search lower/upper bounds. They are the first section in the DSA tab ("W0 · Toolkit"). Write all six there, then test yourself: blank editor, 30-minute timer, all six from memory. Tick this only when that run succeeds.',
      'The tracker is the record of every problem you have solved and when it comes back for revision (pass 1 on the day, pass 2 after 3–7 days, pass 3 after 10–30 days). In this app it is built in — the mastered checkbox is pass 1 and the "Due for revision" card schedules passes 2 and 3 (7 → 14 → 30 days). Tick this once you have mastered your first problem and understand where it will resurface. No spreadsheet needed.',
      'Google reads resumes in XYZ form: "Accomplished X, as measured by Y, by doing Z." Rewrite every bullet of your resume that way, with a number in each. Lead with "payment systems" not "frontend"; make the Socket.IO dispute chat a full-stack bullet; make Workzen carry your backend story. This happens in your resume document, not here — tick it when every bullet has a number and follows XYZ.',
    ],
  },
  {
    id: 'P1', title: 'Pattern foundations', weeks: [1, 8],
    gate: ['An unseen medium from patterns 1–7, solved optimally and cleanly, talking aloud, in under 30 minutes — three times in a row on different days'],
    gateHelp: [
      'Use the Mocks tab → coding mock with the pattern filter set to any W1–W7 section, or the Saturday timed sets. A run counts only if the solution is optimal, the code is clean, you talked the whole time, and you finished under 30 minutes. You need three such runs on three different days, consecutively — a failed run resets the count.',
    ],
  },
  {
    id: 'P2', title: 'The hard core — trees, graphs, DP', weeks: [9, 16],
    gate: ['Any unseen medium from any pattern in under 30 minutes', 'Any graph problem in under 25', 'A 2-D DP problem solved without looking up the recurrence'],
    gateHelp: [
      'Mocks tab → coding mock, "Any pattern". Same standard as Gate 1: optimal, clean, out loud, under 30 minutes.',
      'Mocks tab → coding mock filtered to W12 or W13 (Graphs I / II). Under 25 minutes including the dry run.',
      'Pick an unmastered problem from W15 (DP II) you have not seen, and write the recurrence yourself before coding — no notes, no search. If you had to look it up, it does not count.',
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
  { week: 0, phase: 'P0', theme: 'Baseline & setup', detail: 'Diagnostic, toolkit, tracker, resume, referral map.', sections: [],
    specials: [
      { day: 0, text: 'Timed diagnostic: 4 problems (2 easy, 2 medium), 3 hours, no help. They are from weeks 1–3, which you have not studied yet — that is the point. Record exactly where you stalled.', kind: 'timed', link: { tab: 'dsa', section: 'arrays' } },
      { day: 1, text: 'Review the diagnostic and tune the plan to what it exposed.', items: [
        { label: 'For each of the 4 problems, write one line in its Notes: where exactly you stalled', sub: 'reading the problem · choosing the pattern · writing the code · edge cases' },
        { label: 'If you stalled on choosing the pattern → the plan is right as it is. If you stalled on writing code → add 30 min of typing practice to weeks 1–2.' },
      ] },
      { day: 2, text: 'Build the toolkit: write all six JavaScript templates in the W0 · Toolkit section.', kind: 'template', link: { tab: 'dsa', section: 'toolkit' } },
      { day: 3, text: 'Understand the tracker — it is built into this app.', kind: 'admin', items: [
        { label: 'Mastered checkbox = pass 1', sub: 'tick it in the DSA sidebar when a problem is solved optimally', link: { tab: 'dsa' } },
        { label: '"Due for revision" = passes 2 and 3', sub: 'a mastered problem comes back after 7, then 14, then 30 days — Today shows it when due' },
        { label: 'The plan checkboxes are the calendar', sub: 'tick a day\'s tasks and the ready date moves', link: { tab: 'plan' } },
      ] },
      { day: 4, text: 'Rewrite the resume in XYZ form: "Accomplished X, as measured by Y, by doing Z." (in your resume doc)', items: [
        { label: 'Lead with "payment systems", not "frontend"', sub: 'Collections, Payouts, Connected Banking, BBPS are systems' },
        { label: 'Make the Socket.IO dispute chat a full-stack bullet', sub: 'it has a server, connection state and rooms — say so' },
        { label: 'Make Workzen carry the backend story', sub: 'job pipeline, webhooks, multi-tenant isolation, external API' },
        { label: 'Every bullet gets a number', sub: '30%, 35%, 5,000 MAU — you already have them' },
      ] },
      { day: 5, text: 'Map the referral network: 25 named people in the referral map (Plan tab). Do not contact anyone yet.', link: { tab: 'plan', id: 'outreach' }, items: [
        { label: 'College seniors now at Google' }, { label: 'Ex-colleagues who moved' }, { label: 'Maintainers of repos you have contributed to' }, { label: 'GDG Bangalore regulars' }, { label: 'Google engineers active on LinkedIn or X' },
      ] },
      { day: 6, text: 'Finish the referral map. Read the roadmap §3 (six hard truths) once, properly.', link: { tab: 'plan', id: 'outreach' }, items: [
        { label: 'Do not apply before week 20 — a rejection means a 6–12 month cooldown' },
        { label: 'Volume without retention is wasted — the three-pass rule is the plan' },
        { label: 'Practise out loud from week 1, even alone' },
      ] },
    ] },
  { week: 1, phase: 'P1', theme: 'Arrays, two pointers, prefix sums', detail: 'In-place manipulation, partitioning, sorted-array pairs.', sections: ['arrays'] },
  { week: 2, phase: 'P1', theme: 'Sliding window', detail: 'Fixed and variable size. The "longest/shortest such that" family.', sections: ['sliding-window'] },
  { week: 3, phase: 'P1', theme: 'Hashing, frequency maps, strings', detail: 'Anagrams, grouping, substring problems. Very high yield.', sections: ['hashing'] },
  { week: 4, phase: 'P1', theme: 'Binary search', detail: 'Classic, on rotated arrays, and — most importantly — on the answer space.', sections: ['binary-search'] },
  { week: 5, phase: 'P1', theme: 'Stacks, monotonic stack, queues', detail: 'Next-greater, histograms, parsing with a stack.', sections: ['stacks'] },
  { week: 6, phase: 'P1', theme: 'Linked lists, fast & slow pointers', detail: 'Reversal, cycles, merge, reorder.', sections: ['linked-list'] },
  { week: 7, phase: 'P1', theme: 'Heaps & top-K', detail: 'Your MinHeap earns its keep. K-way merge, streaming median, scheduling.', sections: ['heaps'] },
  { week: 8, phase: 'P1', theme: 'Deload & consolidate', detail: 'No new patterns. Re-solve everything flagged. First mock interview.', sections: [], maintenance: true,
    specials: [{ day: 5, text: 'First mock interview — one 45-minute coding round.', kind: 'mock', link: { tab: 'mocks', kind: 'coding' } }, { day: 6, text: 'Gate 1 check: three unseen mediums from patterns 1–7 in under 30 minutes each, on different days.' }] },
  { week: 9, phase: 'P2', theme: 'Binary trees', detail: 'All traversals recursive and iterative, depth, path sums, diameter.', sections: ['trees'] },
  { week: 10, phase: 'P2', theme: 'BSTs & tree construction', detail: 'Validation, LCA, serialise/deserialise, build from traversals.', sections: ['bst'] },
  { week: 11, phase: 'P2', theme: 'Backtracking', detail: 'Subsets, permutations, combinations, N-queens, word search, sudoku.', sections: ['backtracking'] },
  { week: 12, phase: 'P2', theme: 'Graphs I — BFS/DFS', detail: 'Grids and adjacency lists, components, multi-source BFS. Weekly mocks start now.', sections: ['graphs-1'],
    specials: [{ day: 5, text: 'Weekly mock starts: one 45-minute coding round.', kind: 'mock', link: { tab: 'mocks', kind: 'coding' } }] },
  { week: 13, phase: 'P2', theme: 'Graphs II', detail: 'Topological sort, Union-Find, bipartite checking, Dijkstra.', sections: ['graphs-2'],
    specials: [{ day: 5, text: 'Weekly mock: one 45-minute coding round.', kind: 'mock', link: { tab: 'mocks', kind: 'coding' } }] },
  { week: 14, phase: 'P2', theme: 'DP I — one dimension', detail: 'Climbing stairs, house robber, coin change, LIS, word break. This is where people quit. It clicks. Keep going.', sections: ['dp-1'],
    specials: [{ day: 5, text: 'Weekly mock: one 45-minute coding round.', kind: 'mock', link: { tab: 'mocks', kind: 'coding' } }] },
  { week: 15, phase: 'P2', theme: 'DP II — two dimensions', detail: 'Grid paths, edit distance, LCS, knapsack, interval DP.', sections: ['dp-2'],
    specials: [{ day: 5, text: 'Weekly mock: one 45-minute coding round.', kind: 'mock', link: { tab: 'mocks', kind: 'coding' } }] },
  { week: 16, phase: 'P2', theme: 'Tries, bit manipulation, intervals — then deload', detail: 'Full mock loop #1: 4 rounds back to back.', sections: ['tries-bits-intervals'],
    specials: [{ day: 5, text: 'Full mock loop #1 — 3 coding rounds + 1 behavioural, back to back.', kind: 'mock', link: { tab: 'mocks', kind: 'coding' } }, { day: 6, text: 'Gate 2 check: any unseen medium < 30 min; any graph < 25 min; a 2-D DP without looking up the recurrence.' }] },
  { week: 17, phase: 'P3', theme: 'System design fundamentals', detail: 'Every concept in §7. Estimation drills until the arithmetic is instant.', sections: [], maintenance: true,
    specials: [
      { day: 0, text: 'System design: load balancing, caching & eviction, CDN — write one page of notes each.' },
      { day: 1, text: 'System design: SQL vs NoSQL, sharding, consistent hashing, replication.' },
      { day: 2, text: 'System design: CAP & consistency models, message queues, back-pressure.' },
      { day: 3, text: 'System design: rate limiting, idempotency, indexing, monitoring & SLOs.' },
      { day: 4, text: 'Estimation drills: QPS, storage/year, bandwidth for five random scenarios until the arithmetic is instant (Design tab → Estimate).', kind: 'design', link: { tab: 'design', id: 'estimate' } },
      { day: 5, text: 'Drive two design prompts end-to-end on the whiteboard, 45 minutes each.', kind: 'design', link: { tab: 'design', id: 'url-shortener' } },
      { day: 6, text: 'Write up one design properly in the design doc panel.', kind: 'design', link: { tab: 'design', id: 'rate-limiter' } },
    ] },
  { week: 18, phase: 'P3', theme: 'Six classic backend designs', detail: 'Written up properly. Referral outreach begins — first 8 asks.', sections: [], maintenance: true,
    specials: [
      { day: 0, text: 'Design: URL shortener — full 45-minute run + written design doc.', kind: 'design', link: { tab: 'design', id: 'url-shortener' } },
      { day: 1, text: 'Design: Rate limiter — full run + doc. Referral asks 1–2.', kind: 'design', link: { tab: 'design', id: 'rate-limiter' } },
      { day: 2, text: 'Design: News feed — full run + doc. Referral asks 3–4.', kind: 'design', link: { tab: 'design', id: 'news-feed' } },
      { day: 3, text: 'Design: Chat / messaging — full run + doc. Referral asks 5–6.', kind: 'design', link: { tab: 'design', id: 'chat' } },
      { day: 4, text: 'Design: Notification system — full run + doc. Referral asks 7–8.', kind: 'design', link: { tab: 'design', id: 'notifications' } },
      { day: 5, text: 'Design: Web crawler — full run + doc. Then one design mock.', kind: 'design', link: { tab: 'design', id: 'web-crawler' } },
      { day: 6, text: 'Review all six docs. Send any referral asks still pending and log the replies.', link: { tab: 'plan', id: 'outreach' } },
    ] },
  { week: 19, phase: 'P3', theme: 'Frontend system design + vanilla-JS drills', detail: 'Three frontend design prompts, the W19 drills section in the editor (debounce, throttle, promises, emitter…), accessibility weekend. 8 more referral asks.', sections: ['frontend-drills'], maintenance: true,
    specials: [
      { day: 0, text: 'Frontend design: typeahead component — full run + doc. Referral asks 9–10.', kind: 'design', link: { tab: 'design', id: 'fe-typeahead' } },
      { day: 1, text: 'Frontend design: infinite feed — full run + doc. Referral asks 11–12.', kind: 'design', link: { tab: 'design', id: 'fe-feed' } },
      { day: 2, text: 'Frontend design: chat client — full run + doc. Referral asks 13–14.', kind: 'design', link: { tab: 'design', id: 'fe-chat' } },
      { day: 3, text: 'Component drills in a scratch HTML file: modal with focus trap, accordion, toast queue, virtualised list.' },
      { day: 4, text: 'Referral asks 15–16. Log every reply in the referral map.', link: { tab: 'plan', id: 'outreach' } },
      { day: 5, text: 'Accessibility weekend: semantic HTML, ARIA, focus management, keyboard-only flows. Rebuild one component accessibly.' },
      { day: 6, text: 'Accessibility weekend: audit your own projects with a screen reader. Fix three things.' },
    ] },
  { week: 20, phase: 'P3', theme: 'Behavioural + applications go out', detail: 'Write and rehearse 12 STAR stories to two minutes each. Applications go out.', sections: [], maintenance: true,
    specials: [
      { day: 0, text: 'Write STAR stories 1–4: hardest problem, ambiguous requirements, disagreement, something that failed.', kind: 'behavioural', link: { tab: 'behavioural', id: 'hardest' } },
      { day: 1, text: 'Write STAR stories 5–8: beyond your role, mentoring, difficult feedback, decision without data.', kind: 'behavioural', link: { tab: 'behavioural', id: 'beyond' } },
      { day: 2, text: 'Write STAR stories 9–12: influence without authority, competing priorities, most proud of, why Google.', kind: 'behavioural', link: { tab: 'behavioural', id: 'influence' } },
      { day: 3, text: 'Rehearse all 12 to two minutes each, timed. Record yourself. Listen back.', kind: 'behavioural', link: { tab: 'behavioural' } },
      { day: 4, text: 'APPLICATIONS GO OUT: Software Engineer II reqs (Payments first). Referral + direct application in the same week — log each one.', link: { tab: 'plan', id: 'outreach' } },
      { day: 5, text: 'Behavioural mock: 4 questions with the AI interviewer. Start interviewing elsewhere — parallel funnel.', kind: 'mock', link: { tab: 'mocks', kind: 'behavioural' } },
      { day: 6, text: 'Fix the two weakest stories. Confirm every application and referral is logged in the tracker.', kind: 'behavioural', link: { tab: 'plan', id: 'outreach' } },
    ] },
  { week: 21, phase: 'P3', theme: 'Google flavour', detail: 'Open-ended problems, layered follow-ups, design-and-implement hybrids, hard problems.', sections: ['google-flavour'] },
  { week: 22, phase: 'P3', theme: 'Full mock loop #2 — then deload', detail: '3 coding + 1 design + 1 behavioural, with real humans.', sections: [], maintenance: true,
    specials: [
      { day: 4, text: 'Full mock loop #2, part 1: 2 coding rounds with a real person if you can, else the AI interviewer.', kind: 'mock', link: { tab: 'mocks', kind: 'coding' } },
      { day: 5, text: 'Full mock loop #2, part 2: 1 coding + 1 system design + 1 behavioural.', kind: 'mock', link: { tab: 'mocks', kind: 'design' } },
      { day: 6, text: 'Gate 3 check: cold design prompt driven for 45 min; 12 stories at two minutes without notes; applications in and ≥3 referrals in flight.' },
    ] },
  { week: 23, phase: 'P4', theme: 'Two timed problems daily', detail: '45 min each, out loud, in a plain text editor. Two mocks this week.', sections: [], maintenance: true,
    specials: [{ day: 2, text: 'Mock #1 this week — coding.', kind: 'mock', link: { tab: 'mocks', kind: 'coding' } }, { day: 5, text: 'Mock #2 this week — coding or design.', kind: 'mock', link: { tab: 'mocks', kind: 'design' } }] },
  { week: 24, phase: 'P4', theme: 'Google-tagged problems', detail: 'From the last six months. Full spaced-repetition sweep of everything flagged.', sections: ['google-flavour'], maintenance: true,
    specials: [{ day: 5, text: 'Mock: one coding round.', kind: 'mock', link: { tab: 'mocks', kind: 'coding' } }] },
  { week: 25, phase: 'P4', theme: 'Full mock loop #3', detail: 'Real interviews elsewhere as live reps. Refine the behavioural stories.', sections: [], maintenance: true,
    specials: [{ day: 4, text: 'Full mock loop #3, part 1: 2 coding rounds.', kind: 'mock', link: { tab: 'mocks', kind: 'coding' } }, { day: 5, text: 'Full mock loop #3, part 2: 1 coding + 1 design + 1 behavioural.', kind: 'mock', link: { tab: 'mocks', kind: 'behavioural' } }, { day: 6, text: 'Refine the behavioural stories from the loop feedback.', kind: 'behavioural', link: { tab: 'behavioural' } }] },
  { week: 26, phase: 'P4', theme: 'Taper', detail: 'One problem a day, reread notes, sleep properly. You are ready.', sections: [], maintenance: true,
    specials: [
      { day: 5, text: 'Loop-day checklist (roadmap §6) — run through it the night before every onsite.', items: [
        { label: 'Sleep 8 hours; no new material after 6 pm' },
        { label: 'Morning: two easy warm-ups from the toolkit, out loud, 10 minutes each', link: { tab: 'dsa', section: 'toolkit' } },
        { label: 'Reread your notes for the 16 patterns — trigger lines only, not solutions', link: { tab: 'dsa' } },
        { label: 'Reread the 12 STAR stories once; say the two weakest aloud', link: { tab: 'behavioural' } },
        { label: 'Three questions ready for each interviewer (team, on-call, how L3s grow)' },
        { label: 'Environment: camera, mic, quiet room, water, shared doc / editor tested' },
      ] },
      { day: 6, text: 'Gate 4 check: four consecutive mock rounds at a hire-equivalent standard, judged by someone who is not you. Reread roadmap §6.' },
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

// ── Problem allocation ──────────────────────────────
// Deterministic and state-free: the same start date always yields the
// same day → problems map, so Today never shuffles under you. Live
// state only decorates it (✓ when mastered) — see lib/google/today.ts.
type Slot = { p: GoogleProblem; s: GoogleSection };
const diffLabel = (d: GoogleProblem['difficulty']) => d === 'easy' ? 'E' : d === 'medium' ? 'M' : 'H';

class Allocator {
  private queues = new Map<string, Slot[]>();
  private backlog: Slot[] = [];
  private assigned: Slot[] = [];
  private sweep = 0;

  /** `exclude` = problems already placed elsewhere (the week-0 diagnostic). */
  constructor(exclude: Set<string>) {
    for (const s of GOOGLE_SECTIONS) if (s.id !== 'toolkit') this.queues.set(s.id, s.problems.filter(p => !exclude.has(p.name)).map(p => ({ p, s })));
  }

  /** Problems still unscheduled anywhere (for the coverage self-check). */
  remaining(): number {
    let n = this.backlog.length;
    for (const q of this.queues.values()) n += q.length;
    return n;
  }

  /**
   * Take n problems: this week's section first, then the backlog of earlier
   * sections, then — only when nothing new is left — re-solves of scheduled ones.
   */
  take(sectionId: string | undefined, n: number, extra: string, prefer?: string[]): TaskItem[] {
    const out: TaskItem[] = [];
    const q = sectionId ? this.queues.get(sectionId) : undefined;
    while (out.length < n && q && q.length) out.push(this.fresh(q.shift()!, false, extra));
    while (out.length < n && this.backlog.length) out.push(this.fresh(this.backlog.shift()!, true, extra));
    while (out.length < n && this.assigned.length) out.push(this.again(prefer, extra));
    return out;
  }

  /** End of a pattern week: whatever the section could not fit goes to the backlog. */
  endWeek(sectionIds: string[]) {
    for (const id of sectionIds) { const q = this.queues.get(id); if (q) this.backlog.push(...q.splice(0)); }
  }

  private fresh(slot: Slot, fromBacklog: boolean, extra: string): TaskItem {
    this.assigned.push(slot);
    const { p, s } = slot;
    const sub = [diffLabel(p.difficulty), fromBacklog ? s.title : (p.note ? p.note.split('. ')[0] : ''), extra].filter(Boolean).join(' · ');
    return { label: p.name, sub, link: { tab: 'dsa', section: s.id, problem: p.name } };
  }

  private again(prefer: string[] | undefined, extra: string): TaskItem {
    const pool = prefer?.length ? this.assigned.filter(x => prefer.includes(x.s.id)) : this.assigned;
    const src = pool.length ? pool : this.assigned;
    const { p, s } = src[this.sweep++ % src.length];
    return { label: p.name, sub: ['re-solve', s.title, extra].filter(Boolean).join(' · '), link: { tab: 'dsa', section: s.id, problem: p.name }, again: true };
  }
}

// ── Task generation ─────────────────────────────────
const pad2 = (n: number) => String(n).padStart(2, '0');
/** Timed-set problems open as a coding round in the Mocks tab (timer, interviewer, no coach). */
const asTimedRounds = (items: TaskItem[]): TaskItem[] => items.map(i => (i.link?.problem ? { ...i, link: { tab: 'mocks', kind: 'coding', problem: i.link.problem } } : i));

/** Weeks 1–26. dayInWeek: 0 Mon … 4 Fri, 5 Sat, 6 Sun. */
function weekTemplate(week: PlanWeek, weekIdx: number, dayInWeek: number, alloc: Allocator): PlanTask[] {
  const id = (k: string) => `w${pad2(weekIdx)}d${dayInWeek}-${k}`;
  const sec = week.sections[0];
  const base = { day: 0, week: weekIdx };
  const tasks: PlanTask[] = [];

  if (dayInWeek === 5) {
    const items = asTimedRounds(alloc.take(sec, 4, '35 min', week.sections));
    tasks.push({ ...base, id: id('timed'), kind: 'timed', count: 4, sectionId: sec, items, text: 'Timed set — 4 problems, 35 minutes each, out loud, no help: each pill opens a timed, graded round. Then review every one properly.', link: { tab: 'mocks', kind: 'coding' } });
    tasks.push({ ...base, id: id('review'), kind: 'drill', text: "Post-mortem the set: for each miss, write the pattern trigger you failed to fire in that problem's notes." });
  } else if (dayInWeek === 6) {
    const items = alloc.take(sec, 2, '', week.sections);
    const fromWeek = !!sec && items.some(i => i.link?.section === sec && !i.again);
    tasks.push({ ...base, id: id('drill'), kind: 'drill', count: 2, sectionId: sec, items, text: fromWeek ? 'Finish the pattern — 2 more problems, then redo anything you flagged this week.' : 'Weak-area drilling — 2 problems, then redo anything you flagged this week.', link: { tab: 'dsa', section: sec } });
    tasks.push({ ...base, id: id('tmpl'), kind: 'template', text: 'Rewrite one of the six JavaScript templates from memory, blank file.' });
    tasks.push({ ...base, id: id('admin'), kind: 'admin', text: 'Clear the Due-for-revision list, read next week\'s theme, tick the week off.', link: { tab: 'plan' } });
  } else if (week.maintenance) {
    if (weekIdx === 23) {
      const items = asTimedRounds(alloc.take(sec, 2, '45 min', week.sections));
      tasks.push({ ...base, id: id('timed'), kind: 'timed', count: 2, items, text: 'Two timed problems — 45 minutes each, out loud, as graded rounds.', link: { tab: 'mocks', kind: 'coding' } });
    } else if (weekIdx === 26) {
      const items = alloc.take(sec, 1, '', week.sections);
      tasks.push({ ...base, id: id('solve'), kind: 'solve', count: 1, items, text: 'One problem, out loud. Then reread your notes for the pattern it used.', link: { tab: 'dsa' } });
    } else {
      const items = alloc.take(sec, 2, '', week.sections);
      const fromWeek = !!sec && items.some(i => i.link?.section === sec && !i.again);
      const fresh = items.some(i => !i.again);
      tasks.push({ ...base, id: id('solve'), kind: 'solve', count: 2, sectionId: fromWeek ? sec : undefined, items, text: fromWeek ? `Solve 2 from "${week.theme}" in the editor — no libraries, out loud.` : fresh ? 'Backlog — 2 problems from earlier patterns that did not fit their week.' : 'Re-solve 2 from earlier patterns, from a blank editor.', link: { tab: 'dsa', section: fromWeek ? sec : undefined } });
    }
    tasks.push({ ...base, id: id('sr'), kind: 'revise', count: 3, text: 'Spaced repetition — clear what is due today (90 minutes for the whole session).', link: { tab: 'dsa' } });
  } else {
    const first = dayInWeek <= 1;
    tasks.push({ ...base, id: id('theory'), kind: 'theory', sectionId: sec, text: first ? `Theory (1 hr) — ${week.theme}: pattern notes, trigger condition, the template it needs.` : 'Recap (15 min) — say the trigger condition and write the template from memory before the first problem.', link: { tab: 'dsa', section: sec } });
    const items = alloc.take(sec, 2, '', week.sections);
    tasks.push({ ...base, id: id('solve'), kind: 'solve', count: 2, sectionId: sec, items, text: `Solve 2 new problems from "${week.theme}", always out loud.`, link: { tab: 'dsa', section: sec } });
    tasks.push({ ...base, id: id('revisit'), kind: 'revise', count: 1, text: 'Spaced-repetition revisit — 1 problem due today, from a blank editor, no notes.', link: { tab: 'dsa' } });
  }
  return tasks;
}

/** Week 0 diagnostic — fixed picks so the four problems are the same every time. */
function diagnosticItems(): TaskItem[] {
  const by = (id: string) => GOOGLE_SECTIONS.find(s => s.id === id)!;
  const first = (s: GoogleSection, d: GoogleProblem['difficulty']) => s.problems.find(p => p.difficulty === d)!;
  const picks: Slot[] = [
    { s: by('arrays'), p: first(by('arrays'), 'easy') },
    { s: by('hashing'), p: first(by('hashing'), 'easy') },
    { s: by('sliding-window'), p: first(by('sliding-window'), 'medium') },
    { s: by('arrays'), p: first(by('arrays'), 'medium') },
  ];
  return picks.map(({ p, s }) => ({ label: p.name, sub: `${diffLabel(p.difficulty)} · ${s.title} · taught in W${s.week}`, link: { tab: 'dsa', section: s.id, problem: p.name } }));
}

/** Days in week 0 for a given start: the 7 setup days, then buffer days up to the first Monday. */
export function week0Length(planStartISO: string): number {
  const afterSetup = addDays(parseISODate(planStartISO), 7);
  return 7 + ((8 - afterSetup.getDay()) % 7);
}

/** Build the full plan-day queue for a given start date. Deterministic; cheap to recompute. */
export function buildPlan(planStartISO: string): PlanDay[] {
  const start = parseISODate(planStartISO);
  const w0 = week0Length(planStartISO);
  const total = w0 + (PLAN_WEEKS_TOTAL - 1) * 7;
  const diagnostic = diagnosticItems();
  const alloc = new Allocator(new Set(diagnostic.map(i => i.label)));
  const days: PlanDay[] = [];

  for (let i = 0; i < total; i++) {
    const weekIdx = i < w0 ? 0 : Math.floor((i - w0) / 7) + 1;
    const dayInWeek = weekIdx === 0 ? i : (i - w0) % 7;
    const week = PLAN_WEEKS[weekIdx];
    const date = addDays(start, i);
    let tasks: PlanTask[] = [];

    if (weekIdx === 0) {
      if (dayInWeek === 7) {
        tasks.push({ id: `w00d7-gate`, day: i, week: 0, kind: 'template', text: 'Gate 0 check — all six templates from memory, blank editor, 30-minute timer. Pass → tick Gate 0 in the sidebar.', link: { tab: 'dsa', section: 'toolkit' } });
      } else if (dayInWeek > 7) {
        tasks.push({ id: `w00d${dayInWeek}-buffer`, day: i, week: 0, kind: 'rest', text: 'Buffer day — redo any diagnostic problem you stalled on, or rest. Week 1 starts Monday.' });
      }
    } else {
      tasks = weekTemplate(week, weekIdx, dayInWeek, alloc).map(t => ({ ...t, day: i }));
    }

    for (const sp of week.specials ?? []) {
      if (sp.day !== dayInWeek) continue;
      const kind: PlanTask['kind'] = sp.kind ??
        (/referral|asks/i.test(sp.text) ? 'outreach' :
        /APPLICATIONS/.test(sp.text) ? 'apply' : 'special');
      const items = sp.items ?? (weekIdx === 0 && kind === 'timed' ? diagnostic : undefined);
      tasks.push({ id: `w${pad2(weekIdx)}d${dayInWeek}-sp${tasks.length}`, day: i, week: weekIdx, kind, text: sp.text, link: sp.link, sectionId: sp.link?.section, count: kind === 'timed' ? 4 : undefined, items });
    }
    if (tasks.length === 0) {
      tasks.push({ id: `w${pad2(weekIdx)}d${dayInWeek}-rest`, day: i, week: weekIdx, kind: 'rest', text: 'Rest day — nothing scheduled. Sleep is part of the plan.' });
    }
    days.push({ day: i, week: weekIdx, date, tasks });
    if (weekIdx >= 1 && dayInWeek === 6 && week.sections.length) alloc.endWeek(week.sections);
  }

  if (process.env.NODE_ENV !== 'production' && alloc.remaining() > 0) {
    console.warn(`[google plan] ${alloc.remaining()} problems were never scheduled`);
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

/** True when a task is a fixed set of problems — the kind that mastery alone can complete. */
export function isProblemTask(t: PlanTask): boolean {
  return !!t.items && t.items.length > 0 && t.items.every(it => !!it.link?.problem && !it.again);
}

/**
 * Tick every problem task whose problems are all mastered (and the week-0
 * toolkit task once all six templates are). Mastering ahead of the calendar
 * therefore moves the ready date on its own. Returns true when anything changed.
 */
export function autoTickPlan(days: PlanDay[], state: GoogleState): boolean {
  const mastered = new Set(state.mastered);
  const now = new Date().toISOString();
  let changed = false;
  for (const d of days) {
    for (const t of d.tasks) {
      if (state.planDone[t.id]) continue;
      const ok = isProblemTask(t)
        ? t.items!.every(it => mastered.has(it.link!.problem!))
        : t.kind === 'template' && t.week === 0 && TOOLKIT_NAMES.every(n => mastered.has(n));
      if (ok) { state.planDone[t.id] = now; changed = true; }
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
  /** completedDays − calendarDay: + ahead, − behind */
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
  const daysLeft = totalDays - completedDays;
  const week20 = days.find(d => d.week === 20)?.date ?? addDays(start, 20 * 7);
  return {
    totalDays, completedDays, totalTasks, doneTasks, currentDay, calendarDay,
    delta: completedDays - Math.min(Math.max(calendarDay, 0), totalDays),
    daysLeft,
    projectedReady: addDays(today, daysLeft),
    scheduledReady: addDays(start, totalDays),
    applyWindowOpens: week20,
    started: calendarDay >= 0,
    finished: completedDays >= totalDays,
  };
}
