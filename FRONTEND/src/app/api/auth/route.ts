import { NextResponse } from 'next/server';
import { getCurrentUser, switchPersona, getEnvironment, setEmergencyLockdown } from '@/lib/db';
import { SYSTEM_PERSONAS } from '@/lib/rbac-abac';

export async function GET() {
  return NextResponse.json({
    user: getCurrentUser(),
    environment: getEnvironment(),
    personas: SYSTEM_PERSONAS
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.action === 'switch_persona') {
      const user = switchPersona(body.roleOrUid);
      return NextResponse.json({ success: true, user });
    }
    if (body.action === 'toggle_lockdown') {
      const env = setEmergencyLockdown(Boolean(body.active));
      return NextResponse.json({ success: true, environment: env });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
