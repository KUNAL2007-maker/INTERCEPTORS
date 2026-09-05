const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files from ../frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

const PORT = process.env.PORT || 5000;

// Shared In-Memory State for Prototype Evaluation
const memoryDB = {
  users: [
    { id: 1, name: 'Central Nodal Officer (I4C)', email: 'admin@i4c.gov.in', role_id: 5, role_name: 'SUPER_ADMIN', workspace_id: 3, vasp_id: null },
    { id: 2, name: 'Officer Sharma (MH Cyber)', email: 'senior.sharma@mhcyber.gov.in', role_id: 3, role_name: 'SENIOR_INVESTIGATOR', workspace_id: 1, vasp_id: null },
    { id: 3, name: 'Sub-Inspector Patil', email: 'officer.patil@mhcyber.gov.in', role_id: 2, role_name: 'NORMAL_INVESTIGATOR', workspace_id: 1, vasp_id: null },
    { id: 4, name: 'SP Deshmukh (MH Unit Lead)', email: 'sp.deshmukh@mhcyber.gov.in', role_id: 4, role_name: 'WORKSPACE_ADMIN', workspace_id: 1, vasp_id: null },
    { id: 5, name: 'Rajesh Verma (Victim)', email: 'victim.verma@gmail.com', role_id: 1, role_name: 'VICTIM', workspace_id: null, vasp_id: null },
    { id: 6, name: 'Binance Compliance Lead', email: 'legal@binance.com', role_id: 6, role_name: 'EXCHANGE_NODAL_OFFICER', workspace_id: null, vasp_id: 1 },
    { id: 7, name: 'Justice K. S. Rao', email: 'judge.rao@ecourts.gov.in', role_id: 7, role_name: 'AUDITOR', workspace_id: null, vasp_id: null }
  ],
  workspaces: [
    { id: 1, name: 'Maharashtra Cyber Unit', state: 'Maharashtra', jurisdiction_code: 'MH-CYBER-01' },
    { id: 2, name: 'Delhi Police Cyber Hub', state: 'Delhi', jurisdiction_code: 'DL-CYBER-02' },
    { id: 3, name: 'National Central Hub (I4C)', state: 'Central', jurisdiction_code: 'IN-I4C-00' }
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

// Set default active identity (Officer Sharma - Senior Investigator)
app.set('currentUser', memoryDB.users[1]);
app.set('memoryDB', memoryDB);

// Import Middlewares
const { requireRole } = require('./middleware/rbac');
const { filterCasesByScope } = require('./middleware/abac');

// ----------------------------------------------------------------------------
// API ROUTES
// ----------------------------------------------------------------------------

// Auth / Persona Switcher
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

// Cases API (ABAC Scope Filtered)
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
  const { suspect_wallet_address, blockchain_network, loss_amount_inr, crime_type } = req.body;

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
    status: 'PENDING_TRACING',
    created_at: new Date().toISOString()
  };

  memoryDB.cases.unshift(newCase);
  res.status(201).json({ message: 'Complaint registered successfully', case: newCase });
});

// Blockchain Tracing API
app.post('/api/trace/run', requireRole(['NORMAL_INVESTIGATOR', 'SENIOR_INVESTIGATOR', 'SUPER_ADMIN']), (req, res) => {
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
    risk_category: 'CRITICAL'
  };

  targetCase.status = 'TRACED';
  memoryDB.wallet_traces.push(trace);
  res.json({ message: 'Blockchain trace attribution complete', trace });
});

// Freeze Notice Draft API
app.post('/api/freeze/draft', requireRole(['NORMAL_INVESTIGATOR', 'SENIOR_INVESTIGATOR', 'SUPER_ADMIN']), (req, res) => {
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
    status: 'DRAFTED'
  };

  memoryDB.freeze_requests.push(freezeNotice);
  res.status(201).json({ message: 'Freeze notice drafted under Sec 94 BNSS', freezeNotice });
});

// Approve & Anchor Evidence API (SENIOR ROLE ONLY)
app.post('/api/freeze/approve', requireRole(['SENIOR_INVESTIGATOR', 'SUPER_ADMIN']), (req, res) => {
  if (memoryDB.cases.length > 0) memoryDB.cases[0].status = 'FREEZE_APPROVED';

  const anchor = {
    id: memoryDB.evidence_anchors.length + 1,
    pdf_hash: '0xa7f83e2b9c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f',
    smart_contract_tx_hash: '0x0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e',
    anchored_by: app.get('currentUser').name,
    timestamp: new Date().toISOString()
  };

  memoryDB.evidence_anchors.push(anchor);
  res.json({ message: 'Freeze request approved and evidence anchored on-chain!', anchor });
});

// Super Admin APIs
app.post('/api/workspaces/create', requireRole(['SUPER_ADMIN']), (req, res) => {
  const { name, state, jurisdiction_code } = req.body;
  const newWorkspace = {
    id: memoryDB.workspaces.length + 1,
    name: name || 'Karnataka Cyber Taskforce',
    state: state || 'Karnataka',
    jurisdiction_code: jurisdiction_code || 'KA-CYBER-03'
  };
  memoryDB.workspaces.push(newWorkspace);
  res.status(201).json({ message: 'New state workspace created', workspace: newWorkspace });
});

app.post('/api/admin/lockdown', requireRole(['SUPER_ADMIN']), (req, res) => {
  res.json({ message: 'EMERGENCY LOCKDOWN TRIGGERED: All API keys suspended & state workspaces isolated.' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
