// ======================================================
// GOOGLE PREP — fire-and-forget GitHub activity events
// One event = one commit in the tracker repo (prep/ folder).
// Best-effort: a missing tracker or a failed request is silent.
// ======================================================

export type GoogleTrackAction = 'save' | 'mastered' | 'unmastered' | 'revised' | 'design' | 'story' | 'mock' | 'day' | 'gate' | 'drill' | 'referral' | 'apply' | 'comprehension';

export function trackGoogle(action: GoogleTrackAction, details: string): void {
  if (typeof window === 'undefined' || !details) return;
  fetch('/api/google/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, details }),
    keepalive: true,
  }).catch(() => { /* tracking is best-effort */ });
}
