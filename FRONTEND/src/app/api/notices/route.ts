import { NextResponse } from 'next/server';
import { getNoticesForUser, saveFreezeNotice, getCurrentUser, getUserById, recordAuditLog } from '@/lib/db';
import { extractUserClaims } from '@/lib/auth-crypto';
import { hasPermission } from '@/lib/rbac-abac';

export async function GET(req: Request) {
  const claims = extractUserClaims(req);
  if (!claims) {
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required.' },
      { status: 401 }
    );
  }
  const user = getUserById(claims.id) || (claims as any);

  // VICTIM cannot view police legal notices
  if (user.role === 'VICTIM') {
    return NextResponse.json(
      { error: 'Access Denied: Citizen complainants are not authorized to inspect law enforcement legal notices.' },
      { status: 403 }
    );
  }

  const notices = await getNoticesForUser(user);
  return NextResponse.json({
    officer: {
      name: user.name,
      role: user.role,
      is_gazetted: user.is_gazetted,
      jurisdiction: user.jurisdiction_code
    },
    count: notices.length,
    notices
  });
}

export async function POST(req: Request) {
  try {
    const claims = extractUserClaims(req);
    if (!claims) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required.' },
        { status: 401 }
      );
    }
    const user = getUserById(claims.id) || (claims as any);

    const body = await req.json().catch(() => ({}));
    const isDraft = body.status === 'Draft' || body.action === 'draft';
    const isAck = body.status === 'Acknowledged' || body.action === 'acknowledge';

    // ── 1. RBAC Gate: Investigators/Admins can draft/issue; Exchange Officers can only acknowledge ──
    if (user.role === 'EXCHANGE_NODAL_OFFICER') {
      if (!isAck) {
        return NextResponse.json(
          {
            error: `RBAC Access Denied: Exchange compliance officers cannot draft or issue statutory Section 94 BNSS police notices.`
          },
          { status: 403 }
        );
      }
    } else {
      const isInvestigatorOrAdmin = ['SENIOR_INVESTIGATOR', 'WORKSPACE_ADMIN', 'SUPER_ADMIN', 'NORMAL_INVESTIGATOR'].includes(user.role);
      if (!isInvestigatorOrAdmin) {
        recordAuditLog({
          user_id: user.id,
          user_name: user.name,
          user_role: user.role,
          action: 'ISSUE_SECTION_94_BNSS',
          resource_type: 'FREEZE_NOTICE',
          decision: 'DENIED',
          reason: `RBAC Violation: Role '${user.role}' is not authorized to draft or issue statutory legal notices.`
        });

        return NextResponse.json(
          {
            error: `RBAC Access Denied: Role '${user.role}' has no legal authority to issue statutory Section 94 BNSS notices.`
          },
          { status: 403 }
        );
      }
    }

    // ── 2. ABAC Statutory Gate: Section 94 BNSS Gazetted Officer Mandate ───
    if (!isDraft && !isAck && !user.is_gazetted) {
      const denialReason = `ABAC Policy Violation: Under Section 94 of Bharatiya Nagarik Suraksha Sanhita (BNSS 2023) / Section 91 CrPC, statutory cryptocurrency freeze and evidence preservation orders require Gazetted Police Officer authorization (ACP, DSP, or higher). ${user.name} (${user.role}) is non-gazetted and legally unauthorized to sign.`;

      recordAuditLog({
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        action: 'ISSUE_SECTION_94_BNSS',
        resource_type: 'FREEZE_NOTICE',
        decision: 'DENIED',
        reason: denialReason,
        statutory_code: 'SEC_94_BNSS_GAZETTED_GATE'
      });

      return NextResponse.json(
        {
          error: denialReason,
          statutory_code: 'SEC_94_BNSS_GAZETTED_GATE',
          required_rank: 'Gazetted Officer (ACP / DSP or above)'
        },
        { status: 403 }
      );
    }

    const result = await saveFreezeNotice(body, user);

    if (!result.success) {
      return NextResponse.json({ error: result.error, statutory_code: result.statutory_code }, { status: 403 });
    }

    return NextResponse.json({ success: true, notice: result.notice });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Notice generation error' }, { status: 500 });
  }
}
