import { NextResponse } from 'next/server';
import { getCasesForUser, createCase, getCurrentUser } from '@/lib/db';

export async function GET() {
  const user = getCurrentUser();
  const cases = await getCasesForUser(user);
  return NextResponse.json({
    caller: {
      name: user.name,
      role: user.role,
      jurisdiction: user.jurisdiction_code,
      clearance: user.clearance_level
    },
    count: cases.length,
    cases
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const created = await createCase(body);
    return NextResponse.json({ success: true, case: created });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
