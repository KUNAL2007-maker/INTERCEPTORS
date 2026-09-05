const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files from local frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

const PORT = process.env.PORT || 5000;

// Multi-Tenant Memory DB with rich ABAC Attributes
const memoryDB = {
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

// Import Middlewares
const { requireRole } = require('./middleware/rbac');
const { filterCasesByScope, requireABAC, evaluateABAC, systemEnvironment } = require('./middleware/abac');
const { keycloakAuthMiddleware } = require('./middleware/keycloak-middleware');

// Mount Keycloak OIDC Token Parser
app.use(keycloakAuthMiddleware);

// ----------------------------------------------------------------------------
// 1. AUTH & PERSONA SWITCHING
// ----------------------------------------------------------------------------
app.get('/api/auth/current-user', (req, res) => {
  res.json({
    user: app.get('currentUser'),
    environment: systemEnvironment
  });
});

app.post('/api/auth/switch-role', (req, res) => {
  const { roleName } = req.body;
  const targetUser = memoryDB.users.find(u => u.role_name === roleName);
  if (!targetUser) return res.status(404).json({ error: 'Role identity not found' });

  app.set('currentUser', targetUser);
  res.json({ message: `Switched active persona to ${targetUser.name}`, user: targetUser });
});

// ----------------------------------------------------------------------------
// 2. CASES & ABAC SCOPE FILTERING
// ----------------------------------------------------------------------------
app.get('/api/cases', (req, res) => {
  const currentUser = app.get('currentUser');
  const scopedCases = filterCasesByScope(currentUser, memoryDB.cases);
  res.json({
    role: currentUser.role_name,
    workspace_id: currentUser.workspace_id,
    jurisdiction: currentUser.jurisdiction_code,
    totalCasesInDb: memoryDB.cases.length,
    cases: scopedCases
  });
});

app.post('/api/cases', requireRole(['VICTIM', 'SUPER_ADMIN']), requireABAC('FILE_COMPLAINT'), (req, res) => {
  const currentUser = app.get('currentUser');
  const { suspect_wallet_address, blockchain_network, loss_amount_inr, crime_type, tx_hash } = req.body;

  const newCase = {
    id: memoryDB.cases.length + 1,
    case_number: `MH-CYBER-2026-0${memoryDB.cases.length + 843}`,
    victim_id: currentUser.id,
    workspace_id: 1,
    jurisdiction_code: 'MH-CYBER-01',
    assigned_investigator_id: 3,
    suspect_wallet_address: suspect_wallet_address || '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    blockchain_network: blockchain_network || 'Ethereum',
    loss_amount_inr: parseFloat(loss_amount_inr || 450000),
    crime_type: crime_type || 'Task-based Investment Scam',
    target_vasp: 'Binance International',
    vasp_id: 1,
    classification: 'CONFIDENTIAL',
    status: 'PENDING_TRACING',
    tx_hashes: tx_hash ? [tx_hash] : ['0x5f2e...91a4'],
    created_at: new Date().toISOString()
  };

  memoryDB.cases.unshift(newCase);
  res.status(201).json({ message: 'Complaint registered successfully under victim scope', case: newCase });
});

app.post('/api/cases/upload-tx', requireRole(['VICTIM', 'SUPER_ADMIN']), requireABAC('UPLOAD_TX_HASH'), (req, res) => {
  const { tx_hash } = req.body;
  res.json({ message: `Transaction hash ${tx_hash || '0x992b...fa31'} successfully uploaded.` });
});

// ----------------------------------------------------------------------------
// 3. INVESTIGATION & STATUTORY ACTIONS (Combined RBAC + ABAC Protected)
// ----------------------------------------------------------------------------
app.post('/api/trace/run', requireRole(['NORMAL_INVESTIGATOR', 'SENIOR_INVESTIGATOR', 'WORKSPACE_ADMIN', 'SUPER_ADMIN']), requireABAC('RUN_TRACE'), (req, res) => {
  const { case_id } = req.body;
  const targetCase = memoryDB.cases.find(c => c.id === parseInt(case_id || 1));
  if (!targetCase) return res.status(404).json({ error: 'Case not found' });

  targetCase.status = 'TRACED';
  res.json({
    message: `Automated trace complete for case #${targetCase.case_number}. Identified VASP: ${targetCase.target_vasp}`,
    case: targetCase
  });
});

app.post('/api/freeze/draft', requireRole(['NORMAL_INVESTIGATOR', 'SENIOR_INVESTIGATOR', 'WORKSPACE_ADMIN', 'SUPER_ADMIN']), requireABAC('DRAFT_FREEZE'), (req, res) => {
  const { case_id, freeze_reason } = req.body;
  const targetCase = memoryDB.cases.find(c => c.id === parseInt(case_id || 1));
  if (targetCase) targetCase.status = 'FREEZE_DRAFTED';

  res.status(201).json({
    message: 'Freeze notice drafted under Sec 94 BNSS',
    case: targetCase,
    freeze_reason
  });
});

app.post('/api/freeze/approve', requireRole(['SENIOR_INVESTIGATOR', 'SUPER_ADMIN']), requireABAC('APPROVE_FREEZE'), (req, res) => {
  const targetCase = memoryDB.cases[0];
  if (targetCase) targetCase.status = 'FREEZE_APPROVED';

  res.json({
    message: 'Statutory freeze order approved by Gazetted Authority & SHA-256 anchored on-chain!',
    status: 'FREEZE_APPROVED',
    statute: 'Sec 94 BNSS / Sec 91 CrPC'
  });
});

// ----------------------------------------------------------------------------
// 4. ABAC POLICY EVALUATOR SIMULATOR API
// ----------------------------------------------------------------------------
app.post('/api/abac/evaluate', (req, res) => {
  const { case_id, action, role_override, env_override } = req.body;
  const currentUser = app.get('currentUser');
  
  // Allow simulator to test alternative subjects
  const subject = role_override ? memoryDB.users.find(u => u.role_name === role_override) || currentUser : currentUser;
  const resource = case_id ? memoryDB.cases.find(c => c.id === parseInt(case_id)) : memoryDB.cases[0];

  const decision = evaluateABAC(subject, resource, action || 'VIEW_CASE', env_override || {});
  res.json({
    decision,
    subject: {
      name: subject.name,
      role: subject.role_name,
      workspace: subject.workspace_id,
      clearance: subject.clearance_level,
      is_gazetted: subject.is_gazetted
    },
    resource: resource ? {
      case_number: resource.case_number,
      workspace: resource.workspace_id,
      jurisdiction: resource.jurisdiction_code,
      victim_id: resource.victim_id,
      vasp: resource.target_vasp,
      classification: resource.classification,
      status: resource.status
    } : null
  });
});

app.post('/api/abac/toggle-lockdown', requireRole(['SUPER_ADMIN']), (req, res) => {
  systemEnvironment.isEmergencyLockdown = !systemEnvironment.isEmergencyLockdown;
  res.json({
    isEmergencyLockdown: systemEnvironment.isEmergencyLockdown,
    message: systemEnvironment.isEmergencyLockdown
      ? 'EMERGENCY LOCKDOWN ACTIVATED: All non-Super-Admin access suspended nationwide.'
      : 'EMERGENCY LOCKDOWN DEACTIVATED: Standard operational mode restored.'
  });
});

// Police Unit Admin, Trends & External Endpoints
app.post('/api/police/accounts', requireRole(['WORKSPACE_ADMIN', 'SUPER_ADMIN']), (req, res) => {
  res.json({ message: 'Police unit accounts updated successfully.' });
});

app.post('/api/police/assign-case', requireRole(['WORKSPACE_ADMIN', 'SUPER_ADMIN']), (req, res) => {
  res.json({ message: 'Case reassigned to investigating sub-inspector.' });
});

app.get('/api/police/workload', requireRole(['WORKSPACE_ADMIN', 'SUPER_ADMIN']), (req, res) => {
  res.json({ message: 'District unit performance report retrieved.' });
});

app.post('/api/trace/cross-chain', requireRole(['SENIOR_INVESTIGATOR', 'SUPER_ADMIN']), (req, res) => {
  res.json({ message: 'Cross-chain bridge traversal complete.' });
});

app.post('/api/workspaces/create', requireRole(['SUPER_ADMIN']), (req, res) => {
  res.status(201).json({ message: 'New state workspace created successfully.' });
});

app.get('/api/admin/trends', requireRole(['SUPER_ADMIN']), (req, res) => {
  res.json({ message: 'National fraud patterns retrieved from I4C central telemetry.' });
});

app.post('/api/admin/config-keys', requireRole(['SUPER_ADMIN']), (req, res) => {
  res.json({ message: 'Global Alchemy RPC keys rotated.' });
});

app.post('/api/admin/lockdown', requireRole(['SUPER_ADMIN']), (req, res) => {
  systemEnvironment.isEmergencyLockdown = true;
  res.json({ message: 'EMERGENCY LOCKDOWN TRIGGERED: State workspaces isolated.' });
});

app.post('/api/exchange/confirm-freeze', requireRole(['EXCHANGE_NODAL_OFFICER', 'SUPER_ADMIN']), requireABAC('CONFIRM_FREEZE'), (req, res) => {
  res.json({ message: 'Exchange VASP confirmed: Account frozen under Sec 94 BNSS statutory order.' });
});

app.post('/api/exchange/upload-kyc', requireRole(['EXCHANGE_NODAL_OFFICER', 'SUPER_ADMIN']), requireABAC('UPLOAD_KYC'), (req, res) => {
  res.json({ message: 'Encrypted KYC dossier uploaded for LEA inspection.' });
});

app.post('/api/audit/verify-hash', requireRole(['AUDITOR', 'SENIOR_INVESTIGATOR', 'SUPER_ADMIN']), (req, res) => {
  res.json({
    status: 'VERIFIED_AUTHENTIC',
    document: 'Court Evidence Dossier Section 65B BSA',
    sha256_hash: '0xa7f83e2b9c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f',
    tamper_status: 'UNMODIFIED - 100% Tamper Evident Match'
  });
});

app.listen(PORT, () => {
  console.log(`AUTH_RBAC_ABAC standalone server running on http://localhost:${PORT}`);
});
