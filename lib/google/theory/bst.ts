export const BST = `# BSTs & Tree Construction

> **Reach for it when:** ordered data in a tree (search, kth, successor, range) · build a tree from traversals or a sorted array · serialise / deserialise.
>
> **Say out loud:** "BST → in-order is sorted, and every node is a *range* (lo, hi), not just bigger than its parent." / "Construction → the first of pre-order is the root; find it in in-order to split."

## 1. The idea in one breath

A binary search tree keeps \`left < node < right\` **for the entire subtree**, so:
- **in-order traversal is sorted** — kth smallest, successor, "is it valid", recovery, and "greater tree" all fall out of an in-order walk;
- **search is a walk**: go left or right by comparing, O(h) where \`h\` is the height (log n if balanced, n if degenerate — say it);
- **every node lives in a range** \`(lo, hi)\` inherited from its ancestors — validation and pruning use that range, not the parent.

Construction problems are the other half of the week: a tree is determined by *root + which nodes go left + which go right*, and traversals tell you exactly that.

## 2. Sub-pattern A — Search / prune with the BST property

~~~text
        10
       /  \\
      5    15
     / \\     \\
    3   7     18       Range Sum [7, 15]: at 10 go both ways; at 5 skip left (all < 5 < 7); at 15 skip right (18 > 15)
~~~

~~~js
function rangeSumBST(root, lo, hi) {
  if (!root) return 0;
  if (root.val < lo) return rangeSumBST(root.right, lo, hi);     // whole left subtree too small
  if (root.val > hi) return rangeSumBST(root.left, lo, hi);
  return root.val + rangeSumBST(root.left, lo, hi) + rangeSumBST(root.right, lo, hi);
}

function lowestCommonAncestorBST(root, p, q) {                     // no recursion needed: walk
  while (root) {
    if (p.val < root.val && q.val < root.val) root = root.left;
    else if (p.val > root.val && q.val > root.val) root = root.right;
    else return root;                                              // split point
  }
}
~~~

**Closest Value:** walk down, keeping the best \`|val − target|\`. **Trim:** if \`val < lo\` the answer is \`trim(right)\`; if \`val > hi\` it's \`trim(left)\`; else trim both children and keep the node. **Insert:** walk to the null spot. **Inorder Successor:** walk down; whenever you go left, remember the node (it's a candidate); if going right, no update.

## 3. Sub-pattern B — Validate with ranges (the classic trap)

Comparing only with the parent is **wrong**: \`[5, 1, 4, null, null, 3, 6]\` has 3 under 4 under 5 — 3 < 4 ✓ locally but 3 < 5 ✗ globally.

~~~js
function isValidBST(root, lo = -Infinity, hi = Infinity) {
  if (!root) return true;
  if (root.val <= lo || root.val >= hi) return false;             // strict: duplicates are invalid
  return isValidBST(root.left, lo, root.val) && isValidBST(root.right, root.val, hi);
}
// Alternative: in-order walk must be strictly increasing (keep prev).
~~~

**Recover BST** (two nodes swapped): in-order walk; the first time \`prev > cur\` mark \`first = prev\`; every time it happens mark \`second = cur\`; swap the values. **Delete Node:** find it; if two children, replace its value with the in-order successor's (min of the right subtree) and delete that from the right subtree.

## 4. Sub-pattern C — In-order as a sequence (kth, iterator, greater tree)

~~~text
        3
       / \\
      1   4        in-order: 1 2 3 4  → kth smallest (k=2) = 2
       \\
        2
Reverse in-order (right, me, left): 4 3 2 1 → running sum gives "greater tree": 4, 7, 9, 10
~~~

~~~js
function kthSmallest(root, k) {
  const st = []; let cur = root;
  while (cur || st.length) {
    while (cur) { st.push(cur); cur = cur.left; }
    cur = st.pop();
    if (--k === 0) return cur.val;
    cur = cur.right;
  }
}
// Follow-up "frequent inserts + kth queries": augment nodes with subtree size → O(h) per query.
~~~

**BST Iterator** is this loop split across calls: the stack holds the "left spine"; \`next()\` pops, pushes the popped node's right spine; \`hasNext()\` = stack non-empty. Memory O(h), amortised O(1) per \`next\`. **Convert BST to Greater Tree:** reverse in-order with a running total.

## 5. Sub-pattern D — Building trees

### From a sorted array (balanced BST)
Middle element is the root; recurse on halves. O(n), height ⌈log n⌉. **Balance a BST** = in-order to array, then this.

~~~js
function sortedArrayToBST(nums, lo = 0, hi = nums.length - 1) {
  if (lo > hi) return null;
  const mid = (lo + hi) >> 1;
  return new TreeNode(nums[mid], sortedArrayToBST(nums, lo, mid - 1), sortedArrayToBST(nums, mid + 1, hi));
}
~~~

### From pre-order + in-order
Pre-order's first element is the root; find it in in-order — everything left of it is the left subtree, right of it the right subtree. Hash the in-order indices so the lookup is O(1) → O(n) total.

~~~text
preorder = [3, 9, 20, 15, 7]     inorder = [9, 3, 15, 20, 7]
root = 3; in in-order, 9 is left of 3 (1 node), [15, 20, 7] right (3 nodes)
left  ← preorder[1..1] = [9],        inorder [9]
right ← preorder[2..4] = [20,15,7],  inorder [15,20,7]  → root 20, left 15, right 7
~~~

~~~js
function buildTree(preorder, inorder) {
  const idx = new Map(inorder.map((v, i) => [v, i]));
  let pre = 0;
  const build = (lo, hi) => {                       // in-order window [lo, hi]
    if (lo > hi) return null;
    const val = preorder[pre++], node = new TreeNode(val), m = idx.get(val);
    node.left = build(lo, m - 1);                   // left first — matches pre-order consumption
    node.right = build(m + 1, hi);
    return node;
  };
  return build(0, inorder.length - 1);
}
// in-order + post-order: same, but consume post-order from the END and build RIGHT first.
~~~

**Maximum Binary Tree:** the max is the root; recursion is O(n²) worst; a **decreasing monotonic stack** builds it in O(n) (each popped node becomes the left child of the new node; the new node becomes the right child of the stack top). **Unique Binary Search Trees:** Catalan — \`G(n) = Σ G(i−1)·G(n−i)\`, choosing each \`i\` as root.

## 6. Sub-pattern E — Serialise / deserialise

Pre-order with **null markers** is the simplest correct scheme: \`"1,2,#,#,3,4,#,#,5,#,#"\`. Deserialise by consuming tokens in the same order (a shared index). Level-order also works (that's the LeetCode display format). For a **BST** specifically, pre-order *without* nulls suffices — rebuild with the range trick from §3 (the follow-up).

~~~js
const serialize = root => { const out = []; (function go(n) { if (!n) { out.push('#'); return; } out.push(n.val); go(n.left); go(n.right); })(root); return out.join(','); };
function deserialize(data) {
  const t = data.split(','); let i = 0;
  const go = () => { const v = t[i++]; if (v === '#') return null; const n = new TreeNode(+v); n.left = go(); n.right = go(); return n; };
  return go();
}
~~~

**Find Leaves of Binary Tree:** group nodes by *height* (leaves are height 0) — one post-order pass returning height; a company favourite because the naive "repeatedly remove leaves" is O(n²).

## 7. This week's problems, mapped

| Problem | Sub-pattern | The one thing to remember |
|---|---|---|
| Convert Sorted Array to Binary Search Tree | D | middle is the root |
| Range Sum of BST | A | prune by comparing with lo/hi |
| Closest Binary Search Tree Value | A | walk, keep best |
| Validate Binary Search Tree | B | ranges, strict |
| Kth Smallest Element in a BST | C | iterative in-order; augment for the follow-up |
| Lowest Common Ancestor of a Binary Search Tree | A | split point, iterative |
| Insert into a Binary Search Tree | A | walk to null |
| Delete Node in a BST | B | successor replacement |
| Inorder Successor in BST | A | remember when going left |
| Construct Binary Tree from Preorder and Inorder Traversal | D | root = pre[0]; index map |
| Binary Search Tree Iterator | C | left-spine stack |
| Trim a Binary Search Tree | A | three cases |
| Recover Binary Search Tree | B/C | in-order, first/second |
| Convert BST to Greater Tree | C | reverse in-order, running sum |
| Construct Binary Tree from Inorder and Postorder Traversal | D | consume post from the end, right first |
| Maximum Binary Tree | D | monotonic stack for O(n) |
| Unique Binary Search Trees | D | Catalan DP |
| Find Leaves of Binary Tree | E | group by height |
| Balance a Binary Search Tree | D | in-order → array → build |
| Serialize and Deserialize Binary Tree | E | pre-order with \`#\` |

## 8. Where people fall down in the room

- Validating against the parent only (see §3).
- Kth smallest by building the whole in-order array when O(h + k) with a stack was expected.
- Construction with \`indexOf\` inside recursion → O(n²); the index map is the point.
- Post-order construction: building left first (the end of post-order is the root, and the element before it is the *right* subtree's root).
- Serialise without null markers for a general binary tree (ambiguous).

**Follow-ups the company likes here:** "Kth smallest with frequent inserts" (subtree sizes), "Serialise a BST more compactly" (no nulls + ranges), "The tree doesn't fit in memory" (external in-order merge; level-order streaming), "Iterator with O(1) memory?" (Morris).

## 9. Self-check

1. Why is "compare with parent" not enough to validate a BST?
2. Describe the BST Iterator's stack in one sentence, and the amortised cost of \`next\`.
3. Pre+in construction: which index moves globally, which window is recursive?
4. In in+post construction, why build the right subtree first?
5. What makes pre-order with null markers unambiguous?

## 10. My notes

_Your own words here._
`;
