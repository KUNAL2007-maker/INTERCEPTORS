/**
 * Verification Test Suite for AUTH_RBAC_ABAC Module (RBAC + ABAC)
 * Tests both Role-Based Permissions and Fine-Grained Attribute-Based Policies.
 */

const {
  ROLES,
  PERMISSIONS,
  hasPermission,
  evaluateABAC,
  filterCasesByScope,
  ABAC_POLICIES
} = require('./index');

console.log('====================================================');
console.log('--- RUNNING COMPREHENSIVE RBAC & ABAC TEST SUITE ---');
console.log('====================================================\n');

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    passed++;
    console.log(`✅ PASS: ${message}`);
  } else {
    console.error(`❌ FAIL: ${message}`);
  }
}

// ----------------------------------------------------------------------------
// PART 1: RBAC PERMISSION MATRIX TESTS
// ----------------------------------------------------------------------------
console.log('\n--- PART 1: ROLE-BASED ACCESS CONTROL (RBAC) ---');
assert(hasPermission(ROLES.VICTIM, PERMISSIONS.FILE_COMPLAINT), 'RBAC: Victim can file complaint');
assert(hasPermission(ROLES.VICTIM, PERMISSIONS.UPLOAD_TX_HASH), 'RBAC: Victim can upload tx hash');
assert(!hasPermission(ROLES.VICTIM, PERMISSIONS.RUN_WALLET_GRAPH), 'RBAC: Victim cannot run wallet graph');
assert(!hasPermission(ROLES.VICTIM, PERMISSIONS.APPROVE_FREEZE_REQUEST), 'RBAC: Victim cannot approve freeze request');

assert(hasPermission(ROLES.NORMAL_INVESTIGATOR, PERMISSIONS.RUN_WALLET_GRAPH), 'RBAC: Normal Inv can run wallet graph');
assert(hasPermission(ROLES.NORMAL_INVESTIGATOR, PERMISSIONS.DRAFT_FREEZE_REQUEST), 'RBAC: Normal Inv can draft freeze request');
assert(!hasPermission(ROLES.NORMAL_INVESTIGATOR, PERMISSIONS.APPROVE_FREEZE_REQUEST), 'RBAC: Normal Inv cannot approve freeze request (Requires Senior)');

assert(hasPermission(ROLES.SENIOR_INVESTIGATOR, PERMISSIONS.ADVANCED_CROSS_CHAIN_TRACE), 'RBAC: Senior Inv can run cross-chain trace');
assert(hasPermission(ROLES.SENIOR_INVESTIGATOR, PERMISSIONS.APPROVE_FREEZE_REQUEST), 'RBAC: Senior Inv can approve Sec 94 BNSS freeze');
assert(hasPermission(ROLES.SENIOR_INVESTIGATOR, PERMISSIONS.ANCHOR_EVIDENCE_ONCHAIN), 'RBAC: Senior Inv can anchor evidence on blockchain');

assert(hasPermission(ROLES.WORKSPACE_ADMIN, PERMISSIONS.MANAGE_POLICE_ACCOUNTS), 'RBAC: Workspace Admin can manage police accounts');
assert(hasPermission(ROLES.WORKSPACE_ADMIN, PERMISSIONS.ASSIGN_CASES), 'RBAC: Workspace Admin can assign cases');

assert(hasPermission(ROLES.SUPER_ADMIN, PERMISSIONS.CREATE_STATE_WORKSPACE), 'RBAC: Super Admin can create state workspace');
assert(hasPermission(ROLES.SUPER_ADMIN, PERMISSIONS.EMERGENCY_LOCKDOWN), 'RBAC: Super Admin can trigger emergency lockdown');

assert(hasPermission(ROLES.EXCHANGE_NODAL_OFFICER, PERMISSIONS.CONFIRM_ACCOUNT_FREEZE), 'RBAC: Exchange Officer can confirm account freeze');
assert(!hasPermission(ROLES.EXCHANGE_NODAL_OFFICER, PERMISSIONS.RUN_WALLET_GRAPH), 'RBAC: Exchange Officer cannot run police wallet graph');

assert(hasPermission(ROLES.AUDITOR, PERMISSIONS.COMPARE_PDF_HASH_TIMESTAMP), 'RBAC: Auditor can compare PDF hash against blockchain');
assert(!hasPermission(ROLES.AUDITOR, PERMISSIONS.FILE_COMPLAINT), 'RBAC: Auditor has 0 write permissions');

// ----------------------------------------------------------------------------
// PART 2: ABAC FINE-GRAINED POLICY EVALUATIONS
// ----------------------------------------------------------------------------
console.log('\n--- PART 2: ATTRIBUTE-BASED ACCESS CONTROL (ABAC) ---');

const mhCase = {
  id: 1,
  victim_id: 5,
  workspace_id: 1,
  jurisdiction_code: 'MH-CYBER-01',
  target_vasp: 'Binance',
  vasp_id: 1,
  classification: 'CONFIDENTIAL',
  status: 'TRACED'
};

const dlCase = {
  id: 2,
  victim_id: 99,
  workspace_id: 2,
  jurisdiction_code: 'DL-CYBER-02',
  target_vasp: 'WazirX',
  vasp_id: 2,
  classification: 'RESTRICTED',
  status: 'PENDING_TRACING'
};

const topSecretCaseInMh = {
  id: 3,
  victim_id: 5,
  workspace_id: 1,
  jurisdiction_code: 'MH-CYBER-01',
  target_vasp: 'Binance',
  vasp_id: 1,
  classification: 'TOP_SECRET',
  status: 'TRACED'
};

// 1. Victim Privacy Policy
const victimUser = { id: 5, role_name: ROLES.VICTIM, clearance_level: 'PUBLIC' };
const victimOwnDecision = evaluateABAC(victimUser, mhCase, 'VIEW_CASE');
assert(victimOwnDecision.allowed === true, 'ABAC Policy 3: Victim ALLOWED access to own case (ID 5)');

const victimOtherDecision = evaluateABAC(victimUser, dlCase, 'VIEW_CASE');
assert(victimOtherDecision.allowed === false && victimOtherDecision.policyId === 'POL-03-VICTIM-ISOLATION',
  'ABAC Policy 3: Victim DENIED access to another victim case (ID 99)');

// 2. Jurisdictional Boundary Policy
const mhOfficer = {
  id: 2,
  name: 'Officer Sharma',
  role_name: ROLES.SENIOR_INVESTIGATOR,
  workspace_id: 1,
  jurisdiction_code: 'MH-CYBER-01',
  clearance_level: 'CONFIDENTIAL',
  is_gazetted: true
};

const mhOfficerMhCase = evaluateABAC(mhOfficer, mhCase, 'VIEW_CASE');
assert(mhOfficerMhCase.allowed === true, 'ABAC Policy 4: MH Officer ALLOWED access to MH Unit case');

const mhOfficerDlCase = evaluateABAC(mhOfficer, dlCase, 'VIEW_CASE');
assert(mhOfficerDlCase.allowed === false && mhOfficerDlCase.policyId === 'POL-04-JURISDICTION-BOUNDARY',
  'ABAC Policy 4: MH Officer DENIED cross-border access to DL Unit case');

// 3. Statutory Freeze Approval Gate
const normalOfficer = {
  id: 3,
  name: 'SI Patil',
  role_name: ROLES.NORMAL_INVESTIGATOR,
  workspace_id: 1,
  is_gazetted: false
};

const siFreezeDecision = evaluateABAC(normalOfficer, mhCase, 'APPROVE_FREEZE');
assert(siFreezeDecision.allowed === false && siFreezeDecision.policyId === 'POL-05-STATUTORY-FREEZE-APPROVAL',
  'ABAC Policy 5: Non-Gazetted Sub-Inspector DENIED statutory freeze approval under Sec 94 BNSS');

const seniorFreezeTraced = evaluateABAC(mhOfficer, mhCase, 'APPROVE_FREEZE');
assert(seniorFreezeTraced.allowed === true, 'ABAC Policy 5: Gazetted Senior Officer ALLOWED freeze on TRACED case');

const seniorFreezePending = evaluateABAC(mhOfficer, { ...mhCase, status: 'PENDING_TRACING' }, 'APPROVE_FREEZE');
assert(seniorFreezePending.allowed === false && seniorFreezePending.policyId === 'POL-05-STATUTORY-FREEZE-APPROVAL',
  'ABAC Policy 5: Senior Officer DENIED freeze on untraced case (Must trace first)');

// 4. VASP Compliance Desk Boundary
const binanceOfficer = {
  id: 6,
  role_name: ROLES.EXCHANGE_NODAL_OFFICER,
  vasp_id: 1,
  vasp_name: 'Binance'
};

const binanceAllowed = evaluateABAC(binanceOfficer, mhCase, 'CONFIRM_FREEZE');
assert(binanceAllowed.allowed === true, 'ABAC Policy 6: Binance Officer ALLOWED access to Binance freeze notice');

const binanceBlockedOnWazirX = evaluateABAC(binanceOfficer, dlCase, 'CONFIRM_FREEZE');
assert(binanceBlockedOnWazirX.allowed === false && binanceBlockedOnWazirX.policyId === 'POL-06-VASP-DESK-ISOLATION',
  'ABAC Policy 6: Binance Officer DENIED access to WazirX freeze notice');

// 5. Security Classification Filter
const mhOfficerTopSecret = evaluateABAC(mhOfficer, topSecretCaseInMh, 'VIEW_CASE');
assert(mhOfficerTopSecret.allowed === false && mhOfficerTopSecret.policyId === 'POL-07-DATA-CLASSIFICATION',
  'ABAC Policy 7: State Officer (CONFIDENTIAL clearance) DENIED access to TOP_SECRET case');

const superAdmin = {
  id: 1,
  role_name: ROLES.SUPER_ADMIN,
  workspace_id: 3,
  clearance_level: 'TOP_SECRET',
  is_gazetted: true
};
const superAdminTopSecret = evaluateABAC(superAdmin, topSecretCaseInMh, 'VIEW_CASE');
assert(superAdminTopSecret.allowed === true, 'ABAC Policy 7: Super Admin with TOP_SECRET clearance ALLOWED');

// 6. Emergency Platform Lockdown Override
const lockdownDecision = evaluateABAC(mhOfficer, mhCase, 'VIEW_CASE', { isEmergencyLockdown: true });
assert(lockdownDecision.allowed === false && lockdownDecision.policyId === 'POL-01-EMERGENCY-LOCKDOWN',
  'ABAC Policy 1: Emergency Lockdown BLOCKS all state operations');

const superAdminInLockdown = evaluateABAC(superAdmin, mhCase, 'VIEW_CASE', { isEmergencyLockdown: true });
assert(superAdminInLockdown.allowed === true, 'ABAC Policy 1: Super Admin maintains override during Emergency Lockdown');

// 7. Auditor Strict Read-Only
const judgeUser = { id: 7, role_name: ROLES.AUDITOR };
const judgeRead = evaluateABAC(judgeUser, mhCase, 'VIEW_CASE');
assert(judgeRead.allowed === true, 'ABAC Policy 2: Auditor ALLOWED read-only inspection');

const judgeWrite = evaluateABAC(judgeUser, mhCase, 'APPROVE_FREEZE');
assert(judgeWrite.allowed === false && judgeWrite.policyId === 'POL-02-JUDICIAL-READ-ONLY',
  'ABAC Policy 2: Auditor BLOCKED from executing statutory freeze (0 write permissions)');

// 8. In-Memory Case Filtering by ABAC Scope
const allCases = [mhCase, dlCase, topSecretCaseInMh];
const filteredMhCases = filterCasesByScope(mhOfficer, allCases);
assert(filteredMhCases.length === 1 && filteredMhCases[0].id === 1,
  'ABAC Scope Filter: MH Officer sees strictly 1 non-TOP_SECRET case within MH jurisdiction');

const filteredVictimCases = filterCasesByScope(victimUser, allCases);
assert(filteredVictimCases.length === 1 && filteredVictimCases[0].id === 1,
  'ABAC Scope Filter: Victim sees strictly own non-TOP_SECRET case (ID 1)');

console.log(`\n====================================================`);
console.log(`🎉 TEST SUMMARY: ${passed}/${total} TESTS PASSED`);
console.log(`====================================================`);
if (passed === total) {
  console.log('✅ 100% RBAC & ABAC SECURITY ASSERTIONS VERIFIED SUCCESSFULLY!');
} else {
  process.exit(1);
}
