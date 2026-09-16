// ======================================================
// GOOGLE PREP — turn a plan task into concrete items
// Problem tasks arrive with their items already assigned by
// buildPlan (every problem sits on exactly one day); here they
// are decorated with live state (✓ when mastered). Tasks that
// depend on state — revision due, designs, stories, mocks — are
// resolved on the spot.
// ======================================================

import type { GoogleState, PlanTask, TaskItem } from './types';
import { GOOGLE_PROBLEMS, TOOLKIT_NAMES, sectionById } from './problems';
import { getDueProblems } from '@/lib/revision';
import { DESIGN_PROMPT_BY_ID } from './system-design';
import { STORY_SEEDS } from './behavioural';
import { PLAN_WEEKS } from './plan';

const TEMPLATES = ['MinHeap / MaxHeap with a comparator', 'UnionFind with path compression + union by rank', 'TrieNode + insert / search / startsWith', 'O(1) queue (array + head index — never .shift())', 'Memoisation helper on a Map with string keys', 'Binary search — lowerBound and upperBound'];
const SECTION_TEMPLATE: Record<string, string> = {
  'binary-search': TEMPLATES[5], heaps: TEMPLATES[0], 'graphs-1': TEMPLATES[3], 'graphs-2': TEMPLATES[1], 'dp-1': TEMPLATES[4], 'dp-2': TEMPLATES[4], 'tries-bits-intervals': TEMPLATES[2], trees: TEMPLATES[3], bst: TEMPLATES[4], backtracking: TEMPLATES[4], hashing: TEMPLATES[4], stacks: TEMPLATES[3], 'sliding-window': TEMPLATES[4], arrays: TEMPLATES[5], 'linked-list': TEMPLATES[3], 'google-flavour': TEMPLATES[0],
};

export function resolveTaskItems(task: PlanTask, state: GoogleState): TaskItem[] {
  const mastered = new Set(state.mastered);

  if (task.items) {
    return task.items.map(it => (it.link?.problem && !it.again && it.done === undefined) ? { ...it, done: mastered.has(it.link.problem) } : it);
  }

  switch (task.kind) {
    case 'theory': {
      const sec = task.sectionId ? sectionById(task.sectionId) : undefined;
      if (!sec) return [];
      return [
        { label: `Pattern: ${sec.title}`, sub: `Reach for it when: ${sec.trigger}`, link: { tab: 'dsa', section: sec.id } },
        { label: `Template it leans on: ${SECTION_TEMPLATE[sec.id] ?? TEMPLATES[4]}`, sub: 'Write it once from memory before the first problem' },
      ];
    }
    case 'revise': {
      const due = getDueProblems(state.lastReviewDate, state.reviewCount, state.mastered).slice(0, task.count ?? 1);
      if (due.length === 0) return [{ label: 'Nothing due today — the ladder is clear.', sub: 'Mastered problems come back at 7 → 14 → 30 days' }];
      return due.map(d => ({ label: d.problem, sub: d.overdueDays > 0 ? `${d.overdueDays} day${d.overdueDays === 1 ? '' : 's'} overdue` : 'due today', link: { tab: 'dsa', problem: d.problem } }));
    }
    case 'template': {
      const toItem = (i: number, sub: string): TaskItem => ({ label: TOOLKIT_NAMES[i], sub, link: { tab: 'dsa', section: 'toolkit', problem: TOOLKIT_NAMES[i] }, done: mastered.has(TOOLKIT_NAMES[i]) });
      if (task.week === 0) return TOOLKIT_NAMES.map((_, i) => toItem(i, GOOGLE_PROBLEMS[TOOLKIT_NAMES[i]]?.note?.split('.')[0] ?? ''));
      const i = task.week % TOOLKIT_NAMES.length;
      return [toItem(i, 'Blank editor, no notes, under 5 minutes — then compare with your saved version')];
    }
    case 'design': {
      if (task.link?.id === 'estimate') return [{ label: 'Estimation drill — five scenarios, all four numbers within ±25%', sub: 'Design tab → Estimate', link: { tab: 'design', id: 'estimate' } }];
      const dp = task.link?.id ? DESIGN_PROMPT_BY_ID[task.link.id] : undefined;
      if (!dp) return [];
      const practised = (state.designs[dp.id] && state.designs[dp.id] !== '[]') || (state.designDocs[dp.id] ?? '').trim();
      return [{ label: dp.title, sub: `“${dp.prompt}”`, link: { tab: 'design', id: dp.id }, done: !!practised }];
    }
    case 'behavioural': {
      const id = task.link?.id;
      if (!id) return [];
      const idx = STORY_SEEDS.findIndex(s => s.id === id);
      const group = STORY_SEEDS.slice(idx, idx + 4);
      return group.map(s => {
        const st = state.stories[s.id];
        return { label: s.title, sub: s.drawFrom, link: { tab: 'behavioural', id: s.id }, done: !!(st && st.situation && st.action && st.result) };
      });
    }
    case 'mock': {
      const kind = task.link?.kind ?? 'coding';
      const last = [...state.mocks].reverse().find(m => m.kind === kind);
      return [{ label: `Start a ${kind} round`, sub: last ? `Last ${kind}: ${last.score?.toFixed(1) ?? '—'} · ${last.verdict}` : 'No previous round', link: { tab: 'mocks', kind } }];
    }
    default:
      return [];
  }
}

/** Human line for a week: "W3 · Hashing, frequency maps, strings". */
export function weekLabel(week: number): string {
  const w = PLAN_WEEKS[week];
  return w ? `W${week} · ${w.theme}` : `W${week}`;
}
