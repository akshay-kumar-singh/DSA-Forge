export const BINARY_SEARCH = `# Binary Search

> **Reach for it when:** the input is sorted — **or the answer space is monotonic**: "the smallest X such that ⟨check(X)⟩ is true", where once the check is true it stays true.
>
> **Say out loud:** "The predicate is monotonic (false…false true…true) → binary search for the first true." Then name the range and the check.

## 1. The idea in one breath

Binary search is not "find a number in a sorted array". It is: **given a predicate that is false for a while and then true forever, find the boundary in O(log n) by halving.** The sorted-array version is just \`predicate(i) = arr[i] >= target\`. Once you see it this way, "Koko eats bananas" and "ship packages in D days" are the same problem: the predicate is \`canFinish(speed)\`, monotonic in \`speed\`.

The company loves the *answer-space* version because it separates people who memorised \`while (lo <= hi)\` from people who understand what they are searching.

## 2. The one template — \`lowerBound\` over a predicate

Your W4 toolkit template. Everything below is this loop with a different \`ok\`.

~~~js
// Smallest x in [lo, hi] with ok(x) true.  ok is monotonic: F F F T T T
function firstTrue(lo, hi, ok) {
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1);     // never overflows in other languages; say it
    if (ok(mid)) hi = mid;                 // mid works → answer is mid or left of it
    else lo = mid + 1;                     // mid fails → answer is right of it
  }
  return lo;                               // == hi. If ok(hi) can be false, check it, or search [lo, hi+1) with a sentinel
}
~~~

~~~text
predicate over indices:   F  F  F  F  T  T  T  T
index:                    0  1  2  3  4  5  6  7
lo=0 hi=7  mid=3 F → lo=4
lo=4 hi=7  mid=5 T → hi=5
lo=4 hi=5  mid=4 T → hi=4
lo=4=hi → answer 4  (3 probes for 8 elements)
~~~

Invariants worth saying: \`ok(x)\` is false for all \`x < lo\`, true for all \`x ≥ hi\`; the loop ends when \`lo === hi\`. Because \`hi = mid\` (not \`mid − 1\`), you never skip the answer; because \`lo = mid + 1\`, the range always shrinks.

**Last true instead of first true?** Search for the first false and subtract one — don't write a second template.

## 3. Sub-pattern A — Sorted array, find a value / an insertion point

- **Binary Search / Search Insert Position:** \`firstTrue(0, n, i => arr[i] >= target)\`; if the result is \`n\` or \`arr[i] !== target\`, it's absent. Insert position *is* lowerBound.
- **Find First and Last Position:** \`lowerBound(target)\` and \`lowerBound(target + 1) − 1\` — your two templates.
- **Sqrt(x):** first \`m\` with \`m·m > x\`, minus one.
- **First Bad Version:** literally \`firstTrue(1, n, isBadVersion)\`; the follow-up is "minimise API calls" — that is exactly what this does (⌈log₂ n⌉ calls).
- **Search a 2D Matrix:** treat as a flat array of \`R·C\`: \`arr[i] = matrix[Math.floor(i / C)][i % C]\`.
- **Find K Closest Elements:** binary search the left edge of the k-window: \`firstTrue(0, n − k, i => x − arr[i] <= arr[i + k] − x)\`.
- **Random Pick with Weight:** prefix sums + \`lowerBound(random·total)\`.

## 4. Sub-pattern B — Rotated / bitonic arrays (the predicate is hidden)

You have to *find* the monotonic predicate.

~~~text
Find Minimum in Rotated Sorted Array: [4, 5, 6, 7, 0, 1, 2]
predicate: nums[i] <= nums[last]     F  F  F  F  T  T  T   → first true = index 4 → 0
~~~

~~~js
function findMin(nums) {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] <= nums[hi]) hi = mid; else lo = mid + 1;
  }
  return nums[lo];
}
~~~

- **Search in Rotated Sorted Array:** at each \`mid\`, one half is sorted; check whether \`target\` lies in the sorted half, else go to the other.
- **Find Peak Element:** predicate \`nums[i] > nums[i + 1]\` (going downhill) is F…F T…T because the array ends with −∞ on both sides → first true is a peak.
- **Single Element in a Sorted Array:** before the single, pairs start at even indices; after, at odd. Predicate on even \`i\`: \`nums[i] !== nums[i + 1]\`.

## 5. Sub-pattern C — Binary search on the answer (the company's favourite)

**Trigger:** "minimum speed / capacity / days such that…", "maximise the minimum", "kth smallest value" — and a **check** you can run in O(n) for a candidate answer.

Recipe (say all four out loud):
1. **Range:** what is the smallest and largest possible answer? (\`lo = 1\`, \`hi = max(piles)\`)
2. **Predicate:** \`ok(x)\` = "is x enough?" — must be monotonic.
3. **Check cost:** O(n) usually.
4. **Total:** O(n log(range)).

~~~text
Koko Eating Bananas: piles = [3, 6, 7, 11], h = 8
speed:    1    2    3    4    5   …   11
hours:   27   15   10    8    7   …    4
ok(≤8)?   F    F    F    T    T   …    T      → first true = 4
~~~

~~~js
function minEatingSpeed(piles, h) {
  const hours = k => piles.reduce((s, p) => s + Math.ceil(p / k), 0);
  let lo = 1, hi = Math.max(...piles);
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (hours(mid) <= h) hi = mid; else lo = mid + 1;
  }
  return lo;
}
~~~

Same skeleton, different \`ok\`:

| Problem | Range | \`ok(x)\` |
|---|---|---|
| Capacity To Ship Packages Within D Days | \`[max(w), sum(w)]\` | greedy-pack with capacity x needs ≤ D days |
| Split Array Largest Sum | \`[max, sum]\` | greedy split with max-sum x needs ≤ k parts |
| Minimum Number of Days to Make m Bouquets | \`[min(bloom), max(bloom)]\` | on day x, adjacent-run counting yields ≥ m bouquets |
| Maximum Candies Allocated to K Children | \`[1, max(candies)]\` | Σ⌊c / x⌋ ≥ k — this one is **last true** (bigger x is harder) |
| Kth Smallest Element in a Sorted Matrix | \`[min, max]\` value | count of cells ≤ x is ≥ k (staircase count, O(R + C)) |
| Minimize Max Distance to Gas Station | real \`[0, maxGap]\` | Σ⌊gap / x⌋ ≤ k — loop 100 times or until \`hi − lo < 1e-6\` |

~~~js
// greedy check for "ship within D days with capacity cap"
const canShip = (weights, D, cap) => {
  let days = 1, load = 0;
  for (const w of weights) { if (load + w > cap) { days++; load = 0; } load += w; }
  return days <= D;
};
~~~

## 6. Sub-pattern D — Two-array partition (Median of Two Sorted Arrays)

The hard one. Binary search **how many elements of A go to the left half** (\`i\`); then \`j = half − i\` from B. The partition is right when \`A[i−1] ≤ B[j]\` and \`B[j−1] ≤ A[i]\`. Search on the shorter array so \`j\` is always valid.

~~~text
A = [1, 3]   B = [2]     total 3 → left half has 2
i=1: left A = [1], left B = [2]      A[0]=1 ≤ B[1]=∞ ✓   B[0]=2 ≤ A[1]=3 ✓ → median = max(1, 2) = 2
~~~

~~~js
function findMedianSortedArrays(A, B) {
  if (A.length > B.length) [A, B] = [B, A];
  const m = A.length, n = B.length, half = (m + n + 1) >> 1;
  let lo = 0, hi = m;
  while (lo <= hi) {
    const i = (lo + hi) >> 1, j = half - i;
    const aL = i ? A[i - 1] : -Infinity, aR = i < m ? A[i] : Infinity;
    const bL = j ? B[j - 1] : -Infinity, bR = j < n ? B[j] : Infinity;
    if (aL <= bR && bL <= aR) return (m + n) % 2 ? Math.max(aL, bL) : (Math.max(aL, bL) + Math.min(aR, bR)) / 2;
    if (aL > bR) hi = i - 1; else lo = i + 1;
  }
}
~~~

## 7. Search a 2D Matrix II — not binary search at all

Rows and columns sorted, but the whole thing is not one sorted list. **Staircase:** start top-right; if the value is too big go left, too small go down. O(R + C). Say why binary search per row (O(R log C)) is worse.

## 8. This week's problems, mapped

| Problem | Sub-pattern | Predicate / idea |
|---|---|---|
| Binary Search | A | \`arr[i] >= target\` |
| Search Insert Position | A | lowerBound |
| Sqrt(x) | A/C | first \`m·m > x\`, −1 |
| First Bad Version | C | \`isBad(v)\` |
| Search a 2D Matrix | A | flatten index |
| Search a 2D Matrix II | (staircase) | top-right walk |
| Find First and Last Position of Element in Sorted Array | A | lowerBound(t), lowerBound(t+1)−1 |
| Find Peak Element | B | \`nums[i] > nums[i+1]\` |
| Find Minimum in Rotated Sorted Array | B | \`nums[i] <= nums[last]\` |
| Search in Rotated Sorted Array | B | which half is sorted |
| Single Element in a Sorted Array | B | pair parity |
| Koko Eating Bananas | C | hours(k) ≤ h |
| Capacity To Ship Packages Within D Days | C | days(cap) ≤ D |
| Minimum Number of Days to Make m Bouquets | C | bouquets(day) ≥ m |
| Maximum Candies Allocated to K Children | C | last true: Σ⌊c/x⌋ ≥ k |
| Kth Smallest Element in a Sorted Matrix | C | count(≤ x) ≥ k |
| Find K Closest Elements | A | window left edge |
| Random Pick with Weight | A | prefix + lowerBound |
| Median of Two Sorted Arrays | D | partition invariant |
| Split Array Largest Sum | C | parts(maxSum) ≤ k |
| Minimize Max Distance to Gas Station | C (real) | Σ⌊gap/x⌋ ≤ k |

## 9. Where people fall down in the room

- Mixing two templates (\`lo <= hi\` with \`hi = mid\`) → infinite loop or off-by-one. Own **one** template and derive everything.
- Not stating the predicate and its monotonicity before coding — that sentence is the whole solution.
- Wrong range (\`lo = 0\` for Koko → division by zero; \`hi = sum\` vs \`max\`).
- Checking \`ok\` in O(n log n) when O(n) is available → total becomes O(n log n log range); say the cost of the check.
- Real-valued answers: iterate a fixed number of times, don't compare doubles for equality.

**Follow-ups the company likes here:** "Minimise API calls" (First Bad Version — it's the probe count), "The array is infinite / you don't know n" (exponential search: double \`hi\` until \`ok\`, then binary search), "Many queries on the same array" (precompute, or offline sorting).

## 10. Self-check

1. Write \`firstTrue\` from memory. Why \`hi = mid\` but \`lo = mid + 1\`?
2. Turn "last true" into "first true" without a second template.
3. Koko: state range, predicate, check cost, total complexity — in one breath.
4. Why is the predicate in Find Minimum in Rotated Sorted Array compared with \`nums[hi]\` and not \`nums[lo]\`?
5. Search a 2D Matrix II: why isn't it binary search, and what is the complexity of the staircase?

## 11. My notes

_Your own words here._
`;
