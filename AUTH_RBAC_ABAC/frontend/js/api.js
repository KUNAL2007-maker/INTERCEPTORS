// API Client with Live Server Connection & Zero-Config Client Fallback

const API_BASE = '/api';

// In-Memory Simulation State with Multi-Tenant ABAC Attributes
const mockState = {
  users: [
    {
      id: 1,
      name: 'Central Nodal Officer (I4C)',
      email: 'admin@i4c.gov.in',
      role_id: 5,
      role_name: 'SUPER_ADMIN',
      workspace_id: 3,
      jurisdiction_code: 'IN-I4C-00',
      clearance_level: 'TOP_SECRET',
      is_gazetted: true,
      vasp_id: null
    },
    {
      id: 2,
      name: 'Officer Sharma (MH Cyber)',
      email: 'senior.sharma@mhcyber.gov.in',
      role_id: 3,
      role_name: 'SENIOR_INVESTIGATOR',
      workspace_id: 1,
      jurisdiction_code: 'MH-CYBER-01',
      clearance_level: 'CONFIDENTIAL',
      is_gazetted: true,
      vasp_id: null
    },
    {
      id: 3,
      name: 'Sub-Inspector Patil',
      email: 'officer.patil@mhcyber.gov.in',
      role_id: 2,
      role_name: 'NORMAL_INVESTIGATOR',
      workspace_id: 1,
      jurisdiction_code: 'MH-CYBER-01',
      clearance_level: 'RESTRICTED',
      is_gazetted: false,
      vasp_id: null
    },
    {
      id: 4,
      name: 'SP Deshmukh (MH Unit Lead)',
      email: 'sp.deshmukh@mhcyber.gov.in',
      role_id: 4,
      role_name: 'WORKSPACE_ADMIN',
      workspace_id: 1,
      jurisdiction_code: 'MH-CYBER-01',
      clearance_level: 'CONFIDENTIAL',
      is_gazetted: true,
      vasp_id: null
    },
    {
      id: 5,
      name: 'Rajesh Verma (Victim)',
      email: 'victim.verma@gmail.com',
      role_id: 1,
      role_name: 'VICTIM',
      workspace_id: null,
      jurisdiction_code: null,
      clearance_level: 'PUBLIC',
      is_gazetted: false,
      vasp_id: null
    },
    {
      id: 6,
      name: 'Binance Compliance Lead',
      email: 'legal@binance.com',
      role_id: 6,
      role_name: 'EXCHANGE_NODAL_OFFICER',
      workspace_id: null,
      jurisdiction_code: null,
      clearance_level: 'VASP_EXTERNAL',
      is_gazetted: false,
      vasp_id: 1,
      vasp_name: 'Binance International'
    },
    {
      id: 7,
      name: 'Justice K. S. Rao (Judiciary)',
      email: 'judge.rao@ecourts.gov.in',
      role_id: 7,
      role_name: 'AUDITOR',
      workspace_id: null,
      jurisdiction_code: 'IN-JUDICIAL-00',
      clearance_level: 'CONFIDENTIAL',
      is_gazetted: true,
      vasp_id: null
    }
  ],
  currentUserIndex: 1, // Default to Senior Investigator
  systemEnvironment: {
    isEmergencyLockdown: false
  },
  cases: [
    {
      id: 1,
      case_number: 'MH-CYBER-2026-0842',
      victim_id: 5,
      workspace_id: 1,
      jurisdiction_code: 'MH-CYBER-01',
      assigned_investigator_id: 3,
      suspect_wallet_address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      blockchain_network: 'Ethereum',
      loss_amount_inr: 450000.00,
      crime_type: 'Task-based Investment Scam',
      target_vasp: 'Binance International',
      vasp_id: 1,
      classification: 'CONFIDENTIAL',
      status: 'TRACED',
      tx_hashes: ['0x3a1b...89c2'],
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      case_number: 'DL-CYBER-2026-0319',
      victim_id: 99,
      workspace_id: 2,
      jurisdiction_code: 'DL-CYBER-02',
      assigned_investigator_id: 12,
      suspect_wallet_address: '0x1928aBc849102c98Dfe10293bC8419280918234A',
      blockchain_network: 'Polygon',
      loss_amount_inr: 8500000.00,
      crime_type: 'Fake Crypto Exchange Phishing',
      target_vasp: 'WazirX India',
      vasp_id: 2,
      classification: 'RESTRICTED',
      status: 'PENDING_TRACING',
      tx_hashes: ['0x992a...bb14'],
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      case_number: 'IN-I4C-2026-9901',
      victim_id: 5,
      workspace_id: 3,
      jurisdiction_code: 'IN-I4C-00',
      assigned_investigator_id: 1,
      suspect_wallet_address: '0x55aa33bb110022cc44dd99ee88ff77aa66bb55cc',
      blockchain_network: 'TRON',
      loss_amount_inr: 125000000.00,
      crime_type: 'Cross-Border Syndicate Laundering',
      target_vasp: 'Binance International',
      vasp_id: 1,
      classification: 'TOP_SECRET',
      status: 'TRACED',
      tx_hashes: ['0xcc77...11aa'],
      created_at: new Date().toISOString()
    }
  ]
};

async function safeFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      return { success: false, ...err };
    }
    const data = await res.json();
    return { success: true, ...data };
  } catch (err) {
    return null;
  }
}

async function fetchCurrentUser() {
  const res = await safeFetch(`${API_BASE}/auth/current-user`);
  if (res && res.user) return res;
  return {
    user: mockState.users[mockState.currentUserIndex],
    environment: mockState.systemEnvironment
  };
}

async function switchRoleAPI(roleName) {
  const res = await safeFetch(`${API_BASE}/auth/switch-role`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roleName })
  });
  if (res && res.user) return res;

  const idx = mockState.users.findIndex(u => u.role_name === roleName);
  if (idx !== -1) {
    mockState.currentUserIndex = idx;
    return { success: true, user: mockState.users[idx], message: `Switched persona to ${mockState.users[idx].name}` };
  }
  return { success: false, error: 'Role not found' };
}

async function fetchCasesAPI() {
  const res = await safeFetch(`${API_BASE}/cases`);
  if (res && res.cases) return res;

  const curr = mockState.users[mockState.currentUserIndex];
  let filtered = mockState.cases;

  // ABAC in-memory evaluation
  if (mockState.systemEnvironment.isEmergencyLockdown && curr.role_name !== 'SUPER_ADMIN') {
    return { cases: [], role: curr.role_name, totalCasesInDb: mockState.cases.length, isLockedDown: true };
  }

  if (curr.role_name === 'VICTIM') {
    filtered = mockState.cases.filter(c => c.victim_id === curr.id && c.classification !== 'TOP_SECRET');
  } else if (curr.role_name === 'EXCHANGE_NODAL_OFFICER') {
    filtered = mockState.cases.filter(c => c.vasp_id === curr.vasp_id);
  } else if (curr.role_name !== 'SUPER_ADMIN' && curr.role_name !== 'AUDITOR') {
    filtered = mockState.cases.filter(c => c.workspace_id === curr.workspace_id && c.classification !== 'TOP_SECRET');
  }

  return {
    cases: filtered,
    role: curr.role_name,
    workspace_id: curr.workspace_id,
    jurisdiction: curr.jurisdiction_code,
    totalCasesInDb: mockState.cases.length
  };
}

async function submitFraudComplaintAPI(data) {
  const res = await safeFetch(`${API_BASE}/cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (res && res.case) return res;

  const curr = mockState.users[mockState.currentUserIndex];
  const newCase = {
    id: mockState.cases.length + 1,
    case_number: `MH-CYBER-2026-0${mockState.cases.length + 843}`,
    victim_id: curr.id,
    workspace_id: 1,
    jurisdiction_code: 'MH-CYBER-01',
    assigned_investigator_id: 3,
    suspect_wallet_address: data.suspect_wallet_address || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    blockchain_network: data.blockchain_network || 'Ethereum',
    loss_amount_inr: parseFloat(data.loss_amount_inr || 450000),
    crime_type: data.crime_type || 'Task-based Investment Scam',
    target_vasp: 'Binance International',
    vasp_id: 1,
    classification: 'CONFIDENTIAL',
    status: 'PENDING_TRACING',
    tx_hashes: data.tx_hash ? [data.tx_hash] : ['0x5f2e...91a4'],
    created_at: new Date().toISOString()
  };
  mockState.cases.unshift(newCase);
  return { success: true, message: 'Complaint registered successfully under victim scope', case: newCase };
}

async function uploadTxHashAPI(txHash) {
  const res = await safeFetch(`${API_BASE}/cases/upload-tx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tx_hash: txHash })
  });
  if (res) return res;
  return { success: true, message: `Transaction hash ${txHash} uploaded and linked to case evidence.` };
}

async function runWalletTraceAPI(caseId) {
  const res = await safeFetch(`${API_BASE}/trace/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ case_id: caseId })
  });
  if (res && res.case) return res;

  if (mockState.cases.length > 0) mockState.cases[0].status = 'TRACED';
  return {
    success: true,
    message: 'Automated blockchain graph trace complete! Identified VASP: Binance International',
    case: mockState.cases[0]
  };
}

async function draftFreezeRequestAPI(caseId, reason) {
  const res = await safeFetch(`${API_BASE}/freeze/draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ case_id: caseId, freeze_reason: reason })
  });
  if (res) return res;

  if (mockState.cases.length > 0) mockState.cases[0].status = 'FREEZE_DRAFTED';
  return { success: true, message: 'Freeze notice drafted under Sec 94 BNSS / 91 CrPC.' };
}

async function crossChainTraceAPI() {
  const res = await safeFetch(`${API_BASE}/trace/cross-chain`, { method: 'POST' });
  if (res) return res;
  return { success: true, message: 'Cross-chain bridge traversal complete: Ethereum -> Polygon -> TRON -> Binance.' };
}

async function approveAndAnchorAPI() {
  const res = await safeFetch(`${API_BASE}/freeze/approve`, { method: 'POST' });
  if (res) return res;

  if (mockState.cases.length > 0) mockState.cases[0].status = 'FREEZE_APPROVED';
  return {
    success: true,
    message: 'Statutory freeze order approved! SHA-256 evidence hash anchored to Smart Contract block #19842104.'
  };
}

async function evaluateAbacAPI(caseId, action, roleOverride) {
  const res = await safeFetch(`${API_BASE}/abac/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ case_id: caseId, action, role_override: roleOverride })
  });
  if (res && res.decision) return res;

  // Local fallback simulator logic
  const curr = roleOverride ? mockState.users.find(u => u.role_name === roleOverride) : mockState.users[mockState.currentUserIndex];
  const targetCase = mockState.cases.find(c => c.id === parseInt(case_id)) || mockState.cases[0];

  let allowed = true;
  let reason = 'Access permitted by all ABAC evaluated attributes.';
  let policyId = 'ALL_CLEAR';

  if (mockState.systemEnvironment.isEmergencyLockdown && curr.role_name !== 'SUPER_ADMIN') {
    allowed = false;
    policyId = 'POL-01-EMERGENCY-LOCKDOWN';
    reason = 'Emergency Platform Lockdown is ACTIVE. All state operations suspended.';
  } else if (curr.role_name === 'AUDITOR' && ['APPROVE_FREEZE', 'DRAFT_FREEZE', 'RUN_TRACE'].includes(action)) {
    allowed = false;
    policyId = 'POL-02-JUDICIAL-READ-ONLY';
    reason = 'Auditor role has strict read-only access (0 write/execution permissions).';
  } else if (curr.role_name === 'VICTIM' && targetCase.victim_id !== curr.id) {
    allowed = false;
    policyId = 'POL-03-VICTIM-ISOLATION';
    reason = `Victim Ownership Mismatch: User ID #${curr.id} cannot access case file belonging to Victim #${targetCase.victim_id}.`;
  } else if (['NORMAL_INVESTIGATOR', 'SENIOR_INVESTIGATOR', 'WORKSPACE_ADMIN'].includes(curr.role_name) && targetCase.workspace_id !== curr.workspace_id) {
    allowed = false;
    policyId = 'POL-04-JURISDICTION-BOUNDARY';
    reason = `Jurisdictional Boundary Violation: Officer is stationed at Workspace #${curr.workspace_id} (${curr.jurisdiction_code}), but case is in Workspace #${targetCase.workspace_id}.`;
  } else if (action === 'APPROVE_FREEZE' && curr.role_name !== 'SENIOR_INVESTIGATOR' && curr.role_name !== 'SUPER_ADMIN') {
    allowed = false;
    policyId = 'POL-05-STATUTORY-FREEZE-APPROVAL';
    reason = 'Statutory Authority Missing: Under Sec 94 BNSS, statutory freeze orders require Gazetted Senior rank.';
  } else if (curr.role_name === 'EXCHANGE_NODAL_OFFICER' && targetCase.vasp_id !== curr.vasp_id) {
    allowed = false;
    policyId = 'POL-06-VASP-DESK-ISOLATION';
    reason = `VASP Boundary Mismatch: Officer represents VASP #${curr.vasp_id}, but case target is VASP #${targetCase.vasp_id}.`;
  } else if (targetCase.classification === 'TOP_SECRET' && curr.clearance_level !== 'TOP_SECRET' && curr.role_name !== 'SUPER_ADMIN') {
    allowed = false;
    policyId = 'POL-07-DATA-CLASSIFICATION';
    reason = `Security Clearance Insufficient: Case classification is 'TOP_SECRET'. Active clearance: ${curr.clearance_level}.`;
  }

  return {
    decision: { allowed, policyId, reason },
    subject: { name: curr.name, role: curr.role_name, workspace: curr.workspace_id, clearance: curr.clearance_level, is_gazetted: curr.is_gazetted },
    resource: { case_number: targetCase.case_number, workspace: targetCase.workspace_id, jurisdiction: targetCase.jurisdiction_code, victim_id: targetCase.victim_id, vasp: targetCase.target_vasp, classification: targetCase.classification, status: targetCase.status }
  };
}

async function toggleLockdownAPI() {
  const res = await safeFetch(`${API_BASE}/abac/toggle-lockdown`, { method: 'POST' });
  if (res && res.message) return res;

  mockState.systemEnvironment.isEmergencyLockdown = !mockState.systemEnvironment.isEmergencyLockdown;
  return {
    isEmergencyLockdown: mockState.systemEnvironment.isEmergencyLockdown,
    message: mockState.systemEnvironment.isEmergencyLockdown 
      ? 'EMERGENCY LOCKDOWN ACTIVATED: All non-Super-Admin operations suspended.' 
      : 'EMERGENCY LOCKDOWN DEACTIVATED: Normal operational mode restored.'
  };
}

async function managePoliceAccountsAPI() {
  return { success: true, message: 'Police unit personnel account updated.' };
}
async function assignCaseAPI() {
  return { success: true, message: 'Case dispatched to Sub-Inspector Patil.' };
}
async function reviewWorkloadAPI() {
  return { success: true, message: 'Unit Workload Report: 12 Active Inquiries, 87.5% clearance rate.' };
}
async function createWorkspaceAPI(data) {
  return { success: true, message: 'New State Workspace created.' };
}
async function monitorTrendsAPI() {
  return { success: true, message: 'National Intelligence: ₹142.8 Cr fraud tracked across 36 states.' };
}
async function configureKeysAPI() {
  return { success: true, message: 'Alchemy EVM Nodes & NCRP Gateway API keys rotated.' };
}
async function triggerLockdownAPI() {
  return toggleLockdownAPI();
}
async function confirmExchangeFreezeAPI() {
  return { success: true, message: 'Exchange VASP Confirmed: Account frozen under Sec 94 BNSS statutory order.' };
}
async function uploadKycAPI() {
  return { success: true, message: 'Encrypted KYC dossier uploaded for LEA inspection.' };
}
async function verifyHashAPI() {
  return { success: true, message: 'Court Verification: SHA-256 matches On-Chain Smart Contract timestamp.' };
}
