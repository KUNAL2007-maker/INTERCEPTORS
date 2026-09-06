/**
 * RBAC and ABAC Policy Engine for SIH26183 Crypto Fraud Attribution Platform
 * Directly ported from AUTH_RBAC_ABAC for Next.js full-stack integration.
 */

export type RoleName =
  | 'VICTIM'
  | 'NORMAL_INVESTIGATOR'
  | 'SENIOR_INVESTIGATOR'
  | 'WORKSPACE_ADMIN'
  | 'SUPER_ADMIN'
  | 'EXCHANGE_NODAL_OFFICER'
  | 'AUDITOR';

export const ROLES: Record<string, RoleName> = {
  VICTIM: 'VICTIM',
  NORMAL_INVESTIGATOR: 'NORMAL_INVESTIGATOR',
  SENIOR_INVESTIGATOR: 'SENIOR_INVESTIGATOR',
  WORKSPACE_ADMIN: 'WORKSPACE_ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  EXCHANGE_NODAL_OFFICER: 'EXCHANGE_NODAL_OFFICER',
  AUDITOR: 'AUDITOR'
};

export const PERMISSIONS = {
  // Victim
  COMPLAINT_CREATE: 'complaint:create',
  TX_HASH_UPLOAD: 'tx_hash:upload',
  COMPLAINT_STATUS_READ: 'complaint_status:read',

  // Investigator
  CASE_READ_ASSIGNED: 'case:read_assigned',
  WALLET_GRAPH_READ: 'wallet_graph:read',
  FREEZE_NOTICE_DRAFT: 'freeze_notice:draft',

  // Senior Investigator
  CROSS_CHAIN_TRACE: 'cross_chain:trace',
  FREEZE_ORDER_APPROVE: 'freeze_order:approve',
  EVIDENCE_ANCHOR_EXECUTE: 'evidence_anchor:execute',

  // Workspace Admin
  POLICE_ACCOUNT_MANAGE: 'police_account:manage',
  CASE_ASSIGN: 'case:assign',

  // Super Admin
  WORKSPACE_CREATE: 'workspace:create',
  SYSTEM_CONFIG_UPDATE: 'system_config:update',
  EMERGENCY_LOCKDOWN_TRIGGER: 'emergency_lockdown:trigger',

  // Exchange Nodal Officer
  FREEZE_CONFIRM: 'freeze:confirm',
  KYC_METADATA_SUBMIT: 'kyc_metadata:submit',

  // Judicial Auditor
  AUDIT_LOG_READ: 'audit_log:read',
  BLOCKCHAIN_HASH_VERIFY: 'blockchain_hash:verify'
};

export const ROLE_PERMISSIONS: Record<RoleName, string[]> = {
  VICTIM: [
    PERMISSIONS.COMPLAINT_CREATE,
    PERMISSIONS.TX_HASH_UPLOAD,
    PERMISSIONS.COMPLAINT_STATUS_READ
  ],
  NORMAL_INVESTIGATOR: [
    PERMISSIONS.CASE_READ_ASSIGNED,
    PERMISSIONS.WALLET_GRAPH_READ,
    PERMISSIONS.FREEZE_NOTICE_DRAFT
  ],
  SENIOR_INVESTIGATOR: [
    PERMISSIONS.CASE_READ_ASSIGNED,
    PERMISSIONS.WALLET_GRAPH_READ,
    PERMISSIONS.FREEZE_NOTICE_DRAFT,
    PERMISSIONS.CROSS_CHAIN_TRACE,
    PERMISSIONS.FREEZE_ORDER_APPROVE,
    PERMISSIONS.EVIDENCE_ANCHOR_EXECUTE
  ],
  WORKSPACE_ADMIN: [
    PERMISSIONS.CASE_READ_ASSIGNED,
    PERMISSIONS.WALLET_GRAPH_READ,
    PERMISSIONS.POLICE_ACCOUNT_MANAGE,
    PERMISSIONS.CASE_ASSIGN
  ],
  SUPER_ADMIN: [
    PERMISSIONS.CASE_READ_ASSIGNED,
    PERMISSIONS.WALLET_GRAPH_READ,
    PERMISSIONS.FREEZE_NOTICE_DRAFT,
    PERMISSIONS.CROSS_CHAIN_TRACE,
    PERMISSIONS.FREEZE_ORDER_APPROVE,
    PERMISSIONS.EVIDENCE_ANCHOR_EXECUTE,
    PERMISSIONS.POLICE_ACCOUNT_MANAGE,
    PERMISSIONS.CASE_ASSIGN,
    PERMISSIONS.WORKSPACE_CREATE,
    PERMISSIONS.SYSTEM_CONFIG_UPDATE,
    PERMISSIONS.EMERGENCY_LOCKDOWN_TRIGGER,
    PERMISSIONS.AUDIT_LOG_READ,
    PERMISSIONS.BLOCKCHAIN_HASH_VERIFY
  ],
  EXCHANGE_NODAL_OFFICER: [
    PERMISSIONS.FREEZE_CONFIRM,
    PERMISSIONS.KYC_METADATA_SUBMIT
  ],
  AUDITOR: [
    PERMISSIONS.AUDIT_LOG_READ,
    PERMISSIONS.BLOCKCHAIN_HASH_VERIFY
  ]
};

export function hasPermission(role: RoleName, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

// ----------------------------------------------------------------------------
// 7 STATUTORY ABAC POLICIES
// ----------------------------------------------------------------------------
export const CLEARANCE_HIERARCHY: Record<string, number> = {
  PUBLIC: 1,
  RESTRICTED: 2,
  CONFIDENTIAL: 3,
  TOP_SECRET: 4,
  VASP_EXTERNAL: 0
};

export type ClearanceLevel = 'PUBLIC' | 'RESTRICTED' | 'CONFIDENTIAL' | 'TOP_SECRET' | 'VASP_EXTERNAL';

export type SubjectAttributes = {
  id?: number | string;
  role: RoleName;
  workspace_id?: number | null;
  jurisdiction_code?: string | null;
  clearance_level?: string;
  is_gazetted?: boolean;
  vasp_id?: number | null;
};

export type ResourceAttributes = {
  id?: number | string;
  reported_by?: number | string;
  victim_id?: number | string;
  workspace_id?: number | null;
  jurisdiction_code?: string | null;
  classification?: string;
  status?: string;
  target_vasp?: string | null;
  vasp_id?: number | null;
};

export type EnvironmentAttributes = {
  emergency_lockdown?: boolean;
  ip?: string;
  timestamp?: number;
};

export type ABACEvaluationResult = {
  decision: 'PERMIT' | 'DENY';
  policyId: string | null;
  reason: string;
};

export function evaluateABAC(
  subject: SubjectAttributes,
  resource: ResourceAttributes | null,
  action: string,
  environment: EnvironmentAttributes = {}
): ABACEvaluationResult {
  // POL-01: National Emergency Lockdown
  if (environment.emergency_lockdown) {
    if (subject.role !== 'SUPER_ADMIN') {
      return {
        decision: 'DENY',
        policyId: 'POL-01-EMERGENCY-LOCKDOWN',
        reason: 'National Cyber Emergency Lockdown is active. State operations are frozen.'
      };
    }
  }

  // POL-02: Judicial Zero-Write Restriction
  if (subject.role === 'AUDITOR') {
    const act = (action || '').toLowerCase();
    if (['write', 'create', 'update', 'delete', 'freeze_draft', 'freeze_approve', 'admin_override', 'file_complaint'].includes(act)) {
      return {
        decision: 'DENY',
        policyId: 'POL-02-JUDICIAL-READ-ONLY',
        reason: 'Judicial / Auditor accounts possess absolute 0 write or mutation permissions under BSA 2023 Sec 65B.'
      };
    }
  }

  // If there's no resource to check, permit general non-restricted actions
  if (!resource) {
    return { decision: 'PERMIT', policyId: null, reason: 'No resource constraints triggered.' };
  }

  // POL-03: Victim Case Isolation
  if (subject.role === 'VICTIM') {
    const ownerId = resource.reported_by ?? resource.victim_id;
    if (ownerId && String(ownerId) !== String(subject.id)) {
      return {
        decision: 'DENY',
        policyId: 'POL-03-VICTIM-ISOLATION',
        reason: 'Victims can only access their own submitted complaints.'
      };
    }
  }

  // POL-04: Territorial Jurisdiction Boundary
  if (['NORMAL_INVESTIGATOR', 'SENIOR_INVESTIGATOR', 'WORKSPACE_ADMIN'].includes(subject.role)) {
    if (subject.jurisdiction_code && resource.jurisdiction_code) {
      if (subject.jurisdiction_code !== resource.jurisdiction_code && subject.jurisdiction_code !== 'IN-I4C-00') {
        return {
          decision: 'DENY',
          policyId: 'POL-04-JURISDICTION-BOUNDARY',
          reason: `Cross-jurisdiction boundary violation: User (${subject.jurisdiction_code}) cannot access (${resource.jurisdiction_code}) case.`
        };
      }
    }
  }

  // POL-05: Statutory Freeze Approval under Section 94 BNSS
  if (action === 'freeze_approve') {
    if (!subject.is_gazetted) {
      return {
        decision: 'DENY',
        policyId: 'POL-05-STATUTORY-FREEZE-APPROVAL',
        reason: 'Section 94 BNSS statutory freeze orders require a Gazetted Senior Police Officer (SP/DCP/Senior PI).'
      };
    }
    if (resource.status !== 'TRACED') {
      return {
        decision: 'DENY',
        policyId: 'POL-05-STATUTORY-FREEZE-APPROVAL',
        reason: 'Statutory freeze order cannot be approved on untraced allegations. Case must be TRACED first.'
      };
    }
  }

  // POL-06: VASP Desk Isolation
  if (subject.role === 'EXCHANGE_NODAL_OFFICER') {
    if (subject.vasp_id && resource.vasp_id && subject.vasp_id !== resource.vasp_id) {
      return {
        decision: 'DENY',
        policyId: 'POL-06-VASP-DESK-ISOLATION',
        reason: 'Exchange compliance officer cannot inspect legal notices directed to competing exchanges.'
      };
    }
  }

  // POL-07: Data Classification & Clearance
  if (resource.classification) {
    const userClearance = CLEARANCE_HIERARCHY[subject.clearance_level || 'PUBLIC'] || 1;
    const resourceReq = CLEARANCE_HIERARCHY[resource.classification] || 1;
    if (userClearance < resourceReq) {
      return {
        decision: 'DENY',
        policyId: 'POL-07-DATA-CLASSIFICATION',
        reason: `Insufficient security clearance: (${subject.clearance_level || 'PUBLIC'}) vs required (${resource.classification}).`
      };
    }
  }

  return { decision: 'PERMIT', policyId: null, reason: 'All statutory ABAC policy conditions satisfied.' };
}

// ----------------------------------------------------------------------------
// DYNAMIC SCOPE FILTER FOR CASE QUERIES
// ----------------------------------------------------------------------------
export function filterCasesByScope(user: SubjectAttributes, cases: any[]): any[] {
  if (!user || !cases) return [];
  if (user.role === 'SUPER_ADMIN') return cases;

  return cases.filter(c => {
    // 1. Victim Isolation (A citizen strictly accesses only cases matching their own victim ID)
    if (user.role === 'VICTIM') {
      const ownerId = c.reported_by ?? c.victim_id;
      return String(ownerId) === String(user.id);
    }

    // 2. Data classification for police & intelligence units
    const userClearance = CLEARANCE_HIERARCHY[user.clearance_level || 'PUBLIC'] || 1;
    const reqClearance = CLEARANCE_HIERARCHY[c.classification || 'PUBLIC'] || 1;
    if (userClearance < reqClearance) return false;

    // 3. Exchange Nodal Isolation
    if (user.role === 'EXCHANGE_NODAL_OFFICER') {
      return user.vasp_id && c.vasp_id === user.vasp_id;
    }

    // 4. State Jurisdiction
    if (['NORMAL_INVESTIGATOR', 'SENIOR_INVESTIGATOR', 'WORKSPACE_ADMIN'].includes(user.role)) {
      if (user.jurisdiction_code && user.jurisdiction_code !== 'IN-I4C-00') {
        return c.jurisdiction_code === user.jurisdiction_code;
      }
    }

    return true;
  });
}

// ----------------------------------------------------------------------------
// PRE-SEEDED SYSTEM PERSONAS (Matching DATABASE/db/seed.sql)
// ----------------------------------------------------------------------------
export type AppUser = {
  id: number;
  uid: string;
  name: string;
  email: string;
  role: RoleName;
  role_id: number;
  workspace_id: number | null;
  jurisdiction_code: string | null;
  clearance_level: string;
  is_gazetted: boolean;
  vasp_id: number | null;
  vasp_name?: string;
  badge?: string;
  offline: boolean;
};

export const SYSTEM_PERSONAS: AppUser[] = [
  {
    id: 2,
    uid: 'senior-sharma',
    name: 'Officer Sharma (MH Cyber)',
    email: 'senior.sharma@mhcyber.gov.in',
    role: 'SENIOR_INVESTIGATOR',
    role_id: 3,
    workspace_id: 1,
    jurisdiction_code: 'MH-CYBER-01',
    clearance_level: 'CONFIDENTIAL',
    is_gazetted: true,
    vasp_id: null,
    badge: 'MH-POLICE-884',
    offline: true
  },
  {
    id: 3,
    uid: 'patil-sub-inspector',
    name: 'Sub-Inspector Patil',
    email: 'officer.patil@mhcyber.gov.in',
    role: 'NORMAL_INVESTIGATOR',
    role_id: 2,
    workspace_id: 1,
    jurisdiction_code: 'MH-CYBER-01',
    clearance_level: 'RESTRICTED',
    is_gazetted: false,
    vasp_id: null,
    badge: 'MH-POLICE-102',
    offline: true
  },
  {
    id: 1,
    uid: 'central-nodal-admin',
    name: 'Central Nodal Officer (I4C)',
    email: 'admin@i4c.gov.in',
    role: 'SUPER_ADMIN',
    role_id: 5,
    workspace_id: 3,
    jurisdiction_code: 'IN-I4C-00',
    clearance_level: 'TOP_SECRET',
    is_gazetted: true,
    vasp_id: null,
    badge: 'SUPER-ADMIN-01',
    offline: true
  },
  {
    id: 4,
    uid: 'sp-deshmukh',
    name: 'SP Deshmukh (MH Unit Lead)',
    email: 'sp.deshmukh@mhcyber.gov.in',
    role: 'WORKSPACE_ADMIN',
    role_id: 4,
    workspace_id: 1,
    jurisdiction_code: 'MH-CYBER-01',
    clearance_level: 'CONFIDENTIAL',
    is_gazetted: true,
    vasp_id: null,
    badge: 'MH-POLICE-001',
    offline: true
  },
  {
    id: 5,
    uid: 'victim-verma',
    name: 'Rajesh Verma (Complainant)',
    email: 'victim.verma@gmail.com',
    role: 'VICTIM',
    role_id: 1,
    workspace_id: null,
    jurisdiction_code: null,
    clearance_level: 'PUBLIC',
    is_gazetted: false,
    vasp_id: null,
    offline: true
  },
  {
    id: 6,
    uid: 'binance-compliance',
    name: 'Binance Compliance Lead',
    email: 'legal@binance.com',
    role: 'EXCHANGE_NODAL_OFFICER',
    role_id: 6,
    workspace_id: null,
    jurisdiction_code: null,
    clearance_level: 'VASP_EXTERNAL',
    is_gazetted: false,
    vasp_id: 1,
    vasp_name: 'Binance International',
    offline: true
  },
  {
    id: 7,
    uid: 'justice-rao',
    name: 'Justice K. S. Rao (Judiciary)',
    email: 'judge.rao@ecourts.gov.in',
    role: 'AUDITOR',
    role_id: 7,
    workspace_id: null,
    jurisdiction_code: 'IN-JUDICIAL-00',
    clearance_level: 'CONFIDENTIAL',
    is_gazetted: true,
    vasp_id: null,
    badge: 'JUD-MH-2026',
    offline: true
  }
];
