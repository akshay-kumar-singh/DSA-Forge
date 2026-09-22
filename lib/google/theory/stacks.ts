export const STACKS = `# Stacks, Monotonic Stack & Parsing

> **Reach for it when:** "next / previous greater (or smaller) element" · histograms · anything **nested** (brackets, \`3[a2[c]]\`, paths, function call logs) · evaluating an expression left to right.
>
> **Say out loud:** "For each element I need the nearest one to the left/right that is bigger → monotonic stack." / "Nested structure → a stack holds the context I return to."

## 1. The idea in one breath

A stack remembers *unfinished business* in the order it must be finished. Two families:

- **Parsing / nesting:** push when something opens, pop when it closes; the stack top is "where I am". Brackets, decode-string, calculators, file paths, call logs.
- **Monotonic stack:** keep the stack sorted (increasing or decreasing). When a new element breaks the order, the elements you pop have just found their *answer* (their next greater/smaller), and the new element's *previous* greater/smaller is whatever stays on top. Every element is pushed and popped at most once → **O(n)**, replacing an O(n²) "look ahead for each element".

## 2. Sub-pattern A — Parsing with a stack

**Valid Parentheses:** push openers; on a closer, the top must be its partner. Empty at the end.

~~~js
function isValid(s) {
  const pair = { ')': '(', ']': '[', '}': '{' }, st = [];
  for (const c of s) {
    if (c in pair) { if (st.pop() !== pair[c]) return false; }
    else st.push(c);
  }
  return st.length === 0;
}
~~~

**Decode String** \`"3[a2[c]]"\`: two stacks — counts and the string-so-far. On \`[\` push both and reset; on \`]\` pop and append \`repeat\`.

~~~text
"3[a2[c]]"
read 3      num=3
read [      push (str="", 3)     str=""      num=0
read a      str="a"
read 2      num=2
read [      push ("a", 2)        str=""
read c      str="c"
read ]      pop ("a", 2) → str = "a" + "c"×2 = "acc"
read ]      pop ("", 3)  → str = "" + "acc"×3 = "accaccacc"
~~~

~~~js
function decodeString(s) {
  const nums = [], strs = []; let cur = '', num = 0;
  for (const c of s) {
    if (c >= '0' && c <= '9') num = num * 10 + +c;
    else if (c === '[') { nums.push(num); strs.push(cur); num = 0; cur = ''; }
    else if (c === ']') { cur = strs.pop() + cur.repeat(nums.pop()); }
    else cur += c;
  }
  return cur;
}
~~~

**Basic Calculator II** (\`+ − * /\`, no brackets): keep a stack of signed terms; \`*\` and \`/\` apply to the stack top immediately; sum at the end. **Basic Calculator** (brackets, \`+ −\` only): on \`(\` push the running result and the sign, reset; on \`)\` combine. **Evaluate RPN:** push numbers, pop two on an operator (order matters for \`−\` and \`/\`; JS: truncate toward zero with \`Math.trunc\`). **Simplify Path:** split on \`/\`; \`..\` pops, \`.\`/empty skip, else push; join. **Exclusive Time of Functions:** the stack top is the running function; on \`start\` charge the top up to \`t − 1\`; on \`end\` charge the top up to \`t\` and pop; \`prev = t\` or \`t + 1\`.

## 3. Sub-pattern B — Monotonic stack: next greater / previous smaller

**Trigger:** "for each element, the nearest to the right that is warmer/taller/bigger", "how many days until…", "span".

~~~text
Daily Temperatures: T = [73, 74, 75, 71, 69, 72, 76, 73]      stack keeps indices with DECREASING temps

i=0 73  push               [0]
i=1 74  74>73 → pop 0 (ans[0]=1)          push  [1]
i=2 75  75>74 → pop 1 (ans[1]=1)          push  [2]
i=3 71  push                                    [2,3]
i=4 69  push                                    [2,3,4]
i=5 72  72>69 pop 4 (ans[4]=1); 72>71 pop 3 (ans[3]=2); push  [2,5]
i=6 76  pop 5 (ans[5]=1); pop 2 (ans[2]=4);   push  [6]
i=7 73  push                                    [6,7]
left on stack → 0.   ans = [1,1,4,2,1,1,0,0]
~~~

~~~js
function dailyTemperatures(T) {
  const ans = Array(T.length).fill(0), st = [];       // indices, temps decreasing bottom→top
  for (let i = 0; i < T.length; i++) {
    while (st.length && T[st[st.length - 1]] < T[i]) {   // a warmer day arrived: everyone colder on the stack is answered
      const j = st.pop();
      ans[j] = i - j;
    }
    st.push(i);
  }
  return ans;
}
~~~

Rules of thumb:
- Next **greater** → stack values **decreasing**; next **smaller** → **increasing**.
- Pop with \`<\` vs \`<=\` decides how equal elements are treated — Sum of Subarray Minimums needs *previous-less* and *next-less-or-equal* so each subarray is counted exactly once.
- **Circular** (Next Greater Element II): loop \`i\` from 0 to \`2n − 1\`, use \`i % n\`, only push in the first pass.
- **Online Stock Span:** stack of \`[price, span]\`; pop while \`price ≤ current\`, adding their spans.
- **Remove K Digits:** increasing stack of digits; pop while top > current and \`k > 0\`; strip leading zeros.
- **Asteroid Collision:** stack of survivors; a left-mover fights the top while the top moves right.
- **Number of Visible People in a Queue:** process right to left with a decreasing stack; each pop is a person seen; if the stack is non-empty after popping, +1 for the taller one that stops the view.

## 4. Sub-pattern C — Histograms (largest rectangle)

For each bar, the rectangle it *limits* extends left to the previous smaller bar and right to the next smaller bar. Monotonic increasing stack; when a bar pops, its right bound is \`i\` and left bound is the new top.

~~~text
heights = [2, 1, 5, 6, 2, 3]

i=0 2   push [0]
i=1 1   1<2 → pop 0: h=2, width = 1 - (-1) - 1 = 1 → 2      push [1]
i=2 5   push [1,2]
i=3 6   push [1,2,3]
i=4 2   pop 3: h=6, w = 4-2-1 = 1 → 6;  pop 2: h=5, w = 4-1-1 = 2 → 10 ✓   push [1,4]
i=5 3   push [1,4,5]
i=6 (sentinel 0): pop 5: h=3,w=1→3;  pop 4: h=2, w=6-1-1=4 → 8;  pop 1: h=1, w=6 → 6
answer 10
~~~

~~~js
function largestRectangleArea(heights) {
  const st = []; let best = 0;
  for (let i = 0; i <= heights.length; i++) {
    const h = i === heights.length ? 0 : heights[i];       // sentinel flushes the stack
    while (st.length && heights[st[st.length - 1]] >= h) {
      const height = heights[st.pop()];
      const left = st.length ? st[st.length - 1] : -1;
      best = Math.max(best, height * (i - left - 1));
    }
    st.push(i);
  }
  return best;
}
~~~

**Longest Valid Parentheses:** stack of indices with a \`−1\` base; push on \`(\`; on \`)\` pop, and if empty push \`i\` as the new base, else length = \`i − top\`.

## 5. Sub-pattern D — Stacks as building blocks (design)

- **Min Stack:** each entry stores \`[value, minSoFar]\` (or a second stack of mins). All O(1).
- **Implement Queue using Stacks:** in-stack and out-stack; move everything over only when out is empty → **amortised O(1)**: each element crosses once. Say the word "amortised" and why.
- **Design a Stack With Increment:** lazy — store the increment at index \`k − 1\`; when popping, add it and push the increment down one slot. O(1) per op.
- **Car Fleet:** sort by position descending, compute time-to-target; a car that arrives *sooner* than the fleet ahead merges into it — a stack (or just a running max) of arrival times.

~~~js
class MinStack {
  constructor() { this.st = []; }
  push(v) { const m = this.st.length ? Math.min(v, this.st[this.st.length - 1][1]) : v; this.st.push([v, m]); }
  pop() { this.st.pop(); }
  top() { return this.st[this.st.length - 1][0]; }
  getMin() { return this.st[this.st.length - 1][1]; }
}
~~~

## 6. This week's problems, mapped

| Problem | Sub-pattern | The one thing to remember |
|---|---|---|
| Valid Parentheses | A | pop must equal the partner; empty at end |
| Next Greater Element I | B | map from nums2's next-greater, then look up |
| Implement Queue using Stacks | D | two stacks, amortised O(1) |
| Min Stack | D | store the min alongside |
| Evaluate Reverse Polish Notation | A | pop b then a; \`Math.trunc\` |
| Daily Temperatures | B | decreasing stack of indices |
| Next Greater Element II | B | 2n loop, \`i % n\` |
| Car Fleet | D | sort by position, arrival times |
| Decode String | A | two stacks; \`repeat\` on \`]\` |
| Basic Calculator II | A | stack of signed terms; apply \`* /\` immediately |
| Simplify Path | A | split; \`..\` pops |
| Remove K Digits | B | increasing stack, leading zeros |
| Asteroid Collision | B | left-mover fights the top |
| Minimum Remove to Make Valid Parentheses | A | index stack; mark unmatched for removal |
| Exclusive Time of Functions | A | top is running; \`prev\` bookkeeping |
| Design a Stack With Increment Operation | D | lazy increment array |
| Online Stock Span | B | \`[price, span]\` accumulate |
| Sum of Subarray Minimums | B | prev-less × next-less-or-equal; mod 1e9+7 |
| Basic Calculator | A | push result+sign on \`(\` |
| Largest Rectangle in Histogram | C | sentinel 0, width \`i − left − 1\` |
| Longest Valid Parentheses | C/A | base index −1 |
| Number of Visible People in a Queue | B | right to left, count pops (+1) |

## 7. Where people fall down in the room

- Popping the wrong operand order in RPN / calculator (\`a − b\` where \`b\` was pushed last).
- \`<\` vs \`<=\` in the pop condition — decide it from the problem's duplicate handling and say so.
- Forgetting the sentinel at the end of a histogram (stack never flushes).
- Circular next-greater: pushing in the second pass too (double answers).
- Basic Calculator: the sign *before* a bracket applies to the whole bracket — push it.

**Follow-ups the company likes here:** "Stream of temperatures — can you answer online?" (the stack is already online), "Now support \`* /\` and brackets" (Calculator III: combine the two techniques), "Memory: the stack holds n indices — can you do better?" (usually no; explain why).

## 8. Self-check

1. Next greater → which direction is the stack monotonic? Why?
2. Explain in one sentence why a monotonic stack is O(n) despite the inner \`while\`.
3. Decode String: what exactly is pushed on \`[\`, and what happens on \`]\`?
4. Largest Rectangle: when bar \`j\` pops at index \`i\`, what are its left and right bounds?
5. Why is the two-stack queue amortised O(1) and not O(n)?

## 9. My notes

_Your own words here._
`;
