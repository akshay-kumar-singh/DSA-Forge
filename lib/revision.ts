// ── Spaced-repetition revision ladder ─────────────────
// A mastered problem becomes "due for revision" on an expanding
// schedule: 7 days after mastering, then 14 days after the first
// revision, then every 30 days.

export const REVIEW_INTERVALS_DAYS = [7, 14, 30];

const DAY_MS = 86_400_000;

/** Days until the next revision, given how many revisions are already done. */
export function getIntervalDays(revisionsDone: number): number {
  return REVIEW_INTERVALS_DAYS[Math.min(revisionsDone, REVIEW_INTERVALS_DAYS.length - 1)];
}

export interface DueProblem {
  problem: string;
  /** Full days since the problem was mastered / last revised */
  daysSince: number;
  /** How many full days past its interval it is (0 = due today) */
  overdueDays: number;
}

/** Mastered problems whose interval has elapsed, most overdue first. */
export function getDueProblems(
  lastReviewDate: Record<string, string>,
  reviewCount: Record<string, number>,
  masteredProblems: string[],
  now: number = Date.now(),
): DueProblem[] {
  return masteredProblems
    .filter(prob => lastReviewDate[prob])
    .map(prob => {
      const daysSince = Math.floor((now - new Date(lastReviewDate[prob]).getTime()) / DAY_MS);
      const interval = getIntervalDays(reviewCount[prob] ?? 0);
      return { problem: prob, daysSince, overdueDays: daysSince - interval };
    })
    .filter(d => d.overdueDays >= 0)
    .sort((a, b) => b.overdueDays - a.overdueDays);
}

/** True when a single problem is currently due for revision. */
export function isDueForRevision(
  problem: string,
  lastReviewDate: Record<string, string>,
  reviewCount: Record<string, number>,
  masteredProblems: string[],
  now: number = Date.now(),
): boolean {
  if (!masteredProblems.includes(problem) || !lastReviewDate[problem]) return false;
  const daysSince = Math.floor((now - new Date(lastReviewDate[problem]).getTime()) / DAY_MS);
  return daysSince >= getIntervalDays(reviewCount[problem] ?? 0);
}
