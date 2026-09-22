export const TOOLKIT = `# Toolkit — the method, JavaScript for interviews, and the six templates

> **Read this first, before week 1.** Everything else in these notes assumes it. The six templates are the data structures JavaScript does not ship with — you bring your own, typed from memory in under five minutes.

## 1. The 45-minute shape of a coding round

Every coding round at the company has the same shape. Learn it like a song; the interviewer is silently checking that you hit each beat.

| Minutes | Beat | What "good" looks like |
|---|---|---|
| 0–4 | **Clarify** | Restate the problem in one sentence. Ask about size (\`n ≤ 10^5\`? fits in memory?), value ranges, duplicates, empty input, what to return on ties. Write one small example by hand. |
| 4–10 | **Brute force → improve** | Say the obvious O(n²) or O(2ⁿ) first, name its cost, then say the *trigger* ("sorted + pairs → two pointers") that improves it. |
| 10–14 | **Agree the approach** | Say the plan in 3–5 lines, state time and space, get a nod. Never start typing without the nod. |
| 14–33 | **Code, narrating** | Small functions, real names, no cleverness. Talk while you type: "the invariant here is…". |
| 33–40 | **Dry run** | Walk your example through the code *line by line*, tracking variables in a comment. Fix what you find — finding your own bug is a plus, not a minus. |
| 40–45 | **Follow-ups** | "What if the input is a stream?", "10¹² elements?", "O(1) extra space?", "thread-safe?", "how would you test it?" |

Two rules the hiring committee actually applies when they read the transcript:

1. **Readable code beats clever code.** They read your verbatim code with no interviewer there to explain it.
2. **Reasoning out loud is the product.** A silent correct solution scores lower than a narrated one with a small bug you caught in the dry run.

## 2. Complexity cheat sheet — say these instantly

~~~text
n = 10        anything works, even n! (3.6M)
n = 20        2^n (1M) — bitmask / subsets ok
n = 100       n^3 (1M) ok
n = 1,000     n^2 (1M) ok
n = 10^5      n log n (1.7M) — n^2 is 10^10: too slow
n = 10^6      n or n log n only
n = 10^9+     log n, or O(1) with maths — you cannot even read the input
~~~

**Rule of thumb: about 10⁸ simple operations per second.** If the constraints say \`n ≤ 10^5\`, the interviewer is *telling you* the answer is O(n log n) or better.

| Structure / op | Time | Notes |
|---|---|---|
| Array index, push, pop | O(1) | \`shift()\` / \`unshift()\` are **O(n)** |
| Map / Set get, set, has | O(1) avg | insertion order preserved — free LRU trick |
| Sort | O(n log n) | \`arr.sort()\` without a comparator sorts **as strings** |
| Binary search | O(log n) | on sorted data or a monotonic predicate |
| Heap push / pop | O(log n) | peek O(1); build from array O(n) |
| BFS / DFS | O(V + E) | grids: V = rows × cols, E ≈ 4V |
| Dijkstra | O((V + E) log V) | with a binary heap |
| Trie insert / search | O(L) | L = word length |
| Union-Find | ~O(1) amortised | path compression + union by rank |

## 3. JavaScript for interviews — the traps

~~~js
// 1. sort() compares as strings unless you pass a comparator
[10, 9, 1].sort();              // [1, 10, 9]  ← wrong
[10, 9, 1].sort((a, b) => a - b); // [1, 9, 10]

// 2. shift() is O(n): a BFS built on it is silently O(n^2). Use a head index (Template: O(1) Queue).

// 3. Shared references in 2-D init
const bad = Array(3).fill([]);            // three references to ONE array
const good = Array.from({ length: 3 }, () => []);
const grid = Array.from({ length: R }, () => Array(C).fill(0));

// 4. Integer maths
Math.floor((lo + hi) / 2);   // fine in JS (no 32-bit overflow on doubles) — but say "lo + (hi - lo >> 1)" if asked about other languages
7 / 2;                       // 3.5 — use Math.floor or (7 / 2) | 0
2 ** 53;                     // MAX_SAFE_INTEGER boundary; use BigInt beyond it

// 5. Bit ops coerce to signed 32-bit
1 << 31;                     // -2147483648
(x >>> 0);                   // treat as unsigned 32-bit

// 6. Map keys are compared by identity for objects
const m = new Map(); m.set([1, 2], 'x'); m.get([1, 2]); // undefined → use a string key: \`\${r},\${c}\`

// 7. Recursion depth is ~10k frames: a DFS over 10^5 linked nodes blows the stack → go iterative with an explicit stack.

// 8. Strings are immutable: building with += in a loop is fine for interviews (engines optimise), but say "I'd use an array and join in production".

// 9. Default params & destructuring keep code short and readable
function dfs(node, depth = 0) { /* ... */ }
const [r, c] = queue[head++];
~~~

Idioms worth having in your fingers:

~~~js
const cnt = new Map(); cnt.set(x, (cnt.get(x) ?? 0) + 1);   // frequency map
const key = arr.join(',');                                   // composite key
for (const [k, v] of map) { /* ordered by insertion */ }
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];              // grid neighbours
const inb = (r, c) => r >= 0 && r < R && c >= 0 && c < C;
Number.MAX_SAFE_INTEGER, -Infinity, Infinity                 // sentinels
~~~

## 4. The six templates — what each is, and the loop you must type from memory

Each arrives the Monday of its pattern week and is rewritten from memory on Sunday. If one takes longer than five minutes, rewrite it daily until it does not.

### 4.1 Template: Binary Search Bounds (W4)

**What:** \`lowerBound\` = first index with \`arr[i] >= target\`; \`upperBound\` = first index with \`arr[i] > target\`. Every "binary search on the answer" is \`lowerBound\` over a predicate.

~~~js
function lowerBound(arr, target) {
  let lo = 0, hi = arr.length;            // answer in [lo, hi]; hi = n means "not found"
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] < target) lo = mid + 1;  // mid is too small → go right
    else hi = mid;                        // mid could be the answer → keep it
  }
  return lo;
}
const upperBound = (arr, t) => lowerBound(arr, t + 1); // for integers; otherwise use arr[mid] <= target
~~~

~~~text
arr   = [1, 2, 2, 2, 3]      target = 2
index    0  1  2  3  4
lowerBound → 1   (first >= 2)
upperBound → 4   (first  > 2)      count of 2s = 4 - 1 = 3
~~~

### 4.2 Template: O(1) Queue (W5)

**What:** an array plus a head index. \`Array.prototype.shift()\` is O(n); BFS on a big grid with \`shift()\` is quadratic and interviewers know it.

~~~js
class Queue {
  constructor() { this.a = []; this.h = 0; }
  push(x) { this.a.push(x); }
  shift() { return this.a[this.h++]; }      // optionally compact when h > a.length / 2
  peek() { return this.a[this.h]; }
  get size() { return this.a.length - this.h; }
}
// Inline version inside a BFS:
const q = [start]; let head = 0;
while (head < q.length) { const cur = q[head++]; /* ... q.push(next) */ }
~~~

### 4.3 Template: MinHeap (W7)

**What:** array-backed binary heap; parent of \`i\` is \`(i - 1) >> 1\`, children \`2i + 1\` and \`2i + 2\`. Push = append + sift up; pop = swap root with last, remove, sift down. The comparator makes it a max-heap or a heap of \`[dist, node]\` tuples.

~~~text
        1                 array: [1, 3, 2, 7, 4]
      /   \\               index:  0  1  2  3  4
     3     2              parent(3) = (3-1)>>1 = 1  → 3   ✓ (3 ≤ 7)
    / \\
   7   4
~~~

~~~js
class MinHeap {
  constructor(compare = (a, b) => a - b) { this.a = []; this.cmp = compare; }
  size() { return this.a.length; }
  peek() { return this.a[0]; }
  push(v) {
    const a = this.a; a.push(v);
    let i = a.length - 1;
    while (i > 0) {                                  // sift up
      const p = (i - 1) >> 1;
      if (this.cmp(a[i], a[p]) >= 0) break;
      [a[i], a[p]] = [a[p], a[i]]; i = p;
    }
  }
  pop() {
    const a = this.a, top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {                                     // sift down
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < a.length && this.cmp(a[l], a[m]) < 0) m = l;
        if (r < a.length && this.cmp(a[r], a[m]) < 0) m = r;
        if (m === i) break;
        [a[i], a[m]] = [a[m], a[i]]; i = m;
      }
    }
    return top;
  }
}
// max-heap: new MinHeap((a, b) => b - a)      Dijkstra: new MinHeap((a, b) => a[0] - b[0])
~~~

### 4.4 Template: UnionFind (W13)

**What:** dynamic connectivity. \`find\` with path compression, \`union\` by rank/size. \`union\` returns \`false\` when both are already connected — that is how you detect the redundant edge / the cycle.

~~~js
class UnionFind {
  constructor(n) { this.p = Array.from({ length: n }, (_, i) => i); this.sz = Array(n).fill(1); this.count = n; }
  find(x) { while (this.p[x] !== x) { this.p[x] = this.p[this.p[x]]; x = this.p[x]; } return x; } // path halving
  union(a, b) {
    let ra = this.find(a), rb = this.find(b);
    if (ra === rb) return false;
    if (this.sz[ra] < this.sz[rb]) [ra, rb] = [rb, ra];   // attach smaller under larger
    this.p[rb] = ra; this.sz[ra] += this.sz[rb]; this.count--;
    return true;
  }
  connected(a, b) { return this.find(a) === this.find(b); }
}
~~~

~~~text
union(0,1) union(1,2) union(3,4)          components: {0,1,2} {3,4}   count = 2
      0        3
     / \\       |
    1   2      4        find(2) → 0,  find(4) → 3,  connected(2,4) → false
~~~

### 4.5 Template: Memoise (W14)

**What:** top-down DP is recursion + a cache keyed on the arguments. Say the state, then wrap.

~~~js
function memoise(fn) {
  const cache = new Map();
  return function (...args) {
    const key = args.length === 1 ? args[0] : args.join('|');
    if (cache.has(key)) return cache.get(key);
    const v = fn.apply(this, args);
    cache.set(key, v);
    return v;
  };
}
// const fib = memoise(n => n < 2 ? n : fib(n - 1) + fib(n - 2));   // note: recursive calls must go through the memoised name
~~~

### 4.6 Template: Trie (W16)

**What:** a prefix tree. A node is \`{ children: Map, end: boolean }\`. Autocomplete and Word Search II are this plus DFS.

~~~text
insert("app"), insert("apt"), insert("bat")
        (root)
        /    \\
       a      b
       |      |
       p      a
      / \\     |
    p*   t*   t*        * = end of a word
~~~

~~~js
class Trie {
  constructor() { this.root = { children: new Map(), end: false }; }
  insert(word) {
    let node = this.root;
    for (const ch of word) {
      if (!node.children.has(ch)) node.children.set(ch, { children: new Map(), end: false });
      node = node.children.get(ch);
    }
    node.end = true;
  }
  #walk(s) { let node = this.root; for (const ch of s) { node = node.children.get(ch); if (!node) return null; } return node; }
  search(word) { const n = this.#walk(word); return !!n && n.end; }
  startsWith(prefix) { return this.#walk(prefix) !== null; }
}
~~~

## 5. The pattern-trigger habit

Before any code, say the trigger sentence out loud — it is the single most predictive habit for passing the loop:

- "Sorted array and I need a pair → **two pointers** from both ends."
- "Contiguous subarray with a longest/shortest constraint → **sliding window**."
- "Need O(1) lookup of something I have seen → **hash map**."
- "Sorted, or the answer is monotonic → **binary search** (on the answer)."
- "Next greater / previous smaller → **monotonic stack**."
- "Top-K, streaming, merge K → **heap**."
- "Tree: path or subtree property → **DFS returning a value**; levels → **BFS**."
- "All combinations / permutations / placements → **backtracking**."
- "Grid, connectivity, shortest unweighted path → **BFS/DFS**; dependencies → **topological sort**; weighted → **Dijkstra**."
- "Count / min / max ways over prefixes or choices → **DP** — say the state, then the recurrence."

## 6. My notes

_Your own additions — what confused you, what you keep forgetting, the words you use for the trigger._
`;
