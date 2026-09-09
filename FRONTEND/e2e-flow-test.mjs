/**
 * End-to-End Continuous Workflow Verification Script
 * Tests the entire lifecycle:
 * 1. Victim files complaint with suspect wallet
 * 2. Officer views received complaint in queue
 * 3. Authorized gazetted officer executes trace on victim's suspect wallet
 * 4. Officer issues Section 94 BNSS freeze notice
 * 5. Exchange compliance desk confirms freeze & locks escrow
 * 6. Victim tracks live milestone update (FROZEN)
 * 7. Super Admin verifies national oversight
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

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

async function runE2EFlow() {
  console.log('================================================================');
  console.log('  🚀 END-TO-END VICTIM-TO-FREEZE CONTINUOUS WORKFLOW TEST');
  console.log(`  Target: ${BASE_URL}`);
  console.log('================================================================\n');

  // STEP 1: Victim logs in and files a complaint
  console.log('[STEP 1] Citizen Complainant: Registering Fraud Complaint');
  const victimAuth = await login('victim.verma@gmail.com', 'Victim@123');
  assert(victimAuth.status === 200 && victimAuth.token, 'Victim successfully authenticated');
  assert(victimAuth.user.role === 'VICTIM', 'User role is confirmed VICTIM');

  const suspectWallet = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
  const complaintPayload = {
    title: 'DEX Phishing Drainer - 7.5L INR USDT Stolen',
    suspect_wallet_address: suspectWallet,
    loss_amount_inr: 750000,
    token_symbol: 'USDT',
    incident_date: '2026-09-05',
    notes: 'Phishing approval on fraudulent swap interface; drainer sent funds to this address.',
    tx_hash: '0x9d4a8e3c1b7f2a4e6d8c0b2e4f6a8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b'
  };

  const createRes = await api('/api/cases', {
    method: 'POST',
    token: victimAuth.token,
    body: JSON.stringify(complaintPayload)
  });

  assert(createRes.status === 200 && createRes.body?.success, 'Complaint successfully registered via API');
  const createdCase = createRes.body?.case;
  assert(createdCase?.case_number, `Generated case number: ${createdCase?.case_number}`);
  assert(createdCase?.suspect_wallet_address === suspectWallet, `Suspect wallet correctly bound: ${createdCase?.suspect_wallet_address}`);
  assert(createdCase?.status === 'PENDING_TRACING', `Initial case status is PENDING_TRACING`);
  assert(createdCase?.victim_id === victimAuth.user.id, `Victim isolation preserved (victim_id=${createdCase?.victim_id})`);

  // Verify victim can query this case
  const victimCasesRes = await api('/api/cases', { token: victimAuth.token });
  assert(victimCasesRes.status === 200, 'Victim can retrieve their complaint history');
  const foundVictimCase = victimCasesRes.body?.cases?.find(c => c.case_number === createdCase.case_number);
  assert(foundVictimCase !== undefined, 'Registered complaint appears in victim\'s personal dashboard');

  // STEP 2: Investigating Officer views complaint in queue
  console.log('\n[STEP 2] Investigating Officer Queue: Receiving Complaint');
  const officerAuth = await login('officer.patil@mhcyber.gov.in', 'Patil@123');
  assert(officerAuth.status === 200 && officerAuth.token, 'Sub-Inspector Patil successfully authenticated');
  assert(officerAuth.user.role === 'INVESTIGATING_OFFICER' || officerAuth.user.role === 'NORMAL_INVESTIGATOR', 'Officer role is INVESTIGATING_OFFICER');

  const officerCasesRes = await api('/api/cases', { token: officerAuth.token });
  assert(officerCasesRes.status === 200, 'Investigating officer retrieved regional complaint queue');
  const officerFoundCase = officerCasesRes.body?.cases?.find(c => c.case_number === createdCase.case_number);
  assert(officerFoundCase !== undefined, `Investigating officer sees victim complaint ${createdCase.case_number} in queue`);

  // Sub-Inspector Patil executes forensic trace on suspect wallet
  const patilTraceRes = await api('/api/trace', {
    method: 'POST',
    token: officerAuth.token,
    body: JSON.stringify({
      seed: createdCase.suspect_wallet_address,
      caseMeta: {
        caseNumber: createdCase.case_number,
        victimName: createdCase.victim_name,
        amountInr: createdCase.loss_amount_inr
      }
    })
  });
  assert(patilTraceRes.status === 200, 'Field Investigating Officer (SI Patil) permitted to execute suspect wallet trace');
  assert(patilTraceRes.body?.nodes?.length > 0, `Patil trace mapped ${patilTraceRes.body?.nodes?.length} blockchain nodes`);

  // STEP 3: Gazetted Officer executes forensic trace on victim's suspect wallet
  console.log('\n[STEP 3] Forensic Tracing: Gazetted Officer Tracing Suspect Wallet');
  const acpAuth = await login('senior.sharma@mhcyber.gov.in', 'Police@123');
  assert(acpAuth.status === 200 && acpAuth.token, 'ACP Sharma (Gazetted) successfully authenticated');
  assert(acpAuth.user.is_gazetted === true, 'Officer holds Gazetted authority');

  const traceRes = await api('/api/trace', {
    method: 'POST',
    token: acpAuth.token,
    body: JSON.stringify({
      seed: createdCase.suspect_wallet_address,
      caseMeta: {
        caseNumber: createdCase.case_number,
        victimName: createdCase.victim_name,
        amountInr: createdCase.loss_amount_inr
      }
    })
  });

  assert(traceRes.status === 200, 'Forensic trace executed successfully on suspect wallet');
  assert(traceRes.body?.nodes?.length > 0, `Trace returned ${traceRes.body?.nodes?.length} money trail graph nodes`);
  assert(traceRes.body?.transfers?.length > 0, `Trace returned ${traceRes.body?.transfers?.length} on-chain transfers`);

  // Update case status to TRACED
  const patchTracedRes = await api('/api/cases', {
    method: 'PATCH',
    token: acpAuth.token,
    body: JSON.stringify({
      case_number: createdCase.case_number,
      status: 'TRACED'
    })
  });
  assert(patchTracedRes.status === 200 && patchTracedRes.body?.case?.status === 'TRACED', 'Case status successfully updated to TRACED');

  // STEP 4: Officer issues Section 94 BNSS statutory freeze requisition
  console.log('\n[STEP 4] Statutory Legal Directive: Issuing Section 94 BNSS Notice');
  const noticeRef = `BNSS-2026-${createdCase.case_number.slice(-4)}-BN`;
  const noticeRes = await api('/api/notices', {
    method: 'POST',
    token: acpAuth.token,
    body: JSON.stringify({
      case_id: createdCase.id,
      case_number: createdCase.case_number,
      target_vasp: 'Binance International',
      vasp_id: 1,
      status: 'Issued',
      notice: {
        ref: noticeRef,
        amountInr: createdCase.loss_amount_inr,
        amountUsd: 9000,
        targetAddresses: [createdCase.suspect_wallet_address],
        case_number: createdCase.case_number
      }
    })
  });

  assert(noticeRes.status === 200 && noticeRes.body?.success, 'Gazetted ACP successfully issued Section 94 BNSS freeze order');
  const issuedNotice = noticeRes.body?.notice;
  assert(issuedNotice?.id, `Generated statutory notice ID: ${issuedNotice?.id}`);

  // Verify case status automatically updated to NOTICE_SERVED
  const casesAfterNotice = await api('/api/cases', { token: acpAuth.token });
  const caseAfterNotice = casesAfterNotice.body?.cases?.find(c => c.case_number === createdCase.case_number);
  assert(caseAfterNotice?.status === 'NOTICE_SERVED', `Case status synchronized to NOTICE_SERVED (Got: ${caseAfterNotice?.status})`);

  // STEP 5: Exchange Compliance confirms freeze & locks escrow
  console.log('\n[STEP 5] Exchange Compliance: Acknowledging Freeze & Escrow Lock');
  const exchangeAuth = await login('legal@binance.com', 'Compliance@123');
  assert(exchangeAuth.status === 200 && exchangeAuth.token, 'Binance Compliance Officer authenticated');
  assert(exchangeAuth.user.role === 'VASP_COMPLIANCE_OFFICER' || exchangeAuth.user.role === 'EXCHANGE_NODAL_OFFICER', 'Role is VASP_COMPLIANCE_OFFICER');

  const exchangeNotices = await api('/api/notices', { token: exchangeAuth.token });
  assert(exchangeNotices.status === 200, 'Exchange retrieved inbound statutory directives');
  const targetNotice = exchangeNotices.body?.notices?.find(n => n.id === issuedNotice.id || n.case_number === createdCase.case_number);
  assert(targetNotice !== undefined, 'Exchange compliance desk received law enforcement requisition');

  const ackRes = await api('/api/notices', {
    method: 'POST',
    token: exchangeAuth.token,
    body: JSON.stringify({
      id: issuedNotice.id,
      case_number: createdCase.case_number,
      status: 'Acknowledged'
    })
  });
  assert(ackRes.status === 200 && ackRes.body?.success, 'Exchange successfully acknowledged freeze directive under Sec 94(1) BNSS');

  // Stage 2: Exchange Compliance reports FREEZE_EXECUTED action taken
  const actionRes = await api('/api/notices', {
    method: 'POST',
    token: exchangeAuth.token,
    body: JSON.stringify({
      id: issuedNotice.id,
      case_number: createdCase.case_number,
      action: 'report_action',
      action_taken: 'FREEZE_EXECUTED',
      exchange_ref_no: 'BINANCE-FRZ-88219',
      executed_by: 'VASP Compliance Officer',
      frozen_amount: '$9,000 USDT'
    })
  });
  assert(actionRes.status === 200 && actionRes.body?.success, 'Exchange successfully reported FREEZE_EXECUTED compliance action');

  // Verify case status synchronized to FROZEN
  const casesAfterAck = await api('/api/cases', { token: acpAuth.token });
  const caseAfterAck = casesAfterAck.body?.cases?.find(c => c.case_number === createdCase.case_number);
  assert(caseAfterAck?.status === 'FROZEN', `Case status synchronized to FROZEN (Got: ${caseAfterAck?.status})`);

  // STEP 6: Victim verifies live milestone on personal tracking dashboard
  console.log('\n[STEP 6] Victim Milestone Verification: Live Recovery Tracking');
  const victimCheckRes = await api('/api/cases', { token: victimAuth.token });
  assert(victimCheckRes.status === 200, 'Victim re-queried case status');
  const victimTrackedCase = victimCheckRes.body?.cases?.find(c => c.case_number === createdCase.case_number);
  assert(victimTrackedCase?.status === 'FROZEN', `Victim dashboard shows case status: FROZEN (Assets Locked in Escrow)`);
  assert(victimTrackedCase?.freeze_notice_id !== undefined, `Victim dashboard reflects statutory notice reference`);

  // STEP 7: Super Admin national oversight verification
  console.log('\n[STEP 7] Super Admin National Oversight');
  const adminAuth = await login('admin@i4c.gov.in', 'Admin@123');
  assert(adminAuth.status === 200 && adminAuth.token, 'I4C Super Admin authenticated');
  assert(adminAuth.user.role === 'SYSTEM_ADMIN' || adminAuth.user.role === 'SUPER_ADMIN', 'Role is SYSTEM_ADMIN');

  const adminCasesRes = await api('/api/cases', { token: adminAuth.token });
  assert(adminCasesRes.status === 200, 'Super Admin retrieved national case database');
  const adminFoundCase = adminCasesRes.body?.cases?.find(c => c.case_number === createdCase.case_number);
  assert(adminFoundCase !== undefined, 'Super Admin can observe the complaint and entire lifecycle');
  assert(adminFoundCase?.status === 'FROZEN', 'Super Admin sees case status as FROZEN');

  console.log('\n================================================================');
  console.log(`  E2E FLOW RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runE2EFlow().catch((err) => {
  console.error('Fatal E2E error:', err);
  process.exit(1);
});
