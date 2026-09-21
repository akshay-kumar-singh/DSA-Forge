// ======================================================
// GOOGLE PREP — GitHub tracker helpers (server only)
// Same Git Data API flow as app/api/track/route.ts (the NeetCode
// tracker), kept separate so that route stays untouched. Writes
// go to a prep/ folder in the same tracker repo.
// ======================================================

const API = 'https://api.github.com';

export interface TrackerCreds { token: string; owner: string; repo: string }

/** Reads the three env vars the NeetCode tracker already uses; null when any is missing. */
export function trackerCreds(): TrackerCreds | null {
  const token = process.env.GITHUB_PAT;
  const owner = process.env.GITHUB_USERNAME;
  const repo = process.env.GITHUB_TRACKER_REPO;
  return token && owner && repo ? { token, owner, repo } : null;
}

function headers(token: string) {
  return { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' };
}

export async function getFile({ token, owner, repo }: TrackerCreds, path: string): Promise<string | null> {
  const res = await fetch(`${API}/repos/${owner}/${repo}/contents/${path}`, { headers: headers(token), cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub: failed to fetch ${path} (${res.status})`);
  const data = await res.json();
  return Buffer.from(data.content, 'base64').toString('utf-8');
}

/** One commit containing every file — so log and stats never drift apart. */
export async function commitFiles(creds: TrackerCreds, message: string, files: { path: string; content: string }[]): Promise<void> {
  const { token, owner, repo } = creds;
  const h = headers(token);
  const base = `${API}/repos/${owner}/${repo}`;
  const get = async (url: string, what: string) => { const r = await fetch(url, { headers: h, cache: 'no-store' }); if (!r.ok) throw new Error(`GitHub: ${what} (${r.status})`); return r.json(); };
  const post = async (url: string, body: unknown, what: string, method = 'POST') => { const r = await fetch(url, { method, headers: h, body: JSON.stringify(body) }); if (!r.ok) throw new Error(`GitHub: ${what} (${r.status})`); return r.json(); };

  const branch = (await get(base, 'repo info')).default_branch as string;
  const headSha = (await get(`${base}/git/refs/heads/${branch}`, `branch ${branch}`)).object.sha as string;
  const baseTree = (await get(`${base}/git/commits/${headSha}`, 'head commit')).tree.sha as string;
  const tree = await post(`${base}/git/trees`, { base_tree: baseTree, tree: files.map(f => ({ path: f.path, mode: '100644', type: 'blob', content: f.content })) }, 'create tree');
  const commit = await post(`${base}/git/commits`, { message, tree: tree.sha, parents: [headSha] }, 'create commit');
  await post(`${base}/git/refs/heads/${branch}`, { sha: commit.sha }, 'update ref', 'PATCH');
}
