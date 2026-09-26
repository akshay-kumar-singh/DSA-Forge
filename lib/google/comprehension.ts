// ======================================================
// INTERVIEW PREP — code comprehension exercises
//
// The company's 2026 loop added a round where you are dropped into an
// unfamiliar multi-file codebase for 60 minutes: find and fix a planted
// bug, add a small feature, then make it faster — with an AI assistant in
// a side panel. You are scored on how you READ code, on forming your own
// hypothesis BEFORE asking the AI, and on how precisely you ask it.
//
// Each exercise is real-shaped JavaScript (express route + service + util,
// a React hook, a cache, a job queue) with exactly one planted defect.
// Authoring rule: no backticks and no ${ } inside the sources, so the file
// stays readable as plain template literals.
// ======================================================

export type BugKind =
  | 'off-by-one' | 'stale closure' | 'shared mutable state' | 'missing await'
  | 'wrong map key' | 'race condition' | 'mutation while iterating' | 'cache eviction';

export interface ComprehensionFile {
  name: string;
  code: string;
}

export interface ComprehensionExercise {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  /** The defect family — shown only after the root cause is revealed */
  bug: BugKind;
  /** One line of orientation, the way a teammate would hand it over */
  brief: string;
  /** The bug report. This is all you get before you start reading. */
  symptom: string;
  /** What a strong hypothesis names — shown after you submit yours, never before */
  hypothesisHint: string;
  rootCause: string;
  fix: string;
  /** The small feature the interviewer asks for once the bug is fixed */
  followUp: string;
  /** The "now make it faster" ask */
  optimise: string;
  files: ComprehensionFile[];
}

export const COMPREHENSION: ComprehensionExercise[] = [
  // ─────────────────────────────────────────── 1
  {
    id: 'orders-pagination',
    title: 'Order history — a page of orders goes missing',
    difficulty: 'easy',
    bug: 'off-by-one',
    brief: 'A REST endpoint that returns a customer\'s orders, page by page.',
    symptom: 'Customers report that their most recent orders are missing from the order history screen, and the last page always comes back empty. The counts in the response look right.',
    hypothesisHint: 'A strong hypothesis names the layer (pagination maths, not the query or the route), says which page is affected, and predicts the exact rows that get skipped.',
    rootCause: 'buildPage() computes the SQL offset as page * take, but page is 1-based — so page 1 already skips the first `take` rows, and every page is shifted forward by one page. The rows for the last page fall off the end of the table, which is why it looks empty.',
    fix: 'offset = (page - 1) * take. Worth adding a test that page 1 returns the same first row as an unpaginated query.',
    followUp: 'Add ?sort=total|created_at and ?dir=asc|desc, validated against an allow-list so it cannot be injected into the ORDER BY.',
    optimise: 'Every request runs a second COUNT(*) over the whole table. Switch to keyset pagination (WHERE created_at < $cursor) or return hasMore by fetching limit + 1 rows, so the count disappears.',
    files: [
      {
        name: 'routes/orders.js',
        code: `const express = require('express');
const { listOrders } = require('../services/orderService');

const router = express.Router();

// GET /orders?page=1&limit=20&status=shipped
router.get('/orders', async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);

  if (!Number.isInteger(page) || page < 1) {
    return res.status(400).json({ error: 'page must be an integer >= 1' });
  }
  if (!Number.isInteger(limit) || limit < 1) {
    return res.status(400).json({ error: 'limit must be an integer >= 1' });
  }

  try {
    const result = await listOrders({
      customerId: req.user.id,
      page,
      limit,
      status: req.query.status,
    });
    res.json(result);
  } catch (err) {
    req.log.error({ err, customerId: req.user.id }, 'failed to list orders');
    res.status(500).json({ error: 'internal error' });
  }
});

module.exports = router;`,
      },
      {
        name: 'services/orderService.js',
        code: `const db = require('../lib/db');
const { buildPage } = require('../lib/paginate');

const ALLOWED_STATUS = ['placed', 'paid', 'shipped', 'delivered', 'cancelled'];

async function listOrders({ customerId, page, limit, status }) {
  const filters = ['customer_id = $1'];
  const params = [customerId];

  if (status) {
    if (!ALLOWED_STATUS.includes(status)) {
      const err = new Error('unknown status: ' + status);
      err.status = 400;
      throw err;
    }
    params.push(status);
    filters.push('status = $' + params.length);
  }

  const where = filters.join(' AND ');
  const { offset, take } = buildPage(page, limit);

  const rows = await db.query(
    'SELECT id, total_cents, status, created_at FROM orders' +
    ' WHERE ' + where +
    ' ORDER BY created_at DESC' +
    ' LIMIT $' + (params.length + 1) +
    ' OFFSET $' + (params.length + 2),
    params.concat([take, offset]),
  );

  const counted = await db.query(
    'SELECT COUNT(*)::int AS count FROM orders WHERE ' + where,
    params,
  );
  const total = counted[0].count;

  return {
    orders: rows.map(toOrder),
    page,
    limit: take,
    total,
    totalPages: Math.ceil(total / take),
    hasMore: page * take < total,
  };
}

function toOrder(row) {
  return {
    id: row.id,
    total: row.total_cents / 100,
    status: row.status,
    createdAt: row.created_at,
  };
}

module.exports = { listOrders };`,
      },
      {
        name: 'lib/paginate.js',
        code: `const MAX_PAGE_SIZE = 100;

// Translate a 1-based page number into SQL LIMIT / OFFSET.
function buildPage(page, limit) {
  const take = Math.max(1, Math.min(limit, MAX_PAGE_SIZE));
  const offset = page * take;
  return { offset, take };
}

module.exports = { buildPage, MAX_PAGE_SIZE };`,
      },
    ],
  },

  // ─────────────────────────────────────────── 2
  {
    id: 'session-timer',
    title: 'Session banner — the timer is stuck at one second',
    difficulty: 'easy',
    bug: 'stale closure',
    brief: 'A React hook that counts how long the current support session has been running.',
    symptom: 'The banner shows "1s" for the whole call. It never advances. It started after a refactor that moved the timer out of the component into a hook.',
    hypothesisHint: 'A strong hypothesis names the closure captured by setInterval and says exactly which value is frozen — not just "the interval is broken".',
    rootCause: 'The interval callback is created once (the effect only depends on isRunning) and closes over the seconds value from that render, which is 0 forever. Every tick therefore sets 0 + 1 = 1 and React bails out of re-rendering because the value did not change.',
    fix: 'Use the functional update: setSeconds(s => s + 1). The callback then needs no captured value at all.',
    followUp: 'Add pause/resume that keeps the elapsed time, and a reset(). Make sure resuming does not lose the seconds already counted.',
    optimise: 'One interval per mounted banner drifts and wastes timers. Store the start timestamp and compute elapsed from Date.now(), ticking once a second only to re-render — accurate even if the tab is backgrounded and throttled.',
    files: [
      {
        name: 'hooks/useElapsed.js',
        code: `import { useEffect, useState } from 'react';

// Counts seconds while isRunning is true.
export function useElapsed(isRunning) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isRunning) return undefined;

    const id = setInterval(() => {
      setSeconds(seconds + 1);
    }, 1000);

    return () => clearInterval(id);
  }, [isRunning]);

  return seconds;
}

export function formatClock(total) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}`,
      },
      {
        name: 'hooks/useCountdown.js',
        code: `import { useEffect, useRef, useState } from 'react';

// Counts DOWN to a deadline. Used by the callback-scheduling widget.
export function useCountdown(deadlineMs) {
  const [remaining, setRemaining] = useState(() => Math.max(0, deadlineMs - Date.now()));
  const deadlineRef = useRef(deadlineMs);

  useEffect(() => {
    deadlineRef.current = deadlineMs;
    setRemaining(Math.max(0, deadlineMs - Date.now()));
  }, [deadlineMs]);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(Math.max(0, deadlineRef.current - Date.now()));
    }, 500);
    return () => clearInterval(id);
  }, []);

  return { remaining, expired: remaining === 0 };
}`,
      },
      {
        name: 'components/SessionList.jsx',
        code: `import React, { useMemo } from 'react';
import SessionBanner from './SessionBanner';

function byPriority(a, b) {
  if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
  return a.waitingSince - b.waitingSince;
}

export default function SessionList({ sessions, onEnd, filter }) {
  const visible = useMemo(() => {
    const matched = sessions.filter((s) => {
      if (filter === 'all') return true;
      if (filter === 'mine') return s.assignedTo === 'me';
      return s.status === filter;
    });
    return matched.slice().sort(byPriority);
  }, [sessions, filter]);

  if (visible.length === 0) {
    return <p className='sessions__empty'>Nothing in this queue.</p>;
  }

  return (
    <div className='sessions'>
      <header className='sessions__head'>
        <h2>Live sessions</h2>
        <span className='sessions__count'>{visible.length}</span>
      </header>

      {visible.map((session) => (
        <SessionBanner key={session.id} session={session} onEnd={onEnd} />
      ))}
    </div>
  );
}`,
      },
      {
        name: 'components/SessionBanner.jsx',
        code: `import React from 'react';
import { useElapsed, formatClock } from '../hooks/useElapsed';

export default function SessionBanner({ session, onEnd }) {
  const seconds = useElapsed(session.status === 'active');
  const overLimit = seconds > session.slaSeconds;

  if (!session) return null;

  return (
    <div className={overLimit ? 'banner banner--over' : 'banner'}>
      <span className='banner__customer'>{session.customerName}</span>
      <span className='banner__clock'>{formatClock(seconds)}</span>
      {overLimit && <span className='banner__warn'>over SLA</span>}
      <button type='button' onClick={() => onEnd(session.id, seconds)}>
        End session
      </button>
    </div>
  );
}`,
      },
    ],
  },

  // ─────────────────────────────────────────── 3
  {
    id: 'catalog-cache',
    title: 'Product page — 404 on the first visit, fine on refresh',
    difficulty: 'medium',
    bug: 'missing await',
    brief: 'A TTL cache in front of the product table, used by the product detail endpoint.',
    symptom: 'Opening a product the first time returns 404. Refreshing the same page immediately afterwards works. It only happens for products nobody has viewed in the last minute.',
    hypothesisHint: 'A strong hypothesis names which call returns before the data exists, and explains why the second request succeeds — that asymmetry is the whole clue.',
    rootCause: 'getProduct() calls loadProduct(id) without awaiting it. The function then reads the cache again immediately, before the database round-trip has resolved, gets undefined, and the route turns that into a 404. By the time the user refreshes, the earlier promise has settled and populated the cache.',
    fix: 'return await loadProduct(id) (and let the route handle a genuine null for products that really do not exist). While you are there, an unawaited promise that rejects becomes an unhandled rejection — a second reason to await it.',
    followUp: 'Add single-flight: two concurrent requests for a cold product should trigger exactly one database read, not two. Store the in-flight promise in the cache, not just the value.',
    optimise: 'Serve stale-while-revalidate: return the expired value immediately and refresh in the background, so a TTL expiry never costs a user a slow request.',
    files: [
      {
        name: 'lib/cache.js',
        code: `class TtlCache {
  constructor(ttlMs) {
    this.ttlMs = ttlMs;
    this.entries = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  get(key) {
    const entry = this.entries.get(key);
    if (!entry) {
      this.misses += 1;
      return undefined;
    }
    if (Date.now() - entry.storedAt > this.ttlMs) {
      this.entries.delete(key);
      this.misses += 1;
      return undefined;
    }
    this.hits += 1;
    return entry.value;
  }

  set(key, value) {
    this.entries.set(key, { value, storedAt: Date.now() });
    return value;
  }

  invalidate(key) {
    this.entries.delete(key);
  }

  stats() {
    return { size: this.entries.size, hits: this.hits, misses: this.misses };
  }
}

module.exports = { TtlCache };`,
      },
      {
        name: 'services/productService.js',
        code: `const db = require('../lib/db');
const { TtlCache } = require('../lib/cache');

const cache = new TtlCache(60 * 1000);

async function loadProduct(id) {
  const row = await db.products.findById(id);
  if (!row) return null;

  const product = {
    id: row.id,
    name: row.name,
    price: row.price_cents / 100,
    inStock: row.stock > 0,
    updatedAt: row.updated_at,
  };
  cache.set(id, product);
  return product;
}

async function getProduct(id) {
  const cached = cache.get(id);
  if (cached) return cached;

  loadProduct(id);
  return cache.get(id);
}

async function updateProduct(id, patch) {
  const row = await db.products.update(id, patch);
  cache.invalidate(id);
  return row;
}

module.exports = { getProduct, updateProduct, cacheStats: () => cache.stats() };`,
      },
      {
        name: 'routes/products.js',
        code: `const express = require('express');
const { getProduct } = require('../services/productService');

const router = express.Router();

router.get('/products/:id', async (req, res) => {
  const product = await getProduct(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'product not found' });
  }
  res.set('Cache-Control', 'public, max-age=30');
  res.json(product);
});

module.exports = router;`,
      },
      {
        name: 'lib/db.js',
        code: `const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.PG_POOL_MAX || 10),
  idleTimeoutMillis: 30000,
});

async function query(sql, params) {
  const started = Date.now();
  const res = await pool.query(sql, params);
  const ms = Date.now() - started;
  if (ms > 200) {
    console.warn('slow query', ms + 'ms', sql.slice(0, 80));
  }
  return res.rows;
}

const products = {
  async findById(id) {
    const rows = await query('SELECT * FROM products WHERE id = $1', [id]);
    return rows[0] || null;
  },
  async update(id, patch) {
    const keys = Object.keys(patch);
    const sets = keys.map((k, i) => k + ' = $' + (i + 2));
    const rows = await query(
      'UPDATE products SET ' + sets.join(', ') + ' WHERE id = $1 RETURNING *',
      [id].concat(keys.map((k) => patch[k])),
    );
    return rows[0] || null;
  },
};

module.exports = { query, products, pool };`,
      },
    ],
  },

  // ─────────────────────────────────────────── 4
  {
    id: 'feature-flags',
    title: 'Feature flags — one tester turned a flag on for everyone',
    difficulty: 'medium',
    bug: 'shared mutable state',
    brief: 'Per-request context building: defaults plus the overrides that apply to this user.',
    symptom: 'An internal tester enabled newCheckout for their own account and it went live for every customer until the next deploy. Separately, the experiments array on the context keeps growing all day.',
    hypothesisHint: 'A strong hypothesis names the object that outlives the request and says which line writes to it — and why a deploy "fixes" it.',
    rootCause: 'Object.assign(DEFAULT_FLAGS, overrides) writes the overrides INTO the module-level defaults object rather than into a fresh one, so every later request inherits them. The same object identity is also why experiments.push() accumulates across requests. A deploy resets it because the module is re-evaluated.',
    fix: 'Build a new object: { ...DEFAULT_FLAGS, ...overrides } — and copy the array too, experiments: [...DEFAULT_FLAGS.experiments, ...userExperiments]. A shallow spread is not enough on its own for nested values.',
    followUp: 'Allow a per-request override through an X-Flag-Overrides header, but only for users with the staff role, and only in non-production environments.',
    optimise: 'Object.freeze(DEFAULT_FLAGS) at module load so this class of bug throws in development instead of leaking silently, and skip rebuilding the context for requests with no overrides.',
    files: [
      {
        name: 'config/defaults.js',
        code: `const DEFAULT_FLAGS = {
  newCheckout: false,
  maxCartItems: 20,
  currency: 'INR',
  experiments: [],
};

const ROLE_OVERRIDES = {
  staff: { maxCartItems: 200 },
  partner: { currency: 'USD' },
};

module.exports = { DEFAULT_FLAGS, ROLE_OVERRIDES };`,
      },
      {
        name: 'lib/requestContext.js',
        code: `const { DEFAULT_FLAGS, ROLE_OVERRIDES } = require('../config/defaults');

// Build the per-request context: who is asking, and what is switched on for them.
function buildContext(user, requestOverrides) {
  const overrides = Object.assign({}, ROLE_OVERRIDES[user.role] || {}, requestOverrides || {});
  const flags = Object.assign(DEFAULT_FLAGS, overrides);

  if (user.experiments && user.experiments.length) {
    flags.experiments.push(...user.experiments);
  }

  return {
    userId: user.id,
    role: user.role,
    flags,
    startedAt: Date.now(),
  };
}

function contextMiddleware(req, res, next) {
  req.ctx = buildContext(req.user, req.body && req.body.flagOverrides);
  next();
}

module.exports = { buildContext, contextMiddleware };`,
      },
      {
        name: 'routes/checkout.js',
        code: `const express = require('express');
const { contextMiddleware } = require('../lib/requestContext');
const { placeOrder, placeOrderV2 } = require('../services/checkoutService');

const router = express.Router();

router.post('/checkout', contextMiddleware, async (req, res) => {
  const { flags } = req.ctx;

  if (req.body.items.length > flags.maxCartItems) {
    return res.status(400).json({ error: 'too many items' });
  }

  const place = flags.newCheckout ? placeOrderV2 : placeOrder;
  const order = await place({
    userId: req.ctx.userId,
    items: req.body.items,
    currency: flags.currency,
    experiments: req.ctx.flags.experiments,
  });

  res.status(201).json(order);
});

module.exports = router;`,
      },
      {
        name: 'services/checkoutService.js',
        code: `const db = require('../lib/db');
const { reserveCart } = require('./inventoryService');
const { priceCart } = require('./pricingService');

// The original checkout. Still serves everyone whose newCheckout flag is off.
async function placeOrder({ userId, items, currency, experiments }) {
  const priced = await priceCart({ items, currency, experiments });
  await reserveCart(items);

  const order = await db.orders.insert({
    user_id: userId,
    currency,
    total_cents: priced.totalCents,
    status: 'placed',
    experiments,
  });

  return { id: order.id, total: priced.totalCents / 100, currency, status: order.status };
}

// The rewrite: one transaction, reservation before pricing, idempotency key support.
async function placeOrderV2({ userId, items, currency, experiments, idempotencyKey }) {
  if (idempotencyKey) {
    const existing = await db.orders.findByIdempotencyKey(idempotencyKey);
    if (existing) return toOrder(existing, currency);
  }

  return db.transaction(async (tx) => {
    await reserveCart(items, tx);
    const priced = await priceCart({ items, currency, experiments });

    const order = await tx.orders.insert({
      user_id: userId,
      currency,
      total_cents: priced.totalCents,
      status: 'placed',
      experiments,
      idempotency_key: idempotencyKey,
    });

    return toOrder(order, currency);
  });
}

function toOrder(row, currency) {
  return { id: row.id, total: row.total_cents / 100, currency, status: row.status };
}

module.exports = { placeOrder, placeOrderV2 };`,
      },
    ],
  },

  // ─────────────────────────────────────────── 5
  {
    id: 'notification-dedupe',
    title: 'Notifications — the same email goes out four times',
    difficulty: 'medium',
    bug: 'wrong map key',
    brief: 'An in-process job queue that is supposed to drop duplicate jobs before they run.',
    symptom: 'Customers receive the "your order shipped" email three or four times within a second. The dedupe layer reports zero duplicates dropped.',
    hypothesisHint: 'A strong hypothesis names what the dedupe set actually stores and why two jobs that look identical are treated as different.',
    rootCause: 'this.seen is a Set of job OBJECTS, and every producer builds a fresh object literal, so has(job) is always false — Sets compare objects by identity, not by contents. The upstream webhook fires once per shipment event and each retry creates a new object.',
    fix: 'Derive a string key — job.type + ":" + job.entityId + ":" + job.recipient — and store that in the Set, or use a Map keyed by it if you also need the job back.',
    followUp: 'Give the dedupe window a TTL so the same notification can legitimately be sent again tomorrow, and expose droppedDuplicates in stats().',
    optimise: 'The Set grows forever in a long-lived process. Bound it (an LRU or a time-bucketed set) so memory does not climb for the lifetime of the worker.',
    files: [
      {
        name: 'lib/jobQueue.js',
        code: `class JobQueue {
  constructor({ concurrency = 4 } = {}) {
    this.concurrency = concurrency;
    this.pending = [];
    this.seen = new Set();
    this.running = 0;
    this.stats = { enqueued: 0, dropped: 0, completed: 0, failed: 0 };
  }

  enqueue(job) {
    if (this.seen.has(job)) {
      this.stats.dropped += 1;
      return false;
    }
    this.seen.add(job);
    this.pending.push(job);
    this.stats.enqueued += 1;
    this.drain();
    return true;
  }

  async drain() {
    while (this.running < this.concurrency && this.pending.length > 0) {
      const job = this.pending.shift();
      this.running += 1;
      this.run(job).finally(() => {
        this.running -= 1;
        this.drain();
      });
    }
  }

  async run(job) {
    try {
      await job.handler(job.payload);
      this.stats.completed += 1;
    } catch (err) {
      this.stats.failed += 1;
      console.error('job failed', job.type, err.message);
    }
  }
}

module.exports = { JobQueue };`,
      },
      {
        name: 'jobs/shipmentNotifier.js',
        code: `const { JobQueue } = require('../lib/jobQueue');
const { sendEmail } = require('../lib/mailer');

const queue = new JobQueue({ concurrency: 8 });

// Called from the carrier webhook. The carrier retries aggressively,
// so the same shipment event can arrive several times.
function notifyShipped(event) {
  queue.enqueue({
    type: 'order.shipped',
    entityId: event.orderId,
    recipient: event.customerEmail,
    payload: {
      to: event.customerEmail,
      template: 'order-shipped',
      vars: { orderId: event.orderId, trackingUrl: event.trackingUrl },
    },
    handler: sendEmail,
  });
}

module.exports = { notifyShipped, queueStats: () => queue.stats };`,
      },
      {
        name: 'lib/mailer.js',
        code: `const { render } = require('./templates');
const transport = require('./transport');

const FROM = 'orders@example.com';
const MAX_SUBJECT = 120;

async function sendEmail(payload) {
  const { to, template, vars } = payload;

  if (!to || !to.includes('@')) {
    throw new Error('invalid recipient: ' + to);
  }

  const { subject, html, text } = render(template, vars);

  const message = {
    from: FROM,
    to,
    subject: subject.slice(0, MAX_SUBJECT),
    html,
    text,
    headers: {
      'X-Template': template,
      'X-Entity-Ref': vars.orderId || '',
    },
  };

  const result = await transport.send(message);
  if (!result.accepted || result.accepted.length === 0) {
    throw new Error('transport rejected message for ' + to);
  }

  return { messageId: result.messageId, to };
}

module.exports = { sendEmail, FROM };`,
      },
    ],
  },

  // ─────────────────────────────────────────── 6
  {
    id: 'inventory-race',
    title: 'Flash sale — we sold twelve units of a ten-unit item',
    difficulty: 'medium',
    bug: 'race condition',
    brief: 'The reservation path that decrements stock when a customer checks out.',
    symptom: 'During a flash sale, an item with 10 units in stock produced 12 confirmed orders. Under normal traffic it never happens; support can never reproduce it.',
    hypothesisHint: 'A strong hypothesis names the two lines the interleaving happens between, and says what two concurrent requests each read.',
    rootCause: 'reserve() reads the row, checks availability, awaits, and then writes a value computed from the value it read. Two requests that read before either writes both see available = 1 and both write 0 — the classic lost update. It only shows up when requests for the same SKU overlap, which is exactly what a flash sale produces.',
    fix: 'Make the check and the decrement one atomic statement: UPDATE inventory SET available = available - $qty WHERE sku = $sku AND available >= $qty, then treat zero affected rows as out of stock. No read-then-write, so there is nothing to interleave.',
    followUp: 'Add reservation expiry: a reservation that is not converted to an order within 10 minutes returns the units to stock.',
    optimise: 'Cart checkout reserves each SKU with its own round-trip. Reserve the whole cart in one statement (or one transaction) so a 12-item cart is one database call and cannot half-succeed.',
    files: [
      {
        name: 'services/inventoryService.js',
        code: `const db = require('../lib/db');
const { recordAudit } = require('../lib/audit');

class OutOfStockError extends Error {
  constructor(sku, requested, available) {
    super('out of stock: ' + sku);
    this.status = 409;
    this.sku = sku;
    this.requested = requested;
    this.available = available;
  }
}

async function reserve({ sku, quantity, orderId }) {
  const item = await db.inventory.findBySku(sku);
  if (!item) {
    const err = new Error('unknown sku: ' + sku);
    err.status = 404;
    throw err;
  }

  if (item.available < quantity) {
    throw new OutOfStockError(sku, quantity, item.available);
  }

  await recordAudit({ kind: 'reserve.attempt', sku, quantity, orderId });

  await db.inventory.update(sku, {
    available: item.available - quantity,
    reserved: item.reserved + quantity,
  });

  return { sku, quantity, remaining: item.available - quantity };
}

async function release({ sku, quantity }) {
  const item = await db.inventory.findBySku(sku);
  await db.inventory.update(sku, {
    available: item.available + quantity,
    reserved: Math.max(0, item.reserved - quantity),
  });
}

module.exports = { reserve, release, OutOfStockError };`,
      },
      {
        name: 'routes/reserve.js',
        code: `const express = require('express');
const { reserve, OutOfStockError } = require('../services/inventoryService');

const router = express.Router();

router.post('/orders/:orderId/reserve', async (req, res) => {
  const { items } = req.body;
  const reserved = [];

  try {
    for (const item of items) {
      const result = await reserve({
        sku: item.sku,
        quantity: item.quantity,
        orderId: req.params.orderId,
      });
      reserved.push(result);
    }
    res.json({ reserved });
  } catch (err) {
    if (err instanceof OutOfStockError) {
      return res.status(409).json({ error: 'out of stock', sku: err.sku, available: err.available });
    }
    throw err;
  }
});

module.exports = router;`,
      },
      {
        name: 'lib/audit.js',
        code: `const db = require('./db');

const RETAINED_KINDS = new Set([
  'reserve.attempt',
  'reserve.failed',
  'release',
  'order.placed',
  'order.cancelled',
]);

// Append-only audit trail. Deliberately awaited by callers: if we cannot
// write the audit row we would rather fail the request than lose the trail.
async function recordAudit(entry) {
  if (!RETAINED_KINDS.has(entry.kind)) {
    return null;
  }

  const row = {
    kind: entry.kind,
    sku: entry.sku || null,
    quantity: entry.quantity == null ? null : entry.quantity,
    order_id: entry.orderId || null,
    actor: entry.actor || 'system',
    payload: JSON.stringify(entry.payload || {}),
    created_at: new Date().toISOString(),
  };

  return db.audit.insert(row);
}

async function recentFor(sku, limit = 50) {
  return db.audit.query(
    'SELECT * FROM audit WHERE sku = $1 ORDER BY created_at DESC LIMIT $2',
    [sku, limit],
  );
}

module.exports = { recordAudit, recentFor, RETAINED_KINDS };`,
      },
    ],
  },

  // ─────────────────────────────────────────── 7
  {
    id: 'rate-limiter',
    title: 'Rate limiter — users stay blocked long after the minute is up',
    difficulty: 'medium',
    bug: 'off-by-one',
    brief: 'A sliding-window rate limiter held in process memory, used as express middleware.',
    symptom: 'A client that bursts over the limit keeps getting 429 for hours afterwards, not for the next minute. The pod\'s memory also climbs steadily and never comes back down.',
    hypothesisHint: 'A strong hypothesis explains BOTH symptoms with one line of code — the permanent block and the memory growth are the same defect.',
    rootCause: 'allow() computes a pruned copy of the timestamps into `fresh`, but then pushes onto — and stores back — the original unpruned array. Old timestamps are therefore never dropped: the array only grows, and its length stays above the limit forever, so the key is blocked permanently and the memory is never reclaimed.',
    fix: 'Push onto `fresh` and store `fresh` back into the map. The pruned array is the one that must survive.',
    followUp: 'Support per-plan limits (free: 60/min, pro: 600/min) and return the standard headers: X-RateLimit-Limit, X-RateLimit-Remaining and Retry-After.',
    optimise: 'Filtering an array on every request is O(n) per call and holds one timestamp per request. Use fixed time buckets (a counter per second, summed over the window) — O(1) per request and a bounded, tiny footprint per key.',
    files: [
      {
        name: 'lib/rateLimiter.js',
        code: `class SlidingWindowLimiter {
  constructor({ limit, windowMs }) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.hits = new Map();
  }

  allow(key, now = Date.now()) {
    const timestamps = this.hits.get(key) || [];
    const fresh = timestamps.filter((t) => now - t < this.windowMs);

    if (fresh.length >= this.limit) {
      return { allowed: false, remaining: 0, retryAfterMs: this.windowMs - (now - fresh[0]) };
    }

    timestamps.push(now);
    this.hits.set(key, timestamps);

    return { allowed: true, remaining: this.limit - fresh.length - 1, retryAfterMs: 0 };
  }

  reset(key) {
    this.hits.delete(key);
  }

  size() {
    return this.hits.size;
  }
}

module.exports = { SlidingWindowLimiter };`,
      },
      {
        name: 'middleware/limit.js',
        code: `const { SlidingWindowLimiter } = require('../lib/rateLimiter');

const limiter = new SlidingWindowLimiter({ limit: 60, windowMs: 60 * 1000 });

function rateLimit(req, res, next) {
  const key = req.user ? 'user:' + req.user.id : 'ip:' + req.ip;
  const result = limiter.allow(key);

  if (!result.allowed) {
    res.set('Retry-After', Math.ceil(result.retryAfterMs / 1000));
    return res.status(429).json({ error: 'too many requests' });
  }

  res.set('X-RateLimit-Remaining', String(result.remaining));
  next();
}

module.exports = { rateLimit, limiter };`,
      },
      {
        name: 'lib/keys.js',
        code: `const TRUSTED_PROXIES = ['10.0.0.0/8', '172.16.0.0/12'];

// Which bucket does this request count against?
// Authenticated traffic is limited per user; anonymous traffic per client IP.
function limiterKey(req) {
  if (req.user && req.user.id) {
    return 'user:' + req.user.id;
  }
  if (req.apiKey) {
    return 'key:' + req.apiKey.id;
  }
  return 'ip:' + clientIp(req);
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (!forwarded) return req.socket.remoteAddress;

  const chain = forwarded.split(',').map((part) => part.trim()).filter(Boolean);
  for (let i = chain.length - 1; i >= 0; i--) {
    if (!isTrusted(chain[i])) return chain[i];
  }
  return chain[0] || req.socket.remoteAddress;
}

function isTrusted(ip) {
  return TRUSTED_PROXIES.some((cidr) => inRange(ip, cidr));
}

function inRange(ip, cidr) {
  const [base, bitsRaw] = cidr.split('/');
  const bits = Number(bitsRaw);
  const toInt = (addr) => addr.split('.').reduce((acc, oct) => (acc << 8) + Number(oct), 0) >>> 0;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (toInt(ip) & mask) === (toInt(base) & mask);
}

module.exports = { limiterKey, clientIp };`,
      },
    ],
  },

  // ─────────────────────────────────────────── 8
  {
    id: 'search-debounce',
    title: 'Search box — results for what you typed three keystrokes ago',
    difficulty: 'hard',
    bug: 'stale closure',
    brief: 'A debounced search hook backed by a REST endpoint.',
    symptom: 'Typing "lap" then finishing "laptop" sometimes leaves the results for "lap" on screen. It happens more on a slow connection, and the query in the box never matches what is listed.',
    hypothesisHint: 'A strong hypothesis says which two requests are in flight and which one wins — and notes that the debounce timer is not the problem.',
    rootCause: 'The effect clears its timeout on cleanup, but once the fetch has started nothing cancels it. If the request for "lap" resolves AFTER the request for "laptop", its setResults call runs last and overwrites the newer results. The debounce only reduces how often this happens; it cannot prevent it.',
    fix: 'Guard the write with a cancellation flag set in the cleanup (let cancelled = false; ... if (!cancelled) setResults(...)), or pass an AbortController signal to fetch and abort it in the cleanup. A monotonically increasing request id compared before writing works too.',
    followUp: 'Add loading and empty states, and keep the previous results visible (dimmed) while a new query is in flight instead of blanking the list.',
    optimise: 'Cache results per normalised query in a Map so backspacing to a previous query is instant, and abort the in-flight request when the query changes so the server is not doing work nobody will read.',
    files: [
      {
        name: 'hooks/useSearch.js',
        code: `import { useEffect, useState } from 'react';
import { searchProducts } from '../lib/api';

const DEBOUNCE_MS = 250;

export function useSearch(query, filters) {
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return undefined;
    }

    const timer = setTimeout(async () => {
      try {
        const data = await searchProducts(query.trim(), filters);
        setResults(data.items);
        setError(null);
      } catch (err) {
        setError(err);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, filters]);

  return { results, error };
}`,
      },
      {
        name: 'lib/api.js',
        code: `const BASE = '/api/v2';

async function request(path, options) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || 'request failed');
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export function searchProducts(query, filters) {
  const params = new URLSearchParams({ q: query });
  if (filters && filters.category) params.set('category', filters.category);
  if (filters && filters.maxPrice) params.set('max_price', String(filters.maxPrice));
  return request('/search?' + params.toString());
}

export function recentSearches() {
  return request('/search/recent');
}

export function trackSelection(query, productId) {
  return request('/search/click', {
    method: 'POST',
    body: JSON.stringify({ query, productId, at: Date.now() }),
  });
}`,
      },
      {
        name: 'hooks/useRecentSearches.js',
        code: `import { useCallback, useEffect, useState } from 'react';
import { recentSearches } from '../lib/api';

const STORAGE_KEY = 'recent-searches';
const MAX_RECENT = 8;

function readLocal() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

export function useRecentSearches() {
  const [recent, setRecent] = useState(readLocal);

  useEffect(() => {
    let cancelled = false;
    recentSearches()
      .then((data) => {
        if (!cancelled) setRecent(data.queries.slice(0, MAX_RECENT));
      })
      .catch(() => {
        // offline or logged out: the local copy is good enough
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const remember = useCallback((query) => {
    setRecent((prev) => {
      const next = [query].concat(prev.filter((q) => q !== query)).slice(0, MAX_RECENT);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        // storage full or blocked — not worth failing the search for
      }
      return next;
    });
  }, []);

  return { recent, remember };
}`,
      },
      {
        name: 'components/SearchBox.jsx',
        code: `import React, { useState } from 'react';
import { useSearch } from '../hooks/useSearch';

export default function SearchBox({ filters, onPick }) {
  const [query, setQuery] = useState('');
  const { results, error } = useSearch(query, filters);

  return (
    <div className='search'>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder='Search products'
        aria-label='Search products'
      />

      {error && <p className='search__error'>Something went wrong.</p>}

      <ul className='search__results'>
        {results.map((item) => (
          <li key={item.id}>
            <button type='button' onClick={() => onPick(item)}>
              {item.name}
              <span className='search__price'>{item.price}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}`,
      },
    ],
  },

  // ─────────────────────────────────────────── 9
  {
    id: 'batch-worker',
    title: 'Batch worker — half the jobs in every batch are skipped',
    difficulty: 'hard',
    bug: 'mutation while iterating',
    brief: 'A worker that drains a batch of jobs, removing each one as it succeeds.',
    symptom: 'Roughly every second job in a batch is never processed, and a job that keeps failing seems to be retried forever. Re-running the batch processes some of the missing ones — but again only half.',
    hypothesisHint: 'A strong hypothesis names the two things that both move the cursor, and predicts exactly which jobs survive a batch of five.',
    rootCause: 'The loop advances i while splice() removes the current element and shifts everything left by one — so after handling index 0, the job that was at index 1 is now at index 0 and i has already moved to 1. Every other job is stepped over. The retry path has the same defect, which is why a permanently failing job is never reached again to exhaust its attempts.',
    fix: 'Do not mutate the array you are walking. Either iterate backwards (for (let i = queue.length - 1; i >= 0; i--)), or drain from the front with while (queue.length) { const job = queue.shift(); ... }, or collect survivors into a new array and assign it once at the end.',
    followUp: 'Add a dead-letter list: once a job exceeds MAX_ATTEMPTS, move it to failedJobs with the last error instead of silently dropping it.',
    optimise: 'Jobs are run strictly one at a time. Run them with a concurrency limit (say 5 at once) while keeping ordering per entityId, so one slow job does not stall the batch.',
    files: [
      {
        name: 'workers/batchWorker.js',
        code: `const { runJob } = require('../lib/runner');
const { backoffMs } = require('../lib/retry');

const MAX_ATTEMPTS = 3;

async function drain(queue, logger) {
  const started = Date.now();
  let processed = 0;

  for (let i = 0; i < queue.length; i++) {
    const job = queue[i];

    try {
      await runJob(job);
      queue.splice(i, 1);
      processed += 1;
    } catch (err) {
      job.attempts = (job.attempts || 0) + 1;
      job.lastError = err.message;

      if (job.attempts >= MAX_ATTEMPTS) {
        logger.error({ job: job.id, err }, 'job exhausted retries');
        queue.splice(i, 1);
      } else {
        job.nextRunAt = Date.now() + backoffMs(job.attempts);
        logger.warn({ job: job.id, attempts: job.attempts }, 'job will retry');
      }
    }
  }

  logger.info({ processed, remaining: queue.length, ms: Date.now() - started }, 'batch drained');
  return processed;
}

module.exports = { drain, MAX_ATTEMPTS };`,
      },
      {
        name: 'lib/runner.js',
        code: `const handlers = require('../jobs');
const metrics = require('./metrics');

const TIMEOUT_MS = 30 * 1000;

async function runJob(job) {
  const handler = handlers[job.type];
  if (!handler) {
    const err = new Error('no handler for job type: ' + job.type);
    err.permanent = true;
    throw err;
  }

  const started = Date.now();
  try {
    const result = await withTimeout(handler(job.payload), TIMEOUT_MS, job.type);
    metrics.timing('job.duration', Date.now() - started, { type: job.type, outcome: 'ok' });
    return result;
  } catch (err) {
    metrics.timing('job.duration', Date.now() - started, { type: job.type, outcome: 'error' });
    throw err;
  }
}

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error('job timed out: ' + label)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

module.exports = { runJob, withTimeout, TIMEOUT_MS };`,
      },
      {
        name: 'lib/retry.js',
        code: `const BASE_MS = 200;
const MAX_MS = 30 * 1000;

// Exponential backoff with jitter, so retries from many workers do not align.
function backoffMs(attempt) {
  const exponential = Math.min(BASE_MS * Math.pow(2, attempt - 1), MAX_MS);
  const jitter = Math.random() * BASE_MS;
  return Math.round(exponential + jitter);
}

function isRetryable(err) {
  if (!err) return false;
  if (err.status && err.status >= 400 && err.status < 500) return false;
  return true;
}

module.exports = { backoffMs, isRetryable, BASE_MS, MAX_MS };`,
      },
      {
        name: 'workers/index.js',
        code: `const { drain } = require('./batchWorker');
const { fetchDueJobs } = require('../lib/jobStore');
const logger = require('../lib/logger');

const TICK_MS = 5000;
const BATCH_SIZE = 50;

async function tick() {
  const jobs = await fetchDueJobs(BATCH_SIZE);
  if (jobs.length === 0) return;

  await drain(jobs, logger);

  if (jobs.length > 0) {
    logger.info({ requeued: jobs.length }, 'jobs left for the next tick');
  }
}

function start() {
  setInterval(() => {
    tick().catch((err) => logger.error({ err }, 'tick failed'));
  }, TICK_MS);
}

module.exports = { start, tick };`,
      },
    ],
  },

  // ─────────────────────────────────────────── 10
  {
    id: 'session-lru',
    title: 'Session cache — misses on the busiest sessions',
    difficulty: 'hard',
    bug: 'cache eviction',
    brief: 'An LRU cache of decoded session objects, sitting in front of the session store.',
    symptom: 'The cache hit rate is terrible under load even though the capacity is far larger than the number of active sessions, and the process holds one more entry than the configured cap. The sessions that miss most are the ones being used most.',
    hypothesisHint: 'A strong hypothesis names what "recently used" currently means in this implementation, and why the busiest key is the first one evicted.',
    rootCause: 'Two defects, same area. get() reads through Map.get without re-inserting, so a key\'s position never changes after it is first written — the cache is FIFO, not LRU, and the hottest long-lived session is evicted first. And set() evicts only when size > capacity + 1, so the map steadily holds capacity + 1 entries.',
    fix: 'In get(), delete then re-set the key so it moves to the end of the Map\'s insertion order. In set(), evict while this.map.size > this.capacity. Keep the delete-before-set in set() too, or updating an existing key will not refresh its recency either.',
    followUp: 'Add a per-entry TTL so a session that was revoked server-side cannot be served from cache for longer than a minute, and expose hitRate() for the metrics endpoint.',
    optimise: 'Every get() does a delete plus an insert. For a very hot cache, back it with a hash map plus a doubly linked list so a touch is a few pointer writes and never rehashes.',
    files: [
      {
        name: 'lib/lru.js',
        code: `class LruCache {
  constructor(capacity) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new Error('capacity must be a positive integer');
    }
    this.capacity = capacity;
    this.map = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  get(key) {
    if (!this.map.has(key)) {
      this.misses += 1;
      return undefined;
    }
    this.hits += 1;
    return this.map.get(key);
  }

  set(key, value) {
    this.map.set(key, value);

    if (this.map.size > this.capacity + 1) {
      const oldest = this.map.keys().next().value;
      this.map.delete(oldest);
    }
    return value;
  }

  delete(key) {
    return this.map.delete(key);
  }

  get size() {
    return this.map.size;
  }

  stats() {
    const total = this.hits + this.misses;
    return { size: this.map.size, hits: this.hits, misses: this.misses, hitRate: total ? this.hits / total : 0 };
  }
}

module.exports = { LruCache };`,
      },
      {
        name: 'services/sessionStore.js',
        code: `const { LruCache } = require('../lib/lru');
const { verifyToken } = require('../lib/jwt');
const db = require('../lib/db');

const cache = new LruCache(5000);

async function getSession(token) {
  const cached = cache.get(token);
  if (cached) return cached;

  const claims = verifyToken(token);
  if (!claims) return null;

  const row = await db.sessions.findById(claims.sid);
  if (!row || row.revoked_at) return null;

  const session = {
    id: row.id,
    userId: row.user_id,
    roles: row.roles,
    expiresAt: row.expires_at,
  };
  cache.set(token, session);
  return session;
}

function revoke(token) {
  cache.delete(token);
  return db.sessions.revoke(token);
}

module.exports = { getSession, revoke, sessionCacheStats: () => cache.stats() };`,
      },
      {
        name: 'middleware/auth.js',
        code: `const { getSession } = require('../services/sessionStore');

const PUBLIC_PATHS = ['/health', '/login', '/signup', '/api/v2/search'];

function bearer(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim() || null;
}

async function authenticate(req, res, next) {
  if (PUBLIC_PATHS.some((p) => req.path === p || req.path.startsWith(p + '/'))) {
    return next();
  }

  const token = bearer(req) || (req.cookies && req.cookies.sid);
  if (!token) {
    return res.status(401).json({ error: 'missing credentials' });
  }

  try {
    const session = await getSession(token);
    if (!session) {
      return res.status(401).json({ error: 'invalid session' });
    }
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      return res.status(401).json({ error: 'session expired' });
    }

    req.user = { id: session.userId, roles: session.roles };
    req.sessionId = session.id;
    next();
  } catch (err) {
    req.log.error({ err }, 'auth failed');
    res.status(500).json({ error: 'internal error' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || !req.user.roles.includes(role)) {
      return res.status(403).json({ error: 'forbidden' });
    }
    next();
  };
}

module.exports = { authenticate, requireRole, PUBLIC_PATHS };`,
      },
    ],
  },
];

export const COMPREHENSION_BY_ID: Record<string, ComprehensionExercise> = Object.fromEntries(
  COMPREHENSION.map(e => [e.id, e]),
);

/** Total lines across an exercise — what you are being asked to read. */
export function exerciseLines(e: ComprehensionExercise): number {
  return e.files.reduce((n, f) => n + f.code.split('\n').length, 0);
}
