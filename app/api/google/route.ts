import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import GooglePrep from '@/lib/models/GooglePrep';

// Same static user as /api/progress until auth exists.
const USER_ID = '00000000-0000-0000-0000-000000000000';

function safeParse(payload: string): unknown {
  try { return JSON.parse(payload); } catch { return null; }
}

/**
 * "Nothing worth keeping": no mastered problems, no notes, no notebook, no
 * designs, no stories, no mocks, no contacts — and no ticked plan task beyond
 * the buffer/rest days the app ticks by itself for dates that have passed.
 */
function isEmptyState(data: unknown): boolean {
  const d = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
  const len = (v: unknown) => (Array.isArray(v) ? v.length : 0);
  const keys = (v: unknown) => (v && typeof v === 'object' ? Object.keys(v as object).length : 0);
  const realTasks = Object.keys((d.planDone as Record<string, string>) ?? {}).filter(id => !id.includes('buffer') && !id.includes('rest')).length;
  return (
    realTasks === 0 &&
    len(d.mastered) === 0 &&
    keys(d.notes) === 0 &&
    len(d.notebook) === 0 &&
    keys(d.designs) === 0 &&
    keys(d.designDocs) === 0 &&
    keys(d.stories) === 0 &&
    keys(d.theory) === 0 &&
    keys(d.sketches) === 0 &&
    keys(d.comprehension) === 0 &&
    len(d.mocks) === 0 &&
    len(d.drills) === 0 &&
    len(d.contacts) === 0 &&
    len(d.applications) === 0
  );
}

export async function GET() {
  try {
    await connectToDatabase();
    const doc = await GooglePrep.findOne({ userId: USER_ID }).lean<{ payload?: string; updatedAt?: Date }>();
    if (!doc) return NextResponse.json({ data: null });
    let data: unknown = null;
    try { data = JSON.parse(doc.payload || 'null'); } catch { data = null; }
    return NextResponse.json({ data, updatedAt: doc.updatedAt ?? null });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error fetching Google prep:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const payload = JSON.stringify(body?.data ?? {});
    if (payload.length > 12_000_000) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }
    // Never let a blank state overwrite real work. A browser with an empty
    // localStorage (a fresh profile, a cleared site, a headless run) otherwise
    // pushes "nothing" up and takes months of progress with it.
    if (isEmptyState(body?.data)) {
      const existing = await GooglePrep.findOne({ userId: USER_ID }).lean<{ payload?: string }>();
      if (existing?.payload && !isEmptyState(safeParse(existing.payload))) {
        console.warn('Refused an empty Interview Prep payload — the stored document has real progress.');
        return NextResponse.json({ success: true, skipped: 'refused to overwrite saved progress with an empty state' });
      }
    }

    const doc = await GooglePrep.findOneAndUpdate(
      { userId: USER_ID },
      { userId: USER_ID, payload },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return NextResponse.json({ success: true, updatedAt: doc.updatedAt });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error saving Google prep:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
