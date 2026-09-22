export const HEAPS = `# Heaps, Top-K & Streaming

> **Reach for it when:** "K largest / smallest / closest / most frequent" · a **stream** where you need the min/max/median at any moment · merging K sorted things · scheduling "the next thing that becomes available".
>
> **Say out loud:** "I repeatedly need the current best and the set keeps changing → heap." / "Top-K → a min-heap of size K." / "Median of a stream → two heaps."

## 1. The idea in one breath

A heap is a **priority queue**: \`push\` and \`pop\` the best in O(log n), \`peek\` in O(1). It is *not* sorted — only the root is guaranteed. That's exactly enough when you consume the best one at a time (scheduling, K-way merge) or keep only the K best (top-K). JavaScript has no heap, so the first thing you write this week is your **MinHeap template** (toolkit, W7) — and in the room you say "I'll use a min-heap; I have an implementation, may I assume it?" and most interviewers say yes.

~~~text
Array-backed:   [1, 3, 2, 7, 4]         parent(i) = (i-1) >> 1     children 2i+1, 2i+2
                     1
                   /   \\
                  3     2
                 / \\
                7   4
push(0): append → sift up (0 < 3 swap, 0 < 1 swap) → [0, 3, 1, 7, 4, 2]
pop():   root out, last to root → sift down
~~~

## 2. Sub-pattern A — Top-K with a size-K heap

**Trigger:** "K largest", "K closest", "K most frequent".

Keep a **min-heap of size K** for the K *largest*: every new element goes in; if the size exceeds K, pop the min. What remains is the K largest; the root is the Kth largest. O(n log K) — better than sorting when K ≪ n.

~~~text
Kth largest, k = 2, nums = [3, 2, 1, 5, 6, 4]
push 3 [3]  push 2 [2,3]  push 1 [1,2,3] size>2 pop → [2,3]
push 5 [2,3,5] pop → [3,5]   push 6 → [5,6]   push 4 → [4,5,6] pop → [5,6]
root = 5 ✓
~~~

~~~js
function findKthLargest(nums, k) {
  const h = new MinHeap();
  for (const x of nums) { h.push(x); if (h.size() > k) h.pop(); }
  return h.peek();
}
// Alternative: quickselect, O(n) average, O(n²) worst; say both and pick by constraints.
~~~

- **K Closest Points:** max-heap of size K keyed on squared distance (no \`sqrt\` needed).
- **Top K Frequent Words:** count, then a heap with a comparator (frequency asc, then word *desc*) so the pop order gives the answer; or sort the unique words when n is small — say the trade-off.
- **Kth Largest in a Stream:** the class version — keep the size-K min-heap alive across \`add\` calls.

## 3. Sub-pattern B — Simulation: "always take the current best"

**Trigger:** stones smash, tasks with cooldown, rearrange so no two adjacent are equal.

~~~js
// Last Stone Weight — max-heap; pop two, push the difference
function lastStoneWeight(stones) {
  const h = new MinHeap((a, b) => b - a);
  for (const s of stones) h.push(s);
  while (h.size() > 1) { const a = h.pop(), b = h.pop(); if (a !== b) h.push(a - b); }
  return h.size() ? h.peek() : 0;
}
~~~

**Reorganize String / Task Scheduler:** greedy on the most frequent remaining item, with a *cooldown queue*: pop the most frequent, use it, and only push it back after the cooldown (a queue of \`[item, readyTime]\`). If the heap is empty but the cooldown queue is not, you idle. Task Scheduler also has the closed-form \`max(n, (maxFreq − 1)·(k + 1) + countOfMax)\` — know both, explain the greedy.

~~~text
Reorganize "aab":   counts a:2 b:1     max-heap by count
take a (a:1) → wait one slot;  take b (b:0);  a is back → take a.   "aba"
"aaab": take a, take b, a is back, take a, heap empty but a remains → impossible
~~~

**Ugly Number II:** min-heap seeded with 1; pop the smallest, push ×2, ×3, ×5 (dedupe with a Set). The nth pop is the answer. (The three-pointer DP is the follow-up.)

## 4. Sub-pattern C — Scheduling with two heaps (or heap + sort)

**Trigger:** tasks with start times and durations, servers that become free, meeting rooms.

Sort by start time; a heap holds the things "in progress" keyed by when they finish. Advance time to the next event; move whatever has finished from the busy heap to the free heap.

~~~text
Meeting Rooms II: [[0,30],[5,10],[15,20]]  sorted by start; min-heap of end times
[0,30]  heap [30]                     rooms 1
[5,10]  5 < 30 → new room, heap [10,30]   rooms 2
[15,20] 15 ≥ 10 → reuse: pop 10, push 20 → heap [20,30]   rooms 2
answer 2   (sweep-line alternative: +1 at starts, −1 at ends, sort events, running max)
~~~

~~~js
function minMeetingRooms(intervals) {
  intervals.sort((a, b) => a[0] - b[0]);
  const ends = new MinHeap();
  for (const [s, e] of intervals) {
    if (ends.size() && ends.peek() <= s) ends.pop();   // a room freed up
    ends.push(e);
  }
  return ends.size();
}
~~~

- **Single-Threaded CPU:** sort by enqueue time; available tasks go into a heap by \`[duration, index]\`; when the heap is empty, jump time to the next task's enqueue.
- **Process Tasks Using Servers:** two heaps — free servers by \`[weight, index]\`, busy servers by \`[freeAt, weight, index]\`; at each task, release the busy ones whose \`freeAt ≤ t\`; if none free, jump \`t\` to the earliest \`freeAt\`.
- **Furthest Building:** greedy — use ladders on the biggest climbs so far: keep a min-heap of climbs of size \`ladders\`; when it overflows, the smallest climb pays with bricks; stop when bricks go negative.
- **IPO:** sort projects by capital; a max-heap of profits for everything affordable; pick the most profitable k times.
- **Minimum Cost to Hire K Workers:** sort by \`wage/quality\` ratio; sweep with a max-heap of qualities of size k; cost = ratio × qualitySum.

## 5. Sub-pattern D — Two heaps for the running median

**Trigger:** "median of a stream", "sliding window median".

Keep a **max-heap of the lower half** and a **min-heap of the upper half**, balanced so sizes differ by at most one. Median = root of the bigger heap, or the average of the two roots.

~~~text
add 1:  low [1]         high []           median 1
add 2:  low [1]         high [2]          median 1.5
add 3:  push to low → low [1,3]? no: 3 > high.peek → high [2,3]; rebalance → low [1,2] high [3]   median 2
~~~

~~~js
class MedianFinder {
  constructor() { this.low = new MinHeap((a, b) => b - a); this.high = new MinHeap(); }
  addNum(x) {
    if (!this.low.size() || x <= this.low.peek()) this.low.push(x); else this.high.push(x);
    if (this.low.size() > this.high.size() + 1) this.high.push(this.low.pop());
    else if (this.high.size() > this.low.size()) this.low.push(this.high.pop());
  }
  findMedian() {
    return this.low.size() > this.high.size() ? this.low.peek() : (this.low.peek() + this.high.peek()) / 2;
  }
}
// Follow-up: numbers in [0, 100] → a counting array and walk to the middle; "99% of numbers are in [0,100]" → counts plus two heaps for the tails.
~~~

**Sliding Window Median:** same two heaps, but removal from the middle of a heap is not supported → **lazy deletion**: keep a Map of "to be removed" counts and discard stale roots when they surface; track *effective* sizes for balancing.

## 6. Sub-pattern E — K-way merge and "smallest range"

**Trigger:** K sorted lists / arrays, "smallest range covering one from each list".

A heap of \`[value, listIndex, positionInList]\` — one entry per list. Pop the smallest, push the next from that list. Each element enters once → O(N log K).

**Smallest Range Covering K Lists:** the window is \`[heapMin, currentMax]\`; pop the min, push its successor, update \`currentMax\`; stop when a list runs out. **Design Twitter:** \`getNewsFeed\` is a K-way merge of the followees' tweet lists (each newest-first) — take 10.

## 7. Sub-pattern F — Maximum Frequency Stack (a heap-free "priority")

\`Map<value, freq>\` and \`Map<freq, stack of values>\` plus \`maxFreq\`. \`push\` increments and appends to that frequency's stack; \`pop\` takes from \`stacks[maxFreq]\` and decrements. O(1) — mention it when someone reaches for a heap unnecessarily.

## 8. This week's problems, mapped

| Problem | Sub-pattern | Heap contents / key |
|---|---|---|
| Kth Largest Element in a Stream | A | size-K min-heap kept alive |
| Last Stone Weight | B | max-heap of stones |
| Kth Largest Element in an Array | A | size-K min-heap vs quickselect |
| K Closest Points to Origin | A | size-K max-heap by \`x²+y²\` |
| Top K Frequent Words | A | comparator: freq asc, word desc |
| Task Scheduler | B | max-heap of counts + cooldown queue |
| Reorganize String | B | max-heap + the one you just used |
| Sort Characters By Frequency | A | counts, sort/heap by freq |
| Meeting Rooms II | C | min-heap of end times |
| Ugly Number II | B | min-heap + Set |
| Furthest Building You Can Reach | C | min-heap of the biggest climbs |
| Single-Threaded CPU | C | \`[duration, index]\`, time jumps |
| Process Tasks Using Servers | C | free and busy heaps |
| Design Twitter | E | K-way merge of followee lists |
| Find Median from Data Stream | D | low max-heap, high min-heap |
| Smallest Range Covering Elements from K Lists | E | \`[val, list, pos]\` + running max |
| Minimum Cost to Hire K Workers | C | sort by ratio, size-k max-heap of quality |
| IPO | C | affordable projects max-heap |
| Sliding Window Median | D | two heaps + lazy deletion |
| Maximum Frequency Stack | F | freq → stack |

## 9. Where people fall down in the room

- Reaching for a heap when a **sort** is simpler and the same complexity (n log n) — say why the heap wins (streaming, or K ≪ n).
- Comparators the wrong way round (\`a − b\` is a *min*-heap). For tuples, compare element by element.
- Using \`Array.sort\` inside a loop to fake a heap → O(n² log n).
- Two-heap median: forgetting to rebalance after *every* insert.
- Lazy deletion: comparing raw heap sizes instead of effective sizes.

**Follow-ups the company likes here:** "Numbers are in a small range" (counting beats heaps), "The stream is infinite — memory?" (size-K bounds it), "Many machines each have a stream" (per-machine top-K, then merge — the K-way merge again), "Implement the heap" (your template).

## 10. Self-check

1. Why does a min-heap of size K give the K *largest*?
2. Write \`push\` (sift up) from memory. What is the array index of the parent?
3. Reorganize String: what does the cooldown queue hold, and when do you push back?
4. Two-heap median: what is the invariant on the sizes, and which root is the median when they differ?
5. K-way merge: what exactly is in the heap and what is the complexity?

## 11. My notes

_Your own words here._
`;
