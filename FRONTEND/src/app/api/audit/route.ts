import { NextResponse } from 'next/server';
import { getAuditLogs, getCurrentUser, getUserById, recordAuditLog } from '@/lib/db';
import { extractUserClaims } from '@/lib/auth-crypto';
import { normalizeRole } from '@/lib/rbac-abac';

export async function GET(req: Request) {
  const claims = extractUserClaims(req);
  if (!claims) {
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required to inspect judicial audit logs.' },
      { status: 401 }
    );
  }
  const user = getUserById(claims.id) || (claims as any);
  const normRole = normalizeRole(user.role);

  // System audit trail inspection is restricted to authorized oversight and supervisory roles
  const allowedRoles = [
    'COURT_REVIEWER',
    'AUDITOR',
    'CYBERCRIME_SUPERVISOR',
    'WORKSPACE_ADMIN',
    'SENIOR_INVESTIGATOR',
    'SYSTEM_ADMIN',
    'SUPER_ADMIN',
    'NATIONAL_COORDINATION_ANALYST'
  ];

  if (!allowedRoles.includes(normRole) && !allowedRoles.includes(user.role)) {
    recordAuditLog({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      action: 'INSPECT_AUDIT_LOGS',
      resource_type: 'AUDIT_CHAMBER',
      decision: 'DENIED',
      reason: `Unauthorized: Role '${user.role}' is not authorized to inspect system-wide audit logs.`
    });

    return NextResponse.json(
      { error: 'Unauthorized: Audit trail inspection is restricted to Judicial Reviewers, Supervisors, and Administrators.' },
      { status: 403 }
    );
  }

  const logs = getAuditLogs(100);
  return NextResponse.json({
    count: logs.length,
    logs
  });
}
