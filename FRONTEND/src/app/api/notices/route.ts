import { NextResponse } from 'next/server';
import { getNoticesForUser, saveFreezeNotice, getCurrentUser } from '@/lib/db';

export async function GET() {
  const user = getCurrentUser();
  const notices = await getNoticesForUser(user);
  return NextResponse.json({ notices });
}

export async function POST(req: Request) {
  try {
    const user = getCurrentUser();
    const body = await req.json();
    const result = await saveFreezeNotice(body, user);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }
    return NextResponse.json({ success: true, notice: result.notice });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
