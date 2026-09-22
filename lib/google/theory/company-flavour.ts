export const COMPANY_FLAVOUR = `# Company Flavour — Design & Implement, Open-Ended, Hard

> **Reach for it when:** the prompt is **underspecified** ("design a hit counter"), asks for an **iterator** or an **in-memory system**, or comes with a chain of follow-ups ("now make it thread-safe", "now the stream is huge", "now it's on a thousand machines"). There is no single algorithm — the pattern is **how you drive the conversation**.
>
> **Say out loud:** "Let me pin the requirements first: operations, their frequency, scale, and what we optimise for. Then I'll start with the simplest correct structure and we improve it together."

## 1. The idea in one breath

The company's problems differ from the LeetCode median in three ways:

1. **Underspecified on purpose.** The clarifying questions *are* the assessment. Ask about input size, call frequency, ordering guarantees, memory, and what "good" means.
2. **Layered follow-ups.** The first version is a warm-up; the score comes from how you evolve it. Always have the next improvement ready before they ask.
3. **Design-and-implement hybrids.** A class with 3–4 methods, each with a complexity target. Pick the data structure per operation and say the trade-off aloud.

The rhythm: **clarify → simplest correct version → complexity of each op → the follow-up you expect → evolve.**

## 2. Sub-pattern A — Streams and time windows

**Trigger:** "average of the last k", "hits in the last 300 seconds", "stock price updates with corrections".

~~~text
Moving Average (size 3):   next(1) → 1.0   next(10) → 5.5   next(3) → 4.67   next(5): window [10,3,5] → 6.0
ring buffer of size k + running sum: O(1) per call, O(k) memory
~~~

~~~js
class MovingAverage {
  constructor(size) { this.buf = Array(size).fill(0); this.i = 0; this.n = 0; this.sum = 0; this.size = size; }
  next(v) {
    this.sum += v - this.buf[this.i];                       // drop what this slot held
    this.buf[this.i] = v; this.i = (this.i + 1) % this.size;
    this.n = Math.min(this.n + 1, this.size);
    return this.sum / this.n;
  }
}
~~~

**Design Hit Counter:** v1 a queue of timestamps, evict \`< t − 300\` on \`getHits\` → O(1) amortised, O(hits) memory. Follow-up "hits per second are huge" → **300 buckets** \`[timestamp, count]\` indexed by \`t % 300\`; reset a bucket when its stored timestamp is stale → O(1), O(300). Follow-up "concurrent" → atomic increments per bucket, or per-thread counters merged on read.

**Stock Price Fluctuation:** \`Map<timestamp, price>\` + two heaps with **lazy deletion** (an entry is valid only if \`map.get(ts) === price\`); \`current\` = price at the max timestamp seen. Same lazy-deletion idea as **Design a Food Rating System** (heap per cuisine of \`[−rating, name]\`, validate against the current rating on peek).

## 3. Sub-pattern B — Iterators (lazy, composable)

**Trigger:** \`next()\` / \`hasNext()\` over something nested, interleaved, or wrapped. The word the interviewer wants: **lazy** — don't flatten up front (the input may be infinite or huge).

~~~text
Flatten Nested List Iterator: [[1,1], 2, [1,1]]
stack (reversed): push the top-level list in reverse → [ [1,1], 2, [1,1] ] top is [1,1]
hasNext(): while top is a list, pop it and push its items in reverse → top is 1  ✓
next(): pop 1.   Each element is pushed once → amortised O(1).
~~~

~~~js
class NestedIterator {
  constructor(nestedList) { this.st = [...nestedList].reverse(); }
  hasNext() {
    while (this.st.length) {
      const top = this.st[this.st.length - 1];
      if (top.isInteger()) return true;
      this.st.pop();
      for (const x of [...top.getList()].reverse()) this.st.push(x);
    }
    return false;
  }
  next() { this.hasNext(); return this.st.pop().getInteger(); }
}
~~~

- **Peeking Iterator:** cache one element (\`peeked\`, \`hasPeeked\`); \`next\` returns the cache if present. Wrap *any* iterator — say it's a decorator.
- **Zigzag Iterator:** a queue of iterators; pop one, take its next, push it back if it has more. Generalises to k lists for free — offer it.
- **BST Iterator** (W10) and **Read N Characters (read4 II)** are the same family: state kept *between* calls. For \`read4\`, keep a leftover buffer and its offset; each \`read(n)\` drains leftovers first, then calls \`read4\` until \`n\` or EOF.

## 4. Sub-pattern C — Small systems (pick a structure per operation)

State the operations and target complexities in a table **before** coding — the interviewer is checking that you can.

| Problem | Operations | Structure | Cost |
|---|---|---|---|
| Design Tic-Tac-Toe | \`move(r, c, p)\` | row/col/diag counters (+1 / −1 per player) | O(1); O(n) memory |
| Design Snake Game | \`move(dir)\` | deque of body cells + Set of occupied | O(1); check tail first (it moves) |
| Design Underground System | \`checkIn\`, \`checkOut\`, \`getAverageTime\` | Map id → (station, t); Map "A→B" → [total, count] | O(1) each |
| Encode and Decode TinyURL | \`encode\`, \`decode\` | counter → base62, Map both ways | O(1); design bridge: collisions, custom aliases, expiry |
| Detect Squares | \`add(p)\`, \`count(p)\` | Map "x,y" → count; for each point sharing x, derive the two candidates | O(n) per count |
| Design Text Editor | cursor ops | **two stacks** around the cursor | O(k) per op |
| Range Module | add/query/remove ranges | sorted disjoint intervals (array + binary search) | O(n) per op; segment tree / balanced BST for the follow-up |
| Design In-Memory File System | \`ls\`, \`mkdir\`, \`addContentToFile\`, \`readContentFromFile\` | **trie of directories** (Map name → node, node has \`children\` + \`content\`) | O(path length); sorted \`ls\` |

~~~js
class TicTacToe {
  constructor(n) { this.n = n; this.rows = Array(n).fill(0); this.cols = Array(n).fill(0); this.diag = 0; this.anti = 0; }
  move(r, c, player) {
    const d = player === 1 ? 1 : -1, n = this.n;
    this.rows[r] += d; this.cols[c] += d;
    if (r === c) this.diag += d;
    if (r + c === n - 1) this.anti += d;
    if (Math.abs(this.rows[r]) === n || Math.abs(this.cols[c]) === n || Math.abs(this.diag) === n || Math.abs(this.anti) === n) return player;
    return 0;
  }
}
~~~

~~~text
Text editor with two stacks:   left = ['l','e','e','t']   right = ['c','o','d','e']   cursor between them
cursorLeft(2): move 2 from left's top to right → left [l,e]  right [e,t,c,o,d,e]
deleteText(k): pop k from left.   addText(s): push each char to left.
~~~

## 5. Sub-pattern D — Randomness (Reservoir sampling)

**Random Pick Index:** pick uniformly among indices where \`nums[i] === target\` **without extra memory** — scan; for the k-th match, replace the answer with probability \`1/k\`. Prove it in one line: the k-th match is chosen with \`1/k\` and survives the rest with \`k/(k+1) · (k+1)/(k+2) · … = k/n\` → \`1/n\`. A company staple because it generalises to "sample k of a stream".

~~~js
pick(target) {
  let ans = -1, k = 0;
  for (let i = 0; i < this.nums.length; i++)
    if (this.nums[i] === target && Math.random() < 1 / ++k) ans = i;
  return ans;
}
~~~

## 6. Sub-pattern E — Open-ended search & games

- **Guess the Word:** each guess returns the number of matching positions; keep only candidates consistent with that score (\`match(candidate, guess) === score\`). Choose the guess that **minimises the worst-case remaining candidates** (minimax) — or the cheaper heuristic: the word with the most common letters per position. Explain both; implement the heuristic.
- **Bulls and Cows:** bulls = same position; cows = \`Σ min(countSecret[d], countGuess[d]) − bulls\`.
- **Minimum Domino Rotations:** only two candidates (tops[0] or bottoms[0]); for each, count rotations needed or fail. O(n).
- **Confusing Number II:** DFS over digits \`0 1 6 8 9\` building numbers ≤ n; check "rotated ≠ original". Pruning by bound.

## 7. Sub-pattern F — Greedy with a twist (two passes, two maps)

- **Candy:** two passes — left to right (\`ratings[i] > ratings[i−1]\` → \`+1\`), right to left (take the max). Say why one pass is wrong.
- **Split Array into Consecutive Subsequences:** \`avail\` counts and \`need\` counts (a subsequence waiting for \`x\`): for each \`x\`, if \`need[x]\` attach; else if \`x+1\`, \`x+2\` available start a new run; else fail.
- **Rearrange String k Distance Apart:** the Task Scheduler idea — max-heap by count + a cooldown queue of length \`k\`; if the heap is empty while the queue isn't and the string isn't done → impossible.
- **Longest String Chain:** sort by length; \`dp[word] = 1 + max(dp[word minus one char])\`.
- **Maximum Points from Cards:** take k from the ends = leave a window of \`n − k\` in the middle with minimum sum (W2).
- **Meeting Scheduler:** two pointers over the two sorted slot lists; the first intersection ≥ duration.
- **Minimum Time Difference:** convert to minutes, sort, adjacent gaps plus the wrap-around (\`first + 1440 − last\`); pigeonhole: n > 1440 → 0.
- **Odd Even Jump:** from the right, DP \`odd[i]\`/\`even[i]\` = can reach the end; the next index for an odd jump is the smallest value ≥ \`arr[i]\` to the right → sort indices by value and use a monotonic stack (W5). Hard because it stacks three ideas; narrate them.
- **License Key Formatting:** pure implementation — strip dashes, uppercase, first group is the remainder.

## 8. The follow-ups, and what to say

| Follow-up | Your move |
|---|---|
| "Input is a stream / doesn't fit in memory" | keep only a window / counts / a sketch; iterators stay lazy |
| "10¹² elements" | complexity must be O(n) one pass or O(log n) per op; talk about external sort / partitioning |
| "A thousand machines" | partition by key; per-machine local answer; merge (top-k merges, counts add, averages need sums *and* counts) |
| "Thread-safe" | a lock per structure; then per-shard locks; then lock-free counters; say what race you're preventing |
| "How would you test it" | unit tests for empty, single, boundary, duplicates; property tests against a brute force; a fuzz loop |
| "Memory is tight" | ring buffer, bucketing, lazy deletion, bit packing |

## 9. This week's problems, mapped

| Problem | Sub-pattern | Structure / idea |
|---|---|---|
| Moving Average from Data Stream | A | ring buffer + sum |
| Design Hit Counter | A | queue → 300 buckets |
| Design Tic-Tac-Toe | C | counters |
| Design Snake Game | C | deque + Set |
| Peeking Iterator | B | one-element cache |
| Flatten Nested List Iterator | B | stack, lazy |
| Zigzag Iterator | B | queue of iterators |
| Design Underground System | C | two maps |
| Design a Food Rating System | A | heap + lazy deletion |
| Stock Price Fluctuation | A | map + two heaps, lazy |
| Random Pick Index | D | reservoir sampling |
| Encode and Decode TinyURL | C | counter/base62 + maps |
| Detect Squares | C | point counts |
| Design Text Editor | C | two stacks |
| Range Module | C | sorted disjoint intervals |
| Design In-Memory File System | C | directory trie |
| Read N Characters Given read4 II | B | leftover buffer |
| Guess the Word | E | candidate filtering, minimax |
| Odd Even Jump | F | sorted indices + monotonic stack + DP |
| Minimum Domino Rotations For Equal Row | E | two candidates |
| Confusing Number II | E | DFS over 5 digits |
| Split Array into Consecutive Subsequences | F | avail + need maps |
| Longest String Chain | F | DP by length |
| Maximum Points You Can Obtain from Cards | F | min middle window |
| License Key Formatting | F | implementation |
| Candy | F | two passes |
| Meeting Scheduler | F | two pointers |
| Bulls and Cows | E | counts |
| Minimum Time Difference | F | sort minutes, wrap-around |
| Rearrange String k Distance Apart | F | heap + cooldown queue |

## 10. Where people fall down in the room

- Starting to code before asking a single clarifying question.
- Eagerly flattening / materialising in an iterator problem.
- Not stating per-operation complexity for design problems.
- Lazy deletion without the validity check on peek.
- Treating the first working version as done — have the next step ready.

## 11. Self-check

1. Name five clarifying questions you'd ask for "design a hit counter".
2. Why is the nested-list iterator amortised O(1) per element?
3. Prove reservoir sampling gives each of n matches probability 1/n.
4. Text editor: what are the two stacks and how does \`cursorLeft(k)\` work?
5. For "a thousand machines", how do you merge averages correctly?

## 12. My notes

_Your own words here._
`;
