/**
 * Verification Test Suite for AUTH_RBAC Module
 * Tests permissions, scopes, and role hierarchies for all 7 personas.
 */

const {
  ROLES,
  SCOPES,
  ROLE_METADATA,
  PERMISSIONS,
  hasPermission,
  filterCasesByScope
} = require('./index');

console.log('--- RUNNING AUTH_RBAC VERIFICATION TESTS ---\n');

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

// 1. Victim Role Tests
assert(hasPermission(ROLES.VICTIM, PERMISSIONS.FILE_COMPLAINT), 'Victim can file complaint');
assert(hasPermission(ROLES.VICTIM, PERMISSIONS.UPLOAD_TX_HASH), 'Victim can upload tx hash');
assert(!hasPermission(ROLES.VICTIM, PERMISSIONS.RUN_WALLET_GRAPH), 'Victim cannot run wallet graph');
assert(!hasPermission(ROLES.VICTIM, PERMISSIONS.APPROVE_FREEZE_REQUEST), 'Victim cannot approve freeze request');

// 2. Normal Investigator Tests
assert(hasPermission(ROLES.NORMAL_INVESTIGATOR, PERMISSIONS.RUN_WALLET_GRAPH), 'Normal Inv can run wallet graph');
assert(hasPermission(ROLES.NORMAL_INVESTIGATOR, PERMISSIONS.DRAFT_FREEZE_REQUEST), 'Normal Inv can draft freeze request');
assert(!hasPermission(ROLES.NORMAL_INVESTIGATOR, PERMISSIONS.APPROVE_FREEZE_REQUEST), 'Normal Inv cannot approve freeze request (Requires Senior)');

// 3. Senior Investigator Tests
assert(hasPermission(ROLES.SENIOR_INVESTIGATOR, PERMISSIONS.ADVANCED_CROSS_CHAIN_TRACE), 'Senior Inv can run cross-chain trace');
assert(hasPermission(ROLES.SENIOR_INVESTIGATOR, PERMISSIONS.APPROVE_FREEZE_REQUEST), 'Senior Inv can approve Sec 94 BNSS freeze');
assert(hasPermission(ROLES.SENIOR_INVESTIGATOR, PERMISSIONS.ANCHOR_EVIDENCE_ONCHAIN), 'Senior Inv can anchor evidence on blockchain');

// 4. Workspace Admin Tests
assert(hasPermission(ROLES.WORKSPACE_ADMIN, PERMISSIONS.MANAGE_POLICE_ACCOUNTS), 'Workspace Admin can manage police accounts');
assert(hasPermission(ROLES.WORKSPACE_ADMIN, PERMISSIONS.ASSIGN_CASES), 'Workspace Admin can assign cases');
assert(hasPermission(ROLES.WORKSPACE_ADMIN, PERMISSIONS.REVIEW_UNIT_WORKLOAD), 'Workspace Admin can review unit workload');

// 5. Super Admin Tests
assert(hasPermission(ROLES.SUPER_ADMIN, PERMISSIONS.CREATE_STATE_WORKSPACE), 'Super Admin can create state workspace');
assert(hasPermission(ROLES.SUPER_ADMIN, PERMISSIONS.EMERGENCY_LOCKDOWN), 'Super Admin can trigger emergency lockdown');

// 6. Exchange Nodal Officer Tests
assert(hasPermission(ROLES.EXCHANGE_NODAL_OFFICER, PERMISSIONS.CONFIRM_ACCOUNT_FREEZE), 'Exchange Officer can confirm account freeze');
assert(hasPermission(ROLES.EXCHANGE_NODAL_OFFICER, PERMISSIONS.SUBMIT_KYC_DOSSIER), 'Exchange Officer can submit KYC');
assert(!hasPermission(ROLES.EXCHANGE_NODAL_OFFICER, PERMISSIONS.RUN_WALLET_GRAPH), 'Exchange Officer cannot run police wallet graph');

// 7. Auditor / Judicial Tests
assert(hasPermission(ROLES.AUDITOR, PERMISSIONS.COMPARE_PDF_HASH_TIMESTAMP), 'Auditor can compare PDF hash against blockchain');
assert(!hasPermission(ROLES.AUDITOR, PERMISSIONS.FILE_COMPLAINT), 'Auditor has 0 write permissions (cannot file complaint)');
assert(!hasPermission(ROLES.AUDITOR, PERMISSIONS.DRAFT_FREEZE_REQUEST), 'Auditor has 0 write permissions (cannot draft freeze)');

// 8. ABAC Scoping Tests
const sampleCases = [
  { id: 1, victim_id: 5, workspace_id: 1, vasp_id: 1, target_vasp: 'Binance' },
  { id: 2, victim_id: 99, workspace_id: 2, vasp_id: 2, target_vasp: 'WazirX' }
];

const victimUser = { id: 5, role_name: ROLES.VICTIM };
const scopedVictimCases = filterCasesByScope(victimUser, sampleCases);
assert(scopedVictimCases.length === 1 && scopedVictimCases[0].victim_id === 5, 'ABAC: Victim sees only own case');

const superAdminUser = { id: 1, role_name: ROLES.SUPER_ADMIN };
const scopedAdminCases = filterCasesByScope(superAdminUser, sampleCases);
assert(scopedAdminCases.length === 2, 'ABAC: Super Admin has global case visibility');

console.log(`\n--- TEST SUMMARY: ${passed}/${total} TESTS PASSED ---`);
if (passed === total) {
  console.log('🎉 ALL ACCESS CONTROL CONSTRAINTS VERIFIED SUCCESSFULLY!');
} else {
  process.exit(1);
}
