/**
 * PostgreSQL Database Persistence Layer with Dual-Mode Offline Fallback
 * Directly interfaces with schemas from DATABASE/db/schema.sql
 * Implements Real Authentication, Password Verification (PBKDF2), and Immutable Audit Logging
 * SIH 2026 Prototype / Simulated LEA Environment
 */

import { Pool } from 'pg';
import {
  SYSTEM_PERSONAS,
  filterCasesByScope,
  evaluateABAC,
  normalizeRole,
  type AppUser,
  type SubjectAttributes,
  type RoleName
} from './rbac-abac';
import { hashPassword, verifyPassword } from './auth-crypto';
import { ensureLegalNotice } from './investigation';
import {
  signOrder,
  verifyOrderSignature,
  officerPublicKey,
  type OrderSignature,
  type SignableOrder,
  type VerificationResult
} from './order-signing';
import { loadSnapshot, saveSnapshot, dataFilePath } from './persistence';

export type StoredCase = {
  id: number;
  case_number: string;
  victim_id: number;
  victim_name?: string;
  victim_email?: string;
  victim_phone?: string;
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
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  created_at: string;
  tx_hashes?: string[];
  freeze_notice_id?: string;
  escrow_ref?: string;
  account_uid?: string;
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
  /**
   * Ed25519 signature over the canonical order payload, applied when a
   * gazetted officer issues the order. `approved_by_name` above is a display
   * label and proves nothing; this is the part a court can check.
   */
  signature?: OrderSignature;
  /** What the addressed exchange reported back. See recordVaspResponse. */
  vasp_response?: VaspResponse;
};

/**
 * The exchange's reply to a served requisition.
 *
 * Two stages, because that is how Section 94 BNSS service actually works: the
 * nodal officer first acknowledges receipt (which starts the clock they are
 * answerable against), and separately reports what their compliance team did
 * on their own systems. The platform records the reply. It does not freeze
 * anything, and nothing here touches the chain.
 */
export type VaspResponse = {
  acknowledged_at?: string;
  acknowledged_by?: string;
  /** Minutes between the order being issued and the exchange acknowledging. */
  ack_latency_minutes?: number;
  action?: 'FREEZE_EXECUTED' | 'PARTIAL_FREEZE' | 'REFUSED';
  action_reported_at?: string;
  /** Named individual at the exchange who carried out the action. */
  executed_by?: string;
  /** The exchange's own internal reference, so the two records can be tied. */
  exchange_ref_no?: string;
  /** Amount actually restrained, where partial. */
  frozen_amount?: string;
  /** Mandatory when the action is REFUSED or PARTIAL_FREEZE. */
  reason?: string;
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
// Official Pre-Seeded User Credentials for 8 Prototype Roles
// Supports both primary (@example.demo) and backward-compatible legacy emails
// ----------------------------------------------------------------------------
// Read once at startup to derive each persona's PBKDF2 hash, then never
// consulted again - authentication always goes through verifyPassword.
// Overridable per-role via env so a deployment is not stuck with the
// prototype passwords that appear in this file.
//
// Alias emails (officer.patil@mhcyber.gov.in and friends) resolve to the same
// account through getUserByEmail; they share the primary password rather than
// having one of their own.
const SEED_CREDENTIALS: Record<string, string> = {
  'admin@example.demo': process.env.SEED_PW_ADMIN || 'Admin@123',
  'senior@example.demo': process.env.SEED_PW_SENIOR || 'Police@123',
  'investigator@example.demo': process.env.SEED_PW_IO || 'Patil@123',
  'supervisor@example.demo': process.env.SEED_PW_SUPERVISOR || 'Deshmukh@123',
  'victim.verma@example.demo': process.env.SEED_PW_VICTIM || 'Victim@123',
  'compliance@example.demo': process.env.SEED_PW_VASP || 'Compliance@123',
  'court@example.demo': process.env.SEED_PW_COURT || 'Judge@123',
  'national@example.demo': process.env.SEED_PW_NATIONAL || 'National@123'
};

const INITIAL_USERS: DatabaseUser[] = SYSTEM_PERSONAS.map((persona) => {
  const primaryPwd = SEED_CREDENTIALS[persona.email] || 'Secure@123';
  // Random per-user salt. The previous `salt_${uid}_sih2026` scheme was
  // derived from public data, so the hashes were precomputable and identical
  // in every deployment - which defeats the point of salting.
  const { hash, salt } = hashPassword(primaryPwd);

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
  currentUser: SYSTEM_PERSONAS[1], // Default: ACP Sharma
  environment: {
    emergency_lockdown: false
  },
  workspaces: [
    { id: 1, name: 'Maharashtra Cyber Unit', state: 'Maharashtra', jurisdiction_code: 'MH-CYBER-01' },
    { id: 2, name: 'Delhi Police Cyber Hub', state: 'Delhi', jurisdiction_code: 'DL-CYBER-02' },
    { id: 3, name: 'National Central Hub (I4C)', state: 'Central', jurisdiction_code: 'IN-I4C-00' },
    { id: 4, name: 'Karnataka Cyber Crime Cell', state: 'Karnataka', jurisdiction_code: 'KA-CYBER-03' }
  ],
  vasps: [
    { id: 1, name: 'Binance International', code: 'BINANCE', contact_email: 'compliance@binance.com' },
    { id: 2, name: 'WazirX India', code: 'WAZIRX', contact_email: 'legal@wazirx.com' },
    { id: 3, name: 'CoinDCX', code: 'COINDCX', contact_email: 'nodal@coindcx.com' }
  ],
  // --------------------------------------------------------------------------
  // No seeded cases. Every officer tab (supervisor triage, IO "My Cases",
  // gazetted review desk, court dossier, national correlation) starts empty so
  // the operator can load one curated demo case live for the showcase, rather
  // than opening onto pre-populated fixtures (#17). The automated e2e and
  // security suites no longer rely on seeds either - each provisions the exact
  // cases its assertions need through the API (see e2e-flow-test.mjs and
  // security-test.mjs), which honours body.jurisdiction_code for LEA callers.
  // --------------------------------------------------------------------------
  cases: [] as StoredCase[],
  // No seeded notices. The Section 94 BNSS order is produced during the
  // walkthrough by the officer who drafts it and signed by the gazetted
  // officer who approves it - a pre-signed order in the seed would show a
  // signature nobody in the demo actually applied.
  notices: [] as StoredFreezeNotice[],
  audit_logs: [] as StoredAuditLog[],
  traces: [] as any[]
};

// ----------------------------------------------------------------------------
// 1a. Durable hydration + write-through
//
// memoryStore above is the single source of truth every reader uses. On boot
// we replace its cases/users/notices with whatever was last written to disk,
// so a restart no longer wipes filed complaints, created accounts, assignments
// and signed orders. On a truly fresh machine (no snapshot yet) we keep the
// seeds and write the first snapshot so the file exists from the outset.
//
// audit_logs are intentionally NOT restored: they already mirror to Postgres
// and re-loading a truncated 500-entry ring on every boot would be misleading.
// ----------------------------------------------------------------------------
const __snapshot = loadSnapshot();
if (__snapshot) {
  if (Array.isArray(__snapshot.users) && __snapshot.users.length > 0) {
    memoryStore.users = __snapshot.users;
  }
  if (Array.isArray(__snapshot.cases)) {
    memoryStore.cases = __snapshot.cases;
  }
  if (Array.isArray(__snapshot.notices)) {
    memoryStore.notices = __snapshot.notices;
  }
} else {
  // First boot: no touching of the Postgres let-bindings (still in their TDZ
  // this early), so write the seed snapshot straight through the disk layer.
  saveSnapshot({
    cases: memoryStore.cases,
    users: memoryStore.users,
    notices: memoryStore.notices
  });
}

/**
 * Write-through to disk (durable source of truth) after every mutation, plus a
 * best-effort Postgres mirror of the cases table. Kept off the hot read path -
 * only mutators call it. Safe to call at request time: by then the Postgres
 * pool below has finished initialising.
 */
function persist(): void {
  saveSnapshot({
    cases: memoryStore.cases,
    users: memoryStore.users,
    notices: memoryStore.notices
  });
}

/**
 * Best-effort upsert of one case into the Postgres replica. Fire-and-forget:
 * the durable snapshot is authoritative and getCasesForUser reads memory, so a
 * failed mirror only means the optional replica lags. ON CONFLICT keeps it
 * idempotent when the row already exists; a mismatched pre-existing schema just
 * makes the whole statement throw and get swallowed.
 */
function mirrorCaseToPostgres(c: StoredCase): void {
  if (!pgAvailable || !pool) return;
  pool
    .query(
      `INSERT INTO cases (case_number, victim_id, victim_name, workspace_id, jurisdiction_code, assigned_investigator_id, assigned_investigator_name, suspect_wallet_address, blockchain_network, loss_amount_inr, crime_type, target_vasp, vasp_id, classification, status, priority, freeze_notice_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       ON CONFLICT (case_number) DO UPDATE SET
         assigned_investigator_id = EXCLUDED.assigned_investigator_id,
         assigned_investigator_name = EXCLUDED.assigned_investigator_name,
         status = EXCLUDED.status,
         priority = EXCLUDED.priority,
         target_vasp = EXCLUDED.target_vasp,
         vasp_id = EXCLUDED.vasp_id,
         freeze_notice_id = EXCLUDED.freeze_notice_id`,
      [
        c.case_number,
        c.victim_id ?? null,
        c.victim_name ?? null,
        c.workspace_id ?? null,
        c.jurisdiction_code ?? null,
        c.assigned_investigator_id ?? null,
        c.assigned_investigator_name ?? null,
        c.suspect_wallet_address ?? null,
        c.blockchain_network ?? null,
        c.loss_amount_inr ?? null,
        c.crime_type ?? null,
        c.target_vasp ?? null,
        c.vasp_id ?? null,
        c.classification ?? null,
        c.status ?? null,
        c.priority ?? null,
        c.freeze_notice_id ?? null
      ]
    )
    .catch(() => {});
}

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

  pool.query('SELECT 1', (err) => {
    if (err) {
      pgAvailable = false;
    } else {
      pgAvailable = true;
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

        // Mirror tables for the durable store. The disk snapshot is the source
        // of truth; these exist only so a running Postgres has a live replica
        // to query. Columns align with the createCase/updateCase mirror writes.
        // IF NOT EXISTS means a richer pre-existing schema (e.g. a teammate's
        // migration) is left untouched and the mirror writes degrade quietly.
        pool.query(`
          CREATE TABLE IF NOT EXISTS cases (
            case_number VARCHAR(100) PRIMARY KEY,
            victim_id INTEGER,
            victim_name VARCHAR(150),
            workspace_id INTEGER,
            jurisdiction_code VARCHAR(50),
            assigned_investigator_id INTEGER,
            assigned_investigator_name VARCHAR(150),
            suspect_wallet_address VARCHAR(120),
            blockchain_network VARCHAR(50),
            loss_amount_inr NUMERIC,
            crime_type VARCHAR(150),
            target_vasp VARCHAR(120),
            vasp_id INTEGER,
            classification VARCHAR(30),
            status VARCHAR(50),
            priority VARCHAR(20),
            freeze_notice_id VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `).catch(() => {});

        pool.query(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            uid VARCHAR(80),
            name VARCHAR(150),
            email VARCHAR(150),
            role VARCHAR(60),
            jurisdiction_code VARCHAR(50),
            clearance_level VARCHAR(30),
            is_gazetted BOOLEAN,
            vasp_id INTEGER,
            is_active BOOLEAN DEFAULT TRUE
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
  return (
    memoryStore.users.find(
      (u) =>
        u.email.toLowerCase() === normalized ||
        (u.alias_emails && u.alias_emails.some((a) => a.toLowerCase() === normalized))
    ) || null
  );
}

export function getUserById(id: number | string): AppUser | null {
  return (
    memoryStore.users.find(
      (u) =>
        String(u.id) === String(id) ||
        u.uid === String(id) ||
        u.email.toLowerCase() === String(id).toLowerCase() ||
        (u.alias_emails && u.alias_emails.some((a) => a.toLowerCase() === String(id).toLowerCase()))
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

  if (dbUser.is_active === false) {
    return { success: false, error: 'Account has been disabled by System Administrator.' };
  }

  const isMatch = verifyPassword(password, dbUser.password_hash, dbUser.salt);

  // There is deliberately no plaintext comparison against SEED_CREDENTIALS
  // here. A fallback that accepts the raw seed password whenever the PBKDF2
  // check fails is an authentication bypass: it makes the hash decorative and
  // means any change to the hashing parameters silently stops being enforced.
  // SEED_CREDENTIALS is used once, at startup, to derive the stored hashes.

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
// System Admin User Management Functions
// ----------------------------------------------------------------------------
export function getSystemUsers(): AppUser[] {
  return memoryStore.users.map(({ password_hash, salt, ...u }) => u);
}

export function createSystemUser(userData: {
  name: string;
  email: string;
  role: RoleName;
  password?: string;
  workspace_id?: number | null;
  jurisdiction_code?: string | null;
  clearance_level?: string;
  is_gazetted?: boolean;
}): AppUser {
  const nextId = Math.max(...memoryStore.users.map((u) => u.id), 0) + 1;
  const pwd = userData.password || 'Secure@123';
  // Random salt. `salt_user_${id}` was derived from a predictable value, so the
  // hash for a given password was the same in every deployment.
  const { hash, salt } = hashPassword(pwd);

  const newUser: DatabaseUser = {
    id: nextId,
    uid: `usr-${nextId}-${Date.now().toString(36)}`,
    name: userData.name,
    email: userData.email.toLowerCase().trim(),
    role: normalizeRole(userData.role),
    role_id: nextId,
    workspace_id: userData.workspace_id ?? 1,
    jurisdiction_code: userData.jurisdiction_code ?? 'MH-CYBER-01',
    clearance_level: userData.clearance_level ?? 'RESTRICTED',
    is_gazetted: Boolean(userData.is_gazetted),
    vasp_id: null,
    offline: true,
    is_active: true,
    password_hash: hash,
    salt
  };

  memoryStore.users.push(newUser);
  persist();
  const { password_hash, salt: s, ...safeUser } = newUser;
  return safeUser;
}

export function updateUserStatus(userId: number | string, isActive: boolean): boolean {
  const user = memoryStore.users.find((u) => String(u.id) === String(userId) || u.uid === String(userId));
  if (!user) return false;
  user.is_active = isActive;
  persist();
  return true;
}

export function updateUserRole(userId: number | string, newRole: RoleName): boolean {
  const user = memoryStore.users.find((u) => String(u.id) === String(userId) || u.uid === String(userId));
  if (!user) return false;
  user.role = normalizeRole(newRole);
  persist();
  return true;
}

export function resetUserPassword(userId: number | string, newPassword?: string): boolean {
  const user = memoryStore.users.find((u) => String(u.id) === String(userId) || u.uid === String(userId));
  if (!user) return false;
  const pwd = newPassword || 'Secure@123';
  // Fresh random salt on every reset, so a reset never reproduces a hash an
  // attacker could have precomputed from the user id.
  const { hash, salt } = hashPassword(pwd);
  user.password_hash = hash;
  user.salt = salt;
  persist();
  return true;
}

/**
 * Hard-delete a user account.
 *
 * Guards a data invariant the API layer cannot: the platform must always retain
 * at least one System Administrator, or it locks itself out of user management
 * entirely. (Guarding against deleting *yourself* needs the acting user's id
 * and lives in the API route.) Returns the removed account (minus secrets) so
 * the caller can mirror the delete to Keycloak.
 */
export function deleteSystemUser(userId: number | string): { success: boolean; error?: string; user?: AppUser } {
  const idx = memoryStore.users.findIndex((u) => String(u.id) === String(userId) || u.uid === String(userId));
  if (idx < 0) return { success: false, error: 'No such user account on record.' };

  const target = memoryStore.users[idx];
  if (normalizeRole(target.role) === 'SYSTEM_ADMIN') {
    const remainingAdmins = memoryStore.users.filter(
      (u) => u.id !== target.id && normalizeRole(u.role) === 'SYSTEM_ADMIN' && u.is_active !== false
    );
    if (remainingAdmins.length === 0) {
      return { success: false, error: 'Cannot delete the last System Administrator account.' };
    }
  }

  memoryStore.users.splice(idx, 1);
  persist();
  const { password_hash, salt, ...safe } = target;
  return { success: true, user: safe };
}

// ----------------------------------------------------------------------------
// 4. Immutable Audit Logging (BSA 2023 Sec 63 / 65B Admissibility)
// ----------------------------------------------------------------------------
export function recordAuditLog(log: Omit<StoredAuditLog, 'id' | 'timestamp'>): StoredAuditLog {
  const entry: StoredAuditLog = {
    id: `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...log
  };
  memoryStore.audit_logs.unshift(entry);
  if (memoryStore.audit_logs.length > 500) {
    memoryStore.audit_logs.pop();
  }

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
  // memoryStore.cases is the disk-backed source of truth. Reading Postgres here
  // instead (as this used to) meant the assignee an assignment wrote to memory
  // never came back on the next read, because updateCase only mirrored `status`
  // to PG - the exact "assignment never reaches the field officer" bug. The PG
  // table is now a write-only replica; reads always come from the durable store.
  return filterCasesByScope(user, memoryStore.cases);
}

export function getCaseByIdOrNumber(caseIdOrNumber: string | number): StoredCase | null {
  const target = String(caseIdOrNumber).trim();
  return (
    memoryStore.cases.find(
      (c) => String(c.id) === target || c.case_number.toLowerCase() === target.toLowerCase()
    ) || null
  );
}

export async function createCase(newCase: Partial<StoredCase>): Promise<StoredCase> {
  if (newCase.case_number) {
    const existing = getCaseByIdOrNumber(newCase.case_number);
    if (existing) {
      existing.freeze_notice_id = undefined;
      existing.escrow_ref = undefined;
      existing.account_uid = undefined;
      memoryStore.notices = memoryStore.notices.filter(
        (n) => n.case_number !== newCase.case_number && n.notice?.case_number !== newCase.case_number
      );
      Object.assign(existing, newCase);
      persist();
      return existing;
    }
  }

  const caseObj: StoredCase = {
    // Max + 1, not length + 1: with unshift/delete in play, length-based ids
    // collide with existing rows and two cases end up sharing an id.
    id: Math.max(0, ...memoryStore.cases.map((c) => c.id)) + 1,
    case_number: newCase.case_number || `CRIME-${Date.now().toString().slice(-6)}`,
    victim_id: newCase.victim_id || 5,
    victim_name: newCase.victim_name || (newCase.victim_id === 5 ? 'Rajesh Verma' : 'Complainant'),
    victim_email: newCase.victim_email || (newCase.victim_id === 5 ? 'victim.verma@example.demo' : undefined),
    workspace_id: newCase.workspace_id || 1,
    jurisdiction_code: newCase.jurisdiction_code || 'MH-CYBER-01',
    // A new complaint arrives unallocated. Allocation is the supervisor's
    // decision under the unit workflow, so defaulting it to an officer here
    // would silently perform a step the platform is meant to record.
    assigned_investigator_id: newCase.assigned_investigator_id ?? null,
    assigned_investigator_name: newCase.assigned_investigator_name,
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
    priority: newCase.priority || 'HIGH',
    created_at: newCase.created_at || new Date().toISOString(),
    tx_hashes: newCase.tx_hashes || [],
    freeze_notice_id: newCase.freeze_notice_id,
    notes: newCase.notes || ''
  };

  // Durable store first: this is what getCasesForUser reads, so a new complaint
  // has to land here to be visible. The previous code returned the Postgres row
  // WITHOUT unshifting to memory when PG was up, so freshly-filed cases silently
  // vanished from every list. Postgres is now a best-effort replica only.
  memoryStore.cases.unshift(caseObj);
  persist();
  mirrorCaseToPostgres(caseObj);
  return caseObj;
}

export async function updateCase(
  caseIdOrNumber: string | number,
  updates: Partial<StoredCase>
): Promise<StoredCase | null> {
  const found = getCaseByIdOrNumber(caseIdOrNumber);
  if (!found) return null;

  Object.assign(found, updates);
  // Disk write makes every field durable - crucially the assignee, which the old
  // status-only PG mirror dropped. mirrorCaseToPostgres upserts the full row.
  persist();
  mirrorCaseToPostgres(found);

  return found;
}

/**
 * Hard-delete a case. Used by the victim "withdraw complaint" path. The caller
 * (API layer) enforces WHO may delete and WHEN (owning victim, still
 * PENDING_TRACING, no freeze order issued) - this function only performs the
 * removal and keeps the durable store + replica in step.
 */
export async function deleteCase(caseIdOrNumber: string | number): Promise<{ success: boolean; error?: string }> {
  const target = String(caseIdOrNumber).trim();
  const idx = memoryStore.cases.findIndex(
    (c) => String(c.id) === target || c.case_number.toLowerCase() === target.toLowerCase()
  );
  if (idx === -1) return { success: false, error: 'Case not found.' };

  const [removed] = memoryStore.cases.splice(idx, 1);
  // Drop any notices bound to the case too, so a re-filed complaint with the
  // same number does not inherit a stale order.
  memoryStore.notices = memoryStore.notices.filter(
    (n) => n.case_number !== removed.case_number && n.notice?.case_number !== removed.case_number
  );
  persist();

  if (pgAvailable && pool) {
    pool.query('DELETE FROM cases WHERE case_number = $1', [removed.case_number]).catch(() => {});
  }

  return { success: true };
}

// ----------------------------------------------------------------------------
// 6. Section 94 BNSS Legal Freeze Notices (Statutory Gate + Audit Log)
// ----------------------------------------------------------------------------
export async function getNoticesForUser(user: SubjectAttributes): Promise<StoredFreezeNotice[]> {
  const normRole = normalizeRole(user.role);
  const filtered =
    normRole === 'VASP_COMPLIANCE_OFFICER' || user.role === 'EXCHANGE_NODAL_OFFICER'
      ? memoryStore.notices.filter((n) => {
          if (!user.vasp_id) return false;
          if (n.vasp_id && n.vasp_id === user.vasp_id) return true;
          if (user.vasp_name && n.target_vasp && n.target_vasp.toLowerCase().includes(user.vasp_name.toLowerCase())) return true;
          return false;
        })
      : memoryStore.notices;

  return filtered.filter(Boolean).map((n) => {
    const linkedCase = n.case_number ? getCaseByIdOrNumber(n.case_number) : null;
    n.notice = ensureLegalNotice(n.notice, {
      ...n,
      loss_amount_inr: linkedCase?.loss_amount_inr,
      suspect_wallet_address: linkedCase?.suspect_wallet_address
    });
    return n;
  });
}

/**
 * Reduce a stored notice to just the fields the signature covers.
 *
 * Kept deliberately small. Every field here is one whose alteration should
 * invalidate the order - the case it concerns, the wallets restrained, the sum,
 * the statute, the exchange it is addressed to. Presentation (rendered text,
 * covering paragraphs, contact emails) is excluded on purpose: re-rendering the
 * document must not break a valid signature.
 *
 * Both signing and verification go through this function, so the two can never
 * drift apart.
 */
function signableFromNotice(n: StoredFreezeNotice, linkedCase?: StoredCase | null): SignableOrder {
  const notice = n.notice || {};
  const addresses: string[] =
    Array.isArray(notice.targetAddresses) && notice.targetAddresses.length > 0
      ? notice.targetAddresses
      : linkedCase?.suspect_wallet_address
      ? [linkedCase.suspect_wallet_address]
      : [];

  return {
    ref: notice.ref || n.id,
    case_number: n.case_number || linkedCase?.case_number || '',
    target_addresses: addresses,
    blockchain_network: linkedCase?.blockchain_network || notice.walletTrail?.[0]?.chain || 'Ethereum',
    amount_inr: Number(notice.amountInr ?? linkedCase?.loss_amount_inr ?? 0),
    statute: notice.statute || 'Section 94 BNSS, 2023',
    target_vasp: n.target_vasp
  };
}

/**
 * The public half of an officer's signing key, so a verifier can repeat the
 * check outside this platform instead of taking its word for it.
 */
export function officerSigningKey(officerUid: string) {
  return officerPublicKey(officerUid);
}

/**
 * Verify a stored order. Exposed so both the exchange desk and the court can
 * check the order in front of them rather than being asked to trust a badge on
 * a screen.
 */
export function verifyStoredNotice(noticeId: string): { found: boolean; result?: VerificationResult; notice?: StoredFreezeNotice } {
  const stored = memoryStore.notices.find((n) => n.id === noticeId);
  if (!stored) return { found: false };
  const linkedCase = stored.case_number ? getCaseByIdOrNumber(stored.case_number) : null;
  return {
    found: true,
    notice: stored,
    result: verifyOrderSignature(signableFromNotice(stored, linkedCase), stored.signature)
  };
}

/**
 * Record what the exchange reported back about a served requisition.
 *
 * Two stages, matching real Section 94 BNSS service. The order is served on the
 * exchange's nodal officer out of band; the exchange freezes on its OWN systems
 * and replies. This function records that reply. It does not freeze anything.
 *
 * Only the addressed exchange may write here - a police account cannot record a
 * response on the exchange's behalf, because a fabricated compliance reply is
 * exactly the kind of record that would collapse under cross-examination.
 */
export async function recordVaspResponse(
  noticeId: string,
  stage: 'acknowledge' | 'report_action',
  payload: Partial<VaspResponse>,
  actingOfficer: AppUser
): Promise<{ success: boolean; notice?: StoredFreezeNotice; error?: string }> {
  const normRole = normalizeRole(actingOfficer.role);
  if (normRole !== 'VASP_COMPLIANCE_OFFICER' && actingOfficer.role !== 'EXCHANGE_NODAL_OFFICER') {
    return {
      success: false,
      error: 'Access Denied: Only the addressed exchange can record a compliance response. Law enforcement cannot reply on a VASP\'s behalf.'
    };
  }

  const idx = memoryStore.notices.findIndex((n) => n.id === noticeId);
  if (idx < 0) return { success: false, error: 'No such requisition on this desk.' };
  const stored = memoryStore.notices[idx];

  if (actingOfficer.vasp_id && stored.vasp_id && actingOfficer.vasp_id !== stored.vasp_id) {
    recordAuditLog({
      user_id: actingOfficer.id,
      user_name: actingOfficer.name,
      user_role: actingOfficer.role,
      action: 'VASP_RESPONSE_CROSS_ORG',
      resource_type: 'FREEZE_NOTICE',
      resource_id: noticeId,
      decision: 'DENIED',
      reason: `VASP isolation: exchange #${actingOfficer.vasp_id} attempted to answer a requisition addressed to exchange #${stored.vasp_id}.`
    });
    return { success: false, error: 'Access Denied: This requisition is addressed to a different exchange.' };
  }

  if (stored.status === 'Draft') {
    return { success: false, error: 'This requisition has not been issued yet. There is nothing to respond to.' };
  }

  // An exchange should not be answering an order it cannot verify. Checking
  // here means a tampered order cannot collect a compliance response that
  // would later look like the exchange had accepted it.
  const linkedCase = stored.case_number ? getCaseByIdOrNumber(stored.case_number) : null;
  const verification = verifyOrderSignature(signableFromNotice(stored, linkedCase), stored.signature);
  if (!verification.valid) {
    recordAuditLog({
      user_id: actingOfficer.id,
      user_name: actingOfficer.name,
      user_role: actingOfficer.role,
      action: 'VASP_RESPONSE_ON_UNVERIFIED_ORDER',
      resource_type: 'FREEZE_NOTICE',
      resource_id: noticeId,
      decision: 'DENIED',
      reason: verification.reason,
      statutory_code: 'SEC_94_BNSS_SIGNATURE_INVALID'
    });
    return {
      success: false,
      error: `This requisition cannot be acted upon: ${verification.reason}`
    };
  }

  const existing = stored.vasp_response || {};
  const now = new Date().toISOString();

  if (stage === 'acknowledge') {
    if (existing.acknowledged_at) {
      return { success: false, error: 'Receipt of this requisition has already been acknowledged.' };
    }
    const issuedAt = stored.signature?.signed_at ? new Date(stored.signature.signed_at).getTime() : stored.created_at;
    stored.vasp_response = {
      ...existing,
      acknowledged_at: now,
      acknowledged_by: payload.acknowledged_by || actingOfficer.name,
      ack_latency_minutes: Math.max(0, Math.round((Date.now() - issuedAt) / 60000))
    };
    stored.status = 'Acknowledged';
  } else {
    if (!existing.acknowledged_at) {
      return { success: false, error: 'Acknowledge receipt of the requisition before reporting action taken.' };
    }
    if (existing.action_reported_at) {
      return { success: false, error: 'Action taken on this requisition has already been reported.' };
    }
    const action = (payload as any).action_taken || ((payload as any).action !== 'report_action' ? (payload as any).action : undefined);
    if (action !== 'FREEZE_EXECUTED' && action !== 'PARTIAL_FREEZE' && action !== 'REFUSED') {
      return { success: false, error: 'Report the action taken: freeze executed, partial freeze, or refused.' };
    }
    // A refusal or a partial freeze without a stated reason is not a usable
    // record - the investigator has to be able to say why in court.
    if ((action === 'REFUSED' || action === 'PARTIAL_FREEZE') && !String(payload.reason || '').trim()) {
      return { success: false, error: 'A reason is required when a freeze is refused or only partially executed.' };
    }
    if (!String(payload.exchange_ref_no || '').trim()) {
      return { success: false, error: 'Your exchange reference number is required so the two records can be tied together.' };
    }
    if (!String(payload.executed_by || '').trim()) {
      return { success: false, error: 'Name the person at your organisation who carried out this action.' };
    }

    stored.vasp_response = {
      ...existing,
      action,
      action_reported_at: now,
      executed_by: String(payload.executed_by).trim(),
      exchange_ref_no: String(payload.exchange_ref_no).trim(),
      frozen_amount: payload.frozen_amount,
      reason: payload.reason ? String(payload.reason).trim() : undefined
    };

    // Case status follows what the exchange actually reported, not the fact
    // that a reply arrived. A refusal must not read as a freeze.
    if (linkedCase) {
      linkedCase.status = action === 'REFUSED' ? 'FREEZE_REFUSED' : 'FROZEN';
      if (pgAvailable && pool) {
        pool
          .query('UPDATE cases SET status = $1 WHERE case_number = $2', [linkedCase.status, linkedCase.case_number])
          .catch(() => {});
      }
    }
  }

  memoryStore.notices[idx] = stored;

  recordAuditLog({
    user_id: actingOfficer.id,
    user_name: actingOfficer.name,
    user_role: actingOfficer.role,
    action: stage === 'acknowledge' ? 'VASP_ACKNOWLEDGE_RECEIPT' : 'VASP_REPORT_ACTION_TAKEN',
    resource_type: 'FREEZE_NOTICE',
    resource_id: noticeId,
    decision: 'GRANTED',
    reason:
      stage === 'acknowledge'
        ? `${actingOfficer.name} acknowledged receipt of requisition ${noticeId} on behalf of ${stored.target_vasp} (${stored.vasp_response?.ack_latency_minutes} min after issue).`
        : `${stored.target_vasp} reported ${stored.vasp_response?.action} on requisition ${noticeId}, ref ${stored.vasp_response?.exchange_ref_no}, executed by ${stored.vasp_response?.executed_by}.`,
    statutory_code: 'SEC_94_BNSS_COMPLIANCE_RESPONSE'
  });

  // Durable: the exchange's acknowledgement / reported action and the linked
  // case's new status (FROZEN / FREEZE_REFUSED) must both survive a restart.
  persist();

  return { success: true, notice: stored };
}

export async function saveFreezeNotice(
  noticeData: Partial<StoredFreezeNotice>,
  actingOfficer: AppUser
): Promise<{ success: boolean; notice?: StoredFreezeNotice; error?: string; statutory_code?: string }> {
  const isDraft = noticeData.status === 'Draft';
  const isAck = noticeData.status === 'Acknowledged' || (noticeData as any).action === 'acknowledge';

  const existingIdx = memoryStore.notices.findIndex((n) => n.id === noticeData.id);
  const existingNotice = existingIdx >= 0 ? memoryStore.notices[existingIdx] : null;

  const mergedNoticeData = noticeData.notice !== undefined ? noticeData.notice : existingNotice?.notice;

  const targetCaseKey =
    noticeData.case_id ||
    noticeData.case_number ||
    existingNotice?.case_number ||
    (mergedNoticeData as any)?.case_number;
  const linkedCase = targetCaseKey ? getCaseByIdOrNumber(targetCaseKey) : null;

  // Strict VASP validation for acknowledgments
  if (isAck) {
    const normActingRole = normalizeRole(actingOfficer.role);
    if (normActingRole !== 'VASP_COMPLIANCE_OFFICER' && actingOfficer.role !== 'EXCHANGE_NODAL_OFFICER') {
      return {
        success: false,
        error: 'Access Denied: Only VASP Compliance Officers can acknowledge freeze notices on behalf of their exchange.'
      };
    }
    const targetVaspId = noticeData.vasp_id ?? existingNotice?.vasp_id ?? linkedCase?.vasp_id;
    if (actingOfficer.vasp_id && targetVaspId && actingOfficer.vasp_id !== targetVaspId) {
      return {
        success: false,
        error: 'Access Denied: VASP Compliance Officers can only respond to requests addressed to their own organization.'
      };
    }
  }

  // If issuing or approving a freeze order, enforce Section 94 BNSS statutory check
  if (!isDraft && !isAck) {
    // The real case is passed, not a literal `{ status: 'TRACED' }`. With the
    // status hardcoded, POL-05's "cannot approve a freeze on an untraced
    // allegation" precondition could never fire - it was being handed the
    // answer it was meant to be testing.
    const abacResult = evaluateABAC(
      actingOfficer,
      linkedCase || { status: 'PENDING_TRACING', vasp_id: noticeData.vasp_id },
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

  const resolvedNotice = ensureLegalNotice(mergedNoticeData, {
    ...existingNotice,
    ...noticeData,
    case_number: noticeData.case_number || existingNotice?.case_number || linkedCase?.case_number,
    target_vasp: noticeData.target_vasp || existingNotice?.target_vasp || linkedCase?.target_vasp,
    loss_amount_inr: linkedCase?.loss_amount_inr,
    suspect_wallet_address: linkedCase?.suspect_wallet_address
  });

  const resolvedCaseNumber =
    noticeData.case_number ?? existingNotice?.case_number ?? linkedCase?.case_number;
  const resolvedVasp = noticeData.target_vasp || existingNotice?.target_vasp || linkedCase?.target_vasp;

  // A notice that cannot name its case or its addressee is not serviceable and
  // must not be invented into existence. The previous defaults here silently
  // pinned every malformed notice to MH-CYBER-2026-0842 / Binance.
  if (!isDraft && (!resolvedCaseNumber || !resolvedVasp)) {
    return {
      success: false,
      error: 'Cannot issue a requisition without a case number and an addressed exchange.'
    };
  }

  const stored: StoredFreezeNotice = {
    id: noticeData.id || existingNotice?.id || `NOTICE-${Date.now()}`,
    case_id: noticeData.case_id ?? existingNotice?.case_id ?? (linkedCase?.id as any),
    case_number: resolvedCaseNumber,
    target_vasp: resolvedVasp || '',
    vasp_id: noticeData.vasp_id ?? existingNotice?.vasp_id ?? linkedCase?.vasp_id,
    status: isDraft ? 'Draft' : (noticeData.status || existingNotice?.status || 'Issued'),
    drafted_by_name: noticeData.drafted_by_name || existingNotice?.drafted_by_name || actingOfficer.name,
    approved_by_name: isDraft
      ? undefined
      : isAck
      ? noticeData.approved_by_name || existingNotice?.approved_by_name || actingOfficer.name
      : actingOfficer.name,
    created_at: existingNotice?.created_at || Date.now(),
    notice: resolvedNotice,
    // An acknowledgement must not re-sign: the signature belongs to the officer
    // who issued, and the exchange replying to it cannot alter what was signed.
    signature: existingNotice?.signature,
    vasp_response: existingNotice?.vasp_response
  };

  // ── Digital signature, Section 94 BNSS ────────────────────────────────────
  // Applied at the moment of issue, by the gazetted officer who issued. This is
  // the only step that makes the order more than a formatted document: the
  // exchange and the court can both recompute it without trusting this server.
  if (!isDraft && !isAck) {
    try {
      stored.signature = signOrder(signableFromNotice(stored, linkedCase), {
        uid: String(actingOfficer.id),
        name: actingOfficer.name,
        role: actingOfficer.role,
        badge: (actingOfficer as any).badge_number,
        is_gazetted: Boolean(actingOfficer.is_gazetted)
      });
    } catch (err: any) {
      return { success: false, error: `Order could not be signed: ${err?.message || 'signing failed'}` };
    }
  }

  if (existingIdx >= 0) {
    memoryStore.notices[existingIdx] = stored;
  } else {
    memoryStore.notices.unshift(stored);
  }

  if (targetCaseKey && linkedCase) {
    // Acknowledgement no longer drives the case to FROZEN. An exchange
    // acknowledging receipt has confirmed it holds the order, nothing more;
    // the case only becomes FROZEN when the exchange reports it acted, which
    // arrives through recordVaspResponse.
    if (stored.status === 'Issued' && linkedCase.status !== 'FROZEN') {
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

  // Durable: the draft/issued/acknowledged notice, its Ed25519 signature, and
  // the linked case's NOTICE_SERVED status must all survive a restart.
  persist();

  return { success: true, notice: stored };
}
