export const DP_1 = `# Dynamic Programming I — One Dimension

> **Reach for it when:** "count the ways", "minimum cost / maximum value" over a sequence or an amount, where the answer for \`n\` is built from answers for smaller \`n\` — **optimal substructure** — and the same sub-answers are needed again and again — **overlapping subproblems**.
>
> **Say out loud:** "State: \`dp[i]\` = ⟨the best answer for the prefix / amount i⟩. Transition: \`dp[i]\` = ⟨combine the choices⟩. Base: ⟨…⟩. Answer: \`dp[n]\`." Four sentences, before any code.

## 1. The idea in one breath

DP is recursion with memory. You write the brute-force recursion, notice it recomputes the same calls, and either **cache** them (top-down, your \`memoise\` template) or **fill a table in dependency order** (bottom-up). The hard part is never the code — it is naming the **state** precisely. A state is *the minimum information needed to finish the problem from here*. If you can say "dp[i] means …" in one clean sentence, the rest follows.

This is the week people quit. It clicks. Keep going.

~~~text
Climbing Stairs, n = 5:  ways(i) = ways(i-1) + ways(i-2)

naive recursion — the same calls repeat:
          ways(5)
         /       \\
     ways(4)     ways(3)
     /    \\       /    \\
 ways(3) ways(2) ways(2) ways(1)      ← ways(3) twice, ways(2) three times … O(2^n)

with a table:  dp = [1, 1, 2, 3, 5, 8]  → dp[5] = 8       O(n)
~~~

~~~js
// Top-down (memoised recursion)
const climb = memoise(n => n <= 1 ? 1 : climb(n - 1) + climb(n - 2));

// Bottom-up with a table
function climbStairs(n) {
  const dp = Array(n + 1).fill(0); dp[0] = dp[1] = 1;
  for (let i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];
  return dp[n];
}

// Bottom-up with rolling variables (O(1) space) — the follow-up every time
function climbStairsO1(n) {
  let a = 1, b = 1;
  for (let i = 2; i <= n; i++) [a, b] = [b, a + b];
  return b;
}
~~~

## 2. The recipe (say it every time)

1. **State** — what does \`dp[i]\` mean? (index-based: "for the prefix ending at i"; value-based: "for amount i")
2. **Transition** — what choices lead into \`dp[i]\`, and how do they combine? (\`+\` for counting, \`min\`/\`max\` for optimisation, \`||\` for feasibility)
3. **Base cases** — the smallest states with known answers (\`dp[0]\`), including the "empty" case.
4. **Order** — which states must be filled first (usually increasing i).
5. **Answer** — \`dp[n]\`, or \`max(dp)\` when the state is "ending at i" rather than "up to i".
6. **Space** — can the table shrink to O(1) or O(k)? Say it as a follow-up before they ask.

## 3. Sub-pattern A — Linear "take or skip" (House Robber family)

**Trigger:** adjacent items conflict; choose a subset maximising value.

~~~text
House Robber: nums = [2, 7, 9, 3, 1]     dp[i] = max(dp[i-1], dp[i-2] + nums[i])
i:      0   1   2    3    4
nums:   2   7   9    3    1
dp:     2   7  11   11   12     → 12  (2 + 9 + 1)
~~~

~~~js
function rob(nums) {
  let prev2 = 0, prev1 = 0;                          // best up to i-2, i-1
  for (const x of nums) [prev2, prev1] = [prev1, Math.max(prev1, prev2 + x)];
  return prev1;
}
~~~

- **House Robber II (circle):** \`max(rob(nums[0..n−2]), rob(nums[1..n−1]))\`.
- **Delete and Earn:** bucket by value (\`gain[v] = v·count\`), then House Robber over values 0..max.
- **Paint House:** \`dp[i][colour]\` = min cost with house i in that colour = cost + min of the other two colours at i−1 — three rolling numbers.
- **Best Time to Buy and Sell Stock with Cooldown:** a **state machine** — \`hold\`, \`sold\` (just sold, must cool), \`rest\`; transitions per price. Draw it.

~~~text
        buy (−price)              sell (+price)
  rest ───────────────► hold ───────────────► sold
   ▲  ◄───── rest ──────┘  (stay)               │
   └──────────────────── cooldown ◄─────────────┘
hold = max(hold, rest − p);  sold = hold + p;  rest = max(rest, sold_prev)
~~~

## 4. Sub-pattern B — "Ways to make an amount" (coins, decode, stairs)

**Trigger:** count/minimise ways to reach a total or a position with steps of given sizes.

~~~text
Coin Change: coins [1, 2, 5], amount 11      dp[a] = min over coins c of dp[a − c] + 1
a:    0  1  2  3  4  5  6  7  8  9  10  11
dp:   0  1  1  2  2  1  2  2  3  3   2   3     → 3  (5 + 5 + 1)
~~~

~~~js
function coinChange(coins, amount) {
  const dp = Array(amount + 1).fill(Infinity); dp[0] = 0;
  for (let a = 1; a <= amount; a++)
    for (const c of coins) if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1;
  return dp[amount] === Infinity ? -1 : dp[amount];
}
~~~

**Loop order decides what you count.** *Combination Sum IV* ("ordered sequences", \`[1,2]\` ≠ \`[2,1]\`): amount outer, coins inner (as above). *Coin Change II* (W15, unordered combinations): coins outer, amount inner — each coin is considered once, so orderings are not double-counted. Be ready to explain this in one sentence; it's a favourite probe.

- **Decode Ways:** \`dp[i] = (s[i−1] ≠ '0' ? dp[i−1] : 0) + (10 ≤ s[i−2..i−1] ≤ 26 ? dp[i−2] : 0)\`; leading zeros are the whole test.
- **Perfect Squares:** coin change with coins \`1, 4, 9, …\`.
- **Min Cost Climbing Stairs:** \`dp[i] = cost[i] + min(dp[i−1], dp[i−2])\`, answer \`min(dp[n−1], dp[n−2])\`.
- **Minimum Cost For Tickets:** \`dp[day] = min(dp[day−1] + c1, dp[day−7] + c7, dp[day−30] + c30)\` on travel days, else \`dp[day−1]\`.
- **Counting Bits:** \`bits[i] = bits[i >> 1] + (i & 1)\`.

## 5. Sub-pattern C — "Ending at i" states (LIS, product, Kadane's family)

**Trigger:** the answer is a subsequence/subarray and you need to know *what it ends with* to extend it.

~~~text
LIS: nums = [10, 9, 2, 5, 3, 7, 101, 18]     dp[i] = 1 + max(dp[j]) for j < i with nums[j] < nums[i]
dp:         [ 1, 1, 1, 2, 2, 3,   4,  4]    answer = max(dp) = 4      O(n²)
~~~

~~~js
function lengthOfLIS(nums) {
  const dp = Array(nums.length).fill(1); let best = 0;
  for (let i = 0; i < nums.length; i++) {
    for (let j = 0; j < i; j++) if (nums[j] < nums[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
    best = Math.max(best, dp[i]);
  }
  return best;
}
// O(n log n) follow-up (patience sorting): tails[k] = smallest tail of an increasing subsequence of length k+1;
// for each x, lowerBound(tails, x) → replace or append. The length of tails is the answer.
~~~

- **Number of LIS:** carry a second array \`cnt[i]\` (ways to achieve \`dp[i]\`); on a tie add, on an improvement copy.
- **Maximum Product Subarray:** keep **both** \`maxEnd\` and \`minEnd\` (a negative flips them); swap when \`x < 0\`.
- **Maximum Sum Circular Subarray:** \`max(kadaneMax, total − kadaneMin)\`, unless everything is negative (then \`kadaneMax\`).
- **Arithmetic Slices:** \`run\` = number of slices ending at i; if \`d\` continues, \`run++\` and add to the total, else \`run = 0\`.
- **Longest Palindromic Substring / Palindromic Substrings:** \`dp[i][j]\` is 2-D, but **expand around centre** (2n − 1 centres) is O(n²) time, O(1) space and shorter — prefer it and say why.

## 6. Sub-pattern D — Feasibility on a string / a set (Word Break, Partition Equal Subset Sum)

~~~text
Word Break: s = "leetcode", dict {leet, code}     dp[i] = can s[0..i) be segmented
dp[0] = true;  dp[4] = dp[0] && "leet" ∈ dict = true;  dp[8] = dp[4] && "code" ∈ dict = true
~~~

~~~js
function wordBreak(s, wordDict) {
  const dict = new Set(wordDict), maxLen = Math.max(...wordDict.map(w => w.length));
  const dp = Array(s.length + 1).fill(false); dp[0] = true;
  for (let i = 1; i <= s.length; i++)
    for (let j = Math.max(0, i - maxLen); j < i; j++)
      if (dp[j] && dict.has(s.slice(j, i))) { dp[i] = true; break; }
  return dp[s.length];
}
~~~

**Partition Equal Subset Sum:** subset-sum to \`total / 2\`; 1-D boolean table iterated **downwards** so each number is used once (\`for (let a = target; a >= x; a--) dp[a] ||= dp[a − x]\`). The bitset trick (\`BigInt\` shifts) is the flourish.

## 7. Greedy cousins — know when DP is overkill

- **Jump Game:** furthest reach so far ≥ i at every step → O(n) greedy.
- **Jump Game II:** BFS-like layers: \`end\` of the current jump, \`farthest\`; when \`i === end\`, jump. O(n).
If the interviewer says "DP works but can you do better?" — these are the ones.

## 8. This week's problems, mapped

| Problem | Sub-pattern | State |
|---|---|---|
| Climbing Stairs | B | ways to reach step i |
| Min Cost Climbing Stairs | B | min cost to stand on i |
| Counting Bits | B | bits[i >> 1] + (i & 1) |
| House Robber | A | best up to i |
| House Robber II | A | two linear runs |
| Coin Change | B | min coins for amount a |
| Word Break | D | prefix segmentable |
| Longest Increasing Subsequence | C | LIS ending at i; tails for n log n |
| Jump Game | greedy | furthest reach |
| Partition Equal Subset Sum | D | reachable sums, downward loop |
| Decode Ways | B | ways for prefix i; zeros |
| Longest Palindromic Substring | C | expand around centre |
| Maximum Product Subarray | C | max & min ending at i |
| Combination Sum IV | B | ordered: amount outer |
| Delete and Earn | A | bucket then rob |
| Palindromic Substrings | C | expand around centre, count |
| Perfect Squares | B | coins = squares |
| Maximum Sum Circular Subarray | C | max vs total − min |
| Number of Longest Increasing Subsequence | C | dp + cnt |
| Jump Game II | greedy | layers |
| Best Time to Buy and Sell Stock with Cooldown | A | hold / sold / rest |
| Paint House | A | per-colour rolling mins |
| Minimum Cost For Tickets | B | by day, three passes back |
| Arithmetic Slices | C | run length ending at i |

## 9. Where people fall down in the room

- Coding before saying the state → the code drifts and you can't debug it out loud.
- Off-by-one between "prefix of length i" (\`dp\` size n+1, \`dp[0]\` = empty) and "ending at index i" (size n). Pick one and say it.
- Subset-sum with the loop going *up* (uses a number twice).
- Combination order confusion (Combination Sum IV vs Coin Change II).
- Not offering the O(1)-space version.

**Follow-ups the company likes here:** "Reconstruct the actual choice / path" (store the argmax, walk back), "n is 10⁹" (matrix exponentiation for linear recurrences — know that it exists), "Stream the input" (rolling variables already do), "What if the recursion is too deep?" (bottom-up).

## 10. Self-check

1. Say the four DP sentences (state, transition, base, answer) for Coin Change.
2. Why does swapping the loop order change Combination Sum IV into Coin Change II?
3. Maximum Product Subarray: why track the minimum too?
4. Partition Equal Subset Sum: why iterate the amount downwards?
5. LIS: what does \`tails[k]\` mean in the O(n log n) version?

## 11. My notes

_Your own words here._
`;
