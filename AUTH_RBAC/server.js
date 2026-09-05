const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files from local frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

const PORT = process.env.PORT || 5000;

// Shared In-Memory State for Prototype Evaluation with all 7 Personas
const memoryDB = {
  users: [
    { id: 1, name: 'Central Nodal Officer (I4C)', email: 'admin@i4c.gov.in', role_id: 5, role_name: 'SUPER_ADMIN', workspace_id: 3, vasp_id: null },
    { id: 2, name: 'Officer Sharma (MH Cyber)', email: 'senior.sharma@mhcyber.gov.in', role_id: 3, role_name: 'SENIOR_INVESTIGATOR', workspace_id: 1, vasp_id: null },
    { id: 3, name: 'Sub-Inspector Patil', email: 'officer.patil@mhcyber.gov.in', role_id: 2, role_name: 'NORMAL_INVESTIGATOR', workspace_id: 1, vasp_id: null },
    { id: 4, name: 'SP Deshmukh (MH Unit Lead)', email: 'sp.deshmukh@mhcyber.gov.in', role_id: 4, role_name: 'WORKSPACE_ADMIN', workspace_id: 1, vasp_id: null },
    { id: 5, name: 'Rajesh Verma (Victim)', email: 'victim.verma@gmail.com', role_id: 1, role_name: 'VICTIM', workspace_id: null, vasp_id: null },
    { id: 6, name: 'Binance Compliance Lead', email: 'legal@binance.com', role_id: 6, role_name: 'EXCHANGE_NODAL_OFFICER', workspace_id: null, vasp_id: 1, vasp_name: 'Binance International' },
    { id: 7, name: 'Justice K. S. Rao (Judiciary)', email: 'judge.rao@ecourts.gov.in', role_id: 7, role_name: 'AUDITOR', workspace_id: null, vasp_id: null }
  ],
  workspaces: [
    { id: 1, name: 'Maharashtra Cyber Unit', state: 'Maharashtra', jurisdiction_code: 'MH-CYBER-01' },
    { id: 2, name: 'Delhi Police Cyber Hub', state: 'Delhi', jurisdiction_code: 'DL-CYBER-02' },
    { id: 3, name: 'National Central Hub (I4C)', state: 'Central', jurisdiction_code: 'IN-I4C-00' }
  ],
  vasps: [
    { id: 1, name: 'Binance International', code: 'BINANCE', contact_email: 'compliance@binance.com' },
    { id: 2, name: 'WazirX India', code: 'WAZIRX', contact_email: 'legal@wazirx.com' },
    { id: 3, name: 'CoinDCX', code: 'COINDCX', contact_email: 'nodal@coindcx.com' }
  ],
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
  ],
  police_officers: [
    { id: 3, name: 'Sub-Inspector Patil', badge: 'MH-9021', activeCases: 4, status: 'ACTIVE' },
    { id: 8, name: 'Sub-Inspector Jadhav', badge: 'MH-9044', activeCases: 2, status: 'ACTIVE' }
  ],
  wallet_traces: [],
  freeze_requests: [],
  evidence_anchors: []
};

// Set default active identity (Officer Sharma - Senior Investigator)
app.set('currentUser', memoryDB.users[1]);
app.set('memoryDB', memoryDB);

// Import Middlewares from local directory
const { requireRole } = require('./middleware/rbac');
const { filterCasesByScope } = require('./middleware/abac');

// ----------------------------------------------------------------------------
// 1. AUTH & PERSONA SWITCHING
// ----------------------------------------------------------------------------
app.get('/api/auth/current-user', (req, res) => {
  res.json({ user: app.get('currentUser') });
});

app.post('/api/auth/switch-role', (req, res) => {
  const { roleName } = req.body;
  const targetUser = memoryDB.users.find(u => u.role_name === roleName);
  if (!targetUser) return res.status(404).json({ error: 'Role identity not found' });

  app.set('currentUser', targetUser);
  res.json({ message: `Switched active persona to ${targetUser.name}`, user: targetUser });
});

// ----------------------------------------------------------------------------
// 2. CASES & VICTIM ACTIONS (Scope-Filtered via ABAC)
// ----------------------------------------------------------------------------
app.get('/api/cases', (req, res) => {
  const currentUser = app.get('currentUser');
  const scopedCases = filterCasesByScope(currentUser, memoryDB.cases);
  res.json({
    role: currentUser.role_name,
    workspace_id: currentUser.workspace_id,
    cases: scopedCases
  });
});

app.post('/api/cases', requireRole(['VICTIM', 'SUPER_ADMIN']), (req, res) => {
  const currentUser = app.get('currentUser');
  const { suspect_wallet_address, blockchain_network, loss_amount_inr, crime_type, tx_hash } = req.body;

  const newCase = {
    id: memoryDB.cases.length + 1,
    case_number: `MH-CYBER-2026-0${memoryDB.cases.length + 843}`,
    victim_id: currentUser.id,
    workspace_id: 1,
    assigned_investigator_id: 3,
    suspect_wallet_address: suspect_wallet_address || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    blockchain_network: blockchain_network || 'Ethereum',
    loss_amount_inr: parseFloat(loss_amount_inr || 450000),
    crime_type: crime_type || 'Task-based Investment Scam',
    target_vasp: 'Binance International',
    vasp_id: 1,
    status: 'PENDING_TRACING',
    tx_hashes: tx_hash ? [tx_hash] : ['0x5f2e...91a4'],
    created_at: new Date().toISOString()
  };

  memoryDB.cases.unshift(newCase);
  res.status(201).json({ message: 'Complaint registered successfully', case: newCase });
});

app.post('/api/cases/upload-tx', requireRole(['VICTIM', 'SUPER_ADMIN']), (req, res) => {
  const { tx_hash } = req.body;
  res.json({ message: `Transaction hash ${tx_hash || '0x992b...fa31'} successfully uploaded and linked to case evidence dossier.` });
});

// ----------------------------------------------------------------------------
// 3. INVESTIGATION & FORENSICS (Normal & Senior Investigators)
// ----------------------------------------------------------------------------
app.post('/api/trace/run', requireRole(['NORMAL_INVESTIGATOR', 'SENIOR_INVESTIGATOR', 'WORKSPACE_ADMIN', 'SUPER_ADMIN']), (req, res) => {
  const { case_id } = req.body;
  const targetCase = memoryDB.cases.find(c => c.id === parseInt(case_id || 1));
  if (!targetCase) return res.status(404).json({ error: 'Case not found' });

  const trace = {
    id: memoryDB.wallet_traces.length + 1,
    case_id: targetCase.id,
    input_wallet: targetCase.suspect_wallet_address,
    detected_vasp: 'Binance International',
    vasp_id: 1,
    layering_hops: 3,
    risk_score: 94,
    risk_category: 'CRITICAL',
    graph_nodes: 14,
    peeling_chains_detected: 2
  };

  targetCase.status = 'TRACED';
  memoryDB.wallet_traces.push(trace);
  res.json({ message: 'Automated blockchain graph trace complete! Identified VASP: Binance International', trace });
});

app.get('/api/trace/vasp-attribution', requireRole(['NORMAL_INVESTIGATOR', 'SENIOR_INVESTIGATOR', 'WORKSPACE_ADMIN', 'SUPER_ADMIN']), (req, res) => {
  res.json({
    identified_vasp: 'Binance International (Hot Wallet Sweep #4)',
    deposit_address: '0x32Be343B94f860124dC4fEe278FDCBD38C102D88',
    confidence: '99.4%',
    fiu_ind_registered: false
  });
});

app.post('/api/freeze/draft', requireRole(['NORMAL_INVESTIGATOR', 'SENIOR_INVESTIGATOR', 'WORKSPACE_ADMIN', 'SUPER_ADMIN']), (req, res) => {
  const { case_id, freeze_reason } = req.body;
  const targetCase = memoryDB.cases.find(c => c.id === parseInt(case_id || 1));
  if (targetCase) targetCase.status = 'FREEZE_DRAFTED';

  const freezeNotice = {
    id: memoryDB.freeze_requests.length + 1,
    case_id: case_id || 1,
    vasp_name: 'Binance International',
    drafted_by: app.get('currentUser').name,
    bnss_section: 'Sec 94 BNSS / 91 CrPC',
    freeze_reason: freeze_reason || 'Urgent asset preservation under statutory law',
    status: 'DRAFTED',
    timestamp: new Date().toISOString()
  };

  memoryDB.freeze_requests.push(freezeNotice);
  res.status(201).json({ message: 'Freeze notice drafted under Sec 94 BNSS', freezeNotice });
});

app.post('/api/trace/cross-chain', requireRole(['SENIOR_INVESTIGATOR', 'SUPER_ADMIN']), (req, res) => {
  res.json({
    message: 'Cross-chain bridge traversal complete.',
    hops: [
      { from: 'Ethereum', to: 'Polygon Bridge', contract: '0xA0c68C638235ee3E0433604b8071093ac6', amount: '2.5 ETH' },
      { from: 'Polygon', to: 'TRON via Swapper', contract: '0x111111125421cA6dc452d289314280a0f8842A65', amount: '7,450 USDT' }
    ],
    terminal_vasp: 'Binance International'
  });
});

app.post('/api/freeze/approve', requireRole(['SENIOR_INVESTIGATOR', 'SUPER_ADMIN']), (req, res) => {
  if (memoryDB.cases.length > 0) memoryDB.cases[0].status = 'FREEZE_APPROVED';

  const anchor = {
    id: memoryDB.evidence_anchors.length + 1,
    pdf_hash: '0xa7f83e2b9c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f',
    smart_contract_tx_hash: '0x0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e',
    anchored_by: app.get('currentUser').name,
    block_number: 19842104,
    timestamp: new Date().toISOString()
  };

  memoryDB.evidence_anchors.push(anchor);
  res.json({ message: 'Statutory freeze order approved and evidence SHA-256 anchored on-chain!', anchor });
});

// ----------------------------------------------------------------------------
// 4. POLICE UNIT ADMINISTRATION (WORKSPACE ADMIN & SUPER ADMIN)
// ----------------------------------------------------------------------------
app.post('/api/police/accounts', requireRole(['WORKSPACE_ADMIN', 'SUPER_ADMIN']), (req, res) => {
  const { officer_name, badge } = req.body;
  const newOfficer = {
    id: memoryDB.police_officers.length + 10,
    name: officer_name || 'Inspector Kulkarni',
    badge: badge || 'MH-9088',
    activeCases: 0,
    status: 'ACTIVE'
  };
  memoryDB.police_officers.push(newOfficer);
  res.json({ message: `Officer ${newOfficer.name} (${newOfficer.badge}) onboarded to unit.`, officer: newOfficer });
});

app.post('/api/police/assign-case', requireRole(['WORKSPACE_ADMIN', 'SUPER_ADMIN']), (req, res) => {
  const { case_id } = req.body;
  res.json({ message: `Case #${case_id || 'MH-CYBER-2026-0842'} reassigned to Sub-Inspector Patil (Investigator).` });
});

app.get('/api/police/workload', requireRole(['WORKSPACE_ADMIN', 'SUPER_ADMIN']), (req, res) => {
  res.json({
    totalActiveCases: memoryDB.cases.length,
    officers: memoryDB.police_officers,
    clearanceRate: '87.5%',
    avgAttributionTimeMinutes: 4.2
  });
});

// ----------------------------------------------------------------------------
// 5. SUPER ADMIN NATIONAL NODAL AUTHORITY (SUPER ADMIN ONLY)
// ----------------------------------------------------------------------------
app.post('/api/workspaces/create', requireRole(['SUPER_ADMIN']), (req, res) => {
  const { name, state, jurisdiction_code } = req.body;
  const newWorkspace = {
    id: memoryDB.workspaces.length + 1,
    name: name || 'Karnataka Cyber Taskforce',
    state: state || 'Karnataka',
    jurisdiction_code: jurisdiction_code || 'KA-CYBER-03'
  };
  memoryDB.workspaces.push(newWorkspace);
  res.status(201).json({ message: 'New state workspace created successfully', workspace: newWorkspace });
});

app.get('/api/admin/trends', requireRole(['SUPER_ADMIN']), (req, res) => {
  res.json({
    national_volume_inr: '₹142.8 Crore',
    top_fraud_types: ['Pig Butchering / Task Fraud (61%)', 'Fake Exchange Phishing (22%)', 'DEX Rugpulls (17%)'],
    top_destinations: ['Binance (54%)', 'Huobi/HTX (21%)', 'OKX (15%)', 'WazirX (10%)']
  });
});

app.post('/api/admin/config-keys', requireRole(['SUPER_ADMIN']), (req, res) => {
  res.json({ message: 'Global Alchemy RPC & NCRP API Gateway keys rotated and synchronized across nodes.' });
});

app.post('/api/admin/lockdown', requireRole(['SUPER_ADMIN']), (req, res) => {
  res.json({ message: 'EMERGENCY LOCKDOWN TRIGGERED: All external RPC nodes suspended & state workspaces isolated.' });
});

// ----------------------------------------------------------------------------
// 6. EXCHANGE NODAL OFFICER PORTAL (VASP ONLY)
// ----------------------------------------------------------------------------
app.post('/api/exchange/confirm-freeze', requireRole(['EXCHANGE_NODAL_OFFICER', 'SUPER_ADMIN']), (req, res) => {
  res.json({
    message: 'Deposit account freeze confirmed under Sec 94 BNSS statutory notice.',
    frozen_account: 'UID-88319204 (Binance)',
    frozen_amount_usdt: '5,340 USDT',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/exchange/upload-kyc', requireRole(['EXCHANGE_NODAL_OFFICER', 'SUPER_ADMIN']), (req, res) => {
  res.json({
    message: 'Encrypted KYC dossier uploaded for Law Enforcement Agency inspection.',
    kyc_summary: {
      account_holder: 'A. K. Sharma (Mule)',
      pan: 'ABCDE1234F',
      ip_login: '103.21.144.9 (Mumbai, India)',
      bank_account: 'HDFC Bank - 50100293819'
    }
  });
});

// ----------------------------------------------------------------------------
// 7. AUDITOR & JUDICIAL VERIFICATION (READ-ONLY)
// ----------------------------------------------------------------------------
app.post('/api/audit/verify-hash', requireRole(['AUDITOR', 'SENIOR_INVESTIGATOR', 'SUPER_ADMIN']), (req, res) => {
  res.json({
    status: 'VERIFIED_AUTHENTIC',
    document: 'Court Evidence Dossier Section 65B BSA',
    sha256_hash: '0xa7f83e2b9c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f',
    smart_contract_block: 19842104,
    smart_contract_tx: '0x0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e',
    tamper_status: 'UNMODIFIED - 100% Tamper Evident Match'
  });
});

app.listen(PORT, () => {
  console.log(`AUTH_RBAC standalone server running on http://localhost:${PORT}`);
});
