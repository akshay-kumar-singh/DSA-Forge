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
  revised?: number;
}

interface Stats {
  totalSaves: number;
  totalMastered: number;
  totalUnmastered: number;
  totalRevised?: number;
  dailyStats: Record<string, DailyStats>;
}

interface LogData {
  activities: Activity[];
}

async function getGitHubFileContent(token: string, owner: string, repo: string, path: string) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  if (res.ok) {
    const data = await res.json();
    return Buffer.from(data.content, 'base64').toString('utf-8');
  } else if (res.status === 404) {
    return null;
  } else {
    throw new Error(`Failed to fetch ${path}`);
  }
}

async function commitMultipleFiles(
  token: string,
  owner: string,
  repo: string,
  commitMsg: string,
  files: { path: string; content: string }[]
) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };
  const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;

  // 1. Get default branch
  const repoRes = await fetch(baseUrl, { headers });
  if (!repoRes.ok) throw new Error('Failed to fetch repo info');
  const repoData = await repoRes.json();
  const branch = repoData.default_branch;

  // 2. Get latest commit SHA
  const refRes = await fetch(`${baseUrl}/git/refs/heads/${branch}`, { headers });
  if (!refRes.ok) throw new Error(`Failed to fetch branch ${branch}`);
  const refData = await refRes.json();
  const latestCommitSha = refData.object.sha;

  // 3. Get base tree SHA
  const commitRes = await fetch(`${baseUrl}/git/commits/${latestCommitSha}`, { headers });
  if (!commitRes.ok) throw new Error('Failed to fetch latest commit');
  const commitData = await commitRes.json();
  const baseTreeSha = commitData.tree.sha;

  // 4. Create new tree with both files
  const treePayload = {
    base_tree: baseTreeSha,
    tree: files.map(f => ({
      path: f.path,
      mode: '100644',
      type: 'blob',
      content: f.content,
    })),
  };
  const treeRes = await fetch(`${baseUrl}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify(treePayload),
  });
  if (!treeRes.ok) throw new Error('Failed to create git tree');
  const treeData = await treeRes.json();
  const newTreeSha = treeData.sha;

  // 5. Create new commit
  const newCommitPayload = {
    message: commitMsg,
    tree: newTreeSha,
    parents: [latestCommitSha],
  };
  const newCommitRes = await fetch(`${baseUrl}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify(newCommitPayload),
  });
  if (!newCommitRes.ok) throw new Error('Failed to create git commit');
  const newCommitData = await newCommitRes.json();
  const newCommitSha = newCommitData.sha;

  // 6. Update branch ref
  const updateRefRes = await fetch(`${baseUrl}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ sha: newCommitSha }),
  });
  if (!updateRefRes.ok) throw new Error('Failed to update branch ref');
}

export async function POST(req: Request) {
  try {
    const { action, details } = await req.json();

    if (!action || !details) {
      return NextResponse.json({ error: 'Missing action or details' }, { status: 400 });
    }

    const token = process.env.GITHUB_PAT; 
    const owner = process.env.GITHUB_USERNAME; 
    const repo = process.env.GITHUB_TRACKER_REPO;

    if (!token || !owner || !repo) {
      return NextResponse.json({ error: 'Missing GitHub credentials in environment variables' }, { status: 500 });
    }

    const now = new Date();
    const timestamp = now.toISOString();
    const date = timestamp.split('T')[0]; // YYYY-MM-DD

    const commitMsg =
      action === 'save' ? `📝 Save: ${details}` :
      action === 'mastered' ? `✅ Mastered: ${details}` :
      action === 'revised' ? `📚 Revised: ${details}` :
      `🔄 Unmastered: ${details}`;

    // Fetch existing contents
    const oldLogContent = await getGitHubFileContent(token, owner, repo, 'log.json');
    const oldStatsContent = await getGitHubFileContent(token, owner, repo, 'stats.json');

    // Process log.json
    let log: LogData = { activities: [] };
    if (oldLogContent) {
      try { log = JSON.parse(oldLogContent); } catch {}
    }
    log.activities.push({ timestamp, action, details, date });
    const newLogContent = JSON.stringify(log, null, 2);

    // Process stats.json
    let stats: Stats = { totalSaves: 0, totalMastered: 0, totalUnmastered: 0, dailyStats: {} };
    if (oldStatsContent) {
      try { stats = JSON.parse(oldStatsContent); } catch {}
    }
    if (!stats.dailyStats[date]) {
      stats.dailyStats[date] = { saves: 0, mastered: 0, unmastered: 0, revised: 0 };
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
    } else if (action === 'revised') {
      stats.totalRevised = (stats.totalRevised || 0) + 1;
      stats.dailyStats[date].revised = (stats.dailyStats[date].revised || 0) + 1;
    }
    const newStatsContent = JSON.stringify(stats, null, 2);

    // Commit both files in a single commit!
    await commitMultipleFiles(token, owner, repo, commitMsg, [
      { path: 'log.json', content: newLogContent },
      { path: 'stats.json', content: newStatsContent }
    ]);

    return NextResponse.json({ success: true, action, details, timestamp });
  } catch (error: any) {
    console.error('Track API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
