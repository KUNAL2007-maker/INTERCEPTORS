import { NextResponse } from 'next/server';
import { createCase, getUserById, recordAuditLog } from '@/lib/db';
import { extractUserClaims } from '@/lib/auth-crypto';
import { normalizeRole } from '@/lib/rbac-abac';

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
    const normRole = normalizeRole(user.role);

    if (normRole === 'COURT_REVIEWER' || user.role === 'AUDITOR') {
      return NextResponse.json(
        { error: 'Access Denied: Judicial Auditor / Court Reviewer accounts possess zero write/mutation permissions under BSA 2023 Sec 65B.' },
        { status: 403 }
      );
    }

    if (normRole === 'VASP_COMPLIANCE_OFFICER' || user.role === 'EXCHANGE_NODAL_OFFICER') {
      return NextResponse.json(
        { error: 'Access Denied: Exchange compliance officers cannot ingest law enforcement complaint files.' },
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
        { error: 'Access Denied: System Administrators are separated from investigative intake authority.' },
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
    const isVictim = normRole === 'VICTIM';
    const assignedVictimId = isVictim ? user.id : (body.victim_id || user.id);

    const newCase = await createCase({
      case_number: complaintId,
      victim_id: assignedVictimId,
      victim_name: isVictim ? user.name : (body.victim_name || 'Rajesh Verma'),
      victim_email: isVictim ? user.email : (body.victim_email || 'victim.verma@example.demo'),
      workspace_id: user.workspace_id || 1,
      jurisdiction_code: user.jurisdiction_code || 'MH-CYBER-01',
      suspect_wallet_address: suspectWallet,
      blockchain_network: body.blockchain_network || 'Ethereum',
      loss_amount_inr: amountInr,
      token_symbol: body.token_symbol || body.currency || 'USDT',
      crime_type: crimeCategory,
      incident_date: body.incident_date || new Date().toISOString().split('T')[0],
      target_vasp: body.target_vasp || 'Binance International',
      vasp_id: body.vasp_id || 1,
      classification: isVictim ? 'RESTRICTED' : 'CONFIDENTIAL',
      status: 'PENDING_TRACING',
      priority: 'HIGH',
      assigned_investigator_id: 3,
      assigned_investigator_name: 'SI Patil',
      tx_hashes: body.tx_hash ? [body.tx_hash] : (body.tx_hashes || []),
      notes: body.notes || body.incident_description || ''
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
