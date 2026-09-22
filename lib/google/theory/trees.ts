export const TREES = `# Binary Trees

> **Reach for it when:** anything on a binary tree. **Paths, depths, subtree properties → DFS that returns a value.** **Levels, "closest", "right side view" → BFS.** **Ancestors / "distance K" → treat it as a graph or pass parents.**
>
> **Say out loud:** "What does the recursive call *return* for a subtree, and what do I *record* at this node? Those can be two different values."

## 1. The idea in one breath

A tree is a recursive structure: a node, a left tree, a right tree. So the solution is recursive too: **assume the function already works on the children, then combine.** Almost every tree problem is one of three shapes:

1. **Return a value up** (depth, height, sum, "is this subtree valid") — post-order: children first, then me.
2. **Pass a value down** (path so far, bounds, running number) — pre-order: me first, then children with the updated argument.
3. **Level by level** — BFS with a queue; process one level per outer loop.

The company's twist is nearly always the *return-vs-record* distinction (Diameter, Max Path Sum): the value you return to the parent is not the answer you record.

~~~mermaid
graph TD
  A((3)) --> B((9))
  A --> C((20))
  C --> D((15))
  C --> E((7))
~~~

~~~text
Traversals of the tree above:
pre-order   (me, left, right):   3 9 20 15 7
in-order    (left, me, right):   9 3 15 20 7     ← sorted order for a BST
post-order  (left, right, me):   9 15 7 20 3     ← "children before parent": heights, sums, delete
level order:                     [3] [9 20] [15 7]
~~~

## 2. The shapes you must type without thinking

~~~js
// 1. Return a value up (post-order)
function maxDepth(root) {
  if (!root) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}

// 2. Pass a value down (pre-order)
function sumNumbers(root, acc = 0) {             // Sum Root to Leaf Numbers
  if (!root) return 0;
  acc = acc * 10 + root.val;
  if (!root.left && !root.right) return acc;
  return sumNumbers(root.left, acc) + sumNumbers(root.right, acc);
}

// 3. Level order (BFS) — one level per outer iteration
function levelOrder(root) {
  const out = []; if (!root) return out;
  const q = [root]; let head = 0;
  while (head < q.length) {
    const size = q.length - head, level = [];
    for (let i = 0; i < size; i++) {
      const n = q[head++]; level.push(n.val);
      if (n.left) q.push(n.left); if (n.right) q.push(n.right);
    }
    out.push(level);
  }
  return out;
}

// 4. Iterative in-order with an explicit stack (know it for "no recursion" follow-ups)
function inorder(root) {
  const out = [], st = []; let cur = root;
  while (cur || st.length) {
    while (cur) { st.push(cur); cur = cur.left; }
    cur = st.pop(); out.push(cur.val); cur = cur.right;
  }
  return out;
}
~~~

## 3. Sub-pattern A — Return-vs-record (the company's favourite tree idea)

**Trigger:** diameter, maximum path sum, "longest path", "is balanced" with early exit.

The recursion returns *the best thing that continues upward through this node* (one arm), but records *the best thing that bends at this node* (two arms).

~~~text
Diameter:        1
               /   \\
              2     3
             / \\
            4   5

height(4)=1, height(5)=1 → at 2: through = 1+1 = 2  (path 4-2-5), return 1 + max(1,1) = 2
at 1: through = height(2) + height(3) = 2 + 1 = 3   ← record 3 (edges: 4-2-1-3)
return value to the parent: 1 + max(2, 1) = 3 (not needed — root)
~~~

~~~js
function diameterOfBinaryTree(root) {
  let best = 0;
  const height = n => {
    if (!n) return 0;
    const l = height(n.left), r = height(n.right);
    best = Math.max(best, l + r);          // record: path bending here
    return 1 + Math.max(l, r);             // return: one arm continues upward
  };
  height(root);
  return best;
}

function maxPathSum(root) {                // same shape, with a twist: drop negative arms
  let best = -Infinity;
  const gain = n => {
    if (!n) return 0;
    const l = Math.max(0, gain(n.left)), r = Math.max(0, gain(n.right));
    best = Math.max(best, n.val + l + r);
    return n.val + Math.max(l, r);
  };
  gain(root);
  return best;
}
~~~

**Balanced Binary Tree:** return height, or \`−1\` as a "not balanced" sentinel to short-circuit. **Count Good Nodes:** pass the max-so-far down; count when \`val ≥ max\`.

## 4. Sub-pattern B — Two trees at once / structural comparison

**Same Tree / Symmetric / Subtree of Another Tree:** recurse on pairs of nodes. Symmetric = \`mirror(left, right)\` comparing \`l.left\` with \`r.right\` and \`l.right\` with \`r.left\`. Subtree = for every node of the big tree, \`sameTree(node, subRoot)\` — O(n·m); the follow-up is serialising both (with null markers) and doing a substring search. **Invert:** swap children, recurse — or BFS and swap.

## 5. Sub-pattern C — Paths (pass the path down, backtrack)

**Trigger:** "all root-to-leaf paths with sum", "directions from node A to node B".

~~~js
function pathSum(root, target) {           // Path Sum II
  const out = [], path = [];
  const dfs = (n, rem) => {
    if (!n) return;
    path.push(n.val); rem -= n.val;
    if (!n.left && !n.right && rem === 0) out.push([...path]);   // copy!
    dfs(n.left, rem); dfs(n.right, rem);
    path.pop();                                                  // backtrack
  };
  dfs(root, target);
  return out;
}
~~~

**Step-By-Step Directions:** find the paths from root to start and to dest as strings (L/R), strip the common prefix, replace the start's remainder with \`U\`s. **Boundary of Binary Tree:** three passes — left boundary (prefer left, else right, stop at leaf), leaves (in-order), right boundary (prefer right, collected in reverse).

## 6. Sub-pattern D — Level order variants (BFS)

- **Right Side View:** last node of each level (or DFS right-first, record the first node seen at each depth).
- **Zigzag:** reverse every other level (or a deque).
- **Vertical Order:** BFS with a column index (\`col − 1\` left, \`col + 1\` right); group by column, ordered by row then left-to-right — BFS gives that order for free; DFS would need sorting. A company staple: say why BFS.
- **Populating Next Right Pointers:** BFS, or O(1) space by walking level \`d\` via the \`next\` pointers you already built to wire level \`d + 1\`.

~~~js
function rightSideView(root) {
  const out = []; if (!root) return out;
  const q = [root]; let head = 0;
  while (head < q.length) {
    const size = q.length - head;
    for (let i = 0; i < size; i++) {
      const n = q[head++];
      if (i === size - 1) out.push(n.val);           // last in the level
      if (n.left) q.push(n.left); if (n.right) q.push(n.right);
    }
  }
  return out;
}
~~~

## 7. Sub-pattern E — Ancestors and "the tree is a graph"

**Lowest Common Ancestor:** post-order; return the node if it is \`p\` or \`q\`; if both sides return non-null, this node is the LCA; else pass up whichever is non-null. Follow-ups: "nodes may not exist" (count how many you found), "parent pointers" (walk up like Intersection of Two Linked Lists).

~~~js
function lowestCommonAncestor(root, p, q) {
  if (!root || root === p || root === q) return root;
  const l = lowestCommonAncestor(root.left, p, q), r = lowestCommonAncestor(root.right, p, q);
  return l && r ? root : (l ?? r);
}
~~~

**All Nodes Distance K:** record each node's parent in a Map (one DFS), then BFS from the target in three directions (left, right, parent) with a visited set — the tree is now an undirected graph.

**Flatten to Linked List (pre-order, in place):** reverse post-order with a \`prev\` pointer: visit right, then left, then set \`node.right = prev; node.left = null; prev = node\`.

**Count Complete Tree Nodes in O(log² n):** compare the leftmost and rightmost depths; if equal the subtree is perfect (\`2^h − 1\`), else recurse on both children.

## 8. This week's problems, mapped

| Problem | Shape | The one thing to remember |
|---|---|---|
| Invert Binary Tree | return-up | swap, recurse |
| Maximum Depth of Binary Tree | return-up | then iterative BFS |
| Diameter of Binary Tree | A | record l + r, return 1 + max |
| Balanced Binary Tree | A | −1 sentinel |
| Same Tree | B | pairwise |
| Symmetric Tree | B | mirror(l, r) |
| Subtree of Another Tree | B | sameTree at every node; serialise for the follow-up |
| Binary Tree Inorder Traversal | iterative | explicit stack; Morris if asked O(1) |
| Count Complete Tree Nodes | E | depths of extremes |
| Binary Tree Level Order Traversal | D | size per level |
| Binary Tree Right Side View | D | last of the level |
| Binary Tree Zigzag Level Order Traversal | D | reverse alternate levels |
| Count Good Nodes in Binary Tree | pass-down | max so far |
| Path Sum II | C | copy the path; backtrack |
| Sum Root to Leaf Numbers | pass-down | acc·10 + val |
| Lowest Common Ancestor of a Binary Tree | E | both sides non-null |
| All Nodes Distance K in Binary Tree | E | parent map + BFS |
| Binary Tree Vertical Order Traversal | D | BFS with column index |
| Flatten Binary Tree to Linked List | E | right, left, prev |
| Populating Next Right Pointers in Each Node | D | use the built \`next\`s |
| Boundary of Binary Tree | C | three passes |
| Step-By-Step Directions From a Binary Tree Node to Another | C | common prefix, U's |
| Binary Tree Maximum Path Sum | A | drop negative arms |

## 9. Where people fall down in the room

- Not handling \`null\` first — the base case is the first line of every tree function.
- Diameter / path sum: returning the two-arm value to the parent (it can't continue up).
- Path problems: pushing the *same* array reference into results instead of a copy.
- Recursion depth on a degenerate (linked-list-shaped) tree of 10⁵ nodes → say "I'd go iterative" when asked.
- BFS with \`shift()\` — head index, always.

**Follow-ups the company likes here:** "No recursion" (explicit stack), "O(1) extra space traversal" (Morris — know that it exists and the idea: thread the predecessor), "The tree is huge and on disk / distributed" (level-order streams; serialisation), "Parent pointers available?" (turns ancestor problems into list problems).

## 10. Self-check

1. Pre-, in-, post-order: which one for "children before parent" work, and which gives sorted order for a BST?
2. Diameter: what is returned and what is recorded at each node?
3. LCA: what does the function return when only one side finds something?
4. Why does BFS give the correct ordering for Vertical Order Traversal without sorting?
5. Write the level-order loop with a head index from memory.

## 11. My notes

_Your own words here._
`;
