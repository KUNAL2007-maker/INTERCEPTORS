import { NextResponse } from 'next/server';
import {
  getCasesForUser,
  createCase,
  getCurrentUser,
  getUserById,
  recordAuditLog,
  getEnvironment
} from '@/lib/db';
import { extractUserClaims } from '@/lib/auth-crypto';
import { evaluateABAC } from '@/lib/rbac-abac';

export async function GET(req: Request) {
  const claims = extractUserClaims(req);
  if (!claims) {
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required to access case dossiers.' },
      { status: 401 }
    );
  }
  const user = getUserById(claims.id) || (claims as any);

  const cases = await getCasesForUser(user);

  recordAuditLog({
    user_id: user.id,
    user_name: user.name,
    user_role: user.role,
    action: 'VIEW_CASES_LIST',
    resource_type: 'CASE_DOSSIER',
    decision: 'GRANTED',
    reason: `Retrieved ${cases.length} case files within assigned jurisdictional scope (${user.jurisdiction_code || 'National'}).`
  });

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
    const claims = extractUserClaims(req);
    if (!claims) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required to create or register cases.' },
        { status: 401 }
      );
    }
    const user = getUserById(claims.id) || (claims as any);

    // ABAC Guard: Judicial and Auditor read-only rule
    const abacCheck = evaluateABAC(user, null, 'CREATE', getEnvironment());
    if (abacCheck.decision === 'DENY') {
      recordAuditLog({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        action: 'CREATE_CASE',
        resource_type: 'CASE_DOSSIER',
        decision: 'DENIED',
        reason: abacCheck.reason
      });

      return NextResponse.json(
        { error: abacCheck.reason },
        { status: 403 }
      );
    }

    if (user.role === 'EXCHANGE_NODAL_OFFICER') {
      return NextResponse.json(
        { error: 'Access Denied: Exchange compliance officers cannot create police investigation cases.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const created = await createCase({
      ...body,
      victim_id: user.role === 'VICTIM' ? user.id : body.victim_id,
      jurisdiction_code: user.jurisdiction_code || body.jurisdiction_code || 'MH-CYBER-01'
    });

    recordAuditLog({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      action: 'CREATE_CASE',
      resource_type: 'CASE_DOSSIER',
      resource_id: created.case_number,
      decision: 'GRANTED',
      reason: `Registered new cyber fraud complaint file ${created.case_number}.`
    });

    return NextResponse.json({ success: true, case: created });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Case registration error' }, { status: 500 });
  }
}
