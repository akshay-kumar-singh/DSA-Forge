export const BACKTRACKING = `# Backtracking

> **Reach for it when:** "generate **all** subsets / permutations / combinations / partitions", "place N things so that no two conflict", "is there *any* assignment that works" — and the input is small (n ≤ ~20) because the answer is exponential.
>
> **Say out loud:** "It's a search tree: choose → recurse → un-choose. The pruning is what makes it fast." Then name the *choice* at each level and the *constraint* that prunes.

## 1. The idea in one breath

Backtracking is DFS over a tree of **partial solutions**. At each node you extend the partial solution by one *choice*; if the extension breaks a constraint you stop (prune); if it is complete you record it; otherwise you go deeper. After the recursive call returns, you **undo** the choice so the shared \`path\` is clean for the next sibling. The entire pattern is one function:

~~~js
function backtrack(path, choicesFrom) {
  if (isComplete(path)) { record([...path]); return; }         // copy — path is shared
  for (const c of choices(choicesFrom)) {
    if (!allowed(c, path)) continue;                            // prune
    path.push(c);                                               // choose
    backtrack(path, nextChoicesAfter(c));                       // explore
    path.pop();                                                 // un-choose
  }
}
~~~

The four things that differ between problems: **(1)** what a choice is, **(2)** where the next choices start (\`i + 1\` for combinations, \`0\` with a \`used\` set for permutations), **(3)** how duplicates are skipped, **(4)** what prunes.

## 2. Sub-pattern A — Subsets & combinations (choose forward, \`start\` index)

~~~text
Subsets of [1, 2, 3] — the search tree (record at EVERY node)

                    []
          /          |         \\
        [1]         [2]        [3]
       /   \\         |
   [1,2]  [1,3]    [2,3]
     |
  [1,2,3]
~~~

~~~js
function subsets(nums) {
  const out = [], path = [];
  const go = start => {
    out.push([...path]);
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]); go(i + 1); path.pop();
    }
  };
  go(0);
  return out;
}
~~~

- **Combinations (n choose k):** record when \`path.length === k\`; prune \`i\` so enough elements remain: \`i <= n − (k − path.length) + 1\`.
- **Combination Sum (reuse allowed):** recurse with \`go(i, remaining − c)\` — *same* \`i\`, not \`i + 1\`; sort and \`break\` when \`c > remaining\`.
- **Subsets II / Combination Sum II (duplicates in input):** sort, then **skip a value equal to the previous one at the same depth**: \`if (i > start && nums[i] === nums[i − 1]) continue;\`. That single line is what the interviewer is waiting for.

~~~text
[1, 2, 2]  sorted.  At depth with start=1: take 2 (i=1) → then 2 (i=2) fine.
                    back at start=1: i=2 is 2 again and i > start → skip  (would duplicate [1,2])
~~~

## 3. Sub-pattern B — Permutations (choose from all, \`used\` array)

~~~js
function permute(nums) {
  const out = [], path = [], used = Array(nums.length).fill(false);
  const go = () => {
    if (path.length === nums.length) { out.push([...path]); return; }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      used[i] = true; path.push(nums[i]);
      go();
      path.pop(); used[i] = false;
    }
  };
  go();
  return out;
}
// Permutations II: sort, and skip when nums[i] === nums[i-1] && !used[i-1]  (the earlier duplicate must be used first)
~~~

Alternative in-place version: swap \`nums[i]\` with \`nums[depth]\`, recurse, swap back. O(n·n!) output either way.

## 4. Sub-pattern C — Constraint placement (N-Queens, Sudoku)

The choice is "which column for this row" / "which digit for this cell"; the constraint check must be **O(1)** with sets, not a rescan.

~~~text
N-Queens n=4: row by row; a queen at (r, c) blocks column c, diagonal r-c, anti-diagonal r+c
. Q . .      cols={1}   diag={-1}   anti={1}
. . . Q      cols={1,3} diag={-1,-2} anti={1,4}
Q . . .
. . Q .
~~~

~~~js
function solveNQueens(n) {
  const out = [], cols = new Set(), d1 = new Set(), d2 = new Set(), place = [];
  const go = r => {
    if (r === n) { out.push(place.map(c => '.'.repeat(c) + 'Q' + '.'.repeat(n - c - 1))); return; }
    for (let c = 0; c < n; c++) {
      if (cols.has(c) || d1.has(r - c) || d2.has(r + c)) continue;
      cols.add(c); d1.add(r - c); d2.add(r + c); place.push(c);
      go(r + 1);
      place.pop(); cols.delete(c); d1.delete(r - c); d2.delete(r + c);
    }
  };
  go(0);
  return out;
}
~~~

**Sudoku Solver:** the same, with row/col/box sets. The pruning that matters: **pick the empty cell with the fewest candidates next** (most-constrained first) — it turns seconds into milliseconds; say it even if you implement the simple scan.

## 5. Sub-pattern D — Partitioning strings and numbers

**Trigger:** "split into palindromes", "valid IP addresses", "unique substrings", "add operators".

The choice is *where to cut next*: from \`start\`, try every end \`e\`; if \`s[start..e]\` is valid, recurse from \`e + 1\`.

~~~js
function partition(s) {                            // Palindrome Partitioning
  const out = [], path = [];
  const isPal = (l, r) => { while (l < r) if (s[l++] !== s[r--]) return false; return true; };
  const go = start => {
    if (start === s.length) { out.push([...path]); return; }
    for (let e = start; e < s.length; e++) {
      if (!isPal(start, e)) continue;
      path.push(s.slice(start, e + 1)); go(e + 1); path.pop();
    }
  };
  go(0);
  return out;
}
~~~

- **Restore IP Addresses:** exactly 4 parts, each 1–3 chars, ≤ 255, no leading zero — prune on remaining length (\`remainingParts ≤ remainingChars ≤ 3·remainingParts\`).
- **Expression Add Operators:** track \`value\` and \`last\` operand so \`*\` can undo: \`value − last + last·cur\`. Numbers with a leading zero are a single-digit only.
- **Split into Max Unique Substrings:** a Set of used pieces; prune when \`current + remaining chars ≤ best\`.

## 6. Sub-pattern E — Search on a grid / an implicit graph

**Word Search:** DFS from every cell; mark visited **in place** (\`board[r][c] = '#'\`), restore on the way back. Prune early with a letter-frequency check (the word needs more of some letter than the board has → false).

~~~js
function exist(board, word) {
  const R = board.length, C = board[0].length;
  const go = (r, c, k) => {
    if (k === word.length) return true;
    if (r < 0 || c < 0 || r >= R || c >= C || board[r][c] !== word[k]) return false;
    const ch = board[r][c]; board[r][c] = '#';
    const found = go(r + 1, c, k + 1) || go(r - 1, c, k + 1) || go(r, c + 1, k + 1) || go(r, c - 1, k + 1);
    board[r][c] = ch;
    return found;
  };
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (go(r, c, 0)) return true;
  return false;
}
~~~

**Android Unlock Patterns:** DFS over 9 keys with a "skip" table (1→3 must pass through 2); use symmetry — count from corner ×4, edge ×4, centre ×1. **Beautiful Arrangement:** permutations with the divisibility prune at each position. **Strobogrammatic Number II:** build from both ends inward with the pairs \`00 11 88 69 96\`; no leading zero unless n = 1. **Letter Combinations:** depth = digit index, choices = its letters. **Generate Parentheses:** choices are \`(\` if \`open < n\` and \`)\` if \`close < open\` — the pruning *is* the validity.

## 7. Sub-pattern F — Bucket filling (Matchsticks to Square, Partition to K Equal Subsets)

Choice = which bucket the next item goes in. Prunes that make it feasible: total divisible by k; **sort descending** (big items fail fast); skip a bucket equal to a previous empty/equal bucket (symmetry); stop when \`bucket + item > target\`.

## 8. This week's problems, mapped

| Problem | Sub-pattern | Choice · prune |
|---|---|---|
| Subsets | A | record every node |
| Subsets II | A | sort; skip equal at same depth |
| Permutations | B | \`used\` array |
| Permutations II | B | skip if equal and previous unused |
| Combinations | A | length k; remaining-count prune |
| Combination Sum | A | same \`i\` for reuse; sorted break |
| Combination Sum II | A | \`i + 1\`; skip equal at same depth |
| Letter Combinations of a Phone Number | E | digit → letters |
| Generate Parentheses | E | open < n, close < open |
| Word Search | E | mark in place, restore |
| Palindrome Partitioning | D | cut where palindrome |
| Restore IP Addresses | D | 4 parts, ≤ 255, length prune |
| Matchsticks to Square | F | sort desc, 4 buckets |
| Partition to K Equal Sum Subsets | F | k buckets, symmetry skip |
| Beautiful Arrangement | B | divisibility prune |
| Android Unlock Patterns | E | skip table + symmetry |
| Strobogrammatic Number II | D | build from both ends |
| Split a String Into the Max Number of Unique Substrings | D | Set + upper-bound prune |
| N-Queens | C | cols, r−c, r+c sets |
| Sudoku Solver | C | row/col/box sets; fewest candidates first |
| Expression Add Operators | D | value & last for \`*\` |

## 9. Where people fall down in the room

- Pushing \`path\` itself into the results (every result mutates later) — copy.
- Forgetting the un-choose line, or un-choosing in the wrong order (sets before pop, etc.).
- \`i + 1\` vs \`i\` (combinations vs reuse) and \`start\` vs \`0\` (combinations vs permutations) — say which and why.
- Duplicate handling without sorting first.
- Not stating the complexity: subsets O(n·2ⁿ), permutations O(n·n!), N-Queens ~O(n!) — and that this is fine because n is tiny.

**Follow-ups the company likes here:** "Just count, don't enumerate" (often DP instead), "Return only the k-th / lexicographically next" (maths, not search), "n is 10⁵" (then it's not backtracking — find the greedy/DP), "Iterative instead of recursive" (explicit stack of \`(state, nextChoice)\`).

## 10. Self-check

1. Write the generic backtrack skeleton and mark choose / explore / un-choose.
2. What is the duplicate-skip line for Subsets II, and why does it need sorting?
3. Permutations II: why \`!used[i − 1]\` in the skip condition?
4. N-Queens: three sets — what does each store, and why is it O(1) to check?
5. Word Search: why mark in place instead of a visited set, and what must you not forget?

## 11. My notes

_Your own words here._
`;
