import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

// Path to the sibling tracker repo
const TRACKER_DIR = path.resolve(process.cwd(), '..', 'dsa-forge-tracker');
const LOG_FILE = path.join(TRACKER_DIR, 'log.json');
const STATS_FILE = path.join(TRACKER_DIR, 'stats.json');

interface Activity {
  timestamp: string;
  action: string;
  details: string;
  date: string;
}

interface DailyStats {
  saves: number;
  mastered: number;
  unmastered: number;
}

interface Stats {
  totalSaves: number;
  totalMastered: number;
  totalUnmastered: number;
  dailyStats: Record<string, DailyStats>;
}

interface LogData {
  activities: Activity[];
}

export async function POST(req: Request) {
  try {
    const { action, details } = await req.json();

    if (!action || !details) {
      return NextResponse.json({ error: 'Missing action or details' }, { status: 400 });
    }

    const now = new Date();
    const timestamp = now.toISOString();
    const date = timestamp.split('T')[0]; // YYYY-MM-DD

    // --- Update log.json ---
    let log: LogData = { activities: [] };
    try {
      log = JSON.parse(readFileSync(LOG_FILE, 'utf-8'));
    } catch { /* file doesn't exist or is invalid, start fresh */ }

    log.activities.push({ timestamp, action, details, date });
    writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));

    // --- Update stats.json ---
    let stats: Stats = { totalSaves: 0, totalMastered: 0, totalUnmastered: 0, dailyStats: {} };
    try {
      stats = JSON.parse(readFileSync(STATS_FILE, 'utf-8'));
    } catch { /* start fresh */ }

    if (!stats.dailyStats[date]) {
      stats.dailyStats[date] = { saves: 0, mastered: 0, unmastered: 0 };
    }

    if (action === 'save') {
      stats.totalSaves++;
      stats.dailyStats[date].saves++;
    } else if (action === 'mastered') {
      stats.totalMastered++;
      stats.dailyStats[date].mastered++;
    } else if (action === 'unmastered') {
      stats.totalUnmastered++;
      stats.dailyStats[date].unmastered++;
    }

    writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));

    // --- Git commit & push ---
    const commitMsg =
      action === 'save' ? `📝 Save: ${details}` :
      action === 'mastered' ? `✅ Mastered: ${details}` :
      `🔄 Unmastered: ${details}`;

    try {
      execSync('git add log.json stats.json', { cwd: TRACKER_DIR, stdio: 'pipe' });
      execSync(`git commit -m "${commitMsg}"`, { cwd: TRACKER_DIR, stdio: 'pipe' });
      execSync('git push', { cwd: TRACKER_DIR, stdio: 'pipe' });
    } catch (gitErr: any) {
      console.error('Git operation failed:', gitErr.stderr?.toString() || gitErr.message);
      return NextResponse.json({
        success: false,
        error: 'Files updated but git push failed. Check git credentials.',
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, action, details, timestamp });
  } catch (error: any) {
    console.error('Track API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
