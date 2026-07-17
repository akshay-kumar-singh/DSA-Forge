import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongoose';
import Progress from '@/lib/models/Progress';

// Static user ID since auth isn't fully implemented yet,
// mirroring the previous Supabase hardcoded ID '00000000-0000-0000-0000-000000000000'
const USER_ID = '00000000-0000-0000-0000-000000000000';

export async function GET() {
  try {
    await connectToDatabase();
    
    const progress = await Progress.findOne({ userId: USER_ID }).lean();
    
    if (!progress) {
      return NextResponse.json({ data: null });
    }

    // Helper to safely convert Map fields to plain JS objects.
    // When using .lean(), Map fields are already plain JS objects.
    // If queried normally, they are Mongoose Maps.
    const toObject = (field: any) => {
      if (!field) return {};
      if (field instanceof Map) {
        return Object.fromEntries(field);
      }
      if (typeof field.entries === 'function') {
        return Object.fromEntries(field);
      }
      return field;
    };

    return NextResponse.json({
      data: {
        code_map: toObject(progress.codeMap),
        user_notes: toObject(progress.userNotes),
        mastered_problems: progress.masteredProblems || [],
        last_review_date: toObject(progress.lastReviewDate),
      }
    });
  } catch (error: any) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    const body = await req.json();
    const { code_map, user_notes, mastered_problems, last_review_date } = body;

    const progress = await Progress.findOneAndUpdate(
      { userId: USER_ID },
      {
        userId: USER_ID,
        codeMap: code_map || {},
        userNotes: user_notes || {},
        masteredProblems: mastered_problems || [],
        lastReviewDate: last_review_date || {},
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, data: progress });
  } catch (error: any) {
    console.error('Error saving progress:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
