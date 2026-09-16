import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import GooglePrep from '@/lib/models/GooglePrep';

// Same static user as /api/progress until auth exists.
const USER_ID = '00000000-0000-0000-0000-000000000000';

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
