import { NextResponse } from 'next/server';

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

// Helper to update a file directly in GitHub via their REST API
async function updateGitHubFile(
  filePath: string, 
  updateFn: (oldContent: string) => string, 
  commitMsg: string
) {
  const token = process.env.GITHUB_PAT; 
  const owner = process.env.GITHUB_USERNAME; 
  const repo = process.env.GITHUB_TRACKER_REPO;

  if (!token || !owner || !repo) {
    throw new Error('Missing GitHub credentials in environment variables');
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
  
  // 1. Get the current file (to get its SHA and current content)
  const getRes = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  let sha: string | undefined = undefined;
  let oldContent = '';

  if (getRes.ok) {
    const data = await getRes.json();
    sha = data.sha;
    // GitHub API returns content as base64
    oldContent = Buffer.from(data.content, 'base64').toString('utf-8');
  } else if (getRes.status !== 404) {
    throw new Error(`Failed to fetch ${filePath} from GitHub`);
  }

  // 2. Generate new content using the provided function
  const newContent = updateFn(oldContent);

  // 3. Commit the new file
  const putRes = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: commitMsg,
      content: Buffer.from(newContent).toString('base64'),
      ...(sha ? { sha } : {}) // Must include sha if updating an existing file
    })
  });

  if (!putRes.ok) {
    const errorData = await putRes.json();
    throw new Error(`Failed to commit ${filePath}: ${errorData.message}`);
  }
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

    const commitMsg =
      action === 'save' ? `📝 Save: ${details}` :
      action === 'mastered' ? `✅ Mastered: ${details}` :
      `🔄 Unmastered: ${details}`;

    // --- Update log.json ---
    await updateGitHubFile('log.json', (oldContent) => {
      let log: LogData = { activities: [] };
      try {
        if (oldContent) log = JSON.parse(oldContent);
      } catch { /* ignore parse error */ }
      
      log.activities.push({ timestamp, action, details, date });
      return JSON.stringify(log, null, 2);
    }, commitMsg);

    // --- Update stats.json ---
    await updateGitHubFile('stats.json', (oldContent) => {
      let stats: Stats = { totalSaves: 0, totalMastered: 0, totalUnmastered: 0, dailyStats: {} };
      try {
        if (oldContent) stats = JSON.parse(oldContent);
      } catch { /* ignore parse error */ }

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

      return JSON.stringify(stats, null, 2);
    }, commitMsg);

    return NextResponse.json({ success: true, action, details, timestamp });
  } catch (error: any) {
    console.error('Track API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
