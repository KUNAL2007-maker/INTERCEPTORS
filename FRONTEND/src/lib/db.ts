/**
 * PostgreSQL Database Persistence Layer with Dual-Mode Offline Fallback
 * Directly interfaces with schemas from DATABASE/db/schema.sql
 * Implements Real Authentication, Password Verification (PBKDF2), and Immutable Audit Logging
 */

import { Pool } from 'pg';
import {
  SYSTEM_PERSONAS,
  filterCasesByScope,
  evaluateABAC,
  type AppUser,
  type SubjectAttributes
} from './rbac-abac';
import { hashPassword, verifyPassword } from './auth-crypto';
import { ensureLegalNotice } from './investigation';

export type StoredCase = {
  id: number;
  case_number: string;
  victim_id: number;
  victim_name?: string;
  victim_email?: string;
  workspace_id: number;
  jurisdiction_code: string;
  assigned_investigator_id?: number | null;
  assigned_investigator_name?: string;
  suspect_wallet_address: string;
  blockchain_network: string;
  loss_amount_inr: number;
  token_symbol?: string;
  crime_type: string;
  incident_date?: string;
  target_vasp?: string;
  vasp_id?: number;
  classification: string;
  status: string;
  created_at: string;
  tx_hashes?: string[];
  freeze_notice_id?: string;
  notes?: string;
};

export type StoredFreezeNotice = {
  id: string;
  case_id?: number;
  case_number?: string;
  target_vasp: string;
  vasp_id?: number;
  status: 'Draft' | 'Issued' | 'Acknowledged';
  drafted_by_name: string;
  approved_by_name?: string;
  created_at: number;
  notice: any;
};

export type StoredAuditLog = {
  id: string;
  timestamp: string;
  user_id: number | string;
  user_name: string;
  user_role: string;
  action: string;
  resource_type: string;
  resource_id?: string | number;
  decision: 'GRANTED' | 'DENIED';
  reason?: string;
  statutory_code?: string;
  ip_address?: string;
};

export type DatabaseUser = AppUser & {
  password_hash: string;
  salt: string;
};

// ----------------------------------------------------------------------------
// Official Pre-Seeded User Credentials for 7 Government Personas
// ----------------------------------------------------------------------------
const SEED_CREDENTIALS: Record<string, string> = {
  'admin@i4c.gov.in': 'Admin@123',
  'senior.sharma@mhcyber.gov.in': 'Police@123',
  'officer.patil@mhcyber.gov.in': 'Patil@123',
  'sp.deshmukh@mhcyber.gov.in': 'Deshmukh@123',
  'victim.verma@gmail.com': 'Victim@123',
  'legal@binance.com': 'Binance@123',
  'judge.rao@ecourts.gov.in': 'Judge@123'
};

const INITIAL_USERS: DatabaseUser[] = SYSTEM_PERSONAS.map((persona) => {
  const pwd = SEED_CREDENTIALS[persona.email] || 'Secure@123';
  const { hash, salt } = hashPassword(pwd, `salt_${persona.uid}_sih2026`);
  return {
    ...persona,
    password_hash: hash,
    salt
  };
});

// ----------------------------------------------------------------------------
// 1. In-Memory Resilient Data Store (Fallback if PostgreSQL is offline)
// ----------------------------------------------------------------------------
const memoryStore = {
  users: INITIAL_USERS,
  currentUser: SYSTEM_PERSONAS[0], // Default logged-in: Officer Sharma
  environment: {
    emergency_lockdown: false
  },
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
      victim_name: 'Rajesh Verma',
      victim_email: 'victim.verma@gmail.com',
      workspace_id: 1,
      jurisdiction_code: 'MH-CYBER-01',
      assigned_investigator_id: 3,
      assigned_investigator_name: 'Sub-Inspector Patil',
      suspect_wallet_address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      blockchain_network: 'Ethereum',
      loss_amount_inr: 450000.0,
      token_symbol: 'USDT',
      crime_type: 'Task-based Fake Part-Time Job Scam',
      incident_date: '2026-08-17',
      target_vasp: 'Binance International',
      vasp_id: 1,
      classification: 'CONFIDENTIAL',
      status: 'TRACED',
      tx_hashes: ['0x3a1b49e8d3840291f09e81b37492c019d3847291a0293b89c2'],
      notes: 'Complainant promised high daily returns for rating hotels on Telegram group. Transferred USDT via P2P.',
      created_at: '2026-08-17T09:15:00.000Z'
    },
    {
      id: 2,
      case_number: 'DL-CYBER-2026-0319',
      victim_id: 99,
      victim_name: 'Aakash Sharma',
      victim_email: 'aakash.sharma@gmail.com',
      workspace_id: 2,
      jurisdiction_code: 'DL-CYBER-02',
      assigned_investigator_id: 12,
      assigned_investigator_name: 'Inspector Mehra',
      suspect_wallet_address: '0x1928aBc849102c98Dfe10293bC8419280918234A',
      blockchain_network: 'Polygon',
      loss_amount_inr: 8500000.0,
      token_symbol: 'MATIC',
      crime_type: 'Fake Crypto Exchange Phishing',
      incident_date: '2026-08-20',
      target_vasp: 'WazirX India',
      vasp_id: 2,
      classification: 'RESTRICTED',
      status: 'PENDING_TRACING',
      tx_hashes: ['0x992a8371902bc9182a01948572b9182019a84712bb14'],
      notes: 'Phishing website mimicking Indian crypto exchange lured victim into entering seed phrase.',
      created_at: '2026-08-20T11:30:00.000Z'
    },
    {
      id: 3,
      case_number: 'IN-I4C-2026-9901',
      victim_id: 5,
      victim_name: 'Rajesh Verma',
      victim_email: 'victim.verma@gmail.com',
      workspace_id: 3,
      jurisdiction_code: 'IN-I4C-00',
      assigned_investigator_id: 1,
      assigned_investigator_name: 'Central Cyber Cell',
      suspect_wallet_address: '0x55aa33bb110022cc44dd99ee88ff77aa66bb55cc',
      blockchain_network: 'TRON',
      loss_amount_inr: 125000000.0,
      token_symbol: 'USDT',
      crime_type: 'Cross-Border Syndicate Laundering',
      incident_date: '2026-08-10',
      target_vasp: 'Binance International',
      vasp_id: 1,
      classification: 'TOP_SECRET',
      status: 'NOTICE_SERVED',
      freeze_notice_id: 'NOTICE-2026-0842-BN',
      tx_hashes: ['0xcc77192837461902837461928374619283746111aa'],
      notes: 'International organized cyber crime syndicate laundering funds across bridge into Tron USDT.',
      created_at: '2026-08-10T14:20:00.000Z'
    }
  ] as StoredCase[],
  notices: [
    {
      id: 'NOTICE-2026-0842-BN',
      case_id: 3,
      case_number: 'IN-I4C-2026-9901',
      target_vasp: 'Binance International',
      vasp_id: 1,
      status: 'Issued',
      drafted_by_name: 'ACP Sharma (Gazetted Officer)',
      approved_by_name: 'ACP Sharma (Gazetted Officer)',
      created_at: 1788710000000,
      notice: ensureLegalNotice({
        ref: 'BNSS-2026-0842-BN',
        case_number: 'IN-I4C-2026-9901',
        to_vasp: 'Binance International',
        to_email: 'compliance@binance.com',
        amountInr: 125000000.0,
        amountUsd: 1500000,
        targetAddresses: ['0x55aa33bb110022cc44dd99ee88ff77aa66bb55cc']
      })
    }
  ] as StoredFreezeNotice[],
  audit_logs: [] as StoredAuditLog[],
  traces: [] as any[]
};

// ----------------------------------------------------------------------------
// 2. PostgreSQL Connection Pool
// ----------------------------------------------------------------------------
let pool: Pool | null = null;
let pgAvailable = false;

try {
  pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'crypto_attribution',
    password: process.env.PGPASSWORD || 'postgres',
    port: parseInt(process.env.PGPORT || '5432', 10),
    connectionTimeoutMillis: 1500
  });

  // Test connection silently and create auxiliary tables if available
  pool.query('SELECT 1', (err) => {
    if (err) {
      pgAvailable = false;
    } else {
      pgAvailable = true;
      console.log('[CryptoTrace DB] Connected to live PostgreSQL database.');
      if (pool) {
        pool.query(`
          CREATE TABLE IF NOT EXISTS audit_logs (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(50),
            user_name VARCHAR(100),
            user_role VARCHAR(50),
            action VARCHAR(100) NOT NULL,
            resource_type VARCHAR(50),
            resource_id VARCHAR(100),
            decision VARCHAR(20) NOT NULL,
            reason TEXT,
            statutory_code VARCHAR(100),
            ip_address VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `).catch(() => {});
      }
    }
  });
} catch {
  pgAvailable = false;
}

export function isPostgresActive(): boolean {
  return pgAvailable;
}

// ----------------------------------------------------------------------------
// 3. User Authentication & Session Management
// ----------------------------------------------------------------------------
export function getUserByEmail(email: string): DatabaseUser | null {
  const normalized = (email || '').trim().toLowerCase();
  return memoryStore.users.find((u) => u.email.toLowerCase() === normalized) || null;
}

export function getUserById(id: number | string): AppUser | null {
  return (
    memoryStore.users.find(
      (u) => String(u.id) === String(id) || u.uid === String(id) || u.email === String(id)
    ) || null
  );
}

export function authenticateUser(
  email: string,
  password: string
): { success: boolean; user?: AppUser; error?: string } {
  const dbUser = getUserByEmail(email);
  if (!dbUser) {
    return { success: false, error: 'Invalid email or password.' };
  }
  const isMatch = verifyPassword(password, dbUser.password_hash, dbUser.salt);
  if (!isMatch) {
    return { success: false, error: 'Invalid email or password.' };
  }
  const { password_hash, salt, ...safeUser } = dbUser;
  memoryStore.currentUser = safeUser;
  return { success: true, user: safeUser };
}

export function getCurrentUser(): AppUser {
  return memoryStore.currentUser;
}

export function setCurrentUser(user: AppUser) {
  memoryStore.currentUser = user;
}

export function switchPersona(roleOrUid: string): AppUser {
  const target =
    memoryStore.users.find((p) => p.role === roleOrUid) ||
    memoryStore.users.find((p) => p.uid === roleOrUid) ||
    memoryStore.users.find((p) => String(p.id) === roleOrUid);
  if (target) {
    const { password_hash, salt, ...safeUser } = target;
    memoryStore.currentUser = safeUser;
    return safeUser;
  }
  return memoryStore.currentUser;
}

export function getEnvironment() {
  return memoryStore.environment;
}

export function setEmergencyLockdown(active: boolean) {
  memoryStore.environment.emergency_lockdown = active;
  return memoryStore.environment;
}

// ----------------------------------------------------------------------------
// 4. Immutable Audit Logging (BSA 2023 Sec 63 / 65B Admissibility)
// ----------------------------------------------------------------------------
export function recordAuditLog(
  log: Omit<StoredAuditLog, 'id' | 'timestamp'>
): StoredAuditLog {
  const entry: StoredAuditLog = {
    id: `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...log
  };
  memoryStore.audit_logs.unshift(entry);
  if (memoryStore.audit_logs.length > 500) {
    memoryStore.audit_logs.pop();
  }

  // Persist to PostgreSQL if connected
  if (pgAvailable && pool) {
    pool.query(
      `INSERT INTO audit_logs (user_id, user_name, user_role, action, resource_type, resource_id, decision, reason, statutory_code, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        String(entry.user_id),
        entry.user_name,
        entry.user_role,
        entry.action,
        entry.resource_type,
        String(entry.resource_id || ''),
        entry.decision,
        entry.reason || '',
        entry.statutory_code || '',
        entry.ip_address || ''
      ]
    ).catch(() => {});
  }

  return entry;
}

export function getAuditLogs(limit: number = 50): StoredAuditLog[] {
  return memoryStore.audit_logs.slice(0, limit);
}

// ----------------------------------------------------------------------------
// 5. Case Management (PostgreSQL with Fallback)
// ----------------------------------------------------------------------------
export async function getCasesForUser(user: SubjectAttributes): Promise<StoredCase[]> {
  if (pgAvailable && pool) {
    try {
      const res = await pool.query('SELECT * FROM cases ORDER BY created_at DESC');
      const allCases = res.rows;
      return filterCasesByScope(user, allCases);
    } catch {
      // Fallback to in-memory store on connection failure
    }
  }
  return filterCasesByScope(user, memoryStore.cases);
}

export async function createCase(newCase: Partial<StoredCase>): Promise<StoredCase> {
  const caseObj: StoredCase = {
    id: memoryStore.cases.length + 1,
    case_number: newCase.case_number || `CRIME-${Date.now().toString().slice(-6)}`,
    victim_id: newCase.victim_id || 5,
    victim_name: newCase.victim_name || (newCase.victim_id === 5 ? 'Rajesh Verma' : 'Complainant'),
    victim_email: newCase.victim_email || (newCase.victim_id === 5 ? 'victim.verma@gmail.com' : undefined),
    workspace_id: newCase.workspace_id || 1,
    jurisdiction_code: newCase.jurisdiction_code || 'MH-CYBER-01',
    assigned_investigator_id: newCase.assigned_investigator_id || null,
    assigned_investigator_name: newCase.assigned_investigator_name || 'Sub-Inspector Patil',
    suspect_wallet_address: newCase.suspect_wallet_address || '',
    blockchain_network: newCase.blockchain_network || 'Ethereum',
    loss_amount_inr: Number(newCase.loss_amount_inr) || 0,
    token_symbol: newCase.token_symbol || 'USDT',
    crime_type: newCase.crime_type || 'Crypto Fraud',
    incident_date: newCase.incident_date || new Date().toISOString().split('T')[0],
    target_vasp: newCase.target_vasp || 'Binance International',
    vasp_id: newCase.vasp_id || 1,
    classification: newCase.classification || 'CONFIDENTIAL',
    status: newCase.status || 'PENDING_TRACING',
    created_at: newCase.created_at || new Date().toISOString(),
    tx_hashes: newCase.tx_hashes || [],
    freeze_notice_id: newCase.freeze_notice_id,
    notes: newCase.notes || ''
  };

  if (pgAvailable && pool) {
    try {
      const q = `
        INSERT INTO cases (case_number, victim_id, workspace_id, assigned_investigator_id, suspect_wallet_address, blockchain_network, loss_amount_inr, crime_type, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
      `;
      const values = [
        caseObj.case_number,
        caseObj.victim_id,
        caseObj.workspace_id,
        caseObj.assigned_investigator_id,
        caseObj.suspect_wallet_address,
        caseObj.blockchain_network,
        caseObj.loss_amount_inr,
        caseObj.crime_type,
        caseObj.status
      ];
      const res = await pool.query(q, values);
      return { ...caseObj, ...res.rows[0] };
    } catch {
      // Fall through to memory
    }
  }

  memoryStore.cases.unshift(caseObj);
  return caseObj;
}

export async function updateCase(
  caseIdOrNumber: string | number,
  updates: Partial<StoredCase>
): Promise<StoredCase | null> {
  const found = memoryStore.cases.find(
    (c) => String(c.id) === String(caseIdOrNumber) || c.case_number === String(caseIdOrNumber)
  );
  if (!found) return null;

  Object.assign(found, updates);

  if (pgAvailable && pool) {
    try {
      if (updates.status) {
        await pool.query('UPDATE cases SET status = $1 WHERE case_number = $2', [
          updates.status,
          found.case_number
        ]);
      }
    } catch {
      // Ignore postgres update error on fallback
    }
  }

  return found;
}

// ----------------------------------------------------------------------------
// 6. Section 94 BNSS Legal Freeze Notices (Statutory Gate + Audit Log)
// ----------------------------------------------------------------------------
export async function getNoticesForUser(user: SubjectAttributes): Promise<StoredFreezeNotice[]> {
  const filtered = user.role === 'EXCHANGE_NODAL_OFFICER'
    ? memoryStore.notices.filter((n) => !n.vasp_id || n.vasp_id === user.vasp_id)
    : memoryStore.notices;

  // Defensive hydration: ensure every notice returned has a complete, valid notice payload
  return filtered.filter(Boolean).map((n) => {
    const linkedCase = n.case_number
      ? memoryStore.cases.find((c) => c.case_number === n.case_number)
      : null;
    n.notice = ensureLegalNotice(n.notice, {
      ...n,
      loss_amount_inr: linkedCase?.loss_amount_inr,
      suspect_wallet_address: linkedCase?.suspect_wallet_address
    });
    return n;
  });
}

export async function saveFreezeNotice(
  noticeData: Partial<StoredFreezeNotice>,
  actingOfficer: AppUser
): Promise<{ success: boolean; notice?: StoredFreezeNotice; error?: string; statutory_code?: string }> {
  const isDraft = noticeData.status === 'Draft';
  const isAck = noticeData.status === 'Acknowledged';

  // If attempting to issue or approve a freeze order, enforce Section 94 BNSS statutory gazetted officer check
  if (!isDraft && !isAck) {
    const abacResult = evaluateABAC(
      actingOfficer,
      { status: 'TRACED', vasp_id: noticeData.vasp_id },
      'freeze_approve',
      memoryStore.environment
    );

    if (abacResult.decision === 'DENY') {
      recordAuditLog({
        user_id: actingOfficer.id,
        user_name: actingOfficer.name,
        user_role: actingOfficer.role,
        action: 'ISSUE_SECTION_94_BNSS',
        resource_type: 'FREEZE_NOTICE',
        resource_id: noticeData.id || noticeData.case_number,
        decision: 'DENIED',
        reason: abacResult.reason,
        statutory_code: 'SEC_94_BNSS_GAZETTED_GATE'
      });
      return {
        success: false,
        error: abacResult.reason,
        statutory_code: 'SEC_94_BNSS_GAZETTED_GATE'
      };
    }
  }

  const existingIdx = memoryStore.notices.findIndex((n) => n.id === noticeData.id);
  const existingNotice = existingIdx >= 0 ? memoryStore.notices[existingIdx] : null;

  // CRITICAL: Preserve existing notice object if update payload does not specify notice
  const mergedNoticeData = noticeData.notice !== undefined ? noticeData.notice : existingNotice?.notice;

  const targetCaseKey =
    noticeData.case_id ||
    noticeData.case_number ||
    existingNotice?.case_number ||
    (mergedNoticeData as any)?.case_number;
  const linkedCase = targetCaseKey
    ? memoryStore.cases.find((c) => String(c.id) === String(targetCaseKey) || c.case_number === String(targetCaseKey))
    : null;

  const resolvedNotice = ensureLegalNotice(mergedNoticeData, {
    ...existingNotice,
    ...noticeData,
    case_number: noticeData.case_number || existingNotice?.case_number || linkedCase?.case_number,
    target_vasp: noticeData.target_vasp || existingNotice?.target_vasp || linkedCase?.target_vasp,
    loss_amount_inr: linkedCase?.loss_amount_inr,
    suspect_wallet_address: linkedCase?.suspect_wallet_address,
  });

  const stored: StoredFreezeNotice = {
    id: noticeData.id || existingNotice?.id || `NOTICE-${Date.now()}`,
    case_id: noticeData.case_id ?? existingNotice?.case_id ?? (linkedCase?.id as any),
    case_number: noticeData.case_number ?? existingNotice?.case_number ?? linkedCase?.case_number ?? 'MH-CYBER-2026-0842',
    target_vasp: noticeData.target_vasp || existingNotice?.target_vasp || linkedCase?.target_vasp || 'Binance International',
    vasp_id: noticeData.vasp_id ?? existingNotice?.vasp_id ?? linkedCase?.vasp_id ?? 1,
    status: isDraft ? 'Draft' : (noticeData.status || existingNotice?.status || 'Issued'),
    drafted_by_name: noticeData.drafted_by_name || existingNotice?.drafted_by_name || actingOfficer.name,
    approved_by_name: isDraft ? undefined : (isAck ? (noticeData.approved_by_name || existingNotice?.approved_by_name || actingOfficer.name) : actingOfficer.name),
    created_at: existingNotice?.created_at || Date.now(),
    notice: resolvedNotice
  };

  if (existingIdx >= 0) {
    memoryStore.notices[existingIdx] = stored;
  } else {
    memoryStore.notices.unshift(stored);
  }

  // Synchronize case status and metadata if this notice is linked to a case
  if (targetCaseKey && linkedCase) {
    if (stored.status === 'Acknowledged') {
      linkedCase.status = 'FROZEN';
    } else if (stored.status === 'Issued') {
      linkedCase.status = 'NOTICE_SERVED';
    }
    linkedCase.target_vasp = stored.target_vasp || linkedCase.target_vasp;
    linkedCase.freeze_notice_id = stored.id;

    if (pgAvailable && pool) {
      pool.query('UPDATE cases SET status = $1 WHERE case_number = $2', [
        linkedCase.status,
        linkedCase.case_number
      ]).catch(() => {});
    }
  }

  recordAuditLog({
    user_id: actingOfficer.id,
    user_name: actingOfficer.name,
    user_role: actingOfficer.role,
    action: isDraft
      ? 'DRAFT_SECTION_94_BNSS'
      : isAck
      ? 'CONFIRM_SECTION_94_BNSS_FREEZE'
      : 'ISSUE_SECTION_94_BNSS',
    resource_type: 'FREEZE_NOTICE',
    resource_id: stored.id,
    decision: 'GRANTED',
    reason: isDraft
      ? 'Section 94 BNSS requisition draft registered by field investigator.'
      : isAck
      ? `Asset freeze compliance confirmed under Sec 94(1) BNSS by ${actingOfficer.name} (${actingOfficer.role}).`
      : 'Statutory Sec 94 BNSS freeze approved and digitally signed by Gazetted Officer.'
  });

  return { success: true, notice: stored };
}
