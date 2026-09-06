import { NextResponse } from 'next/server';
import {
  getCasesForUser,
  getCaseByIdOrNumber,
  createCase,
  updateCase,
  getCurrentUser,
  getUserById,
  recordAuditLog,
  getEnvironment
} from '@/lib/db';
import { extractUserClaims } from '@/lib/auth-crypto';
import { evaluateABAC, normalizeRole } from '@/lib/rbac-abac';

export async function GET(req: Request) {
  const claims = extractUserClaims(req);
  if (!claims) {
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required to access case dossiers.' },
      { status: 401 }
    );
  }
  const user = getUserById(claims.id) || (claims as any);
  const normRole = normalizeRole(user.role);

  const url = new URL(req.url);
  const targetCaseParam = url.searchParams.get('id') || url.searchParams.get('case_number') || url.searchParams.get('case_id');

  // ── 1. Single Case Query with Case-Level Access Control (IDOR Prevention) ──
  if (targetCaseParam) {
    const foundCase = getCaseByIdOrNumber(targetCaseParam);
    if (!foundCase) {
      return NextResponse.json({ error: `Case dossier '${targetCaseParam}' not found.` }, { status: 404 });
    }

    // Victim Isolation: Citizen complainant only accesses own submitted case
    if (normRole === 'VICTIM') {
      if (foundCase.victim_id !== user.id) {
        recordAuditLog({
          user_id: user.id,
          user_name: user.name,
          user_role: user.role,
          action: 'CASE_ACCESS_ATTEMPT',
          resource_type: 'CASE_DOSSIER',
          resource_id: foundCase.case_number,
          decision: 'DENIED',
          reason: 'VICTIM Privacy Boundary: Cannot access foreign complainant cases.'
        });
        return NextResponse.json(
          { error: 'Access Denied: Complainants can only access their own case files.' },
          { status: 403 }
        );
      }
    }

    // Investigating Officer Case-Level Access Control (IDOR barrier)
    if (normRole === 'INVESTIGATING_OFFICER' || user.role === 'NORMAL_INVESTIGATOR') {
      const isAssigned =
        (foundCase.assigned_investigator_id && String(foundCase.assigned_investigator_id) === String(user.id)) ||
        (foundCase.assigned_investigator_name && user.name && foundCase.assigned_investigator_name.toLowerCase().includes(user.name.toLowerCase()));
      const isPendingUnitComplaint =
        foundCase.status === 'PENDING_TRACING' &&
        foundCase.jurisdiction_code === user.jurisdiction_code &&
        !foundCase.assigned_investigator_id;

      if (!isAssigned && !isPendingUnitComplaint) {
        recordAuditLog({
          user_id: user.id,
          user_name: user.name,
          user_role: user.role,
          action: 'CASE_ACCESS_IDOR_VIOLATION',
          resource_type: 'CASE_DOSSIER',
          resource_id: foundCase.case_number,
          decision: 'DENIED',
          reason: `Case-Level Access Control: Officer ${user.name} is not assigned to case ${foundCase.case_number}.`
        });
        return NextResponse.json(
          { error: `Forbidden: Investigating Officer is unauthorized to access unassigned case ${foundCase.case_number} (Case-Level Access Control).` },
          { status: 403 }
        );
      }
    }

    // Exchange Officer VASP Isolation
    if (normRole === 'VASP_COMPLIANCE_OFFICER' || user.role === 'EXCHANGE_NODAL_OFFICER') {
      if (foundCase.vasp_id !== user.vasp_id) {
        recordAuditLog({
          user_id: user.id,
          user_name: user.name,
          user_role: user.role,
          action: 'CASE_ACCESS_VASP_ISOLATION',
          resource_type: 'CASE_DOSSIER',
          resource_id: foundCase.case_number,
          decision: 'DENIED',
          reason: 'Exchange officer cannot inspect police cases unrelated to their organization.'
        });
        return NextResponse.json(
          { error: 'Access Denied: Exchange compliance officers can only access cases involving their exchange.' },
          { status: 403 }
        );
      }
    }

    // System Admin Maintenance Audit
    if (normRole === 'SYSTEM_ADMIN' || user.role === 'SUPER_ADMIN') {
      recordAuditLog({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        action: 'ADMIN_MAINTENANCE_CASE_ACCESS',
        resource_type: 'CASE_DOSSIER',
        resource_id: foundCase.case_number,
        decision: 'GRANTED',
        reason: `System Administrator inspected case ${foundCase.case_number} under maintenance protocol.`
      });
    } else {
      recordAuditLog({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        action: 'VIEW_CASE_DETAIL',
        resource_type: 'CASE_DOSSIER',
        resource_id: foundCase.case_number,
        decision: 'GRANTED',
        reason: `Retrieved case dossier ${foundCase.case_number}.`
      });
    }

    return NextResponse.json({ success: true, case: foundCase });
  }

  // ── 2. List Cases by User Scope ─────────────────────────────────────────
  const cases = await getCasesForUser(user);

  if (normRole === 'SYSTEM_ADMIN' || user.role === 'SUPER_ADMIN') {
    recordAuditLog({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      action: 'ADMIN_MAINTENANCE_CASE_ACCESS',
      resource_type: 'CASE_DOSSIER',
      decision: 'GRANTED',
      reason: `System Administrator retrieved ${cases.length} cases for infrastructure audit.`
    });
  } else {
    recordAuditLog({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      action: 'VIEW_CASES_LIST',
      resource_type: 'CASE_DOSSIER',
      decision: 'GRANTED',
      reason: `Retrieved ${cases.length} case files within assigned scope (${user.jurisdiction_code || 'National'}).`
    });
  }

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
    const normRole = normalizeRole(user.role);

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

    if (normRole === 'VASP_COMPLIANCE_OFFICER' || user.role === 'EXCHANGE_NODAL_OFFICER') {
      return NextResponse.json(
        { error: 'Access Denied: Exchange compliance officers cannot create police investigation cases.' },
        { status: 403 }
      );
    }

    if (normRole === 'NATIONAL_COORDINATION_ANALYST') {
      return NextResponse.json(
        { error: 'Access Denied: National Coordination Analysts possess intelligence view-only access and cannot register state police cases.' },
        { status: 403 }
      );
    }

    if (normRole === 'SYSTEM_ADMIN') {
      return NextResponse.json(
        { error: 'Access Denied: System Administrators are separated from investigative authority and cannot create police cases.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const isVictim = normRole === 'VICTIM';

    const created = await createCase({
      ...body,
      victim_id: isVictim ? user.id : (body.victim_id || user.id),
      victim_name: isVictim ? user.name : (body.victim_name || 'Rajesh Verma'),
      victim_email: isVictim ? user.email : (body.victim_email || 'victim.verma@example.demo'),
      jurisdiction_code: user.jurisdiction_code || body.jurisdiction_code || 'MH-CYBER-01',
      classification: isVictim ? 'RESTRICTED' : (body.classification || 'CONFIDENTIAL'),
      status: body.status || 'PENDING_TRACING',
      priority: body.priority || 'HIGH',
      assigned_investigator_id: body.assigned_investigator_id !== undefined ? body.assigned_investigator_id : 3,
      assigned_investigator_name: body.assigned_investigator_name || 'SI Patil'
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

export async function PATCH(req: Request) {
  try {
    const claims = extractUserClaims(req);
    if (!claims) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required to update cases.' },
        { status: 401 }
      );
    }
    const user = getUserById(claims.id) || (claims as any);
    const normRole = normalizeRole(user.role);

    // 1. Strict read-only role barriers
    if (normRole === 'COURT_REVIEWER' || user.role === 'AUDITOR') {
      return NextResponse.json(
        { error: 'Access Denied: Court Reviewer / Auditor accounts possess zero mutation permissions under BSA 2023 Sec 65B.' },
        { status: 403 }
      );
    }

    if (normRole === 'VICTIM') {
      return NextResponse.json(
        { error: 'Access Denied: Citizen complainants cannot modify police investigation cases.' },
        { status: 403 }
      );
    }

    if (normRole === 'VASP_COMPLIANCE_OFFICER' || user.role === 'EXCHANGE_NODAL_OFFICER') {
      return NextResponse.json(
        { error: 'Access Denied: VASP Compliance Officers cannot modify police investigation files.' },
        { status: 403 }
      );
    }

    if (normRole === 'NATIONAL_COORDINATION_ANALYST') {
      return NextResponse.json(
        { error: 'Access Denied: National Coordination Analysts possess intelligence view-only access and cannot mutate state cases.' },
        { status: 403 }
      );
    }

    if (normRole === 'SYSTEM_ADMIN') {
      return NextResponse.json(
        { error: 'Access Denied: System Administrators are separated from investigative authority and cannot modify police cases.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const targetId = body.id || body.case_number;
    if (!targetId) {
      return NextResponse.json({ error: 'Missing case id or case_number' }, { status: 400 });
    }

    const existing = getCaseByIdOrNumber(targetId);
    if (!existing) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // 2. Investigating Officer boundaries:
    // Can only mutate assigned cases; cannot reassign IO; cannot arbitrarily mark RECOVERED
    if (normRole === 'INVESTIGATING_OFFICER' || user.role === 'NORMAL_INVESTIGATOR') {
      const isAssigned =
        String(existing.assigned_investigator_id) === String(user.id) ||
        (user.name && existing.assigned_investigator_name && existing.assigned_investigator_name.toLowerCase().includes(user.name.toLowerCase()));
      if (!isAssigned && existing.status !== 'PENDING_TRACING') {
        return NextResponse.json(
          { error: 'Access Denied: Investigating Officers can only update cases assigned to them.' },
          { status: 403 }
        );
      }

      if (body.assigned_investigator_id && body.assigned_investigator_id !== existing.assigned_investigator_id) {
        return NextResponse.json(
          { error: 'Access Denied: Investigating Officers cannot assign or reassign investigators. Supervisory authorization required.' },
          { status: 403 }
        );
      }

      if (body.status === 'RECOVERED') {
        return NextResponse.json(
          { error: 'Access Denied: Investigating Officers cannot arbitrarily mark funds as recovered.' },
          { status: 403 }
        );
      }
    }

    // 3. Prevent arbitrary funds recovery by supervisor without evidence
    if (body.status === 'RECOVERED' && existing.status !== 'FROZEN') {
      return NextResponse.json(
        { error: 'Validation Error: Case assets must be confirmed FROZEN by VASP before marking RECOVERED.' },
        { status: 400 }
      );
    }

    const updated = await updateCase(targetId, body);
    if (!updated) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    recordAuditLog({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      action: 'UPDATE_CASE',
      resource_type: 'CASE_DOSSIER',
      resource_id: updated.case_number,
      decision: 'GRANTED',
      reason: `Updated case ${updated.case_number}: status=${updated.status}, priority=${updated.priority || 'N/A'}, assigned_io=${updated.assigned_investigator_name}.`
    });

    return NextResponse.json({ success: true, case: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Case update error' }, { status: 500 });
  }
}
