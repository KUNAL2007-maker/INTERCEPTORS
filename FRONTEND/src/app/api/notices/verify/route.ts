import { NextResponse } from 'next/server';
import { verifyStoredNotice, getUserById, recordAuditLog, officerSigningKey } from '@/lib/db';
import { extractUserClaims } from '@/lib/auth-crypto';
import { normalizeRole } from '@/lib/rbac-abac';

/**
 * Verify the digital signature on a Section 94 BNSS freeze order.
 *
 * GET /api/notices/verify?id=NOTICE-...
 *
 * Open to every authenticated role that can legitimately be shown an order -
 * the exchange it is addressed to, the court reviewing it, and police. It is a
 * read-only check that reveals nothing beyond what the order itself already
 * carries, and refusing verification to the parties who most need it would
 * defeat the point of signing.
 *
 * Verification is a GET on purpose: the court reviewer holds zero write
 * permissions, so checking a signature must not be a mutation.
 */
export async function GET(req: Request) {
  const claims = await extractUserClaims(req);
  if (!claims) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
  }
  const user = getUserById(claims.id) || (claims as any);
  const normRole = normalizeRole(user.role);

  if (normRole === 'VICTIM') {
    return NextResponse.json(
      { error: 'Access Denied: Complainants are not shown law enforcement legal instruments.' },
      { status: 403 }
    );
  }

  const url = new URL(req.url);
  const noticeId = url.searchParams.get('id') || url.searchParams.get('notice_id');
  if (!noticeId) {
    return NextResponse.json({ error: 'A notice id is required.' }, { status: 400 });
  }

  const { found, result, notice } = verifyStoredNotice(noticeId);
  if (!found || !result || !notice) {
    return NextResponse.json({ error: 'No such requisition on record.' }, { status: 404 });
  }

  // VASP desk isolation applies to verification too, otherwise one exchange
  // could enumerate orders served on its competitors.
  if (normRole === 'VASP_COMPLIANCE_OFFICER' || user.role === 'EXCHANGE_NODAL_OFFICER') {
    if (!user.vasp_id || (notice.vasp_id && notice.vasp_id !== user.vasp_id)) {
      return NextResponse.json(
        { error: 'Access Denied: This requisition is addressed to a different exchange.' },
        { status: 403 }
      );
    }
  }

  recordAuditLog({
    user_id: user.id,
    user_name: user.name,
    user_role: user.role,
    action: 'VERIFY_ORDER_SIGNATURE',
    resource_type: 'FREEZE_NOTICE',
    resource_id: noticeId,
    decision: 'GRANTED',
    reason: `Signature verification on ${noticeId}: ${result.valid ? 'VALID' : 'FAILED'} - ${result.reason}`,
    statutory_code: 'SEC_94_BNSS_SIGNATURE_CHECK'
  });

  return NextResponse.json({
    notice_id: noticeId,
    case_number: notice.case_number,
    verification: result,
    // The public half, so a verifier can repeat this check outside the platform
    // rather than taking our word for it.
    signing_key: notice.signature ? officerSigningKey(notice.signature.officer.uid) : null,
    signed_by: notice.signature?.officer || null,
    verified_at: new Date().toISOString(),
    verified_by: { name: user.name, role: user.role }
  });
}
