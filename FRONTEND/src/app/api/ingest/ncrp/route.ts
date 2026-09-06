import { NextResponse } from 'next/server';
import { createCase, getUserById, recordAuditLog } from '@/lib/db';
import { extractUserClaims } from '@/lib/auth-crypto';

export async function POST(req: Request) {
  try {
    const claims = extractUserClaims(req);
    if (!claims) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required to ingest complaints into NCRP gateway.' },
        { status: 401 }
      );
    }
    const user = getUserById(claims.id) || (claims as any);

    if (user.role === 'AUDITOR') {
      return NextResponse.json(
        { error: 'Access Denied: Judicial Auditor accounts possess zero write/mutation permissions under BSA 2023 Sec 65B.' },
        { status: 403 }
      );
    }

    if (user.role === 'EXCHANGE_NODAL_OFFICER') {
      return NextResponse.json(
        { error: 'Access Denied: Exchange compliance officers cannot ingest law enforcement complaint files.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const suspectWallet = body.suspect_wallet || body.suspect_wallet_address || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
    const crimeCategory = body.crime_category || body.crime_type || 'Task-based Investment Scam';
    const amountInr = Number(body.loss_amount_inr || body.amount_inr || 450000);
    const portal = body.portal || 'NCRP_1930';
    const complaintId = body.complaint_id || `NCRP-${Date.now().toString().slice(-5)}`;

    // Privacy isolation: If complainant is a citizen, lock complaint strictly to their own victim ID
    const assignedVictimId = user.role === 'VICTIM' ? user.id : (body.victim_id || user.id);

    const newCase = await createCase({
      case_number: complaintId,
      victim_id: assignedVictimId,
      workspace_id: user.workspace_id || 1,
      jurisdiction_code: user.jurisdiction_code || 'MH-CYBER-01',
      suspect_wallet_address: suspectWallet,
      blockchain_network: body.blockchain_network || 'Ethereum',
      loss_amount_inr: amountInr,
      crime_type: crimeCategory,
      target_vasp: body.target_vasp || 'Binance International',
      vasp_id: body.vasp_id || 1,
      classification: user.role === 'VICTIM' ? 'RESTRICTED' : 'CONFIDENTIAL',
      status: 'PENDING_TRACING'
    });

    recordAuditLog({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      action: 'INGEST_NCRP_COMPLAINT',
      resource_type: 'CASE_DOSSIER',
      resource_id: complaintId,
      decision: 'GRANTED',
      reason: `Ingested complaint ${complaintId} from ${portal} for wallet ${suspectWallet}.`
    });

    return NextResponse.json({
      success: true,
      message: `Successfully ingested complaint ${complaintId} from ${portal}`,
      case: newCase
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Ingestion error' }, { status: 500 });
  }
}
