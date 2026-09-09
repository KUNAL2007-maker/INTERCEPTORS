import { NextResponse } from 'next/server';
import {
  getCasesForUser,
  getCaseByIdOrNumber,
  createCase,
  updateCase,
  deleteCase,
  getCurrentUser,
  getUserById,
  recordAuditLog,
  getEnvironment
} from '@/lib/db';
import { extractUserClaims } from '@/lib/auth-crypto';
import { evaluateABAC, normalizeRole, hasPermission, PERMISSIONS } from '@/lib/rbac-abac';

export async function GET(req: Request) {
  const claims = await extractUserClaims(req);
  if (!claims) {
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required to access case dossiers.' },
      { status: 401 }
    );
  }
  const user = getUserById(claims.id) || (claims as any);
  const normRole = normalizeRole(user.role);

  const url = new URL(req.url);

  function sanitizeCaseForVictim(c: any) {
    if (!c) return c;
    const { notes, priority, classification, ...safe } = c;
    return safe;
  }

  // Collect all requested case identifiers across singular, camelCase, and array formats
  const requestedCaseKeys: string[] = [];
  for (const [key, val] of url.searchParams.entries()) {
    const normKey = key.replace(/\[\]$/, '').toLowerCase();
    if (['id', 'case_number', 'case_id', 'casenumber', 'caseid'].includes(normKey) && val.trim()) {
      requestedCaseKeys.push(val.trim());
    }
  }

  // ── 1. Single Case Query with Case-Level Access Control (IDOR Prevention) ──
  if (requestedCaseKeys.length > 0) {
    let resolvedCase: any = null;

    // Validate access against EVERY requested case identifier to prevent parameter pollution bypass
    for (const targetCaseParam of requestedCaseKeys) {
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

      if (!resolvedCase) {
        resolvedCase = foundCase;
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
        resource_id: resolvedCase.case_number,
        decision: 'GRANTED',
        reason: `System Administrator inspected case ${resolvedCase.case_number} under maintenance protocol.`
      });
    } else {
      recordAuditLog({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        action: 'VIEW_CASE_DETAIL',
        resource_type: 'CASE_DOSSIER',
        resource_id: resolvedCase.case_number,
        decision: 'GRANTED',
        reason: `Retrieved case dossier ${resolvedCase.case_number}.`
      });
    }

    const payloadCase = normRole === 'VICTIM' ? sanitizeCaseForVictim(resolvedCase) : resolvedCase;
    return NextResponse.json({ success: true, case: payloadCase });
  }

  // ── 2. List Cases by User Scope ─────────────────────────────────────────
  const rawCases = await getCasesForUser(user);
  const cases = normRole === 'VICTIM' ? rawCases.map(sanitizeCaseForVictim) : rawCases;

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
    const claims = await extractUserClaims(req);
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
      // Unallocated on creation - the supervisor allocates.
      assigned_investigator_id: null,
      assigned_investigator_name: undefined
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
    const claims = await extractUserClaims(req);
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
    const targetId = body.id || body.case_number || body.case_id || body.caseNumber || body.caseId;
    if (!targetId) {
      return NextResponse.json({ error: 'Missing case id or case_number' }, { status: 400 });
    }

    const existing = getCaseByIdOrNumber(targetId);
    if (!existing) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Named workflow transition: a field Investigating Officer hands a fully
    // traced case up to the gazetted officer for statutory sign-off. Modelling
    // it as an explicit action (rather than a raw client status write) lets us
    // enforce the precondition — only a TRACED case can be forwarded — and keeps
    // the handoff chain (field IO → gazetted → compliance) an audited step. It
    // resolves to a plain status update, so the ABAC + IO-boundary guards below
    // still apply unchanged.
    if (body.action === 'forward_to_gazetted') {
      if (existing.status !== 'TRACED') {
        return NextResponse.json(
          { error: 'Only a fully traced case can be forwarded to the gazetted officer for Section 94 BNSS sign-off.' },
          { status: 409 }
        );
      }
      body.status = 'AWAITING_SIGNATURE';
      delete body.action;
    }

    // 1b. Full ABAC evaluation against the specific case. Without this the
    // jurisdiction boundary (POL-04) and clearance (POL-07) were enforced on
    // reads but not on writes, so a supervisor in one state could allocate an
    // officer to another state's case.
    const isAssignment = body.assigned_investigator_id !== undefined;
    const abacAction = isAssignment
      ? 'assign_io'
      : body.priority !== undefined
      ? 'change_priority'
      : 'update';
    const caseAbac = evaluateABAC(user, existing, abacAction, getEnvironment());
    if (caseAbac.decision === 'DENY') {
      recordAuditLog({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        action: 'UPDATE_CASE',
        resource_type: 'CASE_DOSSIER',
        resource_id: existing.case_number,
        decision: 'DENIED',
        reason: caseAbac.reason,
        statutory_code: caseAbac.policyId || undefined
      });
      return NextResponse.json({ error: caseAbac.reason, policy: caseAbac.policyId }, { status: 403 });
    }

    // 1c. Allocation requires the case:assign_io permission and a real target.
    if (isAssignment) {
      if (!hasPermission(user.role, PERMISSIONS.CASE_ASSIGN_IO)) {
        recordAuditLog({
          user_id: user.id,
          user_name: user.name,
          user_role: user.role,
          action: 'ASSIGN_IO',
          resource_type: 'CASE_DOSSIER',
          resource_id: existing.case_number,
          decision: 'DENIED',
          reason: 'Role does not hold case:assign_io. Allocation is a supervisory function.'
        });
        return NextResponse.json(
          { error: 'Access Denied: Case allocation requires supervisory authority.' },
          { status: 403 }
        );
      }

      const targetOfficer = getUserById(body.assigned_investigator_id);
      if (!targetOfficer) {
        return NextResponse.json(
          { error: 'Validation Error: No such officer on this platform.' },
          { status: 400 }
        );
      }
      if (normalizeRole(targetOfficer.role) !== 'INVESTIGATING_OFFICER') {
        return NextResponse.json(
          { error: `Validation Error: ${targetOfficer.name} is not an Investigating Officer and cannot be allocated a case.` },
          { status: 400 }
        );
      }
      if (targetOfficer.jurisdiction_code !== existing.jurisdiction_code) {
        return NextResponse.json(
          {
            error: `Validation Error: ${targetOfficer.name} (${targetOfficer.jurisdiction_code}) is outside the jurisdiction of this case (${existing.jurisdiction_code}).`
          },
          { status: 400 }
        );
      }
      // Derive the name from the account rather than trusting the client, so
      // the audit trail cannot be made to record a different officer.
      body.assigned_investigator_name = targetOfficer.name;
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

/**
 * Withdraw (delete) a complaint.
 *
 * A citizen may take back a complaint they filed, but only while it is still an
 * untouched intake - once an officer has been allocated, a trace run, or a
 * Section 94 BNSS order issued, the file is a live investigative/statutory
 * record and is no longer the complainant's to erase. So the gate is: the
 * caller must be the OWNING victim, and the case must still be PENDING_TRACING
 * with no freeze order bound to it. Anything past that returns 409, surfaced in
 * the UI as a disabled button with a tooltip rather than a silent failure.
 */
export async function DELETE(req: Request) {
  try {
    const claims = await extractUserClaims(req);
    if (!claims) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required to withdraw a complaint.' },
        { status: 401 }
      );
    }
    const user = getUserById(claims.id) || (claims as any);
    const normRole = normalizeRole(user.role);

    const url = new URL(req.url);
    const targetId =
      url.searchParams.get('case_number') ||
      url.searchParams.get('id') ||
      url.searchParams.get('case_id') ||
      '';
    if (!targetId.trim()) {
      return NextResponse.json({ error: 'Missing case_number.' }, { status: 400 });
    }

    const existing = getCaseByIdOrNumber(targetId.trim());
    if (!existing) {
      return NextResponse.json({ error: 'Case not found.' }, { status: 404 });
    }

    // Only a citizen complainant may withdraw, and only their own complaint.
    // Police/VASP/court roles do not delete cases at all - correcting a case is
    // an update with an audit trail, not an erasure.
    if (normRole !== 'VICTIM') {
      return NextResponse.json(
        { error: 'Access Denied: Only the citizen who filed a complaint may withdraw it.' },
        { status: 403 }
      );
    }
    if (existing.victim_id !== user.id) {
      recordAuditLog({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        action: 'CASE_WITHDRAW_ATTEMPT',
        resource_type: 'CASE_DOSSIER',
        resource_id: existing.case_number,
        decision: 'DENIED',
        reason: 'VICTIM Privacy Boundary: cannot withdraw another complainant\'s case.'
      });
      return NextResponse.json(
        { error: 'Access Denied: You can only withdraw complaints you filed.' },
        { status: 403 }
      );
    }

    // A file that has moved past intake - allocated, traced, served, frozen - is
    // a live record. A withdrawal here would erase an active investigation, so
    // it is refused with 409 Conflict.
    const isUntouched = existing.status === 'PENDING_TRACING' && !existing.freeze_notice_id;
    if (!isUntouched) {
      recordAuditLog({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        action: 'CASE_WITHDRAW_ATTEMPT',
        resource_type: 'CASE_DOSSIER',
        resource_id: existing.case_number,
        decision: 'DENIED',
        reason: `Complaint ${existing.case_number} is already under investigation (status ${existing.status}) and cannot be withdrawn.`
      });
      return NextResponse.json(
        {
          error:
            'This complaint is already under investigation and can no longer be withdrawn. Contact the investigating unit for any correction.'
        },
        { status: 409 }
      );
    }

    const result = await deleteCase(existing.case_number);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Could not withdraw the complaint.' }, { status: 500 });
    }

    recordAuditLog({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      action: 'CASE_WITHDRAWN',
      resource_type: 'CASE_DOSSIER',
      resource_id: existing.case_number,
      decision: 'GRANTED',
      reason: `Complainant ${user.name} withdrew complaint ${existing.case_number} while still at intake.`
    });

    return NextResponse.json({ success: true, case_number: existing.case_number });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Case withdrawal error' }, { status: 500 });
  }
}
