export const TRIES_BITS_INTERVALS = `# Tries, Bit Manipulation, Intervals & Greedy

> **Reach for it when:** **prefix** queries over many words (autocomplete, "starts with", wildcard search) → **trie** · parity / "appears once" / XOR tricks / "without using +" → **bits** · scheduling, merging, "max non-overlapping", sweep over time → **intervals** (sort by start, or by end for greedy).
>
> **Say out loud:** "Many words, prefix questions → trie." / "XOR cancels pairs." / "Sort the intervals — by start to merge, by end to pick the most non-overlapping."

## 1. Tries

### The idea
A trie stores strings by **shared prefixes**: each node is a character, each root-to-node path is a prefix. Insert/search/startsWith are O(L) regardless of how many words there are — a hash set can't do "startsWith". Your W16 template: node = \`{ children: Map, end: boolean }\`.

~~~text
insert app, apple, bat                (root)
                                      /    \\
                                     a      b
                                     |      |
                                     p      a
                                     |      |
                                     p*     t*
                                     |
                                     l
                                     |
                                     e*         search("app") → true (end)   startsWith("ap") → true   search("ap") → false
~~~

### Wildcard search (Design Add and Search Words)
\`.\` → try **every** child at that position: DFS over the trie with the pattern index. Worst case exponential in dots, fine in practice; say it.

~~~js
search(word) {
  const go = (node, i) => {
    if (i === word.length) return node.end;
    if (word[i] !== '.') { const nxt = node.children.get(word[i]); return !!nxt && go(nxt, i + 1); }
    for (const child of node.children.values()) if (go(child, i + 1)) return true;
    return false;
  };
  return go(this.root, 0);
}
~~~

### Word Search II — trie + grid DFS, prune as you go
Build a trie of the words; DFS the board **walking the trie at the same time**, so a path that isn't a prefix of any word dies immediately. When you complete a word, record it and set \`end = false\` (no duplicates); the pro move is removing empty leaves after use so the trie shrinks. Complexity O(R·C·4·3^(L−1)) worst case; explain why the naive "for each word, Word Search" is much worse.

### Other trie shapes
- **Replace Words:** insert roots; for each word, walk until the first \`end\` — that's the replacement.
- **Longest Word in Dictionary:** insert all; DFS/BFS only through nodes with \`end = true\`, keep the longest (lexicographically smallest on ties).
- **Design Search Autocomplete System:** trie where each node keeps a Map of \`sentence → count\` (or a top-3 list); on each character walk one node deeper; on \`#\` insert the sentence. Bridge to the design round: "what if it's 10⁹ sentences?" — the trie is per-shard, top-k precomputed per node, updated asynchronously.
- **Maximum XOR of Two Numbers:** a **binary trie** (bits 31 → 0). For each number, walk preferring the *opposite* bit at each level — greedy from the top bit maximises the XOR. O(32n).
- **Palindrome Pairs:** trie of reversed words; for each word walk it and check "the rest is a palindrome" at word ends. (Or the hash-map version with all prefix/suffix splits — O(n·L²), simpler to narrate.)

## 2. Bit manipulation

Facts to say instantly:

| Expression | Meaning |
|---|---|
| \`x & 1\` | is odd |
| \`x & (x − 1)\` | clear the lowest set bit — **Kernighan**; loop counts bits |
| \`x & −x\` | isolate the lowest set bit |
| \`x ^ x = 0\`, \`x ^ 0 = x\` | XOR cancels pairs → **Single Number**, **Missing Number** (XOR indices and values) |
| \`1 << k\`, \`x >> k\` | powers of two, shifts; in JS these are **signed 32-bit** |
| \`x >>> 0\` | reinterpret as unsigned 32-bit (Reverse Bits, Number of 1 Bits with negative input) |
| \`(x & (1 << k)) !== 0\` | test bit k |

~~~text
Single Number: [4, 1, 2, 1, 2]     4 ^ 1 ^ 2 ^ 1 ^ 2 = 4 ^ (1^1) ^ (2^2) = 4
Number of 1 Bits (Kernighan): n = 11 = 1011
  1011 & 1010 = 1010   (1)
  1010 & 1001 = 1000   (2)
  1000 & 0111 = 0000   (3)  → 3
~~~

~~~js
function getSum(a, b) {                         // Sum of Two Integers — no + or −
  while (b !== 0) {
    const carry = (a & b) << 1;                 // where both bits are 1, a carry moves left
    a = a ^ b;                                  // add without carry
    b = carry;
  }
  return a;
}
// JS caveat: & ^ << operate on 32-bit signed integers — fine within ±2^31; say it.

function reverseBits(n) {
  let r = 0;
  for (let i = 0; i < 32; i++) { r = (r << 1) | (n & 1); n >>>= 1; }
  return r >>> 0;
}
~~~

**Counting Bits / Reverse Bits / Missing Number** are warm-ups; the interviewer wants the *sentence* ("XOR cancels pairs", "n & (n−1) clears the lowest bit") more than the code.

## 3. Intervals

### Merge (sort by start)

~~~text
[[1,3],[2,6],[8,10],[15,18]]  sorted by start
cur [1,3];  [2,6] starts ≤ 3 → extend end to 6 → [1,6]
[8,10] starts > 6 → push [1,6], cur [8,10];  [15,18] → push [8,10], cur [15,18]  → [[1,6],[8,10],[15,18]]
~~~

~~~js
function merge(intervals) {
  intervals.sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const [s, e] of intervals) {
    const last = out[out.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);   // overlap → extend
    else out.push([s, e]);
  }
  return out;
}
~~~

- **Insert Interval:** three phases — copy everything ending before \`new.start\`; merge everything overlapping \`new\`; copy the rest. O(n), no sort.
- **Interval List Intersections:** two pointers; intersection is \`[max(starts), min(ends)]\` if non-empty; advance the one that ends first.
- **Meeting Rooms:** sort; any \`start < prevEnd\` → conflict. **Meeting Rooms II** is W7 (heap of end times).
- **My Calendar I:** keep bookings sorted (array + binary search insert, or just linear for interview scale); a conflict is \`start < b.end && b.start < end\`. Follow-up II/III: **sweep line** — \`+1\` at starts, \`−1\` at ends in a sorted Map, running sum = concurrent bookings.
- **Employee Free Time:** flatten all intervals, merge, gaps between merged intervals are the free time.

### Greedy by **end** time (Non-overlapping Intervals)
To keep the maximum number of non-overlapping intervals, sort by **end** and greedily take each interval that starts at/after the last taken end. Removals = total − kept. Why end, not start: the interval that ends earliest leaves the most room. Say that sentence.

~~~js
function eraseOverlapIntervals(intervals) {
  intervals.sort((a, b) => a[1] - b[1]);
  let kept = 0, end = -Infinity;
  for (const [s, e] of intervals) if (s >= end) { kept++; end = e; }
  return intervals.length - kept;
}
~~~

### Sweep line + heap (Skyline, Minimum Interval to Include Each Query)
- **The Skyline Problem:** events \`(x, −height)\` for starts and \`(x, height)\` for ends, sorted; a max-heap of active heights with lazy deletion; whenever the max changes, output \`[x, max]\`.
- **Minimum Interval to Include Each Query:** sort intervals by start and queries by value; sweep queries, pushing intervals whose start ≤ q into a min-heap by **length**; pop while the top's end < q; the top is the answer. O((n + q) log n).

## 4. Greedy — the ones in this section

| Problem | The greedy sentence |
|---|---|
| Gas Station | if total gas ≥ total cost a solution exists; start after the point where the running tank went most negative |
| Partition Labels | last index of each char; extend the current partition's end to \`last[c]\`; cut when \`i === end\` |
| Hand of Straights | sorted counts (Map or sorted keys); from the smallest card, consume a run of \`groupSize\` |
| Merge Triplets to Form Target Triplet | a triplet is usable only if no coordinate exceeds the target's; the usable ones must cover each coordinate exactly |
| Valid Parenthesis String | track the **range** \`[lo, hi]\` of possible open counts; \`*\` widens both; clamp \`lo\` at 0; valid if \`lo === 0\` at the end |

## 5. This week's problems, mapped

| Problem | Area | The one thing to remember |
|---|---|---|
| Implement Trie | trie | Map children + end |
| Design Add and Search Words Data Structure | trie | \`.\` tries all children |
| Word Search II | trie + DFS | walk trie and board together; prune |
| Merge Intervals | intervals | sort by start; extend or push |
| Insert Interval | intervals | three phases |
| Non-overlapping Intervals | greedy | sort by **end** |
| Maximum XOR of Two Numbers in an Array | binary trie | prefer the opposite bit |
| Sum of Two Integers | bits | XOR + shifted carry |
| Longest Word in Dictionary | trie | only through \`end\` nodes |
| Replace Words | trie | stop at the first end |
| Design Search Autocomplete System | trie | counts per node; design bridge |
| Single Number | bits | XOR all |
| Number of 1 Bits | bits | Kernighan |
| Meeting Rooms | intervals | sort, adjacent check |
| Reverse Bits | bits | 32 iterations, \`>>> 0\` |
| Missing Number | bits / maths | XOR with indices, or \`n(n+1)/2 − sum\` |
| Interval List Intersections | intervals | two pointers |
| My Calendar I | intervals | conflict test; sweep line follow-ups |
| Employee Free Time | intervals | merge, then gaps |
| Minimum Interval to Include Each Query | sweep + heap | offline queries |
| The Skyline Problem | sweep + heap | max changes → output |
| Gas Station | greedy | restart after the deepest deficit |
| Partition Labels | greedy | last occurrence |
| Hand of Straights | greedy | from the smallest |
| Merge Triplets to Form Target Triplet | greedy | filter, then cover |
| Valid Parenthesis String | greedy | \`[lo, hi]\` range |
| Palindrome Pairs | trie / hash | prefix–suffix splits |

## 6. Where people fall down in the room

- Trie nodes as plain objects with 26 slots when the alphabet isn't a–z — use a Map, say why.
- Word Search II without pruning (running Word Search per word) — the interviewer will ask for the trie.
- Bit ops on values ≥ 2³¹ in JS — mention the 32-bit coercion and \`>>> 0\`.
- Sorting intervals by start when the greedy needs **end** (Non-overlapping) — and vice versa.
- Sweep line with equal x: define the tie order (starts before ends, or taller first) explicitly.

**Follow-ups the company likes here:** "Autocomplete at scale" (top-k per node, sharding by prefix), "Intervals arrive as a stream" (My Calendar II/III sweep with a sorted map), "Merge intervals that don't fit in memory" (external sort by start, then a single pass), "Count bits for 10⁹ numbers" (DP on \`i >> 1\`).

## 7. Self-check

1. What can a trie answer that a hash set can't, and at what cost per operation?
2. Word Search II: what is pruned, and when do you clear \`end\`?
3. Why does XOR find the single number? What about "every other appears three times"?
4. Non-overlapping Intervals: why sort by end?
5. Skyline: what goes into the heap, and when do you emit a point?

## 8. My notes

_Your own words here._
`;
