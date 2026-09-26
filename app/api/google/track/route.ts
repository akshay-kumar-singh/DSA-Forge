import { NextResponse } from 'next/server';
import { trackerCreds, getFile, commitFiles } from '@/lib/google/github';
import type { GoogleTrackAction } from '@/lib/google/track';

// ======================================================
// POST /api/google/track — one commit per event in the tracker
// repo (prep/log.json + prep/stats.json), so the Prep
// track shows up in the contribution graph exactly like the
// NeetCode Forge does with log.json / stats.json at the root.
// ======================================================

const LABEL: Record<GoogleTrackAction, string> = {
  save: '📝 Save', mastered: '✅ Mastered', unmastered: '🔄 Unmastered', revised: '📚 Revised',
  design: '🏗️ Design', story: '💬 Story', mock: '🎤 Mock', day: '📅 Day done', gate: '🚩 Gate',
  drill: '⚡ Drill', referral: '🤝 Referral', apply: '📨 Applied', comprehension: '🔍 Comprehension',
};

interface Activity { timestamp: string; action: GoogleTrackAction; details: string; date: string }
type Counter = Record<GoogleTrackAction, number>;
interface Stats { totals: Counter; dailyStats: Record<string, Counter> }

const zero = (): Counter => ({ save: 0, mastered: 0, unmastered: 0, revised: 0, design: 0, story: 0, mock: 0, day: 0, gate: 0, drill: 0, referral: 0, apply: 0, comprehension: 0 });

export async function POST(req: Request) {
  try {
    const { action, details } = (await req.json()) as { action?: GoogleTrackAction; details?: string };
    if (!action || !(action in LABEL) || !details) {
      return NextResponse.json({ error: 'Missing action or details' }, { status: 400 });
    }
    const creds = trackerCreds();
    if (!creds) return NextResponse.json({ skipped: true, reason: 'GitHub tracker not configured' });

    const now = new Date();
    const timestamp = now.toISOString();
    const date = timestamp.slice(0, 10);

    let log: { activities: Activity[] } = { activities: [] };
    let stats: Stats = { totals: zero(), dailyStats: {} };
    const [oldLog, oldStats] = await Promise.all([getFile(creds, 'prep/log.json'), getFile(creds, 'prep/stats.json')]);
    if (oldLog) { try { log = JSON.parse(oldLog); } catch { /* start fresh */ } }
    if (oldStats) { try { stats = JSON.parse(oldStats); } catch { /* start fresh */ } }
    if (!Array.isArray(log.activities)) log.activities = [];
    stats.totals = { ...zero(), ...(stats.totals ?? {}) };
    stats.dailyStats = stats.dailyStats ?? {};
    stats.dailyStats[date] = { ...zero(), ...(stats.dailyStats[date] ?? {}) };

    log.activities.push({ timestamp, action, details, date });
    stats.totals[action]++;
    stats.dailyStats[date][action]++;

    await commitFiles(creds, `🎯 Prep · ${LABEL[action]}: ${details}`, [
      { path: 'prep/log.json', content: JSON.stringify(log, null, 2) },
      { path: 'prep/stats.json', content: JSON.stringify(stats, null, 2) },
    ]);
    return NextResponse.json({ success: true, action, details, timestamp });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Google track API error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
