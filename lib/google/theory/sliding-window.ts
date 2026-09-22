export const SLIDING_WINDOW = `# Sliding Window

> **Reach for it when:** a *contiguous* subarray or substring, and the question is "longest / shortest / count such that ⟨a constraint⟩".
>
> **Say out loud:** "Contiguous + a constraint that gets *worse* as the window grows → sliding window: grow right, shrink left until valid."

## 1. The idea in one breath

A window is a pair of indices \`[l, r]\`. You move \`r\` forward one step at a time (adding an element), and whenever the window breaks the constraint you move \`l\` forward (removing elements) until it is valid again. Both pointers only ever move right, so the whole thing is **O(n)** even though there is a loop inside a loop. The brute force is "try every subarray" (O(n²) or O(n³)); the window replaces it by *reusing* the work of the previous subarray.

The only prerequisite: the constraint must be **monotonic** — if a window is invalid, every larger window containing it is invalid too (distinct-count, sum of positives, frequency counts…). If it isn't (e.g. sum with negatives), the window pattern is the wrong tool; think prefix sums + hash map instead.

## 2. Sub-pattern A — Fixed-size window

**Trigger:** "every window of size k", "average of k consecutive", "anagram of p in s".

~~~text
nums = [1, 12, -5, -6, 50, 3]   k = 4

[1, 12, -5, -6]  50  3      sum =  2
 1 [12, -5, -6, 50]  3      sum =  2 - 1  + 50 = 51    ← subtract the one leaving, add the one entering
 1  12 [-5, -6, 50, 3]      sum = 51 - 12 + 3  = 42
max average = 51 / 4 = 12.75
~~~

~~~js
function findMaxAverage(nums, k) {
  let sum = 0;
  for (let i = 0; i < k; i++) sum += nums[i];
  let best = sum;
  for (let r = k; r < nums.length; r++) {
    sum += nums[r] - nums[r - k];          // slide: add entering, drop leaving
    best = Math.max(best, sum);
  }
  return best / k;
}
~~~

For strings (**Permutation in String**, **Find All Anagrams**) the window state is a frequency array of 26 counts plus a "how many letters currently match" counter, so each slide is O(1) instead of comparing 26 counts.

~~~js
function findAnagrams(s, p) {
  if (p.length > s.length) return [];
  const need = Array(26).fill(0), have = Array(26).fill(0), A = 97, out = [];
  for (const ch of p) need[ch.charCodeAt(0) - A]++;
  let matches = 0;                                     // letters whose have === need
  for (let i = 0; i < 26; i++) if (need[i] === 0) matches++;
  const bump = (c, d) => {                             // update have[c] by d, keep matches right
    if (have[c] === need[c]) matches--;
    have[c] += d;
    if (have[c] === need[c]) matches++;
  };
  for (let r = 0; r < s.length; r++) {
    bump(s.charCodeAt(r) - A, +1);
    if (r >= p.length) bump(s.charCodeAt(r - p.length) - A, -1);
    if (matches === 26) out.push(r - p.length + 1);
  }
  return out;
}
~~~

## 3. Sub-pattern B — Variable window, "longest such that…"

**Trigger:** longest substring/subarray with *at most K* of something, no repeats, at most K flips.

The loop is always the same four lines. The **state** (a Map, a count, a sum) is the only thing that changes between problems.

~~~js
let l = 0, best = 0;
for (let r = 0; r < n; r++) {
  add(a[r]);                              // 1. grow
  while (!valid()) remove(a[l++]);        // 2. shrink until valid
  best = Math.max(best, r - l + 1);       // 3. record — the window is valid here
}
~~~

~~~text
Longest Substring Without Repeating Characters: s = "abcabcbb"

r=0 [a]            valid  best=1
r=1 [a b]          valid  best=2
r=2 [a b c]        valid  best=3
r=3 [a b c a]  ✗   shrink: drop 'a' → [b c a]      best=3
r=4 [b c a b]  ✗   shrink: drop 'b' → [c a b]
r=5 [c a b c]  ✗   shrink: drop 'c' → [a b c]
r=6 [a b c b]  ✗   shrink: drop 'a','b' → [c b]
r=7 [c b b]    ✗   shrink: drop 'c','b' → [b]
answer 3
~~~

~~~js
function lengthOfLongestSubstring(s) {
  const last = new Map();                       // char → last index seen
  let l = 0, best = 0;
  for (let r = 0; r < s.length; r++) {
    const c = s[r];
    if (last.has(c) && last.get(c) >= l) l = last.get(c) + 1;   // jump l past the repeat (an O(1) "shrink")
    last.set(c, r);
    best = Math.max(best, r - l + 1);
  }
  return best;
}

// At most K distinct (Fruit Into Baskets is K = 2):
function atMostKDistinct(s, k) {
  const cnt = new Map();
  let l = 0, best = 0;
  for (let r = 0; r < s.length; r++) {
    cnt.set(s[r], (cnt.get(s[r]) ?? 0) + 1);
    while (cnt.size > k) {
      cnt.set(s[l], cnt.get(s[l]) - 1);
      if (cnt.get(s[l]) === 0) cnt.delete(s[l]);
      l++;
    }
    best = Math.max(best, r - l + 1);
  }
  return best;
}
~~~

**Max Consecutive Ones III / Longest Subarray of 1s After Deleting One:** the state is "zeros in window"; valid = \`zeros ≤ k\` (for the deletion one, k = 1 and the answer is \`window − 1\`).

**Longest Repeating Character Replacement:** valid = \`windowLen − maxFreq ≤ k\`. Trick everyone misses: \`maxFreq\` never needs to *decrease* — a stale (too large) \`maxFreq\` only lets the window stay the same size, never grow wrongly, and the answer is the max window size. So it is O(n) with no rescan.

**Frequency of the Most Frequent Element:** sort; window is valid when \`nums[r] * len − sum ≤ k\` (cost to raise everything to the right end).

## 4. Sub-pattern C — Variable window, "shortest such that…"

**Trigger:** minimum length with sum ≥ target; minimum window containing all of t.

Same loop, but you record **inside the shrink loop** — the window is valid *while* shrinking, and you want the smallest valid one.

~~~js
function minSubArrayLen(target, nums) {
  let l = 0, sum = 0, best = Infinity;
  for (let r = 0; r < nums.length; r++) {
    sum += nums[r];
    while (sum >= target) {                          // valid → record, then try smaller
      best = Math.min(best, r - l + 1);
      sum -= nums[l++];
    }
  }
  return best === Infinity ? 0 : best;
}
~~~

**Minimum Window Substring** is the canonical hard: state = \`need\` map + a counter \`formed\` of characters whose count is satisfied; valid when \`formed === need.size\`.

~~~text
s = "ADOBECODEBANC", t = "ABC"
need = {A:1, B:1, C:1}

r=5   [ADOBEC]        formed=3 ✓ record 6 → shrink: drop A → formed=2, l=1
r=10  [DOBECODEBA]    A is back → formed=3 ✓ record 10
      shrink while valid: DOBECODEBA → OBECODEBA → BECODEBA → ECODEBA → CODEBA (6)
      drop C → formed=2, l=6
r=12  [ODEBANC]       C is back → ✓ record 7
      shrink: DEBANC (6) → EBANC (5) → BANC (4) ✓ → drop B → formed=2
answer "BANC"
~~~

~~~js
function minWindow(s, t) {
  const need = new Map(); for (const c of t) need.set(c, (need.get(c) ?? 0) + 1);
  const have = new Map();
  let formed = 0, l = 0, best = [0, Infinity];
  for (let r = 0; r < s.length; r++) {
    const c = s[r];
    have.set(c, (have.get(c) ?? 0) + 1);
    if (need.has(c) && have.get(c) === need.get(c)) formed++;
    while (formed === need.size) {
      if (r - l < best[1] - best[0]) best = [l, r];
      const d = s[l++];
      if (need.has(d) && have.get(d) === need.get(d)) formed--;
      have.set(d, have.get(d) - 1);
    }
  }
  return best[1] === Infinity ? '' : s.slice(best[0], best[1] + 1);
}
~~~

## 5. Sub-pattern D — "Exactly K" = atMost(K) − atMost(K − 1)

**Trigger:** count subarrays with *exactly* k odd numbers / k distinct integers.

"Exactly k" is not monotonic, but "at most k" is. So count windows with at most k, subtract those with at most k−1. In \`atMost\`, every valid window ending at \`r\` contributes \`r − l + 1\` subarrays.

~~~js
function numberOfSubarrays(nums, k) {          // Count Number of Nice Subarrays
  const atMost = k => {
    let l = 0, odd = 0, count = 0;
    for (let r = 0; r < nums.length; r++) {
      odd += nums[r] & 1;
      while (odd > k) odd -= nums[l++] & 1;
      count += r - l + 1;                        // all subarrays [l..r], [l+1..r], … [r..r]
    }
    return count;
  };
  return atMost(k) - atMost(k - 1);
}
// Subarrays with K Different Integers: same with a distinct-count map.
~~~

## 6. Sub-pattern E — Monotonic deque (Sliding Window Maximum)

**Trigger:** max/min of every window of size k in O(n).

Keep a deque of *indices* whose values are decreasing. Front = current max. Push \`r\`: pop from the back everything smaller than \`nums[r]\` (they can never be a max while \`r\` is in the window). Pop the front when it leaves the window.

~~~text
nums = [1, 3, -1, -3, 5, 3, 6, 7], k = 3          deque holds indices, values shown

r=0 push 1          [1]
r=1 3 > 1 pop; push [3]
r=2 push -1         [3, -1]         window [0..2] max = 3
r=3 push -3         [3, -1, -3]     window [1..3] max = 3
r=4 5 pops all      [5]             window [2..4] max = 5
r=5 push 3          [5, 3]          max 5
r=6 6 pops all      [6]             max 6
r=7 7 pops all      [7]             max 7        → [3, 3, 5, 5, 6, 7]
~~~

~~~js
function maxSlidingWindow(nums, k) {
  const dq = []; let head = 0; const out = [];      // dq as array + head index (O(1) queue)
  for (let r = 0; r < nums.length; r++) {
    while (dq.length > head && nums[dq[dq.length - 1]] <= nums[r]) dq.pop();
    dq.push(r);
    if (dq[head] <= r - k) head++;                    // front left the window
    if (r >= k - 1) out.push(nums[dq[head]]);
  }
  return out;
}
~~~

**Minimum Number of K Consecutive Bit Flips:** a window of "flips still in effect" — keep a running parity of flips that started within the last k positions (a queue of start indices or a difference array).

## 7. This week's problems, mapped

| Problem | Sub-pattern | State / validity |
|---|---|---|
| Best Time to Buy and Sell Stock | (Kadane cousin) | track min so far; best = price − min |
| Maximum Average Subarray I | A | running sum of k |
| Longest Substring Without Repeating Characters | B | last index map; jump \`l\` |
| Longest Repeating Character Replacement | B | \`len − maxFreq ≤ k\`; maxFreq never decreases |
| Permutation in String | A | 26 counts + matches |
| Minimum Size Subarray Sum | C | sum ≥ target, record while shrinking |
| Fruit Into Baskets | B | at most 2 distinct |
| Max Consecutive Ones III | B | zeros ≤ k |
| Find All Anagrams in a String | A | 26 counts + matches |
| Longest Substring with At Most K Distinct Characters | B | Map size ≤ k — then "at most two", "exactly K" |
| Count Number of Nice Subarrays | D | atMost(k) − atMost(k−1) |
| Longest Subarray of 1s After Deleting One Element | B | zeros ≤ 1; answer = len − 1 |
| Frequency of the Most Frequent Element | B | sort; \`nums[r]·len − sum ≤ k\` |
| Minimum Window Substring | C | need/have + formed |
| Sliding Window Maximum | E | decreasing deque of indices |
| Subarrays with K Different Integers | D | atMost with distinct map |
| Minimum Number of K Consecutive Bit Flips | (window of effects) | parity of active flips |
| Substring with Concatenation of All Words | A ×wordLen | word-sized steps, one window per offset |

## 8. Where people fall down in the room

- Using a window when the constraint is **not monotonic** (sums with negatives) — say why it fails and switch to prefix sums.
- Recording in the wrong place: *longest* records after the shrink loop, *shortest* records inside it.
- Forgetting to remove the map key when its count hits 0 (\`cnt.size\` is then wrong).
- Off-by-one on window length: it is \`r − l + 1\`. Say it.
- Sliding Window Maximum with \`shift()\` — O(n·k) in disguise; use a head index.

**Follow-ups the company likes here:** "The string is a stream — can you keep the answer updated?" (yes, the window state is exactly what you keep), "Unicode instead of a–z?" (Map instead of a 26-array), "Exactly K instead of at most K?" (sub-pattern D).

## 9. Self-check

1. What property must the constraint have for a window to be correct? Give one constraint that breaks it.
2. Write the four-line "longest" loop from memory, then say which line moves for "shortest".
3. Why can \`maxFreq\` stay stale in Longest Repeating Character Replacement?
4. In "at most K", why does each valid window add \`r − l + 1\` to the count?
5. Sliding Window Maximum: why store indices instead of values?

## 10. My notes

_Your own words here._
`;
