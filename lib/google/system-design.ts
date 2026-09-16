// ======================================================
// GOOGLE PREP — system design prompts & round structure
// Straight from "Six Months to Google" §6: the 45-minute
// shape, the classic prompts, and the payments edge.
// ======================================================

import type { DesignPhase, DesignPrompt } from './types';

/** The 45-minute structure that works (roadmap §6). */
export const DESIGN_PHASES: DesignPhase[] = [
  { id: 'req',   label: 'Requirements',     startMin: 0,  endMin: 7,  goal: 'Functional + non-functional. Pin scale explicitly: users, reads/sec, writes/sec, payload, retention, latency target. Write the numbers down.' },
  { id: 'est',   label: 'Back-of-envelope', startMin: 7,  endMin: 12, goal: 'QPS, storage per year, bandwidth. Round aggressively and say you are rounding.' },
  { id: 'api',   label: 'API & data model', startMin: 12, endMin: 18, goal: 'A handful of endpoints, the core entities, the access patterns. Access patterns drive the storage choice — not the other way round.' },
  { id: 'hld',   label: 'High-level design', startMin: 18, endMin: 32, goal: 'Client → LB → service → cache → datastore, plus queues where you need async. Draw it, then walk one request through the whole path.' },
  { id: 'deep',  label: 'Deep dive',        startMin: 32, endMin: 42, goal: 'One component in depth: sharding key, cache invalidation, hot keys, failure modes.' },
  { id: 'wrap',  label: 'Bottlenecks',      startMin: 42, endMin: 45, goal: 'What breaks first at 10× scale, and what you would do differently.' },
];

export const DESIGN_CONCEPTS = [
  'Load balancing', 'Caching strategies & eviction', 'CDN', 'SQL vs NoSQL — and why', 'Sharding & partitioning',
  'Replication & read replicas', 'CAP & consistency models', 'Message queues', 'Rate limiting', 'Idempotency',
  'Consistent hashing', 'Database indexing', 'Back-pressure', 'Monitoring & SLOs',
];

export const DESIGN_PROMPTS: DesignPrompt[] = [
  // ── Backend — the six classics ───────────────────
  {
    id: 'url-shortener', title: 'URL shortener', track: 'backend', tier: 'core',
    prompt: 'Design a system that shortens URLs.',
    clarifiers: ['Custom aliases or generated only?', 'Expiry?', 'Analytics on clicks?', 'Read:write ratio?', 'Latency target for redirects?'],
    scale: ['100M new URLs / month ≈ 40 writes/s', '10:1 to 100:1 read-heavy → ~4k redirects/s peak', '7-char base62 → 3.5 trillion keys', 'Store ~500 B/URL → 50 GB/yr'],
    mustCover: ['Key generation: hash + collision vs counter vs pre-generated key service', 'Redirect path: cache → DB, 301 vs 302 trade-off', 'Storage choice for a KV workload', 'Expiry and cleanup'],
    deepDives: ['What happens when the key-generation service dies?', 'Hot URL — one link gets 1M hits/min', 'How would you make the redirect path survive a region outage?'],
  },
  {
    id: 'rate-limiter', title: 'Rate limiter', track: 'backend', tier: 'core',
    prompt: 'Design a rate limiter for our public API.',
    clarifiers: ['Per user, per IP, per API key?', 'Client-side or server-side?', 'Hard block or throttle?', 'Distributed — multiple gateway nodes?', 'How precise must the window be?'],
    scale: ['1M users, 10 req/s each allowed', 'Gateway fleet of 50 nodes', 'Rule changes must propagate in seconds'],
    mustCover: ['Algorithms: token bucket, leaky bucket, fixed window, sliding log, sliding window counter', 'Where the counters live — Redis with atomic INCR/Lua', 'Response: 429 + Retry-After headers', 'Race conditions across nodes'],
    deepDives: ['Redis goes down — fail open or fail closed?', 'Clock skew between gateway nodes', 'Rules are per-tenant with different limits — how do you store and hot-reload them?'],
    edge: 'You have built one at Paywize. Say which algorithm you chose and why.',
  },
  {
    id: 'news-feed', title: 'News feed', track: 'backend', tier: 'core',
    prompt: 'Design the news feed for a social network.',
    clarifiers: ['Chronological or ranked?', 'Media in posts?', 'How many follows per user (celebrity problem)?', 'How fresh must the feed be?', 'Mobile + web?'],
    scale: ['10M DAU, each opens feed 10×/day → ~1.2k feed reads/s avg, 10× peak', '1M posts/day', 'Average 300 follows, max 10M followers'],
    mustCover: ['Fan-out on write vs fan-out on read — and the hybrid', 'Feed cache per user (Redis lists)', 'Post service, feed service, media via CDN', 'Ranking as a separate stage'],
    deepDives: ['A celebrity with 10M followers posts — walk through exactly what happens', 'Feed shows a deleted post — how do you handle consistency?', 'Pagination that survives new posts arriving'],
  },
  {
    id: 'chat', title: 'Chat / messaging', track: 'backend', tier: 'core',
    prompt: 'Design a messaging app like WhatsApp.',
    clarifiers: ['1:1 only or groups? Group size limit?', 'Delivery receipts, typing indicators?', 'Message history retention?', 'End-to-end encryption in scope?', 'Offline delivery?'],
    scale: ['50M DAU, 40 messages/user/day → ~25k msg/s avg', 'Persistent connections: 50M concurrent at peak → ~500 chat servers at 100k conns each', 'Messages ~100 B + metadata → ~2 TB/day'],
    mustCover: ['WebSocket vs long-polling vs SSE', 'Connection registry: which server holds which user', 'Message store: write-heavy, ordered by conversation (Cassandra/HBase-style)', 'Delivery guarantees and ordering; message IDs'],
    deepDives: ['User is connected on two devices', 'A chat server crashes with 100k open connections', 'Group of 500 — fan-out cost and ordering across members'],
    edge: 'Your Socket.IO dispute chat: rooms, reconnection, presence. Bring the specifics.',
  },
  {
    id: 'notifications', title: 'Notification system', track: 'backend', tier: 'core',
    prompt: 'Design a notification system that sends push, SMS and email.',
    clarifiers: ['Who triggers notifications — internal services only?', 'User preferences and opt-outs?', 'Priority tiers?', 'Delivery guarantee: at-least-once?', 'Rate limits per user?'],
    scale: ['10M notifications/day, spiky (marketing blasts)', 'Third-party providers with their own rate limits', 'p99 latency for transactional < 5 s'],
    mustCover: ['Ingest API → queue per channel → workers → providers', 'Template service and user-preference lookup', 'Retries with backoff, dead-letter queue, idempotency keys', 'Priority queues so OTPs beat marketing'],
    deepDives: ['Provider is down for 30 minutes', 'Deduplicate — the same event arrives twice', 'How do you know a notification was actually delivered?'],
  },
  {
    id: 'web-crawler', title: 'Web crawler', track: 'backend', tier: 'core',
    prompt: 'Design a web crawler.',
    clarifiers: ['Purpose — search index, archive, link check?', 'Scale: how many pages, how fresh?', 'Content types: HTML only?', 'Politeness constraints?', 'Distributed across data centres?'],
    scale: ['1B pages/month → ~400 pages/s', 'Average page 500 KB → 500 TB/month raw', 'Re-crawl frequency by change rate'],
    mustCover: ['URL frontier: priority + politeness queues', 'Fetcher, DNS cache, robots.txt cache', 'Dedup: content hashes / SimHash; bloom filter for seen URLs', 'Storage of raw pages; extraction pipeline'],
    deepDives: ['Spider traps and infinite calendars', 'One host must not get more than 1 req/s', 'How would you re-crawl only pages that changed?'],
  },
  // ── Backend — Google flavour ─────────────────────
  {
    id: 'video-streaming', title: 'Video streaming', track: 'backend', tier: 'stretch',
    prompt: 'Design YouTube.',
    clarifiers: ['Upload + watch only, or live too?', 'Supported resolutions?', 'Global audience?', 'Comments/likes in scope?'],
    scale: ['5M DAU, 5 videos watched/day', '500 hours uploaded/min', 'Average video 300 MB raw → petabytes/year'],
    mustCover: ['Upload → transcoding DAG (resolutions, codecs) via queue', 'Blob storage + CDN; adaptive bitrate (HLS/DASH)', 'Metadata DB separate from blobs', 'Pre-signed upload URLs; resumable uploads'],
    deepDives: ['Transcoding a 4-hour video — parallelise how?', 'A video goes viral in one country', 'Cost: which layer is most expensive and how do you cut it?'],
  },
  {
    id: 'collab-editing', title: 'Google Docs collaborative editing', track: 'backend', tier: 'stretch',
    prompt: 'Design collaborative document editing like Google Docs.',
    clarifiers: ['How many concurrent editors per doc?', 'Offline editing?', 'Version history?', 'Rich text or plain?', 'Latency expectation for seeing others\' edits?'],
    scale: ['1M active docs, avg 2 editors, max 100', 'Edits are small (a char) and frequent', 'History retained for a year'],
    mustCover: ['OT vs CRDT — pick one and defend it', 'WebSocket session per doc; a doc lives on one server (sticky)', 'Operation log as the source of truth; periodic snapshots', 'Presence and cursors'],
    deepDives: ['Two users type in the same word at the same time', 'The server holding the doc dies mid-session', 'A user comes back online after an hour of offline edits'],
  },
  {
    id: 'autocomplete', title: 'Search autocomplete', track: 'backend', tier: 'stretch',
    prompt: 'Design search autocomplete.',
    clarifiers: ['Top-k suggestions by popularity or personalised?', 'Prefix only or fuzzy?', 'How fresh must trending queries be?', 'Latency budget per keystroke?'],
    scale: ['10M queries/day → 100M keystroke requests/day', 'p99 < 100 ms', 'Trie of top 10M queries fits in memory'],
    mustCover: ['Trie with top-k cached at each node', 'Offline aggregation pipeline (log → count → rebuild) vs streaming updates', 'Sharding the trie by prefix range', 'Client-side debounce and caching'],
    deepDives: ['A new query becomes hot within minutes', 'Prefix "a" is a hot shard', 'Filtering offensive suggestions'],
  },
  {
    id: 'distributed-cache', title: 'Distributed cache', track: 'backend', tier: 'stretch',
    prompt: 'Design a distributed key-value cache like Memcached.',
    clarifiers: ['Consistency expectations?', 'Persistence?', 'Value size limits?', 'Eviction policy?', 'Multi-region?'],
    scale: ['1M ops/s across the cluster', '100 GB working set', 'Nodes fail; adding nodes must not thrash'],
    mustCover: ['Consistent hashing with virtual nodes', 'LRU per node; memory slabs', 'Client-side routing vs proxy', 'Replication for hot keys; cache stampede protection'],
    deepDives: ['Node joins — how much data moves?', 'Thundering herd on a hot key expiring', 'How do you keep the cache and DB consistent on writes?'],
  },
  {
    id: 'payments', title: 'Payment system', track: 'backend', tier: 'stretch',
    prompt: 'Design a payment system that moves money between a customer and a merchant.',
    clarifiers: ['Card payments via a PSP, or bank transfers?', 'Which flows: pay-in, payout, refunds?', 'Reconciliation with the PSP?', 'Regulatory constraints (PCI)?', 'Exactly-once semantics required where?'],
    scale: ['1M transactions/day, peaky at month-end', 'Zero tolerance for double charge', 'PSP webhooks are at-least-once and out-of-order'],
    mustCover: ['Idempotency keys on every write endpoint', 'Double-entry ledger; append-only', 'State machine per payment; retries with backoff', 'Webhook ingestion: verify, dedupe, queue', 'Reconciliation job vs PSP reports'],
    deepDives: ['PSP says success, your DB write failed', 'Two refund requests for the same payment arrive simultaneously', 'Reconciliation finds a mismatch — walk the runbook'],
    edge: 'This is your day job. Collections, Payouts, BBPS, Cashfree webhooks — lead with what you have actually debugged.',
  },
  {
    id: 'job-scheduler', title: 'Distributed job scheduler', track: 'backend', tier: 'stretch',
    prompt: 'Design a system that runs scheduled jobs (cron at scale).',
    clarifiers: ['One-off vs recurring?', 'Exactly-once execution or at-least-once?', 'Job duration range?', 'Priorities and dependencies?'],
    scale: ['10M jobs/day', 'Some due at the same second', 'Workers are unreliable'],
    mustCover: ['Timer store partitioned by due time', 'Leader election / lease per partition', 'Worker leases with heartbeats; visibility timeout', 'Idempotent job handlers'],
    deepDives: ['A worker dies mid-job', 'Clock drift', 'A million jobs due at midnight'],
  },
  {
    id: 'file-storage', title: 'Google Drive (file sync)', track: 'backend', tier: 'stretch',
    prompt: 'Design Google Drive.',
    clarifiers: ['Sync across devices?', 'File size limits?', 'Sharing and permissions?', 'Versioning?'],
    scale: ['50M users, 10 GB each → 500 PB', 'Upload bandwidth heavy', 'Small edits to big files are common'],
    mustCover: ['Chunking + content-addressed dedup', 'Metadata DB vs blob store', 'Sync: change notifications via long-poll/WebSocket', 'Conflict resolution'],
    deepDives: ['Two devices edit offline', 'Upload resumes after a network drop', 'Permission check on every read at scale'],
  },
  {
    id: 'metrics', title: 'Metrics & monitoring', track: 'backend', tier: 'stretch',
    prompt: 'Design a metrics and alerting system.',
    clarifiers: ['Push or pull?', 'Cardinality of labels?', 'Retention and downsampling?', 'Alert latency?'],
    scale: ['10M time series, 10 s resolution', 'Queries over the last hour dominate', 'Retain 1 year with downsampling'],
    mustCover: ['Ingest → stream → time-series store', 'Hot/warm/cold tiers', 'Aggregation and downsampling jobs', 'Alert evaluation loop'],
    deepDives: ['A label explosion doubles cardinality overnight', 'Dashboards are slow — where do you add caching?', 'Alert flapping'],
  },
  // ── Frontend — his edge ───────────────────────────
  {
    id: 'fe-typeahead', title: 'Frontend: typeahead component', track: 'frontend', tier: 'core',
    prompt: 'Design the autocomplete search box on the Google homepage — the client side.',
    clarifiers: ['Keyboard navigation required?', 'Accessibility level?', 'Recent searches offline?', 'Mobile?'],
    scale: ['Keystroke → suggestion in < 100 ms perceived', 'Debounce 150–300 ms', 'Cancel stale requests'],
    mustCover: ['Component API and state machine', 'Debounce, request cancellation (AbortController), race handling', 'ARIA combobox pattern, focus management', 'Client cache by prefix; optimistic rendering'],
    deepDives: ['Responses arrive out of order', 'Screen-reader announcement of result count', 'Rendering 1,000 suggestions'],
  },
  {
    id: 'fe-feed', title: 'Frontend: infinite news feed', track: 'frontend', tier: 'core',
    prompt: 'Design the client for an infinite-scrolling news feed.',
    clarifiers: ['Media-heavy?', 'Real-time updates?', 'Offline?', 'Analytics on impressions?'],
    scale: ['Thousands of items per session', '60 fps scrolling on mid-range phones', 'Images dominate bytes'],
    mustCover: ['Virtualised list, windowing, item height estimation', 'Cursor pagination + prefetch trigger', 'Image lazy loading, responsive sources, CDN', 'State management: normalised cache, optimistic likes'],
    deepDives: ['User scrolls back 2,000 items — memory?', 'New posts arrive while reading', 'Measuring and fixing Largest Contentful Paint here'],
  },
  {
    id: 'fe-chat', title: 'Frontend: real-time chat client', track: 'frontend', tier: 'core',
    prompt: 'Design the web client for a chat app.',
    clarifiers: ['Multiple open conversations?', 'Offline sending?', 'Read receipts and typing?', 'Notifications?'],
    scale: ['Messages arrive 10/s in a busy group', 'Reconnect within 2 s', 'History of 100k messages per conversation'],
    mustCover: ['WebSocket lifecycle with backoff + resume token', 'Optimistic send, pending/failed states, retry', 'Virtualised message list anchored to the bottom', 'Ordering by server sequence, not arrival'],
    deepDives: ['Tab was asleep for an hour', 'Same user on three tabs', 'Accessibility of a live region that updates constantly'],
    edge: 'Your dispute chat again — from the browser side this time.',
  },
  {
    id: 'fe-collab', title: 'Frontend: collaborative editor', track: 'frontend', tier: 'stretch',
    prompt: 'Design the browser side of Google Docs.',
    clarifiers: ['Rich text?', 'Cursor presence?', 'Offline edits?', 'Undo semantics with collaborators?'],
    scale: ['Keystroke latency < 16 ms locally', 'Remote edits visible < 200 ms', 'Documents of 100k characters'],
    mustCover: ['Document model and rendering strategy (contenteditable vs custom)', 'Local-first apply, then sync operations', 'Presence layer', 'Undo stack that ignores others\' edits'],
    deepDives: ['Selection jumps when a remote edit lands', 'Performance on a huge document', 'Reconnecting with unsent operations'],
  },
  {
    id: 'fe-gallery', title: 'Frontend: photo gallery', track: 'frontend', tier: 'stretch',
    prompt: 'Design the Google Photos web grid.',
    clarifiers: ['Justified layout?', 'Selection and bulk actions?', 'Zoom / lightbox?', 'Upload progress?'],
    scale: ['100k photos per user', 'Thumbnails 200 px; originals 5 MB', 'Smooth scrubbing across years'],
    mustCover: ['Virtualised justified grid; layout computed from aspect ratios', 'Progressive images (blur-up), srcset', 'Date-based sections and a scrubber', 'Keyboard + screen-reader navigation of a grid'],
    deepDives: ['Layout shift when metadata arrives late', 'Prefetch strategy while scrubbing fast', 'Uploading 500 photos at once'],
  },
  {
    id: 'fe-dashboard', title: 'Frontend: real-time dashboard', track: 'frontend', tier: 'stretch',
    prompt: 'Design a merchant dashboard that shows live payment metrics.',
    clarifiers: ['Update frequency?', 'How many charts?', 'Historical range selection?', 'Export?'],
    scale: ['Metrics tick every second', '20 charts on screen', 'Ranges up to a year'],
    mustCover: ['SSE vs WebSocket vs polling for the live layer', 'Downsampling on the client; canvas vs SVG per chart type', 'Data-fetching cache with stale-while-revalidate (React Query)', 'Performance budget and Core Web Vitals'],
    deepDives: ['Tab in background — stop or slow updates?', 'A chart with 1M points', 'Time-zone handling'],
    edge: 'Paywize Collections/Payouts dashboards — you know what merchants actually look at.',
  },
  {
    id: 'fe-design-system', title: 'Frontend: design system & accessibility', track: 'frontend', tier: 'stretch',
    prompt: 'Design a component library used by 50 product teams.',
    clarifiers: ['Frameworks supported?', 'Theming?', 'Versioning and breaking changes?', 'Accessibility bar?'],
    scale: ['200 components', '50 teams shipping weekly', 'WCAG 2.1 AA'],
    mustCover: ['Package architecture, tokens, theming', 'Accessible primitives: modal focus trap, listbox, tabs', 'Versioning, codemods, deprecation policy', 'Docs and visual regression testing'],
    deepDives: ['A breaking change to Button', 'Dark mode across 200 components', 'Bundle size when a team uses 3 components'],
  },
];

export const DESIGN_PROMPT_BY_ID: Record<string, DesignPrompt> = Object.fromEntries(DESIGN_PROMPTS.map(x => [x.id, x]));

export function phaseAt(minute: number): DesignPhase {
  return DESIGN_PHASES.find(ph => minute >= ph.startMin && minute < ph.endMin) ?? DESIGN_PHASES[DESIGN_PHASES.length - 1];
}
