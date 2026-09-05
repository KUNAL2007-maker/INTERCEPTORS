/**
 * Canonical Roles, Scopes, and Permissions for SIH 2026 Crypto Fraud Attribution System
 * Problem Statement: Real-Time Identification of Fraud-Linked Cryptocurrency Exchanges
 */

const ROLES = Object.freeze({
  VICTIM: 'VICTIM',
  NORMAL_INVESTIGATOR: 'NORMAL_INVESTIGATOR',
  SENIOR_INVESTIGATOR: 'SENIOR_INVESTIGATOR',
  WORKSPACE_ADMIN: 'WORKSPACE_ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  EXCHANGE_NODAL_OFFICER: 'EXCHANGE_NODAL_OFFICER',
  AUDITOR: 'AUDITOR'
});

const SCOPES = Object.freeze({
  OWN_CASE_ONLY: 'OWN_CASE_ONLY', // Restricted strictly to their own submitted case file
  ASSIGNED_CASES_WORKSPACE: 'ASSIGNED_CASES_WORKSPACE', // Limited to assigned cases within specific State/Unit Workspace
  WORKSPACE_WIDE_OVERSIGHT: 'WORKSPACE_WIDE_OVERSIGHT', // Workspace-wide case oversight & legal approval authority
  FULL_ADMIN_SPECIFIC_WORKSPACE: 'FULL_ADMIN_SPECIFIC_WORKSPACE', // Full administrative management over one specific state/regional workspace
  PLATFORM_WIDE_ALL_JURISDICTIONS: 'PLATFORM_WIDE_ALL_JURISDICTIONS', // Platform-wide system management across all jurisdictions
  TIED_TO_VASP_PLATFORM: 'TIED_TO_VASP_PLATFORM', // Limited strictly to incoming legal requests tied to their platform
  READ_ONLY_VERIFICATION: 'READ_ONLY_VERIFICATION' // Read-only verification access with zero editing or execution permissions
});

const ROLE_METADATA = Object.freeze({
  [ROLES.VICTIM]: {
    title: 'Victim / Complainant',
    description: 'Citizen affected by crypto fraud or hacking.',
    scope: SCOPES.OWN_CASE_ONLY,
    scopeLabel: 'Strictly Own Submitted Case File',
    badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  },
  [ROLES.NORMAL_INVESTIGATOR]: {
    title: 'Normal Investigator',
    description: 'Field cyber officer or sub-inspector conducting initial case tracing.',
    scope: SCOPES.ASSIGNED_CASES_WORKSPACE,
    scopeLabel: 'Assigned Cases within State/Unit Workspace',
    badgeClass: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
  },
  [ROLES.SENIOR_INVESTIGATOR]: {
    title: 'Senior Investigator',
    description: 'Unit lead or forensic specialist handling complex cases and legal approvals.',
    scope: SCOPES.WORKSPACE_WIDE_OVERSIGHT,
    scopeLabel: 'Workspace-Wide Oversight & Legal Approvals',
    badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  },
  [ROLES.WORKSPACE_ADMIN]: {
    title: 'Workspace Admin (SP/DCP)',
    description: 'Police Unit Lead managing personnel, assignments, and unit workload.',
    scope: SCOPES.FULL_ADMIN_SPECIFIC_WORKSPACE,
    scopeLabel: 'Full Admin over Specific Regional Workspace',
    badgeClass: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
  },
  [ROLES.SUPER_ADMIN]: {
    title: 'Super Admin (I4C / MHA)',
    description: 'National Nodal Authority managing national fraud trends and system configs.',
    scope: SCOPES.PLATFORM_WIDE_ALL_JURISDICTIONS,
    scopeLabel: 'Platform-Wide across All Jurisdictions',
    badgeClass: 'bg-red-500/20 text-red-400 border-red-500/30'
  },
  [ROLES.EXCHANGE_NODAL_OFFICER]: {
    title: 'Exchange Nodal Officer',
    description: 'Compliance officer representing external crypto exchanges (VASPs).',
    scope: SCOPES.TIED_TO_VASP_PLATFORM,
    scopeLabel: 'Strictly Incoming Requests for Assigned VASP',
    badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  },
  [ROLES.AUDITOR]: {
    title: 'Auditor / Judicial Representative',
    description: 'Judges, public prosecutors, or third-party compliance auditors.',
    scope: SCOPES.READ_ONLY_VERIFICATION,
    scopeLabel: 'Read-Only Verification (0 Execution Permissions)',
    badgeClass: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  }
});

const PERMISSIONS = Object.freeze({
  // 1. Victim / Complainant
  FILE_COMPLAINT: 'FILE_COMPLAINT',
  UPLOAD_TX_HASH: 'UPLOAD_TX_HASH',
  TRACK_COMPLAINT_STATUS: 'TRACK_COMPLAINT_STATUS',
  VIEW_COURT_SUMMARY: 'VIEW_COURT_SUMMARY',

  // 2. Normal Investigator
  RUN_WALLET_GRAPH: 'RUN_WALLET_GRAPH',
  IDENTIFY_SUSPECT_VASP: 'IDENTIFY_SUSPECT_VASP',
  DRAFT_EVIDENCE_REPORT: 'DRAFT_EVIDENCE_REPORT',
  DRAFT_FREEZE_REQUEST: 'DRAFT_FREEZE_REQUEST',

  // 3. Senior Investigator
  ADVANCED_CROSS_CHAIN_TRACE: 'ADVANCED_CROSS_CHAIN_TRACE',
  APPROVE_FREEZE_REQUEST: 'APPROVE_FREEZE_REQUEST',
  ANCHOR_EVIDENCE_ONCHAIN: 'ANCHOR_EVIDENCE_ONCHAIN',

  // 4. Workspace Admin (SP / DCP)
  MANAGE_POLICE_ACCOUNTS: 'MANAGE_POLICE_ACCOUNTS',
  ASSIGN_CASES: 'ASSIGN_CASES',
  REVIEW_UNIT_WORKLOAD: 'REVIEW_UNIT_WORKLOAD',

  // 5. Super Admin (I4C / MHA)
  CREATE_STATE_WORKSPACE: 'CREATE_STATE_WORKSPACE',
  MONITOR_CROSS_BORDER_TRENDS: 'MONITOR_CROSS_BORDER_TRENDS',
  CONFIGURE_GLOBAL_SETTINGS: 'CONFIGURE_GLOBAL_SETTINGS',
  EMERGENCY_LOCKDOWN: 'EMERGENCY_LOCKDOWN',

  // 6. Exchange Nodal Officer
  RECEIVE_FREEZE_NOTICE: 'RECEIVE_FREEZE_NOTICE',
  CONFIRM_ACCOUNT_FREEZE: 'CONFIRM_ACCOUNT_FREEZE',
  SUBMIT_KYC_DOSSIER: 'SUBMIT_KYC_DOSSIER',

  // 7. Auditor / Judicial Representative
  COMPARE_PDF_HASH_TIMESTAMP: 'COMPARE_PDF_HASH_TIMESTAMP',
  VERIFY_COURT_INTEGRITY: 'VERIFY_COURT_INTEGRITY'
});

const ROLE_PERMISSIONS = {
  [ROLES.VICTIM]: [
    PERMISSIONS.FILE_COMPLAINT,
    PERMISSIONS.UPLOAD_TX_HASH,
    PERMISSIONS.TRACK_COMPLAINT_STATUS,
    PERMISSIONS.VIEW_COURT_SUMMARY
  ],

  [ROLES.NORMAL_INVESTIGATOR]: [
    PERMISSIONS.TRACK_COMPLAINT_STATUS,
    PERMISSIONS.RUN_WALLET_GRAPH,
    PERMISSIONS.IDENTIFY_SUSPECT_VASP,
    PERMISSIONS.DRAFT_EVIDENCE_REPORT,
    PERMISSIONS.DRAFT_FREEZE_REQUEST,
    PERMISSIONS.VIEW_COURT_SUMMARY
  ],

  [ROLES.SENIOR_INVESTIGATOR]: [
    PERMISSIONS.TRACK_COMPLAINT_STATUS,
    PERMISSIONS.RUN_WALLET_GRAPH,
    PERMISSIONS.IDENTIFY_SUSPECT_VASP,
    PERMISSIONS.DRAFT_EVIDENCE_REPORT,
    PERMISSIONS.DRAFT_FREEZE_REQUEST,
    PERMISSIONS.VIEW_COURT_SUMMARY,
    PERMISSIONS.ADVANCED_CROSS_CHAIN_TRACE,
    PERMISSIONS.APPROVE_FREEZE_REQUEST,
    PERMISSIONS.ANCHOR_EVIDENCE_ONCHAIN,
    PERMISSIONS.COMPARE_PDF_HASH_TIMESTAMP,
    PERMISSIONS.VERIFY_COURT_INTEGRITY
  ],

  [ROLES.WORKSPACE_ADMIN]: [
    PERMISSIONS.TRACK_COMPLAINT_STATUS,
    PERMISSIONS.RUN_WALLET_GRAPH,
    PERMISSIONS.IDENTIFY_SUSPECT_VASP,
    PERMISSIONS.DRAFT_EVIDENCE_REPORT,
    PERMISSIONS.DRAFT_FREEZE_REQUEST,
    PERMISSIONS.VIEW_COURT_SUMMARY,
    PERMISSIONS.MANAGE_POLICE_ACCOUNTS,
    PERMISSIONS.ASSIGN_CASES,
    PERMISSIONS.REVIEW_UNIT_WORKLOAD,
    PERMISSIONS.VERIFY_COURT_INTEGRITY
  ],

  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS), // Full platform access

  [ROLES.EXCHANGE_NODAL_OFFICER]: [
    PERMISSIONS.RECEIVE_FREEZE_NOTICE,
    PERMISSIONS.CONFIRM_ACCOUNT_FREEZE,
    PERMISSIONS.SUBMIT_KYC_DOSSIER
  ],

  [ROLES.AUDITOR]: [
    PERMISSIONS.VIEW_COURT_SUMMARY,
    PERMISSIONS.COMPARE_PDF_HASH_TIMESTAMP,
    PERMISSIONS.VERIFY_COURT_INTEGRITY
    // Note: ZERO write/editing/execution permissions
  ]
};

/**
 * Check if a role possesses a specific permission
 * @param {string} role 
 * @param {string} permission 
 * @returns {boolean}
 */
function hasPermission(role, permission) {
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes(permission);
}

module.exports = {
  ROLES,
  SCOPES,
  ROLE_METADATA,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission
};
