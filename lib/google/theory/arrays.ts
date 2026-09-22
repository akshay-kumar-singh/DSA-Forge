export const ARRAYS = `# Arrays, Two Pointers & Prefix Sums

> **Reach for it when:** sorted array · pairs / triplets · in-place partitioning · running totals over a range.
>
> **Say out loud:** "It's sorted and I need a pair → two pointers from both ends." / "I need range sums many times → prefix sums." / "Rearrange in place → read/write pointers."

## 1. The idea in one breath

An array is memory laid out in a line. Almost every array trick is one of three moves: **walk it with two indices instead of one** (turning a nested loop into a single pass), **precompute running totals** so any range costs O(1), or **rewrite it in place** so you use no extra memory. The interviewer is watching whether you can name *which* move applies within the first minute.

## 2. Sub-pattern A — Opposite-ends two pointers

**Trigger:** sorted input (or something you can sort), and you want a pair/triplet with a target sum, or you're maximising something between two ends.

~~~text
numbers = [2, 7, 11, 15]   target = 9

  L→                         ←R
  [2,   7,   11,   15]
   L=0            R=3    2+15 = 17 > 9  → move R left (sum too big)
   L=0       R=2         2+11 = 13 > 9  → move R left
   L=0  R=1              2+7  =  9 ✓
~~~

Why it works: with the array sorted, if \`sum > target\` the only way down is moving \`R\` left; if \`sum < target\` only moving \`L\` right helps. Each step discards one element for good → **O(n)**.

~~~js
function twoSumSorted(numbers, target) {
  let l = 0, r = numbers.length - 1;
  while (l < r) {
    const sum = numbers[l] + numbers[r];
    if (sum === target) return [l + 1, r + 1];   // 1-indexed per the problem
    if (sum < target) l++; else r--;
  }
  return [-1, -1];
}
~~~

**3Sum = sort + fix one + two-pointer the rest.** The thing they watch is *de-duplication*: skip equal values at \`i\`, and after a hit skip equal values at \`l\` and \`r\`.

~~~js
function threeSum(nums) {
  nums.sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue;          // dedupe the anchor
    if (nums[i] > 0) break;                                   // sorted: no triple can sum to 0
    let l = i + 1, r = nums.length - 1;
    while (l < r) {
      const s = nums[i] + nums[l] + nums[r];
      if (s === 0) {
        out.push([nums[i], nums[l], nums[r]]);
        while (l < r && nums[l] === nums[l + 1]) l++;          // dedupe l
        while (l < r && nums[r] === nums[r - 1]) r--;          // dedupe r
        l++; r--;
      } else if (s < 0) l++; else r--;
    }
  }
  return out;
}
~~~
O(n²) time, O(1) extra (ignoring the sort and the output).

**Container With Most Water:** move the *shorter* wall inward — the taller one can never do better with a narrower width. **Trapping Rain Water:** water at \`i\` = \`min(maxLeft, maxRight) − height[i]\`; two pointers keep \`leftMax\`/\`rightMax\` and always advance the side whose max is smaller (that side's water is decided). **Boats to Save People:** sort; pair the heaviest with the lightest if they fit, else the heaviest goes alone.

## 3. Sub-pattern B — Same-direction pointers (read / write): in-place rewriting

**Trigger:** "remove", "move to end", "compact", "partition in place", "O(1) extra space".

The **write** pointer marks the end of the finished prefix; the **read** pointer scans. Invariant: \`[0, write)\` is the answer so far.

~~~text
Move Zeroes: nums = [0, 1, 0, 3, 12]

 read →   0   1   0   3   12
 write=0  ^                     read 0: skip
 write=0      ^                 read 1: nums[write]=1, write=1
 write=1          ^             read 0: skip
 write=1              ^         read 3: nums[write]=3, write=2
 write=2                  ^     read 12: nums[write]=12, write=3
 then fill [write, n) with 0 → [1, 3, 12, 0, 0]
~~~

~~~js
function moveZeroes(nums) {
  let w = 0;
  for (let r = 0; r < nums.length; r++) {
    if (nums[r] !== 0) { if (r !== w) [nums[w], nums[r]] = [nums[r], nums[w]]; w++; } // swap keeps total writes minimal
  }
}
// Remove Duplicates from Sorted Array: same loop, condition is nums[r] !== nums[w - 1]
~~~

**Dutch national flag (Sort Colors):** three regions with two writers and one reader — \`[0,lo)\` = 0s, \`[lo,mid)\` = 1s, \`(hi, n)\` = 2s, \`mid\` scans. On a 0 swap with \`lo++\`, on a 2 swap with \`hi--\` **and do not advance mid** (the swapped-in element is unknown).

~~~js
function sortColors(nums) {
  let lo = 0, mid = 0, hi = nums.length - 1;
  while (mid <= hi) {
    if (nums[mid] === 0) { [nums[lo], nums[mid]] = [nums[mid], nums[lo]]; lo++; mid++; }
    else if (nums[mid] === 2) { [nums[hi], nums[mid]] = [nums[mid], nums[hi]]; hi--; }
    else mid++;
  }
}
~~~

**Merge Sorted Array (nums1 has room at the back):** fill from the back with three pointers so you never overwrite unread data.

**Squares of a Sorted Array:** the biggest square is at one of the two ends → two pointers from the ends, write from the back.

## 4. Sub-pattern C — Prefix sums (+ hash map)

**Trigger:** "sum of subarray", "range sum queries", "count subarrays with sum k", "equal number of 0s and 1s".

~~~text
nums   =      [-2,  0,  3, -5,  2, -1]
prefix = [0,  -2, -2,  1, -4, -2, -3]      prefix[i] = sum of nums[0..i-1]

sum(nums[l..r]) = prefix[r+1] - prefix[l]
sum(nums[0..2]) = prefix[3] - prefix[0] = 1 - 0 = 1   ✓ (-2 + 0 + 3)
~~~

~~~js
const prefix = [0];
for (const x of nums) prefix.push(prefix[prefix.length - 1] + x);
const rangeSum = (l, r) => prefix[r + 1] - prefix[l];
~~~

**Counting subarrays with sum = k** is the important upgrade: a subarray \`[j+1..i]\` sums to \`k\` exactly when \`prefix[i] − prefix[j] = k\`, so while scanning, count how many earlier prefixes equal \`prefix[i] − k\`.

~~~js
function subarraySum(nums, k) {
  const seen = new Map([[0, 1]]);          // prefix 0 occurs once (empty prefix)
  let run = 0, count = 0;
  for (const x of nums) {
    run += x;
    count += seen.get(run - k) ?? 0;
    seen.set(run, (seen.get(run) ?? 0) + 1);
  }
  return count;
}
~~~

**Contiguous Array:** map 0 → −1, then "equal 0s and 1s" = "subarray sum 0" = "same prefix seen before"; store the *first* index of each prefix and take the longest gap. **Find Pivot Index:** \`left == total − left − nums[i]\`. **Product of Array Except Self:** prefix products from the left, then a running suffix product from the right, in place → O(1) extra.

## 5. Sub-pattern D — Kadane (max subarray) and its relatives

**Trigger:** "maximum sum contiguous subarray".

Idea: at each index, the best subarray *ending here* is either just \`nums[i]\` or \`nums[i]\` extended from the best ending at \`i−1\`.

~~~text
nums    = [-2,  1, -3,  4, -1,  2,  1, -5,  4]
endHere = [-2,  1, -2,  4,  3,  5,  6,  1,  5]     endHere = max(x, endHere + x)
best    =  max of endHere = 6   → [4, -1, 2, 1]
~~~

~~~js
function maxSubArray(nums) {
  let endHere = nums[0], best = nums[0], start = 0, bestL = 0, bestR = 0;
  for (let i = 1; i < nums.length; i++) {
    if (endHere < 0) { endHere = nums[i]; start = i; } else endHere += nums[i];
    if (endHere > best) { best = endHere; bestL = start; bestR = i; }
  }
  return best;            // follow-up: return [bestL, bestR]
}
~~~
**Longest Mountain:** for each peak, expand left while increasing and right while decreasing (or two passes of run lengths).

## 6. Sub-pattern E — Rearrangement tricks

- **Rotate Array by k:** three reversals — reverse all, reverse \`[0,k)\`, reverse \`[k,n)\`. In place, O(n). Take \`k %= n\` first.
- **Next Permutation:** from the right find the first \`i\` with \`nums[i] < nums[i+1]\` (the "pivot"); find the rightmost \`j > i\` with \`nums[j] > nums[i]\`; swap; reverse the suffix after \`i\`. If no pivot, reverse everything.

~~~text
[1, 5, 8, 4, 7, 6, 5, 3, 1]
          ^ pivot i=3 (4 < 7)          suffix [7,6,5,3,1] is descending
swap with rightmost > 4 → 5:  [1, 5, 8, 5, 7, 6, 4, 3, 1]
reverse suffix:               [1, 5, 8, 5, 1, 3, 4, 6, 7]
~~~

## 7. This week's problems, mapped

| Problem | Sub-pattern | The one thing to remember |
|---|---|---|
| Valid Palindrome | A | skip non-alphanumerics from both ends; lowercase |
| Move Zeroes | B | read/write, swap to minimise writes |
| Remove Duplicates from Sorted Array | B | compare with \`nums[write−1]\` |
| Squares of a Sorted Array | A | biggest at an end, write from the back |
| Merge Sorted Array | B | fill from the back |
| Find Pivot Index | C | \`left === total − left − x\` |
| Range Sum Query Immutable | C | precompute once, answer O(1) |
| Two Sum II | A | sorted → shrink from the ends |
| 3Sum | A | anchor + two pointers; three dedupe lines |
| Container With Most Water | A | move the shorter wall |
| Sort Colors | B | Dutch flag; don't advance \`mid\` after a 2-swap |
| Product of Array Except Self | C | prefix products, then a running suffix |
| Subarray Sum Equals K | C | prefix + map; seed \`{0: 1}\` |
| Maximum Subarray | D | Kadane; track indices for the follow-up |
| Contiguous Array | C | 0 → −1, first index of each prefix |
| Rotate Array | E | three reversals, \`k %= n\` |
| Next Permutation | E | pivot, rightmost bigger, swap, reverse suffix |
| Boats to Save People | A | sort; heaviest + lightest |
| Longest Mountain in Array | D | peaks; expand both ways |
| Trapping Rain Water | A | two pointers with leftMax/rightMax |

## 8. Where people fall down in the room

- Forgetting the input must be **sorted** for opposite-end pointers — say "if it isn't sorted I sort first, O(n log n)".
- 3Sum without the dedupe lines → duplicate triplets → fail.
- Prefix sums off by one: define \`prefix[0] = 0\` and \`prefix\` has length \`n+1\`, then \`sum(l..r) = prefix[r+1] − prefix[l]\`. Say it before you write it.
- Kadane with all negatives: initialise with \`nums[0]\`, not 0.
- \`k > n\` in Rotate Array; \`n = 0\`/\`1\` everywhere.

**Follow-ups the company likes here:** "What if the array doesn't fit in memory?" (stream → prefix sums still work one pass; two pointers don't), "Return the indices, not the value", "Now do it with O(1) extra space".

## 9. Self-check (say the answers out loud, then start the first problem)

1. Why do opposite-end pointers need sorted input? What breaks if it isn't?
2. What is the invariant of the write pointer in Move Zeroes?
3. Write the formula for \`sum(l..r)\` with a prefix array of length \`n+1\`.
4. In Subarray Sum Equals K, why seed the map with \`{0: 1}\`?
5. Kadane: what does \`endHere\` mean, in one sentence?

## 10. My notes

_Your own words here — what clicked, what didn't, the trigger sentence you actually use._
`;
