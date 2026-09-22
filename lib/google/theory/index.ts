// ======================================================
// INTERVIEW PREP — pattern notes (the theory)
// One markdown document per DSA section: the idea, the trigger
// condition, the code shape in JavaScript, worked examples with
// diagrams, this week's problems mapped to sub-patterns, and a
// self-check. Read on the section's Monday, then rewritten by the
// user in their own words (edits live in GoogleState.theory).
//
// Authoring: template literals — inline code is \`, fences are ~~~
// (so the source stays readable), and ${ must be written \${.
// Never name the target company: say "the company".
// ======================================================

import type { GoogleSection } from '../types';
import { TOOLKIT } from './toolkit';
import { ARRAYS } from './arrays';
import { SLIDING_WINDOW } from './sliding-window';
import { HASHING } from './hashing';
import { BINARY_SEARCH } from './binary-search';
import { STACKS } from './stacks';
import { LINKED_LIST } from './linked-list';
import { HEAPS } from './heaps';
import { TREES } from './trees';
import { BST } from './bst';
import { BACKTRACKING } from './backtracking';
import { GRAPHS_1 } from './graphs-1';
import { GRAPHS_2 } from './graphs-2';
import { DP_1 } from './dp-1';
import { DP_2 } from './dp-2';
import { TRIES_BITS_INTERVALS } from './tries-bits-intervals';
import { FRONTEND_DRILLS } from './frontend-drills';
import { COMPANY_FLAVOUR } from './company-flavour';

export const THEORY: Record<string, string> = {
  'toolkit': TOOLKIT,
  'arrays': ARRAYS,
  'sliding-window': SLIDING_WINDOW,
  'hashing': HASHING,
  'binary-search': BINARY_SEARCH,
  'stacks': STACKS,
  'linked-list': LINKED_LIST,
  'heaps': HEAPS,
  'trees': TREES,
  'bst': BST,
  'backtracking': BACKTRACKING,
  'graphs-1': GRAPHS_1,
  'graphs-2': GRAPHS_2,
  'dp-1': DP_1,
  'dp-2': DP_2,
  'tries-bits-intervals': TRIES_BITS_INTERVALS,
  'frontend-drills': FRONTEND_DRILLS,
  'google-flavour': COMPANY_FLAVOUR,
};

/** The built-in notes for a section — a skeleton when none were written. */
export function theoryFor(section: GoogleSection): string {
  return THEORY[section.id] ?? `# ${section.title}\n\n> **Reach for it when:** ${section.trigger}\n\n## The idea\n\n_Write the core idea in one breath._\n\n## Code shape\n\n~~~js\n// the loop you type from memory\n~~~\n\n## My notes\n`;
}
