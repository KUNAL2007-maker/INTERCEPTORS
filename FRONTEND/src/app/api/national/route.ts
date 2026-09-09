import { NextResponse } from 'next/server';
import { getCasesForUser, getUserById, recordAuditLog, type StoredCase } from '@/lib/db';
import { extractUserClaims } from '@/lib/auth-crypto';
import { normalizeRole, hasPermission, PERMISSIONS } from '@/lib/rbac-abac';

/**
 * National cross-jurisdictional correlation.
 *
 * The correlation primitive is deliberately the plainest on-chain fact there
 * is: two dockets from different states that name the SAME victim-reported
 * suspect wallet are, on the balance of the evidence, paying into one
 * collection address — one operation, reported piecemeal by victims who never
 * met. That single shared address survives across state lines when names,
 * phone numbers and bank mules do not, which is exactly why it is the seam a
 * national desk works along.
 *
 * Everything returned is computed from the live case store. Nothing is
 * fabricated: a cluster exists only because >= 2 real dockets share a wallet,
 * and it is flagged as a cross-border syndicate only when those dockets span
 * >= 2 jurisdictions. A wallet reported once, or repeatedly within one state,
 * is not a cross-jurisdictional link and is not surfaced as one.
 */

// Jurisdiction codes are "<STATE>-<UNIT>-<n>"; map the state prefix to a label.
const STATE_BY_PREFIX: Record<string, string> = {
  MH: 'Maharashtra',
  KA: 'Karnataka',
  DL: 'Delhi',
  TN: 'Tamil Nadu',
  TG: 'Telangana',
  GJ: 'Gujarat',
  WB: 'West Bengal',
  UP: 'Uttar Pradesh',
  RJ: 'Rajasthan',
  KL: 'Kerala',
  IN: 'National (I4C)',
};

function stateFor(jurisdiction?: string): string {
  if (!jurisdiction) return 'Unspecified';
  const prefix = jurisdiction.split('-')[0]?.toUpperCase();
  return STATE_BY_PREFIX[prefix] || jurisdiction;
}

export async function GET(req: Request) {
  const claims = await extractUserClaims(req);
  if (!claims) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
  }
  const user = getUserById(claims.id) || (claims as any);
  const normRole = normalizeRole(user.role);

  // RBAC: only the cross-case intelligence permission opens this desk. This is
  // held by the National Coordination Analyst (and SYSTEM_ADMIN for upkeep).
  if (!hasPermission(normRole, PERMISSIONS.INTELLIGENCE_CROSS_CASE_VIEW)) {
    recordAuditLog({
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      action: 'NATIONAL_CROSS_CASE_VIEW',
      resource_type: 'INTELLIGENCE',
      decision: 'DENIED',
      reason: `RBAC: role '${user.role}' lacks ${PERMISSIONS.INTELLIGENCE_CROSS_CASE_VIEW}.`,
    });
    return NextResponse.json(
      { error: 'Access Denied: cross-jurisdictional correlation is restricted to National Coordination analysts.' },
      { status: 403 },
    );
  }

  // National analyst → filterCasesByScope returns every docket.
  const cases = await getCasesForUser(user);

  // Cluster by the normalised suspect wallet.
  const byWallet = new Map<string, StoredCase[]>();
  for (const c of cases) {
    const key = (c.suspect_wallet_address || '').trim().toLowerCase();
    if (!key) continue;
    const arr = byWallet.get(key) || [];
    arr.push(c);
    byWallet.set(key, arr);
  }

  const clusters = [];
  for (const [walletKey, group] of byWallet) {
    if (group.length < 2) continue; // a single docket is not a correlation

    const states = Array.from(new Set(group.map((c) => stateFor(c.jurisdiction_code))));
    const jurisdictions = Array.from(new Set(group.map((c) => c.jurisdiction_code).filter(Boolean)));
    const crossJurisdiction = states.length >= 2;
    const commonVasps = Array.from(new Set(group.map((c) => c.target_vasp).filter(Boolean))) as string[];
    const chains = Array.from(new Set(group.map((c) => c.blockchain_network).filter(Boolean)));
    const totalExposureInr = group.reduce((sum, c) => sum + (Number(c.loss_amount_inr) || 0), 0);

    clusters.push({
      id: `NCL-${walletKey.replace(/[^a-z0-9]/gi, '').slice(2, 10).toUpperCase() || 'UNKNOWN'}`,
      clusterAddress: group[0].suspect_wallet_address,
      // "Same scammer group" only when the SAME wallet surfaces in >= 2 states.
      sameSyndicate: crossJurisdiction,
      crossJurisdiction,
      states,
      jurisdictions,
      chains,
      commonVasps,
      totalExposureInr,
      caseCount: group.length,
      cases: group
        .map((c) => ({
          state: stateFor(c.jurisdiction_code),
          jurisdiction: c.jurisdiction_code,
          caseNumber: c.case_number,
          victimName: c.victim_name || '—',
          lossInr: Number(c.loss_amount_inr) || 0,
          targetVasp: c.target_vasp || '—',
          chain: c.blockchain_network || '—',
          status: c.status,
          crimeType: c.crime_type || '—',
        }))
        .sort((a, b) => b.lossInr - a.lossInr),
    });
  }

  // Cross-border syndicates first, then by exposure.
  clusters.sort(
    (a, b) => Number(b.crossJurisdiction) - Number(a.crossJurisdiction) || b.totalExposureInr - a.totalExposureInr,
  );

  const flaggedSyndicates = clusters.filter((c) => c.sameSyndicate).length;

  recordAuditLog({
    user_id: user.id,
    user_name: user.name,
    user_role: user.role,
    action: 'NATIONAL_CROSS_CASE_VIEW',
    resource_type: 'INTELLIGENCE',
    decision: 'GRANTED',
    reason: `Cross-case correlation over ${cases.length} dockets → ${clusters.length} shared-wallet clusters, ${flaggedSyndicates} cross-border.`,
  });

  return NextResponse.json({
    analyst: { name: user.name, role: user.role },
    totals: {
      dockets: cases.length,
      clusters: clusters.length,
      flaggedSyndicates,
      correlatedDockets: clusters.reduce((s, c) => s + c.caseCount, 0),
      aggregatedExposureInr: clusters.reduce((s, c) => s + c.totalExposureInr, 0),
    },
    clusters,
  });
}
