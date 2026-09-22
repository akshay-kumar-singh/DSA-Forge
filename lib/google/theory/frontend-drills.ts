export const FRONTEND_DRILLS = `# Frontend Drills — the vanilla-JS interview set

> **Reach for it when:** a front-end round asks you to implement a utility or a tiny component from scratch — closures, timers, promises, prototypes, no libraries. The grading is on **correctness of the edge cases**, **clean API design**, and **explaining the event loop** while you type.
>
> **Say out loud:** "What is the *contract*? (leading/trailing, cancel, order of results, what happens on error) — I'll state it, then implement it, then test it with a timeline."

## 1. The idea in one breath

These are small, but the room is watching three things: **(1)** do you understand closures and \`this\`, **(2)** do you understand the event loop — microtasks (promises) before macrotasks (timers), **(3)** do you design a sensible API and handle the corners (cancel, errors, cycles, order). Write the function, then **draw a timeline** to prove it.

~~~text
Event loop, one tick:
  run script → drain ALL microtasks (promise callbacks, queueMicrotask) → one macrotask (setTimeout / I/O) → repeat
setTimeout(fn, 0) runs AFTER every pending .then().  Say this when the interviewer asks "what prints first?"
~~~

## 2. Timers: debounce & throttle

**Debounce** — fire only after \`wait\` ms of *silence* (search box). **Throttle** — fire at most once per \`wait\` ms (scroll handler). Draw the difference:

~~~text
calls:      x x x x       x x           x
debounce:             ↑           ↑         ↑      (trailing, after silence)
throttle:   ↑     ↑       ↑     ↑         ↑        (one per window; leading here)
~~~

~~~js
function debounce(fn, wait, { leading = false, trailing = true } = {}) {
  let timer = null, lastArgs, lastThis;
  const debounced = function (...args) {
    lastArgs = args; lastThis = this;
    const callNow = leading && !timer;
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      if (trailing && !callNow) fn.apply(lastThis, lastArgs);
    }, wait);
    if (callNow) fn.apply(lastThis, lastArgs);
  };
  debounced.cancel = () => { clearTimeout(timer); timer = null; };
  return debounced;
}

function throttle(fn, wait) {                     // leading + trailing: the last call in a window still fires
  let last = 0, timer = null, lastArgs, lastThis;
  return function (...args) {
    const now = Date.now(), remaining = wait - (now - last);
    lastArgs = args; lastThis = this;
    if (remaining <= 0) {
      clearTimeout(timer); timer = null;
      last = now; fn.apply(lastThis, lastArgs);
    } else if (!timer) {
      timer = setTimeout(() => { last = Date.now(); timer = null; fn.apply(lastThis, lastArgs); }, remaining);
    }
  };
}
~~~
Say: "I keep \`this\` and the latest args so the trailing call sees the last event" and "cancel clears the pending timer — needed on unmount".

## 3. Functions: memoize & curry

~~~js
function memoize(fn, resolver = (...args) => JSON.stringify(args)) {
  const cache = new Map();
  return function (...args) {
    const key = resolver(...args);
    if (!cache.has(key)) cache.set(key, fn.apply(this, args));
    return cache.get(key);
  };
}
// Follow-up: cap the size → evict the oldest (Map keeps insertion order → delete the first key) = LRU-ish.

function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn.apply(this, args);
    return (...more) => curried.apply(this, [...args, ...more]);
  };
}
// curry((a, b, c) => a + b + c)(1)(2)(3) → 6;  (1, 2)(3) also works.  fn.length ignores rest/default params — say it.
~~~

## 4. Data: flatten, deep equal, deep clone

~~~js
function flatten(arr, depth = 1) {
  if (depth < 1) return arr.slice();
  return arr.reduce((out, x) => out.concat(Array.isArray(x) ? flatten(x, depth - 1) : [x]), []);
}
// Iterative for depth = Infinity: a stack of [item, depth]; push children in reverse to keep order.

function deepEqual(a, b, seen = new WeakMap()) {
  if (Object.is(a, b)) return true;                                 // handles NaN, ±0
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
  if (a instanceof Date) return a.getTime() === b.getTime();
  if (a instanceof RegExp) return String(a) === String(b);
  if (seen.get(a) === b) return true; seen.set(a, b);               // cycles
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every(k => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k], seen));
}

function deepClone(v, seen = new WeakMap()) {
  if (typeof v !== 'object' || v === null) return v;
  if (v instanceof Date) return new Date(v);
  if (v instanceof RegExp) return new RegExp(v.source, v.flags);
  if (seen.has(v)) return seen.get(v);                              // cycles & shared refs
  const out = Array.isArray(v) ? [] : Object.create(Object.getPrototypeOf(v));
  seen.set(v, out);
  for (const k of Reflect.ownKeys(v)) out[k] = deepClone(v[k], seen);
  return out;
}
// Why not JSON.parse(JSON.stringify(x))? drops undefined/functions/Dates→strings, throws on cycles, loses prototypes. structuredClone exists — know its limits (no functions).
~~~

## 5. Promises: all, pool, retry

~~~js
function promiseAll(iterable) {
  return new Promise((resolve, reject) => {
    const items = [...iterable], results = Array(items.length); let left = items.length;
    if (!left) return resolve(results);
    items.forEach((p, i) => Promise.resolve(p).then(v => { results[i] = v; if (--left === 0) resolve(results); }, reject));
  });
}
// allSettled: never reject, store {status, value|reason};  any: reject only when all fail (AggregateError);  race: first settle wins.

async function promisePool(tasks, limit) {           // tasks: () => Promise; results in input order
  const results = Array(tasks.length); let next = 0;
  const worker = async () => {
    while (next < tasks.length) { const i = next++; results[i] = await tasks[i](); }
  };
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}
// Say: "each worker pulls the next index; the shared counter is safe because JS is single-threaded between awaits".

async function retry(fn, retries = 3, baseMs = 100, { shouldRetry = () => true, signal } = {}) {
  for (let attempt = 0; ; attempt++) {
    try { return await fn(); }
    catch (err) {
      if (attempt >= retries || !shouldRetry(err) || signal?.aborted) throw err;
      const delay = baseMs * 2 ** attempt + Math.random() * baseMs;   // exponential + jitter
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
~~~

~~~text
Retry timeline (base 100): try → fail → wait ~100 → try → fail → wait ~200 → try → fail → wait ~400 → try
Jitter spreads clients so they don't retry in lockstep (thundering herd) — say it.
~~~

## 6. Objects: event emitter & LRU (Map-based)

~~~js
class EventEmitter {
  #m = new Map();                                                   // event → Set<handler>
  on(ev, h) { if (!this.#m.has(ev)) this.#m.set(ev, new Set()); this.#m.get(ev).add(h); return () => this.off(ev, h); }
  off(ev, h) { this.#m.get(ev)?.delete(h); }
  once(ev, h) { const w = (...a) => { this.off(ev, w); h(...a); }; w.orig = h; return this.on(ev, w); }
  emit(ev, ...a) { for (const h of [...(this.#m.get(ev) ?? [])]) h(...a); }   // copy: handlers may unsubscribe during emit
}

class LRUCache {                                                    // Map keeps insertion order
  constructor(capacity) { this.cap = capacity; this.m = new Map(); }
  get(k) { if (!this.m.has(k)) return -1; const v = this.m.get(k); this.m.delete(k); this.m.set(k, v); return v; }
  put(k, v) {
    if (this.m.has(k)) this.m.delete(k);
    this.m.set(k, v);
    if (this.m.size > this.cap) this.m.delete(this.m.keys().next().value);   // oldest = first key
  }
}
// vs the W6 doubly-linked-list version: same O(1); the Map version leans on an engine guarantee (insertion order) — fine in JS, not portable.
~~~

## 7. This week's problems, mapped

| Problem | The contract to state first |
|---|---|
| Implement Debounce | trailing by default; leading option; \`cancel()\`; keeps \`this\` |
| Implement Throttle | at most one call per window; the last call still fires (trailing) |
| Implement Memoize | key from args (resolver); size limit follow-up |
| Implement Curry | collect until \`fn.length\`; placeholders follow-up |
| Flatten Array to Depth | depth semantics; iterative for Infinity |
| Deep Equal | NaN, ±0, Date, RegExp, cycles, prototypes |
| Deep Clone | cycles via WeakMap; why not JSON |
| Promise.all from Scratch | order preserved; first rejection wins; empty → \`[]\` |
| Promise Pool with Concurrency Limit | at most \`limit\` in flight; results in order |
| Retry with Exponential Backoff | delays base·2ⁿ + jitter; only some errors; abort signal |
| Event Emitter | \`on\` returns unsubscribe; \`once\`; safe during emit |
| LRU Cache (Map-based) | delete + set = move to back; evict first key |

## 8. Where people fall down in the room

- Losing \`this\` by using arrow functions for the returned wrapper (arrows don't have their own \`this\`).
- Debounce without \`clearTimeout\` (fires on every call) or without \`cancel\`.
- \`promiseAll\` resolving on the *last* promise to finish instead of when the count hits zero (order bugs).
- Deep clone without cycle handling → stack overflow; deep equal with \`===\` on NaN.
- Emitting while a handler unsubscribes → mutating the Set during iteration; copy first.

**Follow-ups the company likes here:** "Make debounce return a promise of the eventual result", "Cancel in-flight work in the pool" (AbortController), "Throttle with requestAnimationFrame", "Memoize an async function" (cache the promise, evict on rejection), "Event emitter with wildcard events / priorities".

## 9. Self-check

1. Debounce vs throttle — one sentence each, and a UI example for each.
2. What prints first: \`setTimeout(() => log(1), 0); Promise.resolve().then(() => log(2));\` — and why?
3. Promise pool: how do workers avoid running the same task twice?
4. Name four things \`JSON.parse(JSON.stringify(x))\` gets wrong.
5. Why copy the handler Set before emitting?

## 10. My notes

_Your own words here._
`;
