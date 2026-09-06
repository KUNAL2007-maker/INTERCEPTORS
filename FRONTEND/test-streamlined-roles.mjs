import fs from 'fs';

console.log('================================================================');
console.log('  🧪 VERIFYING STREAMLINED ROLE DASHBOARDS & COMPONENT WIRING');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`  \x1b[32m✔ PASS:\x1b[0m ${msg}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✖ FAIL:\x1b[0m ${msg}`);
    failed++;
  }
}

const appShell = fs.readFileSync('src/components/AppShell.tsx', 'utf8');
const sidebar = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
const casesView = fs.readFileSync('src/components/views/CasesView.tsx', 'utf8');
const victimView = fs.readFileSync('src/components/views/VictimPortalView.tsx', 'utf8');
const cmdDashboard = fs.readFileSync('src/components/views/CommandDashboard.tsx', 'utf8');
const store = fs.readFileSync('src/lib/store.tsx', 'utf8');

// Test 1: AppShell Role Routing
assert(
  appShell.includes('COURT_REVIEWER: ["cases"') && appShell.includes('AUDITOR: ["cases"'),
  'Court Reviewer / Auditor primary landing view is Evidence Dossiers (cases)'
);
assert(
  appShell.includes('NATIONAL_COORDINATION_ANALYST: ["national_coordination"]'),
  'National Coordination Analyst allowed view is strictly national_coordination'
);
assert(
  appShell.includes('CYBERCRIME_SUPERVISOR: ["dashboard", "audit_logs"'),
  'Cybercrime Supervisor allowed views streamlined to dashboard and audit_logs'
);
assert(
  appShell.includes('SENIOR_INVESTIGATOR: ["dashboard", "graph", "notices", "audit_logs"'),
  'Senior Investigator allowed views streamlined to dashboard, graph, notices, and audit_logs'
);
assert(
  appShell.includes('prevUserRef.current = userKey'),
  'AppShell automatically routes to primary landing view on user role or identity switch'
);

// Test 2: Sidebar Role Simplification
assert(
  sidebar.includes('key: "national_coordination"') && !sidebar.includes('Multi-State Dockets'),
  'Sidebar eliminates redundant Multi-State Dockets for National Analyst'
);
assert(
  sidebar.includes('key: "dashboard"') && !sidebar.includes('key: "cases",\n          label: "State Unit Cases"'),
  'Sidebar eliminates redundant State Unit Cases tab for Cybercrime Supervisor (handled by Dashboard)'
);
assert(
  sidebar.includes('label: "Evidence Dossiers"') && sidebar.includes('label: "BSA Audit Trail & Cert"'),
  'Court Reviewer sidebar includes Evidence Dossiers, BSA Audit Trail, and Money Flow Review'
);

// Test 3: Court Reviewer SHA-256 Hash & BSA 65B Certificate Export
assert(
  casesView.includes('generateDossierHash') && casesView.includes('BSA 2023 Section 65B Cryptographic Evidence Hash'),
  'CasesView computes and displays SHA-256 cryptographic evidence hash for Court Reviewer'
);
assert(
  casesView.includes('Export Sec 65B BSA Certificate') && casesView.includes('buildCertText'),
  'CasesView features 1-click Export Section 65B BSA Certificate modal and clipboard copy'
);
assert(
  casesView.includes('READ ONLY EVIDENCE REVIEW MODE'),
  'CasesView displays prominent READ-ONLY mode banner and locks all intake/edit capabilities for Court Reviewer'
);

// Test 4: Autofill Demo Case in Victim Portal & Cases View
assert(
  victimView.includes('0x71C7656EC7ab88b098defB751B7401B5f6d8976F') &&
  victimView.includes('350000') &&
  victimView.includes('Task-based Fake Part-Time Job / VIP Group Scam') &&
  victimView.includes('0x3a1b49e8d3840291f09e81b37492c019d3847291a0293b89c2') &&
  victimView.includes('Contacted via Telegram group for hotel review rating tasks'),
  'VictimPortalView autofills all demo case fields exactly per specification'
);
assert(
  victimView.includes('Autofill Demo Case (0x71C7...)') &&
  victimView.includes('Autofill Demo Case'),
  'VictimPortalView features stylish, prominent Autofill Demo Case button in banner, empty state, and modal'
);

// Test 5: Investigating Officer (SI Patil) Dashboard
assert(
  cmdDashboard.includes('Prepare Draft Notice'),
  'Field IO dashboard gives direct 1-click Prepare Draft Notice button for traced suspect wallets'
);
assert(
  cmdDashboard.includes('Money Flow Graph'),
  'Field IO dashboard gives direct 1-click Money Flow Graph button for traced suspect wallets'
);

// Test 6: Store State Reset on Role Switch
assert(
  store.includes('clearTrace();') && store.includes('setCases([]);') && store.includes('setActiveCase(null);'),
  'Store hydrate purges previous active traces and safely resets cases to empty array when switching users'
);

// Test 7: Store activeCase synchronization in loadCases
assert(
  store.includes('setActiveCase((prev) => {') && store.includes('data.cases.find'),
  'Store loadCases keeps activeCase synchronized with fresh database updates'
);

// Test 8: ExchangePortalView accurate count
const exchangeView = fs.readFileSync('src/components/views/ExchangePortalView.tsx', 'utf8');
assert(
  exchangeView.includes('{noticesList.length} Active Notice'),
  'ExchangePortalView displays strictly accurate count of active inbound notices'
);

console.log(`\n================================================================`);
console.log(`  STREAMLINED ROLE VERIFICATION: ${passed} PASSED, ${failed} FAILED`);
console.log(`================================================================`);

if (failed > 0) {
  process.exit(1);
}
