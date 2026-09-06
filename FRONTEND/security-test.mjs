/**
 * Automated Security & Privilege Escalation Barrier Test Suite
 * SIH26183 - CryptoTrace Intelligence Platform
 *
 * Verifies:
 * 1. Unauthenticated rejection (HTTP 401) on protected API routes
 * 2. RBAC/ABAC Privilege Escalation barriers (HTTP 403)
 * 3. Victim Case Isolation (cannot view or tamper other victims' cases)
 * 4. Statutory Section 94 BNSS Gazetted Officer Mandate (Sub-Inspector blocked from issuing freeze orders)
 * 5. Exchange Nodal Desk isolation (VASP boundaries)
 * 6. Judicial Zero-Write Restriction (Auditors strictly read-only)
 * 7. Super Admin national emergency lockdown gate
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${message}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${message}`);
    failed++;
  }
}

async function api(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });
  let body = null;
  try {
    body = await res.json();
  } catch {}
  return { status: res.status, headers: res.headers, body };
}

async function login(email, password) {
  const res = await api('/api/auth', {
    method: 'POST',
    body: JSON.stringify({ action: 'login', email, password })
  });
  return {
    status: res.status,
    user: res.body?.user,
    token: res.body?.token
  };
}

async function runSecurityTests() {
  console.log('================================================================');
  console.log('  🔒 AUTOMATED SECURITY & PRIVILEGE ESCALATION BARRIER TEST SUITE');
  console.log(`  Target: ${BASE_URL}`);
  console.log('================================================================\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 1: UNAUTHENTICATED ACCESS PREVENTION (Expect 401 Unauthorized)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\x1b[36m[GROUP 1] Testing Unauthenticated Access to Protected Endpoints:\x1b[0m');

  const unauthCases = await api('/api/cases', { method: 'GET' });
  assert(unauthCases.status === 401, `GET /api/cases without token rejected with HTTP ${unauthCases.status} (Expected: 401)`);

  const unauthCasesPost = await api('/api/cases', {
    method: 'POST',
    body: JSON.stringify({ suspect_wallet_address: '0x123' })
  });
  assert(unauthCasesPost.status === 401, `POST /api/cases without token rejected with HTTP ${unauthCasesPost.status} (Expected: 401)`);

  const unauthNoticesGet = await api('/api/notices', { method: 'GET' });
  assert(unauthNoticesGet.status === 401, `GET /api/notices without token rejected with HTTP ${unauthNoticesGet.status} (Expected: 401)`);

  const unauthNoticesPost = await api('/api/notices', {
    method: 'POST',
    body: JSON.stringify({ target_vasp: 'Binance', status: 'Issued' })
  });
  assert(unauthNoticesPost.status === 401, `POST /api/notices without token rejected with HTTP ${unauthNoticesPost.status} (Expected: 401)`);

  const unauthAudit = await api('/api/audit', { method: 'GET' });
  assert(unauthAudit.status === 401, `GET /api/audit without token rejected with HTTP ${unauthAudit.status} (Expected: 401)`);

  const unauthTrace = await api('/api/trace', {
    method: 'POST',
    body: JSON.stringify({ seed: 'demo' })
  });
  assert(unauthTrace.status === 401, `POST /api/trace without token rejected with HTTP ${unauthTrace.status} (Expected: 401)`);

  const unauthLockdown = await api('/api/auth', {
    method: 'POST',
    body: JSON.stringify({ action: 'toggle_lockdown', active: true })
  });
  assert(unauthLockdown.status === 401, `POST /api/auth (toggle_lockdown) without token rejected with HTTP ${unauthLockdown.status} (Expected: 401)`);

  const unauthIngest = await api('/api/ingest/ncrp', {
    method: 'POST',
    body: JSON.stringify({ suspect_wallet: '0xAttacker' })
  });
  assert(unauthIngest.status === 401, `POST /api/ingest/ncrp without token rejected with HTTP ${unauthIngest.status} (Expected: 401)`);

  const unauthChat = await api('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message: 'Forensic query' })
  });
  assert(unauthChat.status === 401, `POST /api/chat without token rejected with HTTP ${unauthChat.status} (Expected: 401)`);

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 2: CITIZEN / VICTIM PRIVILEGE BARRIERS (Rajesh Verma)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n\x1b[36m[GROUP 2] Testing VICTIM Role Barriers (victim.verma@gmail.com):\x1b[0m');
  const victimAuth = await login('victim.verma@gmail.com', 'Victim@123');
  assert(victimAuth.status === 200 && victimAuth.token, `Authenticated as Rajesh Verma (VICTIM): HTTP ${victimAuth.status}`);

  // Can VICTIM trigger Section 94 BNSS notices? (MUST BE DENIED: 403)
  const victimNoticePost = await api('/api/notices', {
    method: 'POST',
    token: victimAuth.token,
    body: JSON.stringify({ target_vasp: 'Binance International', status: 'Issued' })
  });
  assert(victimNoticePost.status === 403, `VICTIM attempting to issue Section 94 BNSS notice rejected with HTTP ${victimNoticePost.status} (Expected: 403)`);

  // Can VICTIM inspect police notices? (MUST BE DENIED: 403)
  const victimNoticeGet = await api('/api/notices', { method: 'GET', token: victimAuth.token });
  assert(victimNoticeGet.status === 403, `VICTIM attempting to inspect police notices rejected with HTTP ${victimNoticeGet.status} (Expected: 403)`);

  // Can VICTIM inspect internal audit logs? (MUST BE DENIED: 403)
  const victimAuditGet = await api('/api/audit', { method: 'GET', token: victimAuth.token });
  assert(victimAuditGet.status === 403, `VICTIM attempting to view judicial audit logs rejected with HTTP ${victimAuditGet.status} (Expected: 403)`);

  // Can VICTIM execute arbitrary forensic trace? (MUST BE DENIED: 403)
  const victimTrace = await api('/api/trace', {
    method: 'POST',
    token: victimAuth.token,
    body: JSON.stringify({ seed: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F' })
  });
  assert(victimTrace.status === 403, `VICTIM attempting to execute blockchain trace rejected with HTTP ${victimTrace.status} (Expected: 403)`);

  // Privacy Isolation Check: Can VICTIM access other victims' cases?
  const victimCases = await api('/api/cases', { method: 'GET', token: victimAuth.token });
  assert(victimCases.status === 200, `VICTIM accessing assigned complaints returned HTTP ${victimCases.status} (Expected: 200)`);
  const foreignCases = (victimCases.body?.cases || []).filter(c => c.victim_id !== 5);
  assert(
    foreignCases.length === 0,
    `VICTIM Privacy Isolation verified: Returned 0 other victims' case files (Only victim_id=5 returned: ${victimCases.body?.cases?.length || 0} cases)`
  );

  // Can VICTIM use AI forensic investigator? (MUST BE DENIED: 403)
  const victimChat = await api('/api/chat', {
    method: 'POST',
    token: victimAuth.token,
    body: JSON.stringify({ message: 'Investigate trace' })
  });
  assert(victimChat.status === 403, `VICTIM attempting to use AI forensic investigator rejected with HTTP ${victimChat.status} (Expected: 403)`);

  // Can VICTIM report suspect wallet via /api/ingest/ncrp and ensure victim_id isolation?
  const victimIngest = await api('/api/ingest/ncrp', {
    method: 'POST',
    token: victimAuth.token,
    body: JSON.stringify({
      suspect_wallet: '0x9999999999999999999999999999999999999999',
      loss_amount_inr: 350000,
      victim_id: 888 // Attempt forged victim ID
    })
  });
  assert(
    victimIngest.status === 200 && victimIngest.body?.case?.victim_id === 5,
    `VICTIM filing complaint via NCRP succeeds with forced victim_id isolation (Expected: 5, Got: ${victimIngest.body?.case?.victim_id}): HTTP ${victimIngest.status}`
  );

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 3: NON-GAZETTED INVESTIGATOR BARRIER (Sub-Inspector Patil)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n\x1b[36m[GROUP 3] Testing Non-Gazetted Officer Gate (officer.patil@mhcyber.gov.in):\x1b[0m');
  const patilAuth = await login('officer.patil@mhcyber.gov.in', 'Patil@123');
  assert(patilAuth.status === 200 && patilAuth.token, `Authenticated as Sub-Inspector Patil (NORMAL_INVESTIGATOR): HTTP ${patilAuth.status}`);

  // Can Sub-Inspector sign and issue Section 94 BNSS freezing orders? (MUST BE DENIED: 403)
  const patilNoticeIssue = await api('/api/notices', {
    method: 'POST',
    token: patilAuth.token,
    body: JSON.stringify({ target_vasp: 'Binance International', status: 'Issued' })
  });
  assert(
    patilNoticeIssue.status === 403 && patilNoticeIssue.body?.statutory_code === 'SEC_94_BNSS_GAZETTED_GATE',
    `Sub-Inspector Patil blocked from signing Sec 94 BNSS freezing order: HTTP ${patilNoticeIssue.status} (Statutory code: ${patilNoticeIssue.body?.statutory_code})`
  );

  // Can Sub-Inspector Patil draft a notice? (MUST BE PERMITTED: 200)
  const patilNoticeDraft = await api('/api/notices', {
    method: 'POST',
    token: patilAuth.token,
    body: JSON.stringify({
      target_vasp: 'Binance International',
      status: 'Draft',
      notice: { ref: 'TEST-DRAFT-01', to_vasp: 'Binance International' }
    })
  });
  assert(patilNoticeDraft.status === 200, `Sub-Inspector Patil permitted to save notice in Draft status: HTTP ${patilNoticeDraft.status}`);

  // Can Sub-Inspector Patil view audit logs? (MUST BE DENIED: 403)
  const patilAudit = await api('/api/audit', { method: 'GET', token: patilAuth.token });
  assert(patilAudit.status === 403, `Sub-Inspector Patil restricted from inspecting audit logs: HTTP ${patilAudit.status} (Expected: 403)`);

  // Can Sub-Inspector Patil use AI investigator? (MUST BE PERMITTED: 200)
  const patilChat = await api('/api/chat', {
    method: 'POST',
    token: patilAuth.token,
    body: JSON.stringify({ message: 'What is the transaction volume?' })
  });
  assert(patilChat.status === 200, `Sub-Inspector Patil permitted to query AI investigator: HTTP ${patilChat.status}`);

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 4: GAZETTED SENIOR INVESTIGATOR (ACP Sharma)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n\x1b[36m[GROUP 4] Testing Gazetted Officer Authority (senior.sharma@mhcyber.gov.in):\x1b[0m');
  const sharmaAuth = await login('senior.sharma@mhcyber.gov.in', 'Police@123');
  assert(sharmaAuth.status === 200 && sharmaAuth.token, `Authenticated as ACP Sharma (SENIOR_INVESTIGATOR, Gazetted): HTTP ${sharmaAuth.status}`);

  // Can Gazetted ACP Sharma sign and issue Section 94 BNSS freezing orders? (MUST BE PERMITTED: 200)
  const sharmaNoticeIssue = await api('/api/notices', {
    method: 'POST',
    token: sharmaAuth.token,
    body: JSON.stringify({
      target_vasp: 'Binance International',
      vasp_id: 1,
      status: 'Issued',
      notice: { ref: 'BNSS-2026-TEST-01', to_vasp: 'Binance International', amountUsd: 5400 }
    })
  });
  assert(
    sharmaNoticeIssue.status === 200 && sharmaNoticeIssue.body?.success,
    `Gazetted ACP Sharma successfully signed & issued Section 94 BNSS freezing order: HTTP ${sharmaNoticeIssue.status}`
  );

  // Can ACP Sharma inspect state audit logs? (MUST BE PERMITTED: 200)
  const sharmaAudit = await api('/api/audit', { method: 'GET', token: sharmaAuth.token });
  assert(sharmaAudit.status === 200, `ACP Sharma access to audit logs permitted: HTTP ${sharmaAudit.status}`);

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 5: EXCHANGE NODAL DESK ISOLATION (Binance Compliance)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n\x1b[36m[GROUP 5] Testing Exchange Nodal Officer Boundaries (legal@binance.com):\x1b[0m');
  const binanceAuth = await login('legal@binance.com', 'Binance@123');
  assert(binanceAuth.status === 200 && binanceAuth.token, `Authenticated as Binance Compliance Lead: HTTP ${binanceAuth.status}`);

  // Can Exchange Officer create police case dossiers? (MUST BE DENIED: 403)
  const binanceCaseCreate = await api('/api/cases', {
    method: 'POST',
    token: binanceAuth.token,
    body: JSON.stringify({ suspect_wallet_address: '0x999' })
  });
  assert(binanceCaseCreate.status === 403, `Exchange officer blocked from creating police cases: HTTP ${binanceCaseCreate.status} (Expected: 403)`);

  // Can Exchange Officer issue police freeze orders? (MUST BE DENIED: 403)
  const binanceNoticeCreate = await api('/api/notices', {
    method: 'POST',
    token: binanceAuth.token,
    body: JSON.stringify({ target_vasp: 'Binance', status: 'Issued' })
  });
  assert(binanceNoticeCreate.status === 403, `Exchange officer blocked from issuing legal notices: HTTP ${binanceNoticeCreate.status} (Expected: 403)`);

  // Can Exchange Officer ingest complaints? (MUST BE DENIED: 403)
  const binanceIngest = await api('/api/ingest/ncrp', {
    method: 'POST',
    token: binanceAuth.token,
    body: JSON.stringify({ suspect_wallet: '0x123' })
  });
  assert(binanceIngest.status === 403, `Exchange officer blocked from ingesting complaints: HTTP ${binanceIngest.status} (Expected: 403)`);

  // Can Exchange Officer access AI investigator? (MUST BE DENIED: 403)
  const binanceChat = await api('/api/chat', {
    method: 'POST',
    token: binanceAuth.token,
    body: JSON.stringify({ message: 'Explain trace' })
  });
  assert(binanceChat.status === 403, `Exchange officer blocked from accessing AI investigator: HTTP ${binanceChat.status} (Expected: 403)`);

  // Can Exchange Officer acknowledge/confirm freeze compliance under Section 94 BNSS? (MUST BE PERMITTED: 200)
  const binanceConfirmFreeze = await api('/api/notices', {
    method: 'POST',
    token: binanceAuth.token,
    body: JSON.stringify({
      action: 'acknowledge',
      status: 'Acknowledged',
      target_vasp: 'Binance International',
      vasp_id: 1,
      notice: { ref: 'BNSS-2026-0842-BN', to_vasp: 'Binance International' }
    })
  });
  assert(
    binanceConfirmFreeze.status === 200 && binanceConfirmFreeze.body?.success,
    `Exchange Nodal Officer successfully confirmed Section 94 BNSS freeze compliance: HTTP ${binanceConfirmFreeze.status}`
  );

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 6: JUDICIAL AUDITOR ZERO-WRITE RESTRICTION (Justice K.S. Rao)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n\x1b[36m[GROUP 6] Testing Judicial Zero-Write Restriction (judge.rao@ecourts.gov.in):\x1b[0m');
  const judgeAuth = await login('judge.rao@ecourts.gov.in', 'Judge@123');
  assert(judgeAuth.status === 200 && judgeAuth.token, `Authenticated as Justice K.S. Rao (AUDITOR): HTTP ${judgeAuth.status}`);

  // Can Judicial Auditor inspect immutable audit trail? (MUST BE PERMITTED: 200)
  const judgeAudit = await api('/api/audit', { method: 'GET', token: judgeAuth.token });
  assert(judgeAudit.status === 200, `Judicial Auditor granted access to BSA 2023 Sec 63/65B audit trail: HTTP ${judgeAudit.status}`);

  // Can Judicial Auditor mutate state / create cases? (MUST BE DENIED: 403 under POL-02)
  const judgeCaseCreate = await api('/api/cases', {
    method: 'POST',
    token: judgeAuth.token,
    body: JSON.stringify({ suspect_wallet_address: '0x888' })
  });
  assert(
    judgeCaseCreate.status === 403,
    `Judicial Auditor zero-write rule enforced (POL-02-JUDICIAL-READ-ONLY): HTTP ${judgeCaseCreate.status}`
  );

  // Can Judicial Auditor ingest complaints into police gateway? (MUST BE DENIED: 403)
  const judgeIngest = await api('/api/ingest/ncrp', {
    method: 'POST',
    token: judgeAuth.token,
    body: JSON.stringify({ suspect_wallet: '0x123' })
  });
  assert(judgeIngest.status === 403, `Judicial Auditor zero-write rule blocks complaint ingestion: HTTP ${judgeIngest.status} (Expected: 403)`);

  // ──────────────────────────────────────────────────────────────────────────
  // TEST GROUP 7: SUPER ADMIN NATIONAL KILLSWITCH (admin@i4c.gov.in)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n\x1b[36m[GROUP 7] Testing Super Admin Central Authority (admin@i4c.gov.in):\x1b[0m');
  const adminAuth = await login('admin@i4c.gov.in', 'Admin@123');
  assert(adminAuth.status === 200 && adminAuth.token, `Authenticated as I4C Central Nodal Officer (SUPER_ADMIN): HTTP ${adminAuth.status}`);

  // Can I4C Super Admin trigger platform emergency lockdown? (MUST BE PERMITTED: 200)
  const adminLockdown = await api('/api/auth', {
    method: 'POST',
    token: adminAuth.token,
    body: JSON.stringify({ action: 'toggle_lockdown', active: false })
  });
  assert(adminLockdown.status === 200, `I4C Super Admin permitted to toggle emergency lockdown: HTTP ${adminLockdown.status}`);

  // Can Sub-Inspector Patil trigger emergency lockdown? (MUST BE DENIED: 403)
  const patilLockdown = await api('/api/auth', {
    method: 'POST',
    token: patilAuth.token,
    body: JSON.stringify({ action: 'toggle_lockdown', active: true })
  });
  assert(patilLockdown.status === 403, `Sub-Inspector Patil blocked from triggering emergency lockdown: HTTP ${patilLockdown.status} (Expected: 403)`);

  console.log('\n================================================================');
  console.log(`  FINAL VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityTests().catch(err => {
  console.error('Test execution exception:', err);
  process.exit(1);
});
