export const GRAPHS_2 = `# Graphs II — Topological Sort, Union-Find & Shortest Paths

> **Reach for it when:** dependencies / prerequisites / "an order such that…" (DAG) · "are these connected" with edges arriving over time (dynamic connectivity) · shortest path with **weights** · minimum spanning tree.
>
> **Say out loud:** "Prerequisites → it's a DAG → topological sort (Kahn's: in-degrees + queue)." / "Edges arrive, connectivity queries → Union-Find." / "Weighted shortest path → Dijkstra with a min-heap of [dist, node]."

## 1. The idea in one breath

Three algorithms, each with one template you own:

1. **Topological sort** orders a directed acyclic graph so every edge goes forward. Kahn's algorithm peels nodes with in-degree 0; if you can't peel everything, there is a **cycle**.
2. **Union-Find** answers "same component?" in near-O(1) as edges are added. \`union\` returning \`false\` = "this edge closes a cycle".
3. **Dijkstra** is BFS where the queue is a min-heap keyed by distance; it's correct for non-negative weights. Variants: Bellman-Ford (k edges limit), Prim (MST), "minimax" paths.

## 2. Topological sort (Kahn's algorithm)

~~~mermaid
graph LR
  0 --> 1
  0 --> 2
  1 --> 3
  2 --> 3
~~~

~~~text
in-degree: 0:0  1:1  2:1  3:2
queue [0] → pop 0, in-degree of 1,2 → 0, push → queue [1,2]
pop 1 → 3:1;  pop 2 → 3:0 push → pop 3.   order: 0 1 2 3   (or 0 2 1 3)
count == n → no cycle
~~~

~~~js
function findOrder(numCourses, prerequisites) {          // Course Schedule II
  const adj = Array.from({ length: numCourses }, () => []), indeg = Array(numCourses).fill(0);
  for (const [course, pre] of prerequisites) { adj[pre].push(course); indeg[course]++; }
  const q = []; let head = 0;
  for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) q.push(i);
  const order = [];
  while (head < q.length) {
    const u = q[head++]; order.push(u);
    for (const v of adj[u]) if (--indeg[v] === 0) q.push(v);
  }
  return order.length === numCourses ? order : [];      // shorter → a cycle
}
~~~

DFS alternative: three colours (white / grey / black); a grey → grey edge is a cycle; post-order reversed is the topological order. Know both; Kahn's is easier to narrate.

- **Parallel Courses:** longest path in a DAG = number of *levels* in Kahn's (process level by level).
- **Minimum Height Trees:** peel leaves layer by layer (undirected Kahn's with degree 1); the last 1–2 nodes are the centres.
- **Find Eventual Safe States:** reverse the edges and run Kahn's — nodes that get peeled are safe (equivalently DFS with grey = "in a cycle").
- **Sequence Reconstruction:** the order is unique ⇔ the queue never holds more than one node at a time.
- **Alien Dictionary:** build edges only from the **first differing character** of adjacent words (\`"abc"\` before \`"ab"\` is invalid); then Kahn's; include letters with no edges.

## 3. Union-Find (dynamic connectivity)

Your W13 template — path compression + union by size. Amortised near-O(1) per op (inverse Ackermann; say "effectively constant").

~~~text
Redundant Connection: edges [[1,2],[1,3],[2,3]]
union(1,2) ✓   union(1,3) ✓   union(2,3) → already connected → this edge is redundant → [2,3]
~~~

~~~js
function findRedundantConnection(edges) {
  const uf = new UnionFind(edges.length + 1);
  for (const [a, b] of edges) if (!uf.union(a, b)) return [a, b];
}
~~~

- **Number of Provinces / Connected Components:** \`count\` after all unions.
- **Accounts Merge:** union emails within each account (via the first email); then group by root, sort, prepend the name — a Map from email → owner index.
- **Number of Islands II (online):** each added cell is a new component (\`count++\`), then union with land neighbours (\`count−−\` per successful union). O(k·α) — why this beats re-running BFS per query.
- **Evaluate Division:** *weighted* union-find (store \`ratio to parent\`) — or simply build a graph with edge weights \`a/b\` and \`b/a\` and DFS per query multiplying along the path; either is accepted, the DFS is easier to get right.
- **Graph Valid Tree (again):** \`n − 1\` edges and every union succeeds.

## 4. Dijkstra — weighted shortest paths

~~~js
function dijkstra(n, adj, src) {                    // adj[u] = [[v, w], ...]
  const dist = Array(n).fill(Infinity); dist[src] = 0;
  const h = new MinHeap((a, b) => a[0] - b[0]);     // [dist, node]
  h.push([0, src]);
  while (h.size()) {
    const [d, u] = h.pop();
    if (d > dist[u]) continue;                      // stale entry (lazy deletion)
    for (const [v, w] of adj[u]) {
      if (d + w < dist[v]) { dist[v] = d + w; h.push([dist[v], v]); }
    }
  }
  return dist;
}
~~~

~~~text
Network Delay Time: times [[2,1,1],[2,3,1],[3,4,1]], k = 2
dist: 2→0.  pop (0,2): 1→1, 3→1.  pop (1,1).  pop (1,3): 4→2.  pop (2,4).
max finite dist = 2 ✓ (if any node stays Infinity → -1)
~~~

Complexity O((V + E) log V). The \`if (d > dist[u]) continue\` line is the *lazy deletion* that makes it correct without a decrease-key operation — say it.

Variants (same loop, different comparison):
- **Path with Maximum Probability:** maximise a product → max-heap, relax with \`d * p\`.
- **Path With Minimum Effort / Swim in Rising Water:** *minimax* — the cost of a path is its **maximum** edge, relax with \`Math.max(d, w)\`. Alternative: binary search on the answer + BFS (W4 pattern), or Kruskal-style union until connected.
- **Cheapest Flights Within K Stops:** Dijkstra's greedy breaks with a stop limit → **Bellman-Ford with k + 1 rounds**, relaxing from a *copy* of the previous round's distances.

~~~js
function findCheapestPrice(n, flights, src, dst, k) {
  let dist = Array(n).fill(Infinity); dist[src] = 0;
  for (let round = 0; round <= k; round++) {
    const next = dist.slice();
    for (const [u, v, w] of flights) if (dist[u] + w < next[v]) next[v] = dist[u] + w;
    dist = next;
  }
  return dist[dst] === Infinity ? -1 : dist[dst];
}
~~~

## 5. Minimum spanning tree (Min Cost to Connect All Points)

- **Prim's:** Dijkstra's loop, but the heap key is the *edge weight* into the tree, not the path distance; O(V²) dense version fits "all points connected to all" nicely.
- **Kruskal's:** sort all edges, union-find, take an edge when \`union\` succeeds; stop at \`n − 1\` edges. Explain both, pick Prim's for dense (n ≤ 1000 points → n² edges).

## 6. Eulerian path (Reconstruct Itinerary) and bridges (Critical Connections)

- **Hierholzer:** sort each adjacency list lexicographically; DFS consuming edges; **append a node when it has no edges left**; reverse the result. The trick is the post-order append — say why a naive greedy can strand you.
- **Tarjan's bridges:** DFS with \`disc[]\` and \`low[]\`; an edge \`(u, v)\` is a bridge when \`low[v] > disc[u]\`. Skip the edge back to the parent. O(V + E).

~~~js
function criticalConnections(n, connections) {
  const adj = Array.from({ length: n }, () => []);
  for (const [a, b] of connections) { adj[a].push(b); adj[b].push(a); }
  const disc = Array(n).fill(-1), low = Array(n).fill(0), out = []; let t = 0;
  const dfs = (u, parent) => {
    disc[u] = low[u] = t++;
    for (const v of adj[u]) {
      if (v === parent) continue;
      if (disc[v] === -1) { dfs(v, u); low[u] = Math.min(low[u], low[v]); if (low[v] > disc[u]) out.push([u, v]); }
      else low[u] = Math.min(low[u], disc[v]);
    }
  };
  dfs(0, -1);
  return out;
}
~~~

## 7. Longest Increasing Path in a Matrix — a DAG in disguise

Edges go from smaller to strictly larger neighbours, so there are no cycles → DFS with memo (\`best[r][c]\` = longest path starting here) is O(R·C). Say "it's a DAG, so memoised DFS is safe" — that sentence is the solution.

## 8. This week's problems, mapped

| Problem | Algorithm | The one thing to remember |
|---|---|---|
| Course Schedule | Kahn | peeled count < n → cycle |
| Course Schedule II | Kahn | return the order |
| Parallel Courses | Kahn by levels | longest path in a DAG |
| Minimum Height Trees | leaf peeling | last 1–2 nodes |
| Find Eventual Safe States | Kahn on reversed graph | or DFS colours |
| Sequence Reconstruction | Kahn | queue size never > 1 |
| Redundant Connection | Union-Find | first failed union |
| Number of Provinces | Union-Find | count |
| Accounts Merge | Union-Find | email → owner, group by root |
| Evaluate Division | weighted UF / DFS | multiply along the path |
| Network Delay Time | Dijkstra | max of dist |
| Cheapest Flights Within K Stops | Bellman-Ford | k+1 rounds, copy per round |
| Path with Maximum Probability | Dijkstra (max) | product relax |
| Path With Minimum Effort | Dijkstra (minimax) | \`max(d, w)\` |
| Min Cost to Connect All Points | Prim / Kruskal | dense → Prim |
| Alien Dictionary | Kahn | first differing char; prefix case |
| Reconstruct Itinerary | Hierholzer | post-order append, reverse |
| Swim in Rising Water | minimax Dijkstra / binary search | |
| Longest Increasing Path in a Matrix | memoised DFS | it's a DAG |
| Number of Islands II | online Union-Find | count++ then −− per merge |
| Critical Connections in a Network | Tarjan | \`low[v] > disc[u]\` |

## 9. Where people fall down in the room

- Reversing the edge direction in Course Schedule (\`[a, b]\` means b before a).
- Dijkstra with negative weights, or with a stop limit — name the failure and switch algorithm.
- Forgetting the stale-entry skip in Dijkstra (still correct, but you can't explain the complexity).
- Union-Find without path compression → O(n) per find in the worst case; and forgetting to return whether the union happened.
- Alien Dictionary: comparing every pair of words instead of adjacent ones; missing the invalid-prefix case.

**Follow-ups the company likes here:** "Edges are added *and removed*" (Union-Find can't delete — offline processing or link-cut), "Graph doesn't fit on one machine" (BFS frontiers as map-reduce rounds), "Return the path, not the distance" (parent array), "Detect *which* nodes are in the cycle" (DFS colours).

## 10. Self-check

1. Kahn's: what does the in-degree array mean, and how is a cycle detected?
2. Union-Find: what does the return value of \`union\` tell you?
3. Dijkstra: why is the stale-entry check needed, and why does it fail with negative weights?
4. Why Bellman-Ford for "at most k stops"? What is copied each round and why?
5. Minimax path: what is the relaxation formula?

## 11. My notes

_Your own words here._
`;
