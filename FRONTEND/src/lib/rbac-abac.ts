/**
 * RBAC and ABAC Policy Engine for SIH 2026 Crypto Fraud Attribution Platform
 * Prototype Role-Based & Attribute-Based Access Control Layer
 * "SIH 2026 Prototype / Simulated LEA Environment - Application Permissions Only"
 */

export type RoleName =
  | 'VICTIM'
  | 'CYBERCRIME_SUPERVISOR'
  | 'INVESTIGATING_OFFICER'
  | 'SENIOR_INVESTIGATOR'
  | 'VASP_COMPLIANCE_OFFICER'
  | 'COURT_REVIEWER'
  | 'NATIONAL_COORDINATION_ANALYST'
  | 'SYSTEM_ADMIN'
  // Backward compatibility legacy aliases
  | 'NORMAL_INVESTIGATOR'
  | 'WORKSPACE_ADMIN'
  | 'SUPER_ADMIN'
  | 'EXCHANGE_NODAL_OFFICER'
  | 'AUDITOR';

export const ROLES: Record<string, RoleName> = {
  VICTIM: 'VICTIM',
  CYBERCRIME_SUPERVISOR: 'CYBERCRIME_SUPERVISOR',
  INVESTIGATING_OFFICER: 'INVESTIGATING_OFFICER',
  SENIOR_INVESTIGATOR: 'SENIOR_INVESTIGATOR',
  VASP_COMPLIANCE_OFFICER: 'VASP_COMPLIANCE_OFFICER',
  COURT_REVIEWER: 'COURT_REVIEWER',
  NATIONAL_COORDINATION_ANALYST: 'NATIONAL_COORDINATION_ANALYST',
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  // Legacy aliases
  NORMAL_INVESTIGATOR: 'INVESTIGATING_OFFICER',
  WORKSPACE_ADMIN: 'CYBERCRIME_SUPERVISOR',
  SUPER_ADMIN: 'SYSTEM_ADMIN',
  EXCHANGE_NODAL_OFFICER: 'VASP_COMPLIANCE_OFFICER',
  AUDITOR: 'COURT_REVIEWER'
};

export function normalizeRole(role: string): RoleName {
  if (!role) return 'VICTIM';
  switch (role) {
    case 'NORMAL_INVESTIGATOR':
      return 'INVESTIGATING_OFFICER';
    case 'WORKSPACE_ADMIN':
      return 'CYBERCRIME_SUPERVISOR';
    case 'SUPER_ADMIN':
      return 'SYSTEM_ADMIN';
    case 'EXCHANGE_NODAL_OFFICER':
      return 'VASP_COMPLIANCE_OFFICER';
    case 'AUDITOR':
      return 'COURT_REVIEWER';
    default:
      return role as RoleName;
  }
}

export const PERMISSIONS = {
  // Victim permissions
  COMPLAINT_CREATE: 'complaint:create',
  TX_HASH_UPLOAD: 'tx_hash:upload',
  EVIDENCE_UPLOAD: 'evidence:upload',
  CASE_READ_OWN: 'case:read_own',
  COMPLAINT_STATUS_READ: 'complaint_status:read',
  MILESTONES_READ: 'milestones:read',
  RECOVERY_STATUS_READ: 'recovery_status:read',

  // Investigating Officer permissions
  CASE_READ_ASSIGNED: 'case:read_assigned',
  CASE_EVIDENCE_VIEW: 'case:evidence_view',
  WALLET_GRAPH_READ: 'wallet_graph:read',
  WALLET_DETAILS_READ: 'wallet:details_read',
  WALLET_MONITOR: 'wallet:monitor',
  TRACE_EXECUTE: 'trace:execute',
  TRACE_VIEW: 'trace:view',
  CROSS_CHAIN_TRACE: 'cross_chain:trace',
  VASP_ATTRIBUTION_VIEW: 'vasp:view_attribution',
  RISK_ANALYSIS_VIEW: 'risk:view',
  REPORT_GENERATE: 'report:generate',
  FREEZE_NOTICE_DRAFT: 'freeze_notice:draft',
  COPILOT_USE: 'copilot:use',
  CASE_NOTES_WRITE: 'case:notes_write',

  // Cybercrime Supervisor permissions
  CASE_READ_UNIT: 'case:read_unit',
  CASE_REVIEW_COMPLAINTS: 'case:review_complaints',
  CASE_ASSIGN_IO: 'case:assign_io',
  CASE_REASSIGN_IO: 'case:reassign_io',
  CASE_CHANGE_PRIORITY: 'case:change_priority',
  CASE_REQUEST_INFO: 'case:request_info',
  REPORT_REVIEW: 'report:review',
  NOTICE_REVIEW: 'notice:review',

  // Senior Investigator permissions
  CASE_READ_ALL: 'case:read_all',
  FREEZE_ORDER_APPROVE: 'freeze_order:approve',
  FREEZE_ORDER_ISSUE: 'freeze_order:issue',
  EVIDENCE_ANCHOR_EXECUTE: 'evidence_anchor:execute',
  CASE_ESCALATE: 'case:escalate',

  // VASP Compliance Officer permissions
  VASP_REQUESTS_VIEW_OWN: 'vasp:requests_view_own',
  VASP_REQUEST_ACKNOWLEDGE: 'vasp:request_acknowledge',
  VASP_RESPONSE_SUBMIT: 'vasp:response_submit',
  VASP_DOCUMENTATION_UPLOAD: 'vasp:documentation_upload',
  VASP_ACTION_RECORD: 'vasp:action_record',
  FREEZE_CONFIRM: 'freeze:confirm',
  KYC_METADATA_SUBMIT: 'kyc_metadata:submit',

  // Court Reviewer permissions (Strictly Read-Only)
  COURT_EVIDENCE_VIEW: 'court:evidence_view',
  COURT_METADATA_VIEW: 'court:metadata_view',
  COURT_HASH_VERIFY: 'court:hash_verify',
  COURT_CHAIN_OF_CUSTODY_VIEW: 'court:chain_of_custody_view',
  COURT_TIMELINE_VIEW: 'court:timeline_view',
  COURT_REPORT_VIEW: 'court:report_view',
  COURT_REQUESTS_HISTORY_VIEW: 'court:requests_history_view',
  COURT_PACKAGE_EXPORT: 'court:package_export',
  BLOCKCHAIN_HASH_VERIFY: 'blockchain_hash:verify',

  // National Coordination Analyst permissions
  INTELLIGENCE_CROSS_CASE_VIEW: 'intelligence:cross_case_view',
  INTELLIGENCE_ADDRESS_SEARCH: 'intelligence:address_search',
  INTELLIGENCE_CLUSTER_VIEW: 'intelligence:cluster_view',
  INTELLIGENCE_FRAUD_PATTERNS_VIEW: 'intelligence:fraud_patterns_view',
  INTELLIGENCE_CROSS_STATE_VIEW: 'intelligence:cross_state_view',
  INTELLIGENCE_VASP_ENDPOINTS_VIEW: 'intelligence:vasp_endpoints_view',
  INTELLIGENCE_ALERT_GENERATE: 'intelligence:alert_generate',
  INTELLIGENCE_STATISTICS_VIEW: 'intelligence:statistics_view',

  // System Administrator permissions
  ADMIN_USER_CREATE: 'admin:user_create',
  ADMIN_USER_MANAGE: 'admin:user_manage',
  ADMIN_ROLE_ASSIGN: 'admin:role_assign',
  ADMIN_PASSWORD_RESET: 'admin:password_reset',
  ADMIN_SYSTEM_HEALTH: 'admin:system_health',
  ADMIN_SECURITY_LOGS: 'admin:security_logs',
  ADMIN_SYSTEM_CONFIG: 'admin:system_config',
  EMERGENCY_LOCKDOWN_TRIGGER: 'emergency_lockdown:trigger',

  // Shared audit permission
  AUDIT_LOG_READ: 'audit_log:read'
};

export const ROLE_PERMISSIONS: Record<RoleName, string[]> = {
  VICTIM: [
    PERMISSIONS.COMPLAINT_CREATE,
    PERMISSIONS.TX_HASH_UPLOAD,
    PERMISSIONS.EVIDENCE_UPLOAD,
    PERMISSIONS.CASE_READ_OWN,
    PERMISSIONS.COMPLAINT_STATUS_READ,
    PERMISSIONS.MILESTONES_READ,
    PERMISSIONS.RECOVERY_STATUS_READ
  ],
  CYBERCRIME_SUPERVISOR: [
    PERMISSIONS.CASE_READ_UNIT,
    PERMISSIONS.CASE_REVIEW_COMPLAINTS,
    PERMISSIONS.CASE_ASSIGN_IO,
    PERMISSIONS.CASE_REASSIGN_IO,
    PERMISSIONS.CASE_CHANGE_PRIORITY,
    PERMISSIONS.CASE_REQUEST_INFO,
    PERMISSIONS.WALLET_GRAPH_READ,
    PERMISSIONS.WALLET_DETAILS_READ,
    PERMISSIONS.TRACE_EXECUTE,
    PERMISSIONS.TRACE_VIEW,
    PERMISSIONS.CROSS_CHAIN_TRACE,
    PERMISSIONS.VASP_ATTRIBUTION_VIEW,
    PERMISSIONS.RISK_ANALYSIS_VIEW,
    PERMISSIONS.REPORT_REVIEW,
    PERMISSIONS.NOTICE_REVIEW,
    PERMISSIONS.FREEZE_NOTICE_DRAFT,
    PERMISSIONS.FREEZE_ORDER_APPROVE,
    PERMISSIONS.FREEZE_ORDER_ISSUE,
    PERMISSIONS.EVIDENCE_ANCHOR_EXECUTE,
    PERMISSIONS.COPILOT_USE,
    PERMISSIONS.AUDIT_LOG_READ
  ],
  INVESTIGATING_OFFICER: [
    PERMISSIONS.CASE_READ_ASSIGNED,
    PERMISSIONS.CASE_EVIDENCE_VIEW,
    PERMISSIONS.EVIDENCE_UPLOAD,
    PERMISSIONS.WALLET_GRAPH_READ,
    PERMISSIONS.WALLET_DETAILS_READ,
    PERMISSIONS.WALLET_MONITOR,
    PERMISSIONS.TRACE_EXECUTE,
    PERMISSIONS.TRACE_VIEW,
    PERMISSIONS.CROSS_CHAIN_TRACE,
    PERMISSIONS.VASP_ATTRIBUTION_VIEW,
    PERMISSIONS.RISK_ANALYSIS_VIEW,
    PERMISSIONS.REPORT_GENERATE,
    PERMISSIONS.FREEZE_NOTICE_DRAFT,
    PERMISSIONS.COPILOT_USE,
    PERMISSIONS.CASE_NOTES_WRITE
  ],
  SENIOR_INVESTIGATOR: [
    PERMISSIONS.CASE_READ_ASSIGNED,
    PERMISSIONS.CASE_READ_UNIT,
    PERMISSIONS.CASE_READ_ALL,
    PERMISSIONS.CASE_EVIDENCE_VIEW,
    PERMISSIONS.WALLET_GRAPH_READ,
    PERMISSIONS.WALLET_DETAILS_READ,
    PERMISSIONS.WALLET_MONITOR,
    PERMISSIONS.TRACE_EXECUTE,
    PERMISSIONS.TRACE_VIEW,
    PERMISSIONS.CROSS_CHAIN_TRACE,
    PERMISSIONS.VASP_ATTRIBUTION_VIEW,
    PERMISSIONS.RISK_ANALYSIS_VIEW,
    PERMISSIONS.REPORT_REVIEW,
    PERMISSIONS.REPORT_GENERATE,
    PERMISSIONS.FREEZE_NOTICE_DRAFT,
    PERMISSIONS.FREEZE_ORDER_APPROVE,
    PERMISSIONS.FREEZE_ORDER_ISSUE,
    PERMISSIONS.EVIDENCE_ANCHOR_EXECUTE,
    PERMISSIONS.CASE_ESCALATE,
    PERMISSIONS.COPILOT_USE,
    PERMISSIONS.AUDIT_LOG_READ
  ],
  VASP_COMPLIANCE_OFFICER: [
    PERMISSIONS.VASP_REQUESTS_VIEW_OWN,
    PERMISSIONS.VASP_REQUEST_ACKNOWLEDGE,
    PERMISSIONS.VASP_RESPONSE_SUBMIT,
    PERMISSIONS.VASP_DOCUMENTATION_UPLOAD,
    PERMISSIONS.VASP_ACTION_RECORD,
    PERMISSIONS.FREEZE_CONFIRM,
    PERMISSIONS.KYC_METADATA_SUBMIT
  ],
  COURT_REVIEWER: [
    PERMISSIONS.COURT_EVIDENCE_VIEW,
    PERMISSIONS.COURT_METADATA_VIEW,
    PERMISSIONS.COURT_HASH_VERIFY,
    PERMISSIONS.COURT_CHAIN_OF_CUSTODY_VIEW,
    PERMISSIONS.COURT_TIMELINE_VIEW,
    PERMISSIONS.COURT_REPORT_VIEW,
    PERMISSIONS.COURT_REQUESTS_HISTORY_VIEW,
    PERMISSIONS.COURT_PACKAGE_EXPORT,
    PERMISSIONS.AUDIT_LOG_READ,
    PERMISSIONS.BLOCKCHAIN_HASH_VERIFY,
    PERMISSIONS.WALLET_GRAPH_READ
  ],
  NATIONAL_COORDINATION_ANALYST: [
    PERMISSIONS.INTELLIGENCE_CROSS_CASE_VIEW,
    PERMISSIONS.INTELLIGENCE_ADDRESS_SEARCH,
    PERMISSIONS.INTELLIGENCE_CLUSTER_VIEW,
    PERMISSIONS.INTELLIGENCE_FRAUD_PATTERNS_VIEW,
    PERMISSIONS.INTELLIGENCE_CROSS_STATE_VIEW,
    PERMISSIONS.INTELLIGENCE_VASP_ENDPOINTS_VIEW,
    PERMISSIONS.INTELLIGENCE_ALERT_GENERATE,
    PERMISSIONS.INTELLIGENCE_STATISTICS_VIEW,
    PERMISSIONS.WALLET_GRAPH_READ,
    PERMISSIONS.TRACE_EXECUTE,
    PERMISSIONS.TRACE_VIEW,
    PERMISSIONS.VASP_ATTRIBUTION_VIEW,
    PERMISSIONS.RISK_ANALYSIS_VIEW,
    PERMISSIONS.AUDIT_LOG_READ
  ],
  SYSTEM_ADMIN: [
    PERMISSIONS.ADMIN_USER_CREATE,
    PERMISSIONS.ADMIN_USER_MANAGE,
    PERMISSIONS.ADMIN_ROLE_ASSIGN,
    PERMISSIONS.ADMIN_PASSWORD_RESET,
    PERMISSIONS.ADMIN_SYSTEM_HEALTH,
    PERMISSIONS.ADMIN_SECURITY_LOGS,
    PERMISSIONS.ADMIN_SYSTEM_CONFIG,
    PERMISSIONS.EMERGENCY_LOCKDOWN_TRIGGER,
    PERMISSIONS.AUDIT_LOG_READ
  ],

  // Backward compatibility alias definitions
  NORMAL_INVESTIGATOR: [
    PERMISSIONS.CASE_READ_ASSIGNED,
    PERMISSIONS.WALLET_GRAPH_READ,
    PERMISSIONS.TRACE_EXECUTE,
    PERMISSIONS.TRACE_VIEW,
    PERMISSIONS.CROSS_CHAIN_TRACE,
    PERMISSIONS.FREEZE_NOTICE_DRAFT,
    PERMISSIONS.COPILOT_USE
  ],
  WORKSPACE_ADMIN: [
    PERMISSIONS.CASE_READ_UNIT,
    PERMISSIONS.CASE_REVIEW_COMPLAINTS,
    PERMISSIONS.CASE_ASSIGN_IO,
    PERMISSIONS.WALLET_GRAPH_READ,
    PERMISSIONS.TRACE_EXECUTE,
    PERMISSIONS.TRACE_VIEW,
    PERMISSIONS.CROSS_CHAIN_TRACE,
    PERMISSIONS.FREEZE_NOTICE_DRAFT,
    PERMISSIONS.FREEZE_ORDER_APPROVE,
    PERMISSIONS.FREEZE_ORDER_ISSUE,
    PERMISSIONS.EVIDENCE_ANCHOR_EXECUTE,
    PERMISSIONS.COPILOT_USE,
    PERMISSIONS.AUDIT_LOG_READ
  ],
  SUPER_ADMIN: [
    PERMISSIONS.ADMIN_USER_CREATE,
    PERMISSIONS.ADMIN_USER_MANAGE,
    PERMISSIONS.ADMIN_ROLE_ASSIGN,
    PERMISSIONS.ADMIN_PASSWORD_RESET,
    PERMISSIONS.ADMIN_SYSTEM_HEALTH,
    PERMISSIONS.ADMIN_SECURITY_LOGS,
    PERMISSIONS.ADMIN_SYSTEM_CONFIG,
    PERMISSIONS.EMERGENCY_LOCKDOWN_TRIGGER,
    PERMISSIONS.AUDIT_LOG_READ,
    PERMISSIONS.CASE_READ_ALL,
    PERMISSIONS.WALLET_GRAPH_READ
  ],
  EXCHANGE_NODAL_OFFICER: [
    PERMISSIONS.VASP_REQUESTS_VIEW_OWN,
    PERMISSIONS.VASP_REQUEST_ACKNOWLEDGE,
    PERMISSIONS.FREEZE_CONFIRM,
    PERMISSIONS.KYC_METADATA_SUBMIT
  ],
  AUDITOR: [
    PERMISSIONS.COURT_EVIDENCE_VIEW,
    PERMISSIONS.COURT_METADATA_VIEW,
    PERMISSIONS.COURT_HASH_VERIFY,
    PERMISSIONS.AUDIT_LOG_READ,
    PERMISSIONS.BLOCKCHAIN_HASH_VERIFY,
    PERMISSIONS.WALLET_GRAPH_READ
  ]
};

export function hasPermission(role: RoleName | string, permission: string): boolean {
  const norm = normalizeRole(role);
  const permissions = ROLE_PERMISSIONS[norm] || ROLE_PERMISSIONS[role as RoleName] || [];
  return permissions.includes(permission);
}

// ----------------------------------------------------------------------------
// STATUTORY ABAC POLICIES
// ----------------------------------------------------------------------------
export const CLEARANCE_HIERARCHY: Record<string, number> = {
  PUBLIC: 1,
  RESTRICTED: 2,
  CONFIDENTIAL: 3,
  SECRET: 3,
  TOP_SECRET: 4,
  VASP_EXTERNAL: 0
};

export type ClearanceLevel = 'PUBLIC' | 'RESTRICTED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET' | 'VASP_EXTERNAL';

export type SubjectAttributes = {
  id?: number | string;
  name?: string;
  role: RoleName;
  workspace_id?: number | null;
  jurisdiction_code?: string | null;
  clearance_level?: string;
  is_gazetted?: boolean;
  vasp_id?: number | null;
  vasp_name?: string;
  email?: string;
};

export type ResourceAttributes = {
  id?: number | string;
  case_number?: string;
  reported_by?: number | string;
  victim_id?: number | string;
  workspace_id?: number | null;
  jurisdiction_code?: string | null;
  assigned_investigator_id?: number | string | null;
  assigned_investigator_name?: string | null;
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
  const normRole = normalizeRole(subject.role);

  // POL-01: National Emergency Lockdown
  if (environment.emergency_lockdown) {
    if (normRole !== 'SYSTEM_ADMIN' && subject.role !== 'SUPER_ADMIN') {
      return {
        decision: 'DENY',
        policyId: 'POL-01-EMERGENCY-LOCKDOWN',
        reason: 'National Cyber Emergency Lockdown is active. State operations are frozen.'
      };
    }
  }

  // POL-02: Judicial Zero-Write Restriction
  if (normRole === 'COURT_REVIEWER' || subject.role === 'AUDITOR') {
    const act = (action || '').toLowerCase();
    if (
      [
        'write',
        'create',
        'update',
        'delete',
        'patch',
        'freeze_draft',
        'freeze_approve',
        'admin_override',
        'file_complaint',
        'assign_io',
        'change_priority'
      ].includes(act)
    ) {
      return {
        decision: 'DENY',
        policyId: 'POL-02-JUDICIAL-READ-ONLY',
        reason: 'Court Reviewer / Auditor accounts possess absolute zero write or mutation permissions under BSA 2023 Sec 65B.'
      };
    }
  }

  // If there's no resource to check, permit general non-restricted actions
  if (!resource) {
    return { decision: 'PERMIT', policyId: null, reason: 'No resource constraints triggered.' };
  }

  // POL-03: Victim Case Isolation
  if (normRole === 'VICTIM') {
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
  if (['INVESTIGATING_OFFICER', 'CYBERCRIME_SUPERVISOR', 'NORMAL_INVESTIGATOR', 'WORKSPACE_ADMIN'].includes(normRole)) {
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
  if (action === 'freeze_approve' || action === 'freeze_issue') {
    if (!subject.is_gazetted) {
      return {
        decision: 'DENY',
        policyId: 'POL-05-STATUTORY-FREEZE-APPROVAL',
        reason: 'Section 94 BNSS statutory freeze orders require a Gazetted Police Officer (ACP/DSP/SP).'
      };
    }
    if (resource.status !== 'TRACED' && resource.status !== 'NOTICE_SERVED') {
      return {
        decision: 'DENY',
        policyId: 'POL-05-STATUTORY-FREEZE-APPROVAL',
        reason: 'Statutory freeze order cannot be approved on untraced allegations. Case must be TRACED first.'
      };
    }
  }

  // POL-06: VASP Desk Isolation
  if (normRole === 'VASP_COMPLIANCE_OFFICER' || subject.role === 'EXCHANGE_NODAL_OFFICER') {
    if (subject.vasp_id && resource.vasp_id && subject.vasp_id !== resource.vasp_id) {
      return {
        decision: 'DENY',
        policyId: 'POL-06-VASP-DESK-ISOLATION',
        reason: 'Exchange compliance officer cannot inspect legal notices or cases directed to other exchanges.'
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

  // POL-08: Case-Level Access Control (IDOR Prevention for Investigating Officers)
  if (normRole === 'INVESTIGATING_OFFICER' || subject.role === 'NORMAL_INVESTIGATOR') {
    if (action === 'case_view_detail') {
      const isAssigned =
        (resource.assigned_investigator_id && String(resource.assigned_investigator_id) === String(subject.id)) ||
        (resource.assigned_investigator_name && subject.name && resource.assigned_investigator_name.toLowerCase().includes(subject.name.toLowerCase()));
      const isPendingUnitComplaint =
        resource.status === 'PENDING_TRACING' &&
        resource.jurisdiction_code === subject.jurisdiction_code &&
        !resource.assigned_investigator_id;

      if (!isAssigned && !isPendingUnitComplaint) {
        return {
          decision: 'DENY',
          policyId: 'POL-08-CASE-ASSIGNMENT-BARRIER',
          reason: `Access Denied (IDOR Barrier): Investigating Officer is only authorized to access cases assigned to their warrant.`
        };
      }
    }
  }

  return { decision: 'PERMIT', policyId: null, reason: 'All statutory ABAC policy conditions satisfied.' };
}

// ----------------------------------------------------------------------------
// DYNAMIC SCOPE FILTER FOR CASE QUERIES
// ----------------------------------------------------------------------------
export function filterCasesByScope(user: SubjectAttributes, cases: any[]): any[] {
  if (!user || !cases) return [];
  const normRole = normalizeRole(user.role);

  // System Admin maintenance inspection
  if (normRole === 'SYSTEM_ADMIN' || user.role === 'SUPER_ADMIN') return cases;

  // National Coordination Analyst: Cross-state aggregated view
  if (normRole === 'NATIONAL_COORDINATION_ANALYST') return cases;

  return cases.filter(c => {
    // 1. Victim Isolation
    if (normRole === 'VICTIM') {
      const ownerId = c.reported_by ?? c.victim_id;
      return String(ownerId) === String(user.id);
    }

    // 2. Data classification check
    const userClearance = CLEARANCE_HIERARCHY[user.clearance_level || 'PUBLIC'] || 1;
    const reqClearance = CLEARANCE_HIERARCHY[c.classification || 'PUBLIC'] || 1;
    if (userClearance < reqClearance) return false;

    // 3. Exchange Compliance Desk Isolation
    if (normRole === 'VASP_COMPLIANCE_OFFICER' || user.role === 'EXCHANGE_NODAL_OFFICER') {
      return Boolean(user.vasp_id && c.vasp_id === user.vasp_id);
    }

    // 4. Investigating Officer: Assigned cases + new unit intake queue
    if (normRole === 'INVESTIGATING_OFFICER' || user.role === 'NORMAL_INVESTIGATOR') {
      const isAssigned =
        String(c.assigned_investigator_id) === String(user.id) ||
        (user.name && c.assigned_investigator_name && c.assigned_investigator_name.toLowerCase().includes(user.name.toLowerCase()));
      const isPendingInUnit =
        c.jurisdiction_code === user.jurisdiction_code &&
        (c.status === 'PENDING_TRACING' || !c.assigned_investigator_id);
      return isAssigned || isPendingInUnit;
    }

    // 5. Supervisor: All cases within their assigned jurisdictional unit
    if (normRole === 'CYBERCRIME_SUPERVISOR' || user.role === 'WORKSPACE_ADMIN') {
      if (user.jurisdiction_code && user.jurisdiction_code !== 'IN-I4C-00') {
        return c.jurisdiction_code === user.jurisdiction_code;
      }
      return true;
    }

    // 6. Senior Investigator: Cases in unit or escalated
    if (normRole === 'SENIOR_INVESTIGATOR') {
      if (user.jurisdiction_code && user.jurisdiction_code !== 'IN-I4C-00') {
        return c.jurisdiction_code === user.jurisdiction_code || c.status === 'ESCALATED';
      }
      return true;
    }

    // 7. Court Reviewer / Auditor: Read-only access to all cases meeting clearance
    if (normRole === 'COURT_REVIEWER' || user.role === 'AUDITOR') {
      return true;
    }

    return true;
  });
}

// ----------------------------------------------------------------------------
// PRE-SEEDED SYSTEM PERSONAS (Prototype LEA Environment)
// ----------------------------------------------------------------------------
export type AppUser = {
  id: number;
  uid: string;
  name: string;
  email: string;
  alias_emails?: string[];
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
  is_active?: boolean;
};

export const SYSTEM_PERSONAS: AppUser[] = [
  {
    id: 1,
    uid: 'central-nodal-admin',
    name: 'System Administrator',
    email: 'admin@example.demo',
    alias_emails: ['admin@i4c.gov.in'],
    role: 'SYSTEM_ADMIN',
    role_id: 8,
    workspace_id: 3,
    jurisdiction_code: 'IN-I4C-00',
    clearance_level: 'TOP_SECRET',
    is_gazetted: true,
    vasp_id: null,
    badge: 'SUPER-ADMIN-01',
    offline: true,
    is_active: true
  },
  {
    id: 2,
    uid: 'senior-sharma',
    name: 'ACP Sharma',
    email: 'senior@example.demo',
    alias_emails: ['senior.sharma@mhcyber.gov.in'],
    role: 'SENIOR_INVESTIGATOR',
    role_id: 4,
    workspace_id: 1,
    jurisdiction_code: 'MH-CYBER-01',
    clearance_level: 'CONFIDENTIAL',
    is_gazetted: true,
    vasp_id: null,
    badge: 'MH-POLICE-884',
    offline: true,
    is_active: true
  },
  {
    id: 3,
    uid: 'patil-sub-inspector',
    name: 'SI Patil',
    email: 'investigator@example.demo',
    alias_emails: ['officer.patil@mhcyber.gov.in'],
    role: 'INVESTIGATING_OFFICER',
    role_id: 3,
    workspace_id: 1,
    jurisdiction_code: 'MH-CYBER-01',
    clearance_level: 'RESTRICTED',
    is_gazetted: false,
    vasp_id: null,
    badge: 'MH-POLICE-102',
    offline: true,
    is_active: true
  },
  {
    id: 4,
    uid: 'sp-deshmukh',
    name: 'SP Deshmukh',
    email: 'supervisor@example.demo',
    alias_emails: ['sp.deshmukh@mhcyber.gov.in'],
    role: 'CYBERCRIME_SUPERVISOR',
    role_id: 2,
    workspace_id: 1,
    jurisdiction_code: 'MH-CYBER-01',
    clearance_level: 'CONFIDENTIAL',
    is_gazetted: true,
    vasp_id: null,
    badge: 'MH-POLICE-001',
    offline: true,
    is_active: true
  },
  {
    id: 5,
    uid: 'victim-verma',
    name: 'Rajesh Verma',
    email: 'victim.verma@example.demo',
    alias_emails: ['victim.verma@gmail.com'],
    role: 'VICTIM',
    role_id: 1,
    workspace_id: null,
    jurisdiction_code: null,
    clearance_level: 'PUBLIC',
    is_gazetted: false,
    vasp_id: null,
    offline: true,
    is_active: true
  },
  {
    id: 6,
    uid: 'binance-compliance',
    name: 'Example Crypto Exchange (Compliance Desk)',
    email: 'compliance@example.demo',
    alias_emails: ['legal@binance.com'],
    role: 'VASP_COMPLIANCE_OFFICER',
    role_id: 5,
    workspace_id: null,
    jurisdiction_code: null,
    clearance_level: 'VASP_EXTERNAL',
    is_gazetted: false,
    vasp_id: 1,
    vasp_name: 'Binance International',
    offline: true,
    is_active: true
  },
  {
    id: 7,
    uid: 'justice-rao',
    name: 'Justice Rao (Court Reviewer)',
    email: 'court@example.demo',
    alias_emails: ['judge.rao@ecourts.gov.in'],
    role: 'COURT_REVIEWER',
    role_id: 6,
    workspace_id: null,
    jurisdiction_code: 'IN-JUDICIAL-00',
    clearance_level: 'CONFIDENTIAL',
    is_gazetted: true,
    vasp_id: null,
    badge: 'JUD-MH-2026',
    offline: true,
    is_active: true
  },
  {
    id: 8,
    uid: 'national-analyst',
    name: 'National Coordination Analyst',
    email: 'national@example.demo',
    alias_emails: [],
    role: 'NATIONAL_COORDINATION_ANALYST',
    role_id: 7,
    workspace_id: 3,
    jurisdiction_code: 'IN-I4C-00',
    clearance_level: 'SECRET',
    is_gazetted: false,
    vasp_id: null,
    badge: 'NAT-COORD-01',
    offline: true,
    is_active: true
  }
];
