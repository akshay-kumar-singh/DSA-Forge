export const HASHING = `# Hashing, Frequency Maps & Strings

> **Reach for it when:** counting · "have I seen this before?" · grouping things that are "the same" under some key · you need O(1) lookup to kill an inner loop.
>
> **Say out loud:** "The inner loop is a *search* → replace it with a hash lookup." / "Same-under-a-key → build a canonical key and group."

## 1. The idea in one breath

A hash map turns "search for X" from O(n) into O(1). Nearly every O(n²) brute force with an inner \`for\` that *looks for* something becomes O(n) once you store what you have seen in a \`Map\` or \`Set\`. The second idea is the **canonical key**: two things belong together if they map to the same key (\`sorted letters\`, \`count signature\`, \`row/col/box\`). The third idea is that the map itself can be the data structure of a small system — a cache, a rate limiter, a versioned store.

Very high yield because the company's problems tend to be "implement this small thing cleanly" — and the small thing is usually a map plus one twist.

## 2. Sub-pattern A — Seen-before (one pass, remember the past)

**Trigger:** pairs with a target, duplicates, first unique, "has this appeared".

~~~text
Two Sum: nums = [2, 7, 11, 15], target = 9

i=0  x=2   need 7   seen = {}          → not there; seen[2] = 0
i=1  x=7   need 2   seen = {2:0}       → found → [0, 1]
~~~

~~~js
function twoSum(nums, target) {
  const seen = new Map();                        // value → index
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);                        // store AFTER checking: handles target = 2x with one x
  }
  return [];
}
~~~

**Longest Consecutive Sequence** is the clever version: put everything in a Set; only start counting from numbers whose \`x − 1\` is *not* in the set (they are sequence starts). Each number is visited at most twice → O(n).

~~~js
function longestConsecutive(nums) {
  const set = new Set(nums); let best = 0;
  for (const x of set) {
    if (set.has(x - 1)) continue;                 // not a start
    let len = 1; while (set.has(x + len)) len++;
    best = Math.max(best, len);
  }
  return best;
}
~~~

## 3. Sub-pattern B — Frequency maps

**Trigger:** anagrams, "can I build A from B", majority, top-K frequent, first unique.

~~~js
const cnt = new Map();
for (const c of s) cnt.set(c, (cnt.get(c) ?? 0) + 1);
// For a–z only, an Int32Array(26) is faster and reads well: cnt[c.charCodeAt(0) - 97]++
~~~

**Valid Anagram:** count \`s\` up, count \`t\` down, all zero. Follow-up "Unicode input?" → Map instead of a 26-array (say why: code points beyond 26 letters, surrogate pairs → iterate with \`for…of\`, not by index).

**Top K Frequent Elements:** count → then either a heap of size k (O(n log k)) or **bucket sort** by frequency (O(n)): \`buckets[freq] = [values…]\`, walk from the highest bucket.

~~~text
nums = [1,1,1,2,2,3]   counts {1:3, 2:2, 3:1}
buckets: index 1 → [3]   index 2 → [2]   index 3 → [1]
walk from the top: 1, 2  → k = 2 done
~~~

**Majority Element (Boyer–Moore):** O(1) space — keep a candidate and a count; same value +1, different −1, at 0 switch candidate. Works because the majority survives every cancellation.

## 4. Sub-pattern C — Canonical keys (group by "sameness")

**Trigger:** "group anagrams", "isomorphic", "word pattern", "valid sudoku".

The whole problem is *choosing the key*.

| Problem | Key | Cost of the key |
|---|---|---|
| Group Anagrams | sorted letters \`"aet"\` | O(L log L) per word |
| Group Anagrams (better) | count signature \`"1#0#0#…"\` | O(L) per word — say the trade-off: shorter code vs. optimal |
| Isomorphic Strings | position of first occurrence, for both strings | O(L) — or two maps s→t and t→s |
| Word Pattern | same, but one side is words | split on spaces first |
| Valid Sudoku | strings like \`"r3-5"\`, \`"c7-5"\`, \`"b1-5"\` in one Set | one pass over 81 cells |

~~~js
function groupAnagrams(strs) {
  const groups = new Map();
  for (const w of strs) {
    const key = [...w].sort().join('');            // or a 26-count signature for O(L)
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(w);
  }
  return [...groups.values()];
}
~~~

~~~js
function isIsomorphic(s, t) {                      // bijection: both directions must agree
  const st = new Map(), ts = new Map();
  for (let i = 0; i < s.length; i++) {
    if ((st.has(s[i]) && st.get(s[i]) !== t[i]) || (ts.has(t[i]) && ts.get(t[i]) !== s[i])) return false;
    st.set(s[i], t[i]); ts.set(t[i], s[i]);
  }
  return true;
}
~~~

## 5. Sub-pattern D — The map *is* the system (design problems)

**Trigger:** "design a … with O(1) operations".

- **Design HashMap:** array of buckets, each a list of \`[key, value]\`; \`index = hash(key) % size\`. Talk about **load factor** (resize at 0.75, double, rehash everything) and collisions (chaining vs open addressing).
- **Logger Rate Limiter:** \`Map<message, nextAllowedTimestamp>\`. Follow-up "messages never repeat → memory grows forever": evict entries older than 10 s with a queue, or use a time-bucketed structure.
- **Insert Delete GetRandom O(1):** array for O(1) random + \`Map<value, index>\`; delete = **swap with last, pop**, fix the moved element's index.
- **Time Based Key-Value Store:** \`Map<key, [[timestamp, value], …]>\` — timestamps arrive increasing, so \`get\` is a binary search (upper bound − 1) over the list. (Your W4 template, a week early.)

~~~text
RandomizedSet remove(2):   arr = [5, 2, 9]   idx = {5:0, 2:1, 9:2}
  swap arr[1] ↔ arr[2]:     arr = [5, 9, 2]   idx[9] = 1
  pop:                      arr = [5, 9]      delete idx[2]
~~~

## 6. Sub-pattern E — String implementation care

**Trigger:** the problem is "just do what it says" — and the grading is on edge cases and clean code.

- **Encode and Decode Strings:** length-prefix framing \`"4#lint4#code"\` — never a delimiter that could appear in the data. Decoding reads the number up to \`#\`, then that many characters.
- **String Compression:** read/write pointers (W1) — count a run, write the char, write the digits of the count.
- **Longest Common Prefix:** vertical scan, stop at the first mismatch; or sort and compare first/last.
- **Custom Sort String:** count \`s\`, emit letters in \`order\`, then the rest.
- **Subdomain Visit Count:** split, then for every suffix starting at each dot, add the count.
- **Text Justification:** greedy line packing, then distribute spaces — leftmost gaps get the extra ones; last line left-justified. Write small helpers (\`packLine\`, \`justify\`); this one is graded on structure.

~~~js
// length-prefix framing
const encode = strs => strs.map(s => \`\${s.length}#\${s}\`).join('');
function decode(str) {
  const out = []; let i = 0;
  while (i < str.length) {
    const j = str.indexOf('#', i);
    const len = Number(str.slice(i, j));
    out.push(str.slice(j + 1, j + 1 + len));
    i = j + 1 + len;
  }
  return out;
}
~~~

## 7. This week's problems, mapped

| Problem | Sub-pattern | Key / state |
|---|---|---|
| Two Sum | A | value → index; check before store |
| Contains Duplicate | A | Set size vs length |
| Valid Anagram | B | 26 counts, up then down |
| First Unique Character in a String | B | counts, then first with count 1 |
| Isomorphic Strings | C | two maps (bijection) |
| Word Pattern | C | same, split words |
| Ransom Note | B | magazine counts − note counts ≥ 0 |
| Longest Palindrome | B | pairs ×2, +1 if any odd |
| Longest Common Prefix | E | vertical scan |
| Majority Element | B | Boyer–Moore |
| Design HashMap | D | buckets + load factor |
| Logger Rate Limiter | D | message → next allowed time |
| Group Anagrams | C | sorted key vs count key |
| Top K Frequent Elements | B | bucket by frequency |
| Longest Consecutive Sequence | A | Set; only start at x−1 missing |
| Encode and Decode Strings | E | length-prefix framing |
| Valid Sudoku | C | one Set of composite keys |
| Insert Delete GetRandom O(1) | D | array + index map, swap-with-last |
| Time Based Key-Value Store | D | list per key + binary search |
| Custom Sort String | B/E | counts, emit in order |
| String Compression | E | read/write pointers |
| Subdomain Visit Count | B/E | counts per suffix |
| Text Justification | E | pack, then distribute spaces |

## 8. Where people fall down in the room

- Using an object as a map with numeric keys — keys become strings; \`obj[1]\` and \`obj["1"]\` collide. Use \`Map\`.
- Object keys as Map keys are compared by identity → build a string key (\`\` \`\${r},\${c}\` \`\`).
- Storing before checking in Two Sum (breaks \`target = 2x\` with a single \`x\`).
- Isomorphic with one direction only (\`"ab"\` → \`"aa"\` passes wrongly).
- Not saying the hash-map cost model: O(1) *average*, O(n) worst case, and what a bad hash function does.

**Follow-ups the company likes here:** "The input doesn't fit in memory" (external sort / partition by hash to files), "Unicode" (Map, code points), "Make the rate limiter memory-bounded", "What is the load factor of your HashMap and when do you resize?".

## 9. Self-check

1. In Two Sum, what goes wrong if you insert into the map before you check?
2. Two ways to key Group Anagrams — cost of each, and which you'd pick under time pressure?
3. Why does Longest Consecutive Sequence run in O(n) despite the inner \`while\`?
4. Describe the swap-with-last delete in one sentence.
5. What does load factor mean and why resize at 0.75?

## 10. My notes

_Your own words here._
`;
