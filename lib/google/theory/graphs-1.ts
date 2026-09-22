export const GRAPHS_1 = `# Graphs I — BFS, DFS & Grids

> **Reach for it when:** a grid · "connected" / "components" / "islands" · shortest path where every step costs the same · "minimum moves" over states you can enumerate (a lock, a word, a board).
>
> **Say out loud:** "Shortest path with unit steps → BFS." / "Reachability, components, flood fill → DFS or BFS, either." / "The graph is *implicit* — a state is a node, a move is an edge."

## 1. The idea in one breath

A graph is nodes + edges. Everything this week is two traversals:

- **BFS** explores in rings of increasing distance → the **first time you reach a node is the shortest path** (unit weights). Queue, visited-on-enqueue.
- **DFS** dives as deep as it can → great for **components, cycles, "can I reach", flood fill**. Recursion or an explicit stack.

Both are **O(V + E)**. On a grid \`V = R·C\` and \`E ≈ 4V\`, so O(R·C). The company's twist: the graph is often not given as a list — it's a grid, a word list, a lock dial, a set of bus routes — and the first job is to *say what the nodes and edges are*.

~~~mermaid
graph LR
  A((A)) --- B((B))
  A --- C((C))
  B --- D((D))
  C --- D
  D --- E((E))
~~~

~~~text
BFS from A (rings):        DFS from A (one deep dive):
ring 0: A                  A → B → D → C (back) → E
ring 1: B, C               order depends on neighbour order; visited prevents loops
ring 2: D
ring 3: E                  dist(E) = 3 — BFS gives this, DFS does not
~~~

## 2. The two loops you must type without thinking

~~~js
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// BFS on a grid — O(1) queue via head index; mark visited when ENQUEUED (not when dequeued)
function bfs(grid, sr, sc) {
  const R = grid.length, C = grid[0].length;
  const dist = Array.from({ length: R }, () => Array(C).fill(-1));
  const q = [[sr, sc]]; let head = 0; dist[sr][sc] = 0;
  while (head < q.length) {
    const [r, c] = q[head++];
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= R || nc >= C || grid[nr][nc] === 1 || dist[nr][nc] !== -1) continue;
      dist[nr][nc] = dist[r][c] + 1;
      q.push([nr, nc]);
    }
  }
  return dist;
}

// DFS on a grid — recursive; mark in place if allowed, else a visited set
function dfs(grid, r, c) {
  if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] !== '1') return 0;
  grid[r][c] = '0';                                     // visited
  return 1 + dfs(grid, r + 1, c) + dfs(grid, r - 1, c) + dfs(grid, r, c + 1) + dfs(grid, r, c - 1);
}

// Adjacency list from an edge list (undirected)
const adj = Array.from({ length: n }, () => []);
for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); }
~~~

## 3. Sub-pattern A — Components & flood fill (DFS or BFS)

**Trigger:** count islands, max area, "regions surrounded", "enclaves", clone a graph.

~~~text
Number of Islands:   1 1 0 0 0          scan every cell; on a '1' start a DFS that sinks the island,
                     1 1 0 0 0          count++.  Each cell visited once → O(R·C).
                     0 0 1 0 0
                     0 0 0 1 1          → 3
~~~

**Surrounded Regions / Number of Enclaves / Pacific Atlantic — the "start from the border" trick:** instead of asking "is this region enclosed?", flood from the **border** (or from the ocean) and mark what is reachable; everything else is enclosed. Pacific Atlantic does two floods (one per ocean, flowing *uphill* in reverse) and intersects.

**Clone Graph:** a Map old → new; BFS/DFS, creating a node the first time you see it and wiring neighbours from the map. **Keys and Rooms:** DFS from room 0 over the keys; visited count = n. **Graph Valid Tree:** exactly \`n − 1\` edges **and** connected (one component). **Number of Connected Components:** count DFS starts (or Union-Find, W13).

## 4. Sub-pattern B — Shortest path with BFS (single and multi-source)

**Trigger:** "minimum steps", "distance to nearest 0/gate", "time for all oranges to rot".

**Multi-source BFS:** put *all* sources in the queue at distance 0 first. The rings then expand from every source at once — the distance field is "distance to the nearest source". Rotting Oranges, Walls and Gates, 01 Matrix are the same code.

~~~text
01 Matrix:   0 0 0        seed all 0s at dist 0, BFS outward:
             0 1 0    →   0 0 0
             1 1 1        0 1 0
                          1 2 1
~~~

~~~js
function orangesRotting(grid) {
  const R = grid.length, C = grid[0].length, q = []; let head = 0, fresh = 0, minutes = 0;
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    if (grid[r][c] === 2) q.push([r, c]); else if (grid[r][c] === 1) fresh++;
  }
  while (head < q.length && fresh) {
    const size = q.length - head;                          // one ring = one minute
    for (let i = 0; i < size; i++) {
      const [r, c] = q[head++];
      for (const [dr, dc] of DIRS) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= R || nc >= C || grid[nr][nc] !== 1) continue;
        grid[nr][nc] = 2; fresh--; q.push([nr, nc]);
      }
    }
    minutes++;
  }
  return fresh ? -1 : minutes;
}
~~~

- **Shortest Path in Binary Matrix:** 8 directions; answer is \`dist + 1\` cells.
- **Nearest Exit from Entrance:** BFS, first border cell that isn't the entrance.
- **Shortest Bridge:** DFS to find and collect one island, then multi-source BFS from it until you touch the other — the number of rings is the answer.
- **Snakes and Ladders:** nodes are squares 1..n², edges are dice rolls (then jump if a snake/ladder); the board's zig-zag indexing is the only hard part — write a \`toRC(square)\` helper.

## 5. Sub-pattern C — Implicit graphs (the state is the node)

**Trigger:** a lock, a word, a knight, a bus — "minimum number of moves".

Say the mapping before anything else: *node = state, edge = one legal move, visited = a Set of serialised states.*

| Problem | Node | Edge | Visited key |
|---|---|---|---|
| Open the Lock | 4-digit string | ±1 on one wheel (8 neighbours) | the string; deadends pre-seeded |
| Word Ladder | word | change one letter to a word in the list | the word |
| Minimum Knight Moves | \`(x, y)\` | 8 knight jumps | \`"x,y"\` — use symmetry: \`|x|, |y|\` |
| Bus Routes | **a route**, not a stop | routes sharing a stop | route index |

**Word Ladder** with a naive "compare with every word" per step is O(N²·L); instead generate the 25·L neighbours and check the Set — O(N·L²) — or use wildcard buckets (\`h*t\`). **Bidirectional BFS** is the follow-up: expand the smaller frontier, stop when they meet.

~~~js
function ladderLength(begin, end, wordList) {
  const dict = new Set(wordList); if (!dict.has(end)) return 0;
  const q = [begin]; let head = 0, steps = 1;
  dict.delete(begin);
  while (head < q.length) {
    const size = q.length - head;
    for (let i = 0; i < size; i++) {
      const w = q[head++]; if (w === end) return steps;
      for (let j = 0; j < w.length; j++) for (let c = 97; c <= 122; c++) {
        const nw = w.slice(0, j) + String.fromCharCode(c) + w.slice(j + 1);
        if (dict.has(nw)) { dict.delete(nw); q.push(nw); }   // delete = visited
      }
    }
    steps++;
  }
  return 0;
}
~~~

## 6. Sub-pattern D — Two-colouring (Is Graph Bipartite)

BFS/DFS assigning alternating colours; a neighbour with the *same* colour → not bipartite. Run from every unvisited node (the graph may be disconnected).

## 7. Sub-pattern E — Robot Room Cleaner (DFS with a relative frame)

The company classic. You only have \`move()\`, \`turnLeft()\`, \`turnRight()\`, \`clean()\`. Keep your own \`(r, c, dir)\` in a relative coordinate frame starting at \`(0, 0)\` facing up; visited Set of \`"r,c"\`; DFS in four directions in a fixed rotation order; after exploring a direction, **back up** — turn twice, move, turn twice — so you're facing the original way again. State the invariant: "when \`dfs(r, c, d)\` returns, the robot is back at \`(r, c)\` facing \`d\`."

## 8. This week's problems, mapped

| Problem | Sub-pattern | Traversal · the one thing |
|---|---|---|
| Flood Fill | A | DFS; guard \`newColor === old\` |
| Find if Path Exists in Graph | A | adjacency list, DFS |
| Number of Islands | A | sink islands, count starts |
| Max Area of Island | A | DFS returns size |
| Clone Graph | A | Map old → new |
| Pacific Atlantic Water Flow | A | flood from both oceans uphill |
| Surrounded Regions | A | flood from the border |
| Rotting Oranges | B | multi-source, rings = minutes |
| Walls and Gates | B | multi-source from gates |
| 01 Matrix | B | multi-source from zeros |
| Shortest Path in Binary Matrix | B | 8 dirs, count cells |
| Is Graph Bipartite | D | two-colouring |
| Number of Connected Components in an Undirected Graph | A | count DFS starts |
| Graph Valid Tree | A | n−1 edges and connected |
| Keys and Rooms | A | DFS over keys |
| Shortest Bridge | A + B | DFS one island, BFS out |
| Nearest Exit from Entrance in Maze | B | first border cell |
| Number of Enclaves | A | flood from the border, count the rest |
| Open the Lock | C | string states, deadends as visited |
| Snakes and Ladders | C | squares as nodes, \`toRC\` |
| Minimum Knight Moves | C | symmetry, \`"x,y"\` keys |
| Word Ladder | C | neighbour generation; bidirectional follow-up |
| Bus Routes | C | routes as nodes |
| Robot Room Cleaner | E | relative frame, back up |

## 9. Where people fall down in the room

- Marking visited on **dequeue** instead of enqueue → nodes enter the queue many times (still correct, but O(E) memory and a slower explanation).
- BFS with \`shift()\` → quadratic. Head index.
- Recursive DFS on a 1000×1000 grid → stack overflow; say "iterative with a stack for big inputs".
- Forgetting the disconnected case (bipartite, components): loop over all start nodes.
- Implicit graphs: not defining the visited *key* (objects as Set members are compared by identity).

**Follow-ups the company likes here:** "The grid is too big for memory" (Number of Islands streaming row by row: keep the previous row's labels — Union-Find, W13), "Weighted edges" (Dijkstra, W13), "Find the path, not just the length" (store parents and walk back), "Many queries" (precompute components / distances once).

## 10. Self-check

1. When do you mark a node visited in BFS, and why does it matter?
2. Multi-source BFS: what changes versus single-source?
3. Word Ladder: what are the nodes and edges, and what is the visited structure?
4. Why does "flood from the border" solve Surrounded Regions in one pass?
5. State the invariant of Robot Room Cleaner's DFS in one sentence.

## 11. My notes

_Your own words here._
`;
