import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import PracticeLab from '@/lib/models/PracticeLab';

// Same static user as /api/progress and /api/google until auth exists.
const USER_ID = '00000000-0000-0000-0000-000000000000';

export async function GET() {
  try {
    await connectToDatabase();
    const doc = await PracticeLab.findOne({ userId: USER_ID }).lean<{ payload?: string; updatedAt?: Date }>();
    if (!doc) return NextResponse.json({ data: null });
    let data: unknown = null;
    try { data = JSON.parse(doc.payload || 'null'); } catch { data = null; }
    return NextResponse.json({ data, updatedAt: doc.updatedAt ?? null });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error fetching Practice Lab:', message);
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
    // Never blank an existing document: an empty payload can only be a bug or a
    // half-loaded client, and this collection is the only copy of the user's work.
    const empty = (() => {
      try {
        const d = JSON.parse(payload) as { problems?: unknown[]; designs?: unknown[] };
        return !d || ((d.problems?.length ?? 0) === 0 && (d.designs?.length ?? 0) === 0);
      } catch { return true; }
    })();
    if (empty) {
      const existing = await PracticeLab.findOne({ userId: USER_ID }).lean<{ payload?: string }>();
      if (existing?.payload && existing.payload.length > 40) {
        return NextResponse.json({ success: true, skipped: 'refused to overwrite saved work with an empty payload' });
      }
    }
    const doc = await PracticeLab.findOneAndUpdate(
      { userId: USER_ID },
      { userId: USER_ID, payload },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    return NextResponse.json({ success: true, updatedAt: doc.updatedAt });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error saving Practice Lab:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
