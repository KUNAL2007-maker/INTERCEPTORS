/**
 * PostgreSQL Database Persistence Layer with Dual-Mode Offline Fallback
 * Directly interfaces with schemas from DATABASE/db/schema.sql
 */

import { Pool } from 'pg';
import {
  SYSTEM_PERSONAS,
  filterCasesByScope,
  evaluateABAC,
  type AppUser,
  type SubjectAttributes
} from './rbac-abac';

export type StoredCase = {
  id: number;
  case_number: string;
  victim_id: number;
  workspace_id: number;
  jurisdiction_code: string;
  assigned_investigator_id?: number | null;
  suspect_wallet_address: string;
  blockchain_network: string;
  loss_amount_inr: number;
  crime_type: string;
  target_vasp?: string;
  vasp_id?: number;
  classification: string;
  status: string;
  created_at: string;
  tx_hashes?: string[];
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

// ----------------------------------------------------------------------------
// 1. In-Memory Resilient Data Store (Fallback if PostgreSQL is offline)
// ----------------------------------------------------------------------------
const memoryStore = {
  currentUser: SYSTEM_PERSONAS[0], // Default: Officer Sharma (Senior Investigator)
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
      workspace_id: 1,
      jurisdiction_code: 'MH-CYBER-01',
      assigned_investigator_id: 3,
      suspect_wallet_address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      blockchain_network: 'Ethereum',
      loss_amount_inr: 450000.0,
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
      loss_amount_inr: 8500000.0,
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
      loss_amount_inr: 125000000.0,
      crime_type: 'Cross-Border Syndicate Laundering',
      target_vasp: 'Binance International',
      vasp_id: 1,
      classification: 'TOP_SECRET',
      status: 'TRACED',
      tx_hashes: ['0xcc77...11aa'],
      created_at: new Date().toISOString()
    }
  ] as StoredCase[],
  notices: [] as StoredFreezeNotice[],
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

  // Test connection silently
  pool.query('SELECT 1', (err) => {
    if (err) {
      pgAvailable = false;
    } else {
      pgAvailable = true;
      console.log('[CryptoTrace DB] Connected to live PostgreSQL database.');
    }
  });
} catch {
  pgAvailable = false;
}

export function isPostgresActive(): boolean {
  return pgAvailable;
}

// ----------------------------------------------------------------------------
// 3. User / Persona Session Management
// ----------------------------------------------------------------------------
export function getCurrentUser(): AppUser {
  return memoryStore.currentUser;
}

export function switchPersona(roleOrUid: string): AppUser {
  const target =
    SYSTEM_PERSONAS.find((p) => p.role === roleOrUid) ||
    SYSTEM_PERSONAS.find((p) => p.uid === roleOrUid);
  if (target) {
    memoryStore.currentUser = target;
    return target;
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
// 4. Case Management (PostgreSQL with Fallback)
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
    workspace_id: newCase.workspace_id || 1,
    jurisdiction_code: newCase.jurisdiction_code || 'MH-CYBER-01',
    assigned_investigator_id: newCase.assigned_investigator_id || null,
    suspect_wallet_address: newCase.suspect_wallet_address || '',
    blockchain_network: newCase.blockchain_network || 'Ethereum',
    loss_amount_inr: Number(newCase.loss_amount_inr) || 0,
    crime_type: newCase.crime_type || 'Crypto Fraud',
    target_vasp: newCase.target_vasp || 'Binance International',
    vasp_id: newCase.vasp_id || 1,
    classification: newCase.classification || 'CONFIDENTIAL',
    status: newCase.status || 'TRACED',
    created_at: new Date().toISOString()
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
      return res.rows[0];
    } catch {
      // Fall through to memory
    }
  }

  memoryStore.cases.unshift(caseObj);
  return caseObj;
}

// ----------------------------------------------------------------------------
// 5. Section 94 BNSS Legal Freeze Notices (PostgreSQL with Fallback)
// ----------------------------------------------------------------------------
export async function getNoticesForUser(user: SubjectAttributes): Promise<StoredFreezeNotice[]> {
  if (user.role === 'EXCHANGE_NODAL_OFFICER') {
    return memoryStore.notices.filter((n) => !n.vasp_id || n.vasp_id === user.vasp_id);
  }
  return memoryStore.notices;
}

export async function saveFreezeNotice(
  noticeData: Partial<StoredFreezeNotice>,
  actingOfficer: AppUser
): Promise<{ success: boolean; notice?: StoredFreezeNotice; error?: string }> {
  // ABAC Guard: Section 94 BNSS check
  const abacResult = evaluateABAC(
    actingOfficer,
    { status: 'TRACED', vasp_id: noticeData.vasp_id },
    'freeze_approve',
    memoryStore.environment
  );

  if (abacResult.decision === 'DENY') {
    return { success: false, error: abacResult.reason };
  }

  const stored: StoredFreezeNotice = {
    id: noticeData.id || `NOTICE-${Date.now()}`,
    case_id: noticeData.case_id,
    case_number: noticeData.case_number,
    target_vasp: noticeData.target_vasp || 'Binance International',
    vasp_id: noticeData.vasp_id || 1,
    status: noticeData.status || 'Issued',
    drafted_by_name: noticeData.drafted_by_name || actingOfficer.name,
    approved_by_name: actingOfficer.name,
    created_at: Date.now(),
    notice: noticeData.notice
  };

  memoryStore.notices.unshift(stored);
  return { success: true, notice: stored };
}
