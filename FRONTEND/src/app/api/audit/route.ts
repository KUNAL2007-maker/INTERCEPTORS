import { NextResponse } from 'next/server';
import { getAuditLogs, getCaseByIdOrNumber, getUserById, recordAuditLog } from '@/lib/db';
import { extractUserClaims } from '@/lib/auth-crypto';
import { normalizeRole } from '@/lib/rbac-abac';

export async function GET(req: Request) {
  const claims = await extractUserClaims(req);
  if (!claims) {
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required to inspect audit logs.' },
      { status: 401 }
    );
  }
  const user = getUserById(claims.id) || (claims as any);
  const normRole = normalizeRole(user.role);

  // VICTIM is strictly forbidden from inspecting audit logs under all circumstances
  if (normRole === 'VICTIM') {
    recordAuditLog({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      action: 'INSPECT_AUDIT_LOGS',
      resource_type: 'AUDIT_CHAMBER',
      decision: 'DENIED',
      reason: 'VICTIM Boundary: Citizen complainants cannot inspect internal law enforcement audit logs.'
    });
    return NextResponse.json(
      { error: 'Access Denied: Citizen complainants are not authorized to inspect audit logs.' },
      { status: 403 }
    );
  }

  const url = new URL(req.url);
  const targetCaseParam =
    url.searchParams.get('case_number') ||
    url.searchParams.get('case_id') ||
    url.searchParams.get('id');

  // #15: the national analyst no longer holds audit-log access — its desk is
  // aggregate National Correlation, not per-actor chain-of-custody.
  const systemOversightRoles = [
    'COURT_REVIEWER',
    'AUDITOR',
    'CYBERCRIME_SUPERVISOR',
    'WORKSPACE_ADMIN',
    'SENIOR_INVESTIGATOR',
    'SYSTEM_ADMIN',
    'SUPER_ADMIN'
  ];

  const hasSystemAuditAccess =
    systemOversightRoles.includes(normRole) || systemOversightRoles.includes(user.role);

  // 1. System-wide audit logs query (no specific case scope specified)
  if (!targetCaseParam) {
    if (!hasSystemAuditAccess) {
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
        { error: 'Unauthorized: System-wide audit trail inspection is restricted to Judicial Reviewers, Supervisors, and Administrators.' },
        { status: 403 }
      );
    }

    const logs = getAuditLogs(100);
    return NextResponse.json({
      count: logs.length,
      logs
    });
  }

  // 2. Case-specific audit history query
  const foundCase = getCaseByIdOrNumber(targetCaseParam);
  if (!foundCase) {
    return NextResponse.json({ error: `Case dossier '${targetCaseParam}' not found.` }, { status: 404 });
  }

  // Case-Level Access Control for Investigating Officers on audit history
  if (normRole === 'INVESTIGATING_OFFICER' || user.role === 'NORMAL_INVESTIGATOR') {
    const isAssigned =
      (foundCase.assigned_investigator_id && String(foundCase.assigned_investigator_id) === String(user.id)) ||
      (foundCase.assigned_investigator_name && user.name && foundCase.assigned_investigator_name.toLowerCase().includes(user.name.toLowerCase()));

    if (!isAssigned) {
      recordAuditLog({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        action: 'CASE_AUDIT_ACCESS_DENIED',
        resource_type: 'CASE_AUDIT_HISTORY',
        resource_id: foundCase.case_number,
        decision: 'DENIED',
        reason: `IDOR Barrier: Officer ${user.name} is not assigned to case ${foundCase.case_number}.`
      });
      return NextResponse.json(
        { error: `Forbidden: Investigating Officer is unauthorized to inspect audit history for unassigned case ${foundCase.case_number}.` },
        { status: 403 }
      );
    }
  } else if (normRole === 'VASP_COMPLIANCE_OFFICER' || user.role === 'EXCHANGE_NODAL_OFFICER') {
    if (foundCase.vasp_id !== user.vasp_id) {
      return NextResponse.json(
        { error: 'Access Denied: VASP Compliance Officers can only inspect audit history for their own exchange cases.' },
        { status: 403 }
      );
    }
  } else if (!hasSystemAuditAccess) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Retrieve case-specific audit trail records
  const allLogs = getAuditLogs(200);
  const caseLogs = allLogs.filter(
    (l) =>
      l.resource_id === foundCase.case_number ||
      String(l.resource_id) === String(foundCase.id) ||
      l.reason?.includes(foundCase.case_number)
  );

  return NextResponse.json({
    case_number: foundCase.case_number,
    count: caseLogs.length,
    logs: caseLogs,
    audit_logs: caseLogs
  });
}
