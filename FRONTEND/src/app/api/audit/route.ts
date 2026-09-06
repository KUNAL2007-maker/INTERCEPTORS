import { NextResponse } from 'next/server';
import { getAuditLogs, getCurrentUser, getUserById } from '@/lib/db';
import { extractUserClaims } from '@/lib/auth-crypto';

export async function GET(req: Request) {
  const claims = extractUserClaims(req);
  const user = (claims ? getUserById(claims.id) : null) || getCurrentUser();

  // Audit logs are accessible by Auditor, Super Admin, and Workspace Admin
  const allowedRoles = ['AUDITOR', 'SUPER_ADMIN', 'WORKSPACE_ADMIN', 'SENIOR_INVESTIGATOR'];
  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(
      { error: 'Unauthorized: Audit trail inspection is restricted to Judicial Auditors and System Administrators.' },
      { status: 403 }
    );
  }

  const logs = getAuditLogs(100);
  return NextResponse.json({
    count: logs.length,
    logs
  });
}
