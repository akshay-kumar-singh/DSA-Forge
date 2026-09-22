export const DP_2 = `# Dynamic Programming II — Two Dimensions & Intervals

> **Reach for it when:** **two sequences** (align, edit, match, interleave) · a **grid** you walk through · a **capacity** and items (knapsack) · an **interval** \`[i, j]\` where the answer depends on how you split it (burst balloons, cut a stick, palindromes).
>
> **Say out loud:** "State is \`dp[i][j]\` = ⟨answer for prefix i of A and prefix j of B⟩ / ⟨cell (i, j)⟩ / ⟨interval i..j⟩. Transition from the three neighbours / from every split point k."

## 1. The idea in one breath

Same recipe as DP I — state, transition, base, order, answer — but the state now needs **two coordinates**. There are four families, and each has a signature transition you should recognise on sight:

| Family | State | Transition comes from | Fill order |
|---|---|---|---|
| Grid | \`dp[r][c]\` | up and left | row by row |
| Two sequences | \`dp[i][j]\` (prefixes) | \`(i−1, j−1)\`, \`(i−1, j)\`, \`(i, j−1)\` | row by row |
| Knapsack | \`dp[i][cap]\` → 1-D \`dp[cap]\` | take or skip item i | items outer, capacity inner (**downwards** for 0-1) |
| Interval | \`dp[i][j]\` (substring/subarray) | all splits \`k\` in \`[i, j]\` | by increasing **length** |

## 2. Family A — Grid paths

~~~text
Unique Paths 3×3:   dp[r][c] = dp[r-1][c] + dp[r][c-1]      Minimum Path Sum: grid[r][c] + min(up, left)
   1  1  1
   1  2  3
   1  3  6   → 6
~~~

~~~js
function uniquePaths(m, n) {
  let row = Array(n).fill(1);                       // O(n) space: the previous row is enough
  for (let r = 1; r < m; r++) for (let c = 1; c < n; c++) row[c] += row[c - 1];
  return row[n - 1];
}
// Combinatorics follow-up: C(m+n−2, m−1).   Obstacles: dp = 0 at an obstacle.
~~~

- **Dungeon Game:** fill from the **bottom-right** — \`need[r][c] = max(1, min(need[r+1][c], need[r][c+1]) − dungeon[r][c])\`; forward DP fails because the constraint is "never drop to 0 *along the way*".
- **Maximal Square:** \`dp[r][c]\` = side of the largest square with bottom-right corner here = \`1 + min(up, left, up-left)\` when the cell is 1.
- **Out of Boundary Paths:** \`dp[moves][r][c]\` = ways to be at (r, c) after \`moves\`; count moves that step off the grid. Roll the \`moves\` dimension.
- **Cherry Pickup:** two walkers moving simultaneously — state \`(step, r1, r2)\` with \`c1 = step − r1\`, \`c2 = step − r2\`; take the cell once if they coincide. Say why "greedy then greedy back" fails.

## 3. Family B — Two sequences (LCS, edit distance, matching)

~~~text
LCS("abcde", "ace"):     dp[i][j] = a[i-1]===b[j-1] ? dp[i-1][j-1] + 1 : max(dp[i-1][j], dp[i][j-1])

        ""  a  c  e
    ""   0  0  0  0
    a    0  1  1  1
    b    0  1  1  1
    c    0  1  2  2
    d    0  1  2  2
    e    0  1  2  3     → 3
~~~

~~~js
function longestCommonSubsequence(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return dp[m][n];
}
~~~

**Edit Distance** — say the recurrence before you type: \`dp[i][j]\` = edits to turn \`a[0..i)\` into \`b[0..j)\`. If the last characters match, \`dp[i−1][j−1]\`; else \`1 + min(dp[i−1][j−1] replace, dp[i−1][j] delete, dp[i][j−1] insert)\`. Base: \`dp[i][0] = i\`, \`dp[0][j] = j\`.

~~~text
edit("horse", "ros"):
        ""  r  o  s
    ""   0  1  2  3
    h    1  1  2  3
    o    2  2  1  2
    r    3  2  2  2
    s    4  3  3  2
    e    5  4  4  3   → 3
~~~

- **Longest Palindromic Subsequence:** LCS of \`s\` and \`reverse(s)\` — or interval DP (§5).
- **Distinct Subsequences:** ways to form \`t\` from \`s\`: \`dp[i][j] = dp[i−1][j] + (s[i−1]===t[j−1] ? dp[i−1][j−1] : 0)\`; \`dp[i][0] = 1\`.
- **Interleaving String:** \`dp[i][j]\` = can \`s3[0..i+j)\` be formed from \`s1[0..i)\` and \`s2[0..j)\`; true if the last char of s3 matches s1's and \`dp[i−1][j]\`, or s2's and \`dp[i][j−1]\`.
- **Regular Expression Matching:** \`dp[i][j]\` over \`s[0..i)\`, \`p[0..j)\`; the \`*\` case: \`dp[i][j−2]\` (zero of the preceding) **or** (\`s[i−1]\` matches \`p[j−2]\` and \`dp[i−1][j]\`). Base: \`dp[0][j]\` true when \`p[0..j)\` is like \`a*b*\`.
- **Wildcard Matching:** \`*\` → \`dp[i][j−1]\` (empty) or \`dp[i−1][j]\` (eat one more char). Greedy two-pointer with backtracking to the last \`*\` is the O(1)-space follow-up.

## 4. Family C — Knapsack (capacity × items)

**0-1 Knapsack** (each item once): \`dp[cap] = max(dp[cap], dp[cap − w] + v)\`, capacity loop **downwards**. **Unbounded** (reuse): loop **upwards**. That single direction flip is the entire difference; say it.

~~~text
0-1 Knapsack: weights [1,3,4,5], values [1,4,5,7], capacity 7
after item (1,1):  cap 0..7 → 0 1 1 1 1 1 1 1
after item (3,4):            0 1 1 4 5 5 5 5
after item (4,5):            0 1 1 4 5 6 6 9
after item (5,7):            0 1 1 4 5 7 8 9   → 9
~~~

~~~js
function knapsack01(weights, values, capacity) {
  const dp = Array(capacity + 1).fill(0);
  for (let i = 0; i < weights.length; i++)
    for (let cap = capacity; cap >= weights[i]; cap--)               // downwards: item i used at most once
      dp[cap] = Math.max(dp[cap], dp[cap - weights[i]] + values[i]);
  return dp[capacity];
}
function change(amount, coins) {                                      // Coin Change II — unbounded, COUNT
  const dp = Array(amount + 1).fill(0); dp[0] = 1;
  for (const c of coins) for (let a = c; a <= amount; a++) dp[a] += dp[a - c];   // coins outer → combinations, not permutations
  return dp[amount];
}
~~~

- **Target Sum:** \`P − N = target\`, \`P + N = total\` → count subsets with sum \`(total + target) / 2\` (0-1 counting knapsack); check parity and sign.
- **Best Time to Buy and Sell Stock III / IV:** \`k\` transactions → \`buy[k]\`, \`sell[k]\` rolling arrays: \`buy[t] = max(buy[t], sell[t−1] − p)\`, \`sell[t] = max(sell[t], buy[t] + p)\`. If \`k ≥ n/2\` it's unlimited → greedy sum of rises.

## 5. Family D — Interval DP (fill by length)

**Trigger:** "remove / burst / cut / merge — the cost depends on what remains", "minimum cuts into palindromes", "who wins picking from the ends".

The state is a range \`[i, j]\`; you choose a **split point** \`k\` and combine the two sides. Because \`dp[i][j]\` depends on shorter ranges, fill by **increasing length**.

~~~text
Burst Balloons nums = [3, 1, 5, 8]  → pad: [1, 3, 1, 5, 8, 1]
dp[i][j] = max over k in (i, j) of dp[i][k] + nums[i]*nums[k]*nums[j] + dp[k][j]
"k is the LAST balloon to burst in (i, j)" — then its neighbours are exactly i and j. That sentence is the whole trick.
~~~

~~~js
function maxCoins(nums) {
  const a = [1, ...nums, 1], n = a.length;
  const dp = Array.from({ length: n }, () => Array(n).fill(0));
  for (let len = 2; len < n; len++)                       // distance between i and j
    for (let i = 0; i + len < n; i++) {
      const j = i + len;
      for (let k = i + 1; k < j; k++)
        dp[i][j] = Math.max(dp[i][j], dp[i][k] + a[i] * a[k] * a[j] + dp[k][j]);
    }
  return dp[0][n - 1];
}
~~~

- **Minimum Cost to Cut a Stick:** sort cuts, pad with 0 and n; \`dp[i][j] = (cuts[j] − cuts[i]) + min over k of dp[i][k] + dp[k][j]\` — Burst Balloons in disguise.
- **Stone Game:** \`dp[i][j]\` = best score difference for the player to move on \`piles[i..j]\` = \`max(piles[i] − dp[i+1][j], piles[j] − dp[i][j−1])\`. (Even length + even total → first player always wins; know the maths *and* the DP.)
- **Strange Printer:** \`dp[i][j]\` = min prints for \`s[i..j]\`; \`dp[i][j] = dp[i][j−1]\` if \`s[j] === s[i]\`… general: \`1 + dp[i+1][j]\`, improved by any \`k\` with \`s[k] === s[i]\`: \`dp[i][k−1] + dp[k+1][j]\`.
- **Palindrome Partitioning II:** precompute \`isPal[i][j]\` by length, then 1-D \`cuts[i] = min over j ≤ i with isPal[j][i] of cuts[j−1] + 1\`.
- **Longest Palindromic Subsequence (interval form):** \`s[i]===s[j] ? dp[i+1][j−1] + 2 : max(dp[i+1][j], dp[i][j−1])\`.

## 6. Space reduction — always offer it

- Grid / two-sequence DP: keep two rows (or one row with a saved diagonal).
- Knapsack: one row, direction decides 0-1 vs unbounded.
- Interval DP: needs the full \`n²\` table (dependencies point in both directions).

## 7. This week's problems, mapped

| Problem | Family | Transition in one line |
|---|---|---|
| Unique Paths | A | up + left |
| Unique Paths II | A | 0 at obstacles |
| Minimum Path Sum | A | cell + min(up, left) |
| Longest Common Subsequence | B | diag + 1 or max(up, left) |
| Edit Distance | B | 1 + min(replace, delete, insert) |
| Coin Change II | C | coins outer, amount upwards |
| Target Sum | C | subsets summing to (total + target)/2 |
| 0-1 Knapsack | C | capacity downwards |
| Interleaving String | B | last char from s1 or s2 |
| Longest Palindromic Subsequence | B / D | LCS with reverse, or interval |
| Maximal Square | A | 1 + min(up, left, diag) |
| Stone Game | D | score difference |
| Out of Boundary Paths | A | moves × cells, roll moves |
| Regular Expression Matching | B | \`*\` = zero or one-more |
| Burst Balloons | D | k = last to burst |
| Distinct Subsequences | B | skip s[i] + match |
| Wildcard Matching | B | \`*\` = empty or eat |
| Best Time to Buy and Sell Stock III | C | buy/sell per transaction |
| Best Time to Buy and Sell Stock IV | C | same, k rolling; greedy if k big |
| Minimum Cost to Cut a Stick | D | sorted cuts, padded |
| Palindrome Partitioning II | D + 1-D | isPal table, then cuts |
| Dungeon Game | A | from the bottom-right, max(1, …) |
| Cherry Pickup | A | two walkers, (step, r1, r2) |
| Strange Printer | D | match s[k] === s[i] |

## 8. Where people fall down in the room

- Two-sequence tables of size \`n × m\` instead of \`(n+1) × (m+1)\` — the empty prefix row/column is where the base cases live.
- Filling interval DP by \`i\` then \`j\` instead of by **length** — reads uninitialised cells.
- Knapsack direction (see §4).
- Regex \`*\`: forgetting the "zero occurrences" branch, or matching \`.\` against the empty string.
- Not saying the complexity: two-sequence O(nm), interval O(n³), knapsack O(n·cap).

**Follow-ups the company likes here:** "Reconstruct the alignment / the cuts" (parent pointers), "Reduce memory" (§6), "One string is huge, the other tiny" (rows = the small one), "k is huge in Stock IV" (greedy switch).

## 9. Self-check

1. Draw the LCS table for \`"abc"\`, \`"ac"\` and read the answer.
2. Edit Distance: say the three moves and which cell each comes from.
3. Why downwards for 0-1 knapsack and upwards for unbounded?
4. Burst Balloons: why "last to burst" instead of "first"?
5. Dungeon Game: why fill from the end?

## 10. My notes

_Your own words here._
`;
