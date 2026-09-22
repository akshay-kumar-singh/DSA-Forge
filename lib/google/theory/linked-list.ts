export const LINKED_LIST = `# Linked Lists & Fast/Slow Pointers

> **Reach for it when:** cycle detection · the middle · in-place reversal (whole, partial, in groups) · merging sorted lists · an O(1)-reorder structure behind a cache.
>
> **Say out loud:** "Two pointers at different speeds find the middle / a cycle." / "Reversal is three pointers: prev, cur, next." / "A dummy head removes every edge case at the front."

## 1. The idea in one breath

A linked list gives up random access to gain **O(1) insertion and removal anywhere you already have a pointer**. Every list problem is pointer choreography: you rarely allocate — you *re-wire*. Three habits make all of them easy: a **dummy head** so the first node is not special, **drawing the pointers** before typing, and **never losing the rest of the list** (save \`next\` before you overwrite it).

## 2. The primitives you must type without thinking

~~~js
function ListNode(val, next = null) { this.val = val; this.next = next; }

// Reverse — iterative (O(1) space)
function reverse(head) {
  let prev = null, cur = head;
  while (cur) { const nxt = cur.next; cur.next = prev; prev = cur; cur = nxt; }
  return prev;
}
// Reverse — recursive (say the stack cost: O(n))
function reverseRec(head) {
  if (!head || !head.next) return head;
  const newHead = reverseRec(head.next);
  head.next.next = head; head.next = null;
  return newHead;
}
~~~

~~~text
prev=null  cur=1 → 2 → 3 → null
step: nxt=2;  1.next=null;  prev=1; cur=2         null ← 1   2 → 3
step: nxt=3;  2.next=1;     prev=2; cur=3         null ← 1 ← 2   3
step: nxt=null; 3.next=2;   prev=3; cur=null      null ← 1 ← 2 ← 3   → return 3
~~~

~~~js
// Merge two sorted lists — dummy head, then relink
function mergeTwoLists(a, b) {
  const dummy = new ListNode(0); let t = dummy;
  while (a && b) {
    if (a.val <= b.val) { t.next = a; a = a.next; } else { t.next = b; b = b.next; }
    t = t.next;
  }
  t.next = a ?? b;
  return dummy.next;
}
~~~

## 3. Sub-pattern A — Fast & slow pointers

**Trigger:** middle, cycle, "nth from the end", palindrome.

~~~text
Middle: 1 → 2 → 3 → 4 → 5
slow moves 1, fast moves 2:
  s=1 f=1  →  s=2 f=3  →  s=3 f=5  → fast.next is null → slow = 3 (second middle for even length)
~~~

~~~js
let slow = head, fast = head;
while (fast && fast.next) { slow = slow.next; fast = fast.next.next; }   // slow = middle
~~~

**Cycle (Floyd):** if there is a cycle, fast laps slow and they meet. **Cycle start (Linked List Cycle II):** after they meet, put one pointer back at the head; move both by 1; they meet at the cycle entrance. (Proof sketch: distance head→entrance equals distance meeting→entrance mod cycle length.)

~~~js
function detectCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next; fast = fast.next.next;
    if (slow === fast) {
      let p = head;
      while (p !== slow) { p = p.next; slow = slow.next; }
      return p;
    }
  }
  return null;
}
~~~

**Find the Duplicate Number** is Floyd on the *implicit* list \`i → nums[i]\` — the duplicate is the cycle entrance. O(1) space, no modification; say why the mapping forms a cycle.

**Remove Nth From End:** advance \`fast\` by \`n\`, then move both until \`fast.next\` is null; \`slow.next = slow.next.next\`. Start both from a dummy so removing the head works.

**Palindrome Linked List in O(1) space:** find the middle, reverse the second half, compare, (restore).

**Intersection of Two Lists:** two pointers, each switches to the other list's head when it ends — they align after \`lenA + lenB\` steps.

## 4. Sub-pattern B — Re-wiring (reorder, swap, partial reversal)

**Trigger:** "reorder", "swap in pairs", "reverse between", "reverse in k-groups", "odd even".

Draw the three or four pointers, name them, then write exactly what you drew.

~~~text
Swap Nodes in Pairs:   dummy → 1 → 2 → 3 → 4
   p = dummy, a = 1, b = 2
   p.next = b;  a.next = b.next;  b.next = a;   →  dummy → 2 → 1 → 3 → 4
   p = a (now the node 1), repeat while p.next && p.next.next
~~~

~~~js
function swapPairs(head) {
  const dummy = new ListNode(0, head); let p = dummy;
  while (p.next && p.next.next) {
    const a = p.next, b = a.next;
    p.next = b; a.next = b.next; b.next = a;
    p = a;
  }
  return dummy.next;
}
~~~

**Reverse Nodes in K-Group:** check k nodes exist; reverse that block with the 3-pointer loop; connect the previous block's tail to the new head; move on. **Reorder List (1→n→2→n−1…):** middle → reverse second half → merge alternately. **Odd Even List:** two builders (odd, even), then \`oddTail.next = evenHead\`. **Flatten Multilevel:** DFS with a stack of "next" pointers to come back to, or recursion that returns the tail.

## 5. Sub-pattern C — Merge & sort

- **Merge K Sorted Lists:** min-heap of heads, O(N log k) — or divide-and-conquer pairwise merges, also O(N log k) with no heap. Compare both aloud; the heap version uses your W7 template.
- **Sort List:** merge sort — split at the middle (fast/slow), sort halves, merge. O(n log n), O(log n) stack; bottom-up iterative version is O(1) extra space (the follow-up).
- **Add Two Numbers:** walk both with a carry; dummy head; don't forget the final carry.

## 6. Sub-pattern D — The list behind a cache (LRU / LFU / browser history)

**LRU Cache:** \`Map<key, node>\` + a doubly linked list ordered by recency with dummy head/tail. \`get\` = move node to front; \`put\` = insert/move to front, evict the tail when over capacity. Everything O(1).

~~~text
head ⇄ [3] ⇄ [1] ⇄ [2] ⇄ tail        most recent at the head, evict from the tail
get(1):  unlink 1, insert after head →  head ⇄ [1] ⇄ [3] ⇄ [2] ⇄ tail
~~~

~~~js
class LRUCache {
  constructor(capacity) {
    this.cap = capacity; this.map = new Map();
    this.head = { key: 0, val: 0 }; this.tail = { key: 0, val: 0 };
    this.head.next = this.tail; this.tail.prev = this.head;
  }
  #unlink(n) { n.prev.next = n.next; n.next.prev = n.prev; }
  #toFront(n) { n.next = this.head.next; n.prev = this.head; this.head.next.prev = n; this.head.next = n; }
  get(key) {
    const n = this.map.get(key); if (!n) return -1;
    this.#unlink(n); this.#toFront(n); return n.val;
  }
  put(key, val) {
    let n = this.map.get(key);
    if (n) { n.val = val; this.#unlink(n); }
    else {
      n = { key, val }; this.map.set(key, n);
      if (this.map.size > this.cap) { const lru = this.tail.prev; this.#unlink(lru); this.map.delete(lru.key); }
    }
    this.#toFront(n);
  }
}
// In JS, a plain Map already keeps insertion order: delete + set moves a key to the back — the W19 "LRU (Map-based)" drill. Know both and say the trade-off.
~~~

**LFU Cache:** \`Map<key, node>\` + \`Map<freq, doubly-linked list>\` + \`minFreq\`. On access, move the node from list \`f\` to list \`f+1\`; if list \`f\` was the min and is now empty, \`minFreq++\`. Evict the LRU of \`minFreq\`'s list. Follow-up for LRU: "make it thread-safe" → a lock around get/put, or a striped lock per key range; say what breaks without it (two puts racing on eviction).

**Design Browser History:** a doubly linked list of pages, or simpler an array + a cursor + a "valid length" (visit truncates the forward history).

## 7. This week's problems, mapped

| Problem | Sub-pattern | The one thing to remember |
|---|---|---|
| Reverse Linked List | primitive | prev/cur/nxt; both versions |
| Merge Two Sorted Lists | primitive | dummy head; append the remainder |
| Linked List Cycle | A | Floyd |
| Middle of the Linked List | A | fast/slow |
| Palindrome Linked List | A | reverse second half |
| Swap Nodes in Pairs | B | draw p, a, b |
| Intersection of Two Linked Lists | A | switch heads |
| LRU Cache | D | map + DLL, O(1) |
| Reorder List | B | middle, reverse, weave |
| Remove Nth Node From End of List | A | gap of n, dummy |
| Copy List with Random Pointer | B | interleave copies, set randoms, split |
| Add Two Numbers | C | carry, final carry |
| Find the Duplicate Number | A | Floyd on \`i → nums[i]\` |
| Linked List Cycle II | A | reset one pointer to head |
| Sort List | C | merge sort; bottom-up for O(1) space |
| Odd Even Linked List | B | two builders |
| Flatten a Multilevel Doubly Linked List | B | stack of pending nexts |
| Design Browser History | D | array + cursor |
| Merge K Sorted Lists | C | heap vs divide & conquer |
| Reverse Nodes in K-Group | B | check k, reverse block, reconnect |
| LFU Cache | D | freq buckets + minFreq |

## 8. Where people fall down in the room

- Losing the rest of the list: always \`const nxt = cur.next\` before rewiring.
- No dummy head → special-casing the first node and getting it wrong under pressure.
- Off-by-one in fast/slow for even lengths (first vs second middle) — state which one you return.
- Reverse K-Group without checking that k nodes remain (the tail must stay in order).
- LRU: forgetting to update \`prev\` pointers (it's *doubly* linked — four pointer writes per insert).

**Follow-ups the company likes here:** "Recursive reversal — what's the space cost?", "Thread-safe LRU", "Merge K where K is huge / lists are on disk" (heap of K heads is exactly the external merge), "Detect the cycle without extra memory" (Floyd).

## 9. Self-check

1. Write iterative reversal from memory, with the three pointer names.
2. Why does putting one pointer back at the head find the cycle start?
3. What does the dummy head buy you, concretely, in Remove Nth From End?
4. LRU: list the pointer updates for "move to front".
5. Merge K: complexity of the heap approach and the divide-and-conquer approach — and their memory.

## 10. My notes

_Your own words here._
`;
