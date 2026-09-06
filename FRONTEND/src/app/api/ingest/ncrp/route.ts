import { NextResponse } from 'next/server';
import { createCase } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const suspectWallet = body.suspect_wallet || body.suspect_wallet_address || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
    const crimeCategory = body.crime_category || body.crime_type || 'Task-based Investment Scam';
    const amountInr = Number(body.loss_amount_inr || body.amount_inr || 450000);
    const portal = body.portal || 'NCRP_1930';
    const complaintId = body.complaint_id || `NCRP-${Date.now().toString().slice(-5)}`;

    const newCase = await createCase({
      case_number: complaintId,
      victim_id: 5,
      workspace_id: 1,
      jurisdiction_code: 'MH-CYBER-01',
      suspect_wallet_address: suspectWallet,
      blockchain_network: body.blockchain_network || 'Ethereum',
      loss_amount_inr: amountInr,
      crime_type: crimeCategory,
      target_vasp: 'Binance International',
      vasp_id: 1,
      classification: 'CONFIDENTIAL',
      status: 'PENDING_TRACING'
    });

    return NextResponse.json({
      success: true,
      message: `Successfully ingested complaint ${complaintId} from ${portal}`,
      case: newCase
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
