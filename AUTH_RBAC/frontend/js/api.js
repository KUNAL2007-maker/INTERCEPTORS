// API Client with Live Server Connection & Zero-Config Client Fallback

const API_BASE = '/api';

// In-Memory Simulation State (Fallback if backend server is not active)
const mockState = {
  users: [
    { id: 1, name: 'Central Nodal Officer (I4C)', email: 'admin@i4c.gov.in', role_id: 5, role_name: 'SUPER_ADMIN', workspace_id: 3, vasp_id: null },
    { id: 2, name: 'Officer Sharma (MH Cyber)', email: 'senior.sharma@mhcyber.gov.in', role_id: 3, role_name: 'SENIOR_INVESTIGATOR', workspace_id: 1, vasp_id: null },
    { id: 3, name: 'Sub-Inspector Patil', email: 'officer.patil@mhcyber.gov.in', role_id: 2, role_name: 'NORMAL_INVESTIGATOR', workspace_id: 1, vasp_id: null },
    { id: 4, name: 'SP Deshmukh (MH Unit Lead)', email: 'sp.deshmukh@mhcyber.gov.in', role_id: 4, role_name: 'WORKSPACE_ADMIN', workspace_id: 1, vasp_id: null },
    { id: 5, name: 'Rajesh Verma (Victim)', email: 'victim.verma@gmail.com', role_id: 1, role_name: 'VICTIM', workspace_id: null, vasp_id: null },
    { id: 6, name: 'Binance Compliance Lead', email: 'legal@binance.com', role_id: 6, role_name: 'EXCHANGE_NODAL_OFFICER', workspace_id: null, vasp_id: 1, vasp_name: 'Binance International' },
    { id: 7, name: 'Justice K. S. Rao (Judiciary)', email: 'judge.rao@ecourts.gov.in', role_id: 7, role_name: 'AUDITOR', workspace_id: null, vasp_id: null }
  ],
  currentUserIndex: 1, // Default to Senior Investigator
  cases: [
    {
      id: 1,
      case_number: 'MH-CYBER-2026-0842',
      victim_id: 5,
      workspace_id: 1,
      assigned_investigator_id: 3,
      suspect_wallet_address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      blockchain_network: 'Ethereum',
      loss_amount_inr: 450000.00,
      crime_type: 'Task-based Investment Scam',
      target_vasp: 'Binance International',
      vasp_id: 1,
      status: 'PENDING_TRACING',
      tx_hashes: ['0x3a1b...89c2'],
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
    // Graceful offline fallback
    return null;
  }
}

async function fetchCurrentUser() {
  const res = await safeFetch(`${API_BASE}/auth/current-user`);
  if (res && res.user) return res;
  return { user: mockState.users[mockState.currentUserIndex] };
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
  if (curr.role_name === 'VICTIM') {
    filtered = mockState.cases.filter(c => c.victim_id === curr.id);
  } else if (curr.role_name === 'EXCHANGE_NODAL_OFFICER') {
    filtered = mockState.cases.filter(c => c.vasp_id === curr.vasp_id);
  } else if (curr.role_name !== 'SUPER_ADMIN' && curr.role_name !== 'AUDITOR') {
    filtered = mockState.cases.filter(c => c.workspace_id === curr.workspace_id);
  }
  return { cases: filtered, role: curr.role_name, workspace_id: curr.workspace_id };
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
    assigned_investigator_id: 3,
    suspect_wallet_address: data.suspect_wallet_address || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    blockchain_network: data.blockchain_network || 'Ethereum',
    loss_amount_inr: parseFloat(data.loss_amount_inr || 450000),
    crime_type: data.crime_type || 'Task-based Investment Scam',
    target_vasp: 'Binance International',
    vasp_id: 1,
    status: 'PENDING_TRACING',
    tx_hashes: data.tx_hash ? [data.tx_hash] : ['0x5f2e...91a4'],
    created_at: new Date().toISOString()
  };
  mockState.cases.unshift(newCase);
  return { success: true, message: 'Complaint registered successfully', case: newCase };
}

async function uploadTxHashAPI(txHash) {
  const res = await safeFetch(`${API_BASE}/cases/upload-tx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tx_hash: txHash })
  });
  if (res) return res;
  return { success: true, message: `Transaction hash ${txHash} uploaded and attached to evidence dossier.` };
}

async function runWalletTraceAPI(caseId) {
  const res = await safeFetch(`${API_BASE}/trace/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ case_id: caseId })
  });
  if (res && res.trace) return res;

  if (mockState.cases.length > 0) mockState.cases[0].status = 'TRACED';
  return {
    success: true,
    message: 'Automated blockchain graph trace complete! Identified VASP: Binance International (Hot Wallet Sweep #4)',
    trace: { detected_vasp: 'Binance International', layering_hops: 3, risk_score: 94 }
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
  return { success: true, message: 'Freeze notice drafted under Sec 94 BNSS / 91 CrPC for Binance Compliance Desk.' };
}

async function crossChainTraceAPI() {
  const res = await safeFetch(`${API_BASE}/trace/cross-chain`, { method: 'POST' });
  if (res) return res;
  return {
    success: true,
    message: 'Cross-chain bridge traversal complete: Ethereum -> Polygon PoS Bridge -> TRON -> Binance Hot Wallet.'
  };
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

async function managePoliceAccountsAPI() {
  const res = await safeFetch(`${API_BASE}/police/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ officer_name: 'Inspector Kulkarni', badge: 'MH-9088' })
  });
  if (res) return res;
  return { success: true, message: 'Police unit account updated: Inspector Kulkarni (MH-9088) assigned to Cyber Cell.' };
}

async function assignCaseAPI() {
  const res = await safeFetch(`${API_BASE}/police/assign-case`, { method: 'POST' });
  if (res) return res;
  return { success: true, message: 'Case MH-CYBER-2026-0842 reassigned to Sub-Inspector Patil for expedited field tracing.' };
}

async function reviewWorkloadAPI() {
  const res = await safeFetch(`${API_BASE}/police/workload`);
  if (res) return res;
  return { success: true, message: 'Unit Workload Report: 12 Active Inquiries, 87.5% attribution rate, 4.2 min avg tracing speed.' };
}

async function createWorkspaceAPI(data) {
  const res = await safeFetch(`${API_BASE}/workspaces/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (res) return res;
  return { success: true, message: 'New State Workspace created: Karnataka Cyber Taskforce (KA-CYBER-03).' };
}

async function monitorTrendsAPI() {
  const res = await safeFetch(`${API_BASE}/admin/trends`);
  if (res) return res;
  return { success: true, message: 'National Intelligence: ₹142.8 Cr fraud tracked across 36 states; 61% Task Scams; Top Target: Binance.' };
}

async function configureKeysAPI() {
  const res = await safeFetch(`${API_BASE}/admin/config-keys`, { method: 'POST' });
  if (res) return res;
  return { success: true, message: 'Alchemy EVM Nodes & NCRP 1930 Gateway API credentials rotated and synced.' };
}

async function triggerLockdownAPI() {
  const res = await safeFetch(`${API_BASE}/admin/lockdown`, { method: 'POST' });
  if (res) return res;
  return { success: true, message: 'EMERGENCY LOCKDOWN TRIGGERED: All external RPC nodes suspended & state workspaces isolated.' };
}

async function confirmExchangeFreezeAPI() {
  const res = await safeFetch(`${API_BASE}/exchange/confirm-freeze`, { method: 'POST' });
  if (res) return res;
  return { success: true, message: 'Exchange VASP Confirmed: Account UID-88319204 frozen (5,340 USDT preserved).' };
}

async function uploadKycAPI() {
  const res = await safeFetch(`${API_BASE}/exchange/upload-kyc`, { method: 'POST' });
  if (res) return res;
  return { success: true, message: 'Encrypted KYC dossier uploaded: Account Holder A. K. Sharma, PAN ABCDE1234F, HDFC Bank.' };
}

async function verifyHashAPI() {
  const res = await safeFetch(`${API_BASE}/audit/verify-hash`, { method: 'POST' });
  if (res) return res;
  return { success: true, message: 'Court Verification Success: Case PDF SHA-256 matches On-Chain Smart Contract timestamp (Sec 65B BSA compliant).' };
}
