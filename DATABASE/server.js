const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 5000;

// PostgreSQL Connection Pool (Optional fallback to mock memory store for easy local testing)
const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'crypto_attribution',
  password: process.env.PGPASSWORD || 'postgres',
  port: process.env.PGPORT || 5432,
});

// In-Memory Data Store Seed (Fallback if PostgreSQL is not active during local demo testing)
let memoryDB = {
  roles: [
    { id: 1, name: 'VICTIM', description: 'Citizen affected by crypto fraud' },
    { id: 2, name: 'NORMAL_INVESTIGATOR', description: 'Field cyber officer conducting tracing' },
    { id: 3, name: 'SENIOR_INVESTIGATOR', description: 'Unit lead with legal approval authority' },
    { id: 4, name: 'WORKSPACE_ADMIN', description: 'Police Unit Lead (SP/DCP)' },
    { id: 5, name: 'SUPER_ADMIN', description: 'National Nodal Authority (I4C/MHA)' },
    { id: 6, name: 'EXCHANGE_NODAL_OFFICER', description: 'VASP compliance officer' },
    { id: 7, name: 'AUDITOR', description: 'Judicial / Auditor read-only role' }
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
  users: [
    { id: 1, name: 'Central Nodal Officer (I4C)', email: 'admin@i4c.gov.in', role_id: 5, role_name: 'SUPER_ADMIN', workspace_id: 3, vasp_id: null },
    { id: 2, name: 'Officer Sharma (MH Cyber)', email: 'senior.sharma@mhcyber.gov.in', role_id: 3, role_name: 'SENIOR_INVESTIGATOR', workspace_id: 1, vasp_id: null },
    { id: 3, name: 'Sub-Inspector Patil', email: 'officer.patil@mhcyber.gov.in', role_id: 2, role_name: 'NORMAL_INVESTIGATOR', workspace_id: 1, vasp_id: null },
    { id: 4, name: 'SP Deshmukh (MH Unit Lead)', email: 'sp.deshmukh@mhcyber.gov.in', role_id: 4, role_name: 'WORKSPACE_ADMIN', workspace_id: 1, vasp_id: null },
    { id: 5, name: 'Rajesh Verma (Victim)', email: 'victim.verma@gmail.com', role_id: 1, role_name: 'VICTIM', workspace_id: null, vasp_id: null },
    { id: 6, name: 'Binance Compliance Lead', email: 'legal@binance.com', role_id: 6, role_name: 'EXCHANGE_NODAL_OFFICER', workspace_id: null, vasp_id: 1 },
    { id: 7, name: 'Justice K. S. Rao', email: 'judge.rao@ecourts.gov.in', role_id: 7, role_name: 'AUDITOR', workspace_id: null, vasp_id: null }
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
      status: 'PENDING_TRACING',
      created_at: new Date().toISOString()
    }
  ],
  wallet_traces: [],
  freeze_requests: [],
  evidence_anchors: []
};

// Current Session State (Default: Senior Investigator Officer Sharma)
let currentUser = memoryDB.users[1]; // Officer Sharma (Senior Investigator)

// ----------------------------------------------------------------------------
// DUAL ACCESS CONTROL MIDDLEWARE (RBAC + ABAC)
// ----------------------------------------------------------------------------

// 1. Role-Based Access Control (RBAC Middleware)
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(currentUser.role_name)) {
      return res.status(403).json({
        error: 'Access Denied (RBAC Restriction)',
        message: `Your role '${currentUser.role_name}' is not authorized to perform this operation. Allowed roles: ${allowedRoles.join(', ')}`
      });
    }
    next();
  };
}

// 2. Attribute-Based / Scope-Based Access Control (ABAC Middleware)
function filterCasesByScope(user, casesList) {
  if (user.role_name === 'SUPER_ADMIN' || user.role_name === 'AUDITOR') {
    return casesList; // Global scope
  }
  if (user.role_name === 'VICTIM') {
    return casesList.filter(c => c.victim_id === user.id); // Strict ownership scope
  }
  if (user.role_name === 'NORMAL_INVESTIGATOR' || user.role_name === 'SENIOR_INVESTIGATOR' || user.role_name === 'WORKSPACE_ADMIN') {
    return casesList.filter(c => c.workspace_id === user.workspace_id); // State/Unit Workspace scope
  }
  if (user.role_name === 'EXCHANGE_NODAL_OFFICER') {
    // Only cases linked to their VASP
    const vaspFreezeCaseIds = memoryDB.freeze_requests
      .filter(fr => fr.vasp_id === user.vasp_id)
      .map(fr => fr.case_id);
    return casesList.filter(c => vaspFreezeCaseIds.includes(c.id));
  }
  return [];
}

// ----------------------------------------------------------------------------
// API ENDPOINTS
// ----------------------------------------------------------------------------

// Auth & Switcher Endpoints
app.get('/api/auth/current-user', (req, res) => {
  res.json({ user: currentUser });
});

app.post('/api/auth/switch-role', (req, res) => {
  const { roleName } = req.body;
  const targetUser = memoryDB.users.find(u => u.role_name === roleName);
  if (!targetUser) {
    return res.status(404).json({ error: 'Role setup identity not found' });
  }
  currentUser = targetUser;
  res.json({ message: `Switched identity to ${targetUser.name}`, user: currentUser });
});

// Case Management Endpoint (Enforces Scope-Based ABAC)
app.get('/api/cases', (req, res) => {
  const scopedCases = filterCasesByScope(currentUser, memoryDB.cases);
  res.json({
    role: currentUser.role_name,
    workspace_id: currentUser.workspace_id,
    scope_description: currentUser.role_name === 'VICTIM' 
      ? 'Restricted to personal submitted complaints'
      : (currentUser.workspace_id ? `Restricted to Workspace #${currentUser.workspace_id}` : 'Global Jurisdiction Scope'),
    cases: scopedCases
  });
});

// Victim Submit Fraud Complaint
app.post('/api/cases', requireRole(['VICTIM', 'SUPER_ADMIN']), (req, res) => {
  const { suspect_wallet_address, blockchain_network, loss_amount_inr, crime_type } = req.body;
  
  const newCase = {
    id: memoryDB.cases.length + 1,
    case_number: `MH-CYBER-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    victim_id: currentUser.id,
    workspace_id: 1, // Default assigned to Maharashtra Cyber for testing
    assigned_investigator_id: 3,
    suspect_wallet_address: suspect_wallet_address || '0x99A81B...771B',
    blockchain_network: blockchain_network || 'Ethereum',
    loss_amount_inr: parseFloat(loss_amount_inr || 250000),
    crime_type: crime_type || 'Crypto Investment Fraud',
    status: 'PENDING_TRACING',
    created_at: new Date().toISOString()
  };

  memoryDB.cases.unshift(newCase);
  res.status(201).json({ message: 'Complaint registered successfully', case: newCase });
});

// Blockchain Tracing Analytics Endpoint
app.post('/api/trace/run', requireRole(['NORMAL_INVESTIGATOR', 'SENIOR_INVESTIGATOR', 'SUPER_ADMIN']), (req, res) => {
  const { case_id } = req.body;
  const targetCase = memoryDB.cases.find(c => c.id === parseInt(case_id));
  
  if (!targetCase) {
    return res.status(404).json({ error: 'Case not found' });
  }

  // ABAC Scope Check
  if (currentUser.role_name !== 'SUPER_ADMIN' && targetCase.workspace_id !== currentUser.workspace_id) {
    return res.status(403).json({ error: 'Scope Access Violation: Cannot trace case outside your unit workspace.' });
  }

  // Simulated Automated Tracing Result (Attributing to Binance / VASP)
  const traceResult = {
    id: memoryDB.wallet_traces.length + 1,
    case_id: targetCase.id,
    input_wallet: targetCase.suspect_wallet_address,
    detected_vasp: 'Binance International',
    vasp_id: 1,
    layering_hops: 3,
    risk_score: 94,
    risk_category: 'CRITICAL',
    attributed_deposit_wallet: '0x28C6c06298d514Db089934071355E5743bf21d60',
    timeline: [
      { step: 1, label: 'Victim Non-Custodial Burner Wallet', status: 'Source' },
      { step: 2, label: 'Intermediary Layering Wallet (Tornado Cash / Mixer Hop)', status: 'Obfuscation Detected' },
      { step: 3, label: 'Binance Deposit Hot Wallet Identified', status: 'VASP Identified' }
    ]
  };

  targetCase.status = 'TRACED';
  memoryDB.wallet_traces.push(traceResult);

  res.json({ message: 'Blockchain trace completed successfully', trace: traceResult });
});

// Draft Freeze Request (Normal + Senior Investigators)
app.post('/api/freeze/draft', requireRole(['NORMAL_INVESTIGATOR', 'SENIOR_INVESTIGATOR', 'SUPER_ADMIN']), (req, res) => {
  const { case_id, freeze_reason } = req.body;
  const targetCase = memoryDB.cases.find(c => c.id === parseInt(case_id));

  if (!targetCase) return res.status(404).json({ error: 'Case not found' });

  const freezeNotice = {
    id: memoryDB.freeze_requests.length + 1,
    case_id: targetCase.id,
    vasp_id: 1,
    vasp_name: 'Binance International',
    drafted_by: currentUser.name,
    approved_by: null,
    bnss_section: 'Sec 94 BNSS / 91 CrPC Statutory Freeze Notice',
    freeze_reason: freeze_reason || 'Urgent asset preservation requested under Cyber Fraud Investigation',
    status: 'DRAFTED',
    created_at: new Date().toISOString()
  };

  memoryDB.freeze_requests.push(freezeNotice);
  targetCase.status = 'FREEZE_DRAFTED';

  res.status(201).json({ message: 'Freeze notice drafted successfully', freezeNotice });
});

// Approve Freeze Notice & Trigger Anchor (Senior Investigator ONLY)
app.post('/api/freeze/approve', requireRole(['SENIOR_INVESTIGATOR', 'SUPER_ADMIN']), (req, res) => {
  const { freeze_request_id } = req.body;
  const notice = memoryDB.freeze_requests.find(fr => fr.id === parseInt(freeze_request_id));

  if (!notice) return res.status(404).json({ error: 'Freeze request not found' });

  notice.status = 'APPROVED';
  notice.approved_by = currentUser.name;

  const targetCase = memoryDB.cases.find(c => c.id === notice.case_id);
  if (targetCase) targetCase.status = 'FREEZE_APPROVED';

  // Smart Contract Anchor Hash Simulation
  const anchor = {
    id: memoryDB.evidence_anchors.length + 1,
    case_id: notice.case_id,
    pdf_hash: '0xa7f83e2b9c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f',
    smart_contract_tx_hash: '0x0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e',
    anchored_by: currentUser.name,
    timestamp: new Date().toISOString()
  };
  memoryDB.evidence_anchors.push(anchor);

  res.json({ message: 'Freeze request approved and evidence hash anchored to Smart Contract!', notice, anchor });
});

// Super Admin Functions (Create Workspace, Lockdown)
app.post('/api/workspaces/create', requireRole(['SUPER_ADMIN']), (req, res) => {
  const { name, state, jurisdiction_code } = req.body;
  const newWorkspace = {
    id: memoryDB.workspaces.length + 1,
    name: name || 'Karnataka Cyber Taskforce',
    state: state || 'Karnataka',
    jurisdiction_code: jurisdiction_code || 'KA-CYBER-03'
  };
  memoryDB.workspaces.push(newWorkspace);
  res.status(201).json({ message: 'New Regional State Workspace created', workspace: newWorkspace });
});

app.post('/api/admin/lockdown', requireRole(['SUPER_ADMIN']), (req, res) => {
  res.json({ message: 'EMERGENCY LOCKDOWN TRIGGERED: All API keys suspended & state workspaces isolated.' });
});

app.listen(PORT, () => {
  console.log(`Crypto Fraud Attribution System API Server running on port ${PORT}`);
});
