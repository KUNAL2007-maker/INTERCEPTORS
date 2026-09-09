import { NextResponse } from 'next/server';
import {
  getSystemUsers,
  getUserById,
  recordAuditLog
} from '@/lib/db';
import { extractUserClaims } from '@/lib/auth-crypto';
import { normalizeRole, hasPermission, PERMISSIONS } from '@/lib/rbac-abac';

/**
 * Officer directory for case allocation.
 *
 * The supervisor's assign control needs a list of real, assignable officers.
 * Before this endpoint the dashboard hard-coded that list, which is how it came
 * to offer ids that belong to no account (12, 14) and ids that belong to the
 * wrong role (2 = ACP Sharma, a gazetted senior, not an IO). The PATCH on
 * /api/cases already rejected all of those, so the UI could offer an officer the
 * server would then refuse - a control that looks like it works and does not.
 *
 * This returns exactly the set the PATCH will accept: active Investigating
 * Officers whose jurisdiction matches the caller's. A supervisor in MH-CYBER-01
 * sees the officers they can actually allocate, and no one else's.
 *
 * GET only. Allocation is a write and lives on PATCH /api/cases; this endpoint
 * never mutates anything.
 */
export async function GET(req: Request) {
  const claims = extractUserClaims(req);
  if (!claims) {
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required to view the officer directory.' },
      { status: 401 }
    );
  }
  const user = getUserById(claims.id) || (claims as any);

  // Reading the assignable-officer list is a supervisory function: it is the
  // first half of allocation, and the same permission gates the PATCH that
  // completes it. A role that cannot assign has no business enumerating who is
  // assignable.
  if (!hasPermission(user.role, PERMISSIONS.CASE_ASSIGN_IO)) {
    recordAuditLog({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      action: 'VIEW_OFFICER_DIRECTORY',
      resource_type: 'USER_DIRECTORY',
      decision: 'DENIED',
      reason: 'Role does not hold case:assign_io. The officer directory is a supervisory resource.'
    });
    return NextResponse.json(
      { error: 'Access Denied: Viewing assignable officers requires supervisory authority.' },
      { status: 403 }
    );
  }

  // National coordination units (IN-I4C-00) allocate across states; every other
  // supervisor is bound to their own jurisdiction, exactly as POL-04 and the
  // PATCH jurisdiction check are. Anything else would list officers the server
  // would then refuse to allocate.
  const isNational = user.jurisdiction_code === 'IN-I4C-00';

  const officers = getSystemUsers()
    .filter((u) => normalizeRole(u.role) === 'INVESTIGATING_OFFICER')
    .filter((u) => u.is_active !== false)
    .filter((u) => isNational || u.jurisdiction_code === user.jurisdiction_code)
    .map((u) => ({
      id: u.id,
      name: u.name,
      badge: u.badge,
      jurisdiction_code: u.jurisdiction_code,
      clearance_level: u.clearance_level
    }));

  recordAuditLog({
    user_id: user.id,
    user_name: user.name,
    user_role: user.role,
    action: 'VIEW_OFFICER_DIRECTORY',
    resource_type: 'USER_DIRECTORY',
    decision: 'GRANTED',
    reason: `Retrieved ${officers.length} assignable Investigating Officer(s) for ${user.jurisdiction_code || 'National'}.`
  });

  return NextResponse.json({
    caller: {
      name: user.name,
      role: user.role,
      jurisdiction: user.jurisdiction_code
    },
    count: officers.length,
    officers
  });
}
