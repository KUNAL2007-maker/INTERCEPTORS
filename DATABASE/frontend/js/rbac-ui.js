// Declarative RBAC & ABAC UI Permission Engine for SIH 2026 Crypto Fraud Attribution System

const RBAC_CONFIG = {
  ROLES: {
    VICTIM: {
      name: 'VICTIM',
      title: 'Victim / Complainant',
      color: 'emerald',
      scope: 'Strictly Own Submitted Case File',
      description: 'Citizen affected by crypto fraud or hacking. Can file reports, upload hashes, and track progress.',
      permissions: ['FILE_COMPLAINT', 'UPLOAD_TX_HASH', 'TRACK_COMPLAINT_STATUS', 'VIEW_COURT_SUMMARY']
    },
    NORMAL_INVESTIGATOR: {
      name: 'NORMAL_INVESTIGATOR',
      title: 'Normal Investigator',
      color: 'indigo',
      scope: 'Assigned Cases within Maharashtra Cyber Unit',
      description: 'Field cyber officer conducting initial multi-hop tracing, graph visualization, and freeze notice drafting.',
      permissions: ['TRACK_COMPLAINT_STATUS', 'RUN_WALLET_GRAPH', 'IDENTIFY_SUSPECT_VASP', 'DRAFT_EVIDENCE_REPORT', 'DRAFT_FREEZE_REQUEST', 'VIEW_COURT_SUMMARY']
    },
    SENIOR_INVESTIGATOR: {
      name: 'SENIOR_INVESTIGATOR',
      title: 'Senior Investigator',
      color: 'blue',
      scope: 'Workspace-Wide Case Oversight & Statutory Legal Approval',
      description: 'Unit lead or forensic specialist conducting cross-chain tracing, statutory approvals, and blockchain evidence anchoring.',
      permissions: ['TRACK_COMPLAINT_STATUS', 'RUN_WALLET_GRAPH', 'IDENTIFY_SUSPECT_VASP', 'DRAFT_EVIDENCE_REPORT', 'DRAFT_FREEZE_REQUEST', 'VIEW_COURT_SUMMARY', 'ADVANCED_CROSS_CHAIN_TRACE', 'APPROVE_FREEZE_REQUEST', 'ANCHOR_EVIDENCE_ONCHAIN', 'COMPARE_PDF_HASH_TIMESTAMP', 'VERIFY_COURT_INTEGRITY']
    },
    WORKSPACE_ADMIN: {
      name: 'WORKSPACE_ADMIN',
      title: 'Workspace Admin (SP / DCP)',
      color: 'cyan',
      scope: 'Full Administrative Management over Maharashtra Cyber Unit',
      description: 'Police Unit Lead managing officer accounts, workload balancing, and case dispatch.',
      permissions: ['TRACK_COMPLAINT_STATUS', 'RUN_WALLET_GRAPH', 'IDENTIFY_SUSPECT_VASP', 'DRAFT_EVIDENCE_REPORT', 'DRAFT_FREEZE_REQUEST', 'VIEW_COURT_SUMMARY', 'MANAGE_POLICE_ACCOUNTS', 'ASSIGN_CASES', 'REVIEW_UNIT_WORKLOAD', 'VERIFY_COURT_INTEGRITY']
    },
    SUPER_ADMIN: {
      name: 'SUPER_ADMIN',
      title: 'Super Admin (I4C / MHA)',
      color: 'red',
      scope: 'Platform-Wide System Management across All 36 States/UTs',
      description: 'National Nodal Authority monitoring national fraud patterns, provisioning state hubs, and global security controls.',
      permissions: [
        'FILE_COMPLAINT', 'UPLOAD_TX_HASH', 'TRACK_COMPLAINT_STATUS', 'VIEW_COURT_SUMMARY',
        'RUN_WALLET_GRAPH', 'IDENTIFY_SUSPECT_VASP', 'DRAFT_EVIDENCE_REPORT', 'DRAFT_FREEZE_REQUEST',
        'ADVANCED_CROSS_CHAIN_TRACE', 'APPROVE_FREEZE_REQUEST', 'ANCHOR_EVIDENCE_ONCHAIN',
        'MANAGE_POLICE_ACCOUNTS', 'ASSIGN_CASES', 'REVIEW_UNIT_WORKLOAD',
        'CREATE_STATE_WORKSPACE', 'MONITOR_CROSS_BORDER_TRENDS', 'CONFIGURE_GLOBAL_SETTINGS', 'EMERGENCY_LOCKDOWN',
        'RECEIVE_FREEZE_NOTICE', 'CONFIRM_ACCOUNT_FREEZE', 'SUBMIT_KYC_DOSSIER',
        'COMPARE_PDF_HASH_TIMESTAMP', 'VERIFY_COURT_INTEGRITY'
      ]
    },
    EXCHANGE_NODAL_OFFICER: {
      name: 'EXCHANGE_NODAL_OFFICER',
      title: 'Exchange Nodal Officer (Binance / VASP)',
      color: 'amber',
      scope: 'Strictly Incoming Statutory Requests Tied to Binance Platform',
      description: 'Compliance officer representing external crypto exchanges. Receives freeze notices, confirms account freezes, and submits KYC.',
      permissions: ['RECEIVE_FREEZE_NOTICE', 'CONFIRM_ACCOUNT_FREEZE', 'SUBMIT_KYC_DOSSIER']
    },
    AUDITOR: {
      name: 'AUDITOR',
      title: 'Auditor / Judicial Representative',
      color: 'purple',
      scope: 'Read-Only Verification Access (Zero Execution Permissions)',
      description: 'Judges, public prosecutors, or judicial auditors comparing case PDF hashes against smart contract timestamps.',
      permissions: ['VIEW_COURT_SUMMARY', 'COMPARE_PDF_HASH_TIMESTAMP', 'VERIFY_COURT_INTEGRITY']
    }
  }
};

/**
 * Check if the given role has the specified permission
 */
function userHasPermission(roleName, permission) {
  const roleCfg = RBAC_CONFIG.ROLES[roleName];
  if (!roleCfg) return false;
  return roleCfg.permissions.includes(permission);
}

/**
 * Check if user belongs to one of the specified allowed roles
 */
function userMatchesRoles(roleName, allowedRolesString) {
  if (!allowedRolesString) return true;
  const allowed = allowedRolesString.split(',').map(s => s.trim());
  return allowed.includes(roleName);
}

/**
 * Core UI Permission Enforcer: Scans DOM buttons with data attributes and updates their states
 */
function applyPermissionRules(user) {
  if (!user) return;
  const roleName = user.role_name;
  const roleConfig = RBAC_CONFIG.ROLES[roleName] || {
    title: roleName,
    scope: 'Unknown Scope',
    description: '',
    permissions: []
  };

  // 1. Update Active Profile Card & Scope Banner
  const roleTitleElem = document.getElementById('active-role-title');
  if (roleTitleElem) roleTitleElem.innerText = roleConfig.title;

  const roleDescElem = document.getElementById('active-role-desc');
  if (roleDescElem) roleDescElem.innerText = roleConfig.description;

  const scopeElem = document.getElementById('active-scope-badge');
  if (scopeElem) scopeElem.innerText = `Scope: ${roleConfig.scope}`;

  const headerBadge = document.getElementById('header-role-badge');
  if (headerBadge) {
    headerBadge.innerText = roleName;
    headerBadge.className = `px-2 py-0.5 rounded border text-[10px] font-mono uppercase bg-${roleConfig.color || 'blue'}-500/20 text-${roleConfig.color || 'blue'}-300 border-${roleConfig.color || 'blue'}-500/30`;
  }

  const headerScope = document.getElementById('header-scope-text');
  if (headerScope) headerScope.innerText = roleConfig.scope;

  // 2. Scan and enforce all buttons with declarative RBAC attributes
  const allActionButtons = document.querySelectorAll('button[data-permission], button[data-roles]');
  
  allActionButtons.forEach(btn => {
    const requiredPermission = btn.getAttribute('data-permission');
    const allowedRoles = btn.getAttribute('data-roles');

    let isAllowed = true;
    let denialReason = '';

    if (requiredPermission && !userHasPermission(roleName, requiredPermission)) {
      isAllowed = false;
      denialReason = `Denied: Requires permission '${requiredPermission}'. Active role: ${roleName}`;
    }

    if (isAllowed && allowedRoles && !userMatchesRoles(roleName, allowedRoles)) {
      isAllowed = false;
      denialReason = `Denied: Requires one of [${allowedRoles}]. Active role: ${roleName}`;
    }

    // Special Judicial Read-Only Constraint: Auditor has 0 write/execution permissions
    if (roleName === 'AUDITOR' && btn.getAttribute('data-is-write') === 'true') {
      isAllowed = false;
      denialReason = 'Denied: AUDITOR / Judicial role has strict read-only access (0 write/execution permissions).';
    }

    // Apply visual styling and interactivity
    const lockIcon = btn.querySelector('.rbac-lock-icon');
    const statusBadge = btn.querySelector('.rbac-badge');

    if (isAllowed) {
      btn.disabled = false;
      btn.classList.remove('opacity-40', 'cursor-not-allowed', 'filter', 'grayscale');
      btn.classList.add('hover:shadow-md');
      btn.title = `Access Granted for ${roleConfig.title}`;
      if (lockIcon) lockIcon.classList.add('hidden');
      if (statusBadge) {
        statusBadge.innerText = 'ALLOWED';
        statusBadge.className = 'rbac-badge text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      }
    } else {
      btn.disabled = true;
      btn.classList.add('opacity-40', 'cursor-not-allowed', 'filter', 'grayscale');
      btn.classList.remove('hover:shadow-md');
      btn.title = `🔒 ${denialReason}`;
      if (lockIcon) lockIcon.classList.remove('hidden');
      if (statusBadge) {
        statusBadge.innerText = 'LOCKED';
        statusBadge.className = 'rbac-badge text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30';
      }
    }
  });

  // 3. Highlight the Active Persona Button at top
  document.querySelectorAll('.persona-switch-btn').forEach(btn => {
    if (btn.getAttribute('data-role') === roleName) {
      btn.classList.add('ring-2', 'ring-white', 'scale-105', 'font-bold');
    } else {
      btn.classList.remove('ring-2', 'ring-white', 'scale-105', 'font-bold');
    }
  });

  // 4. Update the live Security Audit Log
  logSecurityAudit(`RBAC Context recomputed for ${user.name}. Role: ${roleName} (${roleConfig.permissions.length} active permissions).`);
}

function logSecurityAudit(message) {
  const auditContainer = document.getElementById('security-audit-logs');
  if (!auditContainer) return;
  const time = new Date().toLocaleTimeString();
  const entry = document.createElement('div');
  entry.className = 'text-[11px] font-mono py-1 border-b border-slate-700/50 text-slate-300 flex items-center space-x-2';
  entry.innerHTML = `<span class="text-blue-400 font-bold">[${time}]</span> <span>${message}</span>`;
  auditContainer.prepend(entry);

  // Keep max 20 items
  while (auditContainer.children.length > 20) {
    auditContainer.removeChild(auditContainer.lastChild);
  }
}
