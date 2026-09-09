/**
 * Single source of truth for role -> view access.
 *
 * Both the view gate (AppShell) and the navigation (Sidebar) read from this
 * module. That is the whole point: when the two lists were maintained
 * separately, a role could be authorised for a view that had no nav entry
 * (the supervisor and `cases`), and a view could be linked from four places
 * while being authorised for nobody (`trace`).
 *
 * Rules enforced here:
 *   1. A role sees exactly the views listed for it. No fallback nav.
 *   2. Every listed view is backed by a permission the role actually holds
 *      (asserted below, so a drift in ROLE_PERMISSIONS surfaces immediately).
 *   3. The first entry is the landing view for that role.
 */

import { ROLE_PERMISSIONS, PERMISSIONS, normalizeRole, type RoleName } from './rbac-abac';

export type ViewKey =
  | 'dashboard'
  | 'cases'
  | 'transfers'
  | 'graph'
  | 'canvas'
  | 'trace'
  | 'chat'
  | 'notices'
  | 'victim_portal'
  | 'audit_logs'
  | 'exchange_portal'
  | 'national_coordination'
  | 'system_admin';

export type NavGroup = 'Case Work' | 'Analysis' | 'Statutory' | 'Oversight' | 'Administration';

type ViewDefinition = {
  label: string;
  hint: string;
  group: NavGroup;
  /** Any one of these permissions authorises the view. */
  requires: string[];
};

/**
 * Default presentation for each view. Roles that need different wording
 * override it in ROLE_VIEW_LABELS below - a supervisor's dashboard is a
 * triage queue, an officer's is a case overview, and calling both
 * "Dashboard" hides what the screen is for.
 */
const VIEW_DEFS: Record<ViewKey, ViewDefinition> = {
  dashboard: {
    label: 'Overview',
    hint: 'Case posture and pending actions',
    group: 'Case Work',
    requires: [
      PERMISSIONS.CASE_READ_ASSIGNED,
      PERMISSIONS.CASE_READ_UNIT,
      PERMISSIONS.CASE_READ_ALL,
    ],
  },
  cases: {
    label: 'Case Register',
    hint: 'Complaints within your scope',
    group: 'Case Work',
    requires: [
      PERMISSIONS.CASE_READ_ASSIGNED,
      PERMISSIONS.CASE_READ_UNIT,
      PERMISSIONS.CASE_READ_ALL,
      PERMISSIONS.COURT_EVIDENCE_VIEW,
    ],
  },
  trace: {
    label: 'Wallet Trace',
    hint: 'Follow funds from a seed address',
    group: 'Analysis',
    requires: [PERMISSIONS.TRACE_EXECUTE, PERMISSIONS.INTELLIGENCE_ADDRESS_SEARCH],
  },
  graph: {
    label: 'Fund Flow Graph',
    hint: 'Multi-hop attribution canvas',
    group: 'Analysis',
    requires: [PERMISSIONS.WALLET_GRAPH_READ],
  },
  canvas: {
    label: 'Crime Canvas',
    hint: 'Interactive graph, wallet risk & VASP path',
    group: 'Analysis',
    requires: [PERMISSIONS.WALLET_GRAPH_READ],
  },
  transfers: {
    label: 'Transfer Ledger',
    hint: 'Transaction-level detail',
    group: 'Analysis',
    requires: [PERMISSIONS.WALLET_DETAILS_READ, PERMISSIONS.CASE_EVIDENCE_VIEW],
  },
  chat: {
    label: 'Case Assistant',
    hint: 'Grounded analytical support',
    group: 'Analysis',
    requires: [PERMISSIONS.COPILOT_USE],
  },
  notices: {
    label: 'Section 94 BNSS Orders',
    hint: 'Draft, sign and serve requisitions',
    group: 'Statutory',
    requires: [PERMISSIONS.FREEZE_NOTICE_DRAFT, PERMISSIONS.FREEZE_ORDER_ISSUE, PERMISSIONS.COURT_EVIDENCE_VIEW],
  },
  audit_logs: {
    label: 'Audit Trail',
    hint: 'Immutable action log',
    group: 'Oversight',
    requires: [PERMISSIONS.AUDIT_LOG_READ],
  },
  victim_portal: {
    label: 'My Complaint',
    hint: 'Status and recovery milestones',
    group: 'Case Work',
    requires: [PERMISSIONS.COMPLAINT_STATUS_READ],
  },
  exchange_portal: {
    label: 'Compliance Desk',
    hint: 'Requisitions served on this exchange',
    group: 'Statutory',
    requires: [PERMISSIONS.VASP_REQUESTS_VIEW_OWN],
  },
  national_coordination: {
    label: 'National Correlation',
    hint: 'Cross-state pattern intelligence',
    group: 'Oversight',
    requires: [PERMISSIONS.INTELLIGENCE_CROSS_CASE_VIEW],
  },
  system_admin: {
    label: 'System Administration',
    hint: 'Accounts, roles and platform health',
    group: 'Administration',
    requires: [PERMISSIONS.ADMIN_USER_MANAGE, PERMISSIONS.ADMIN_SYSTEM_HEALTH],
  },
};

/**
 * The authoritative allow-list. Order matters: index 0 is where the role lands
 * on sign-in and where an out-of-scope navigation attempt is redirected.
 *
 * Only the eight canonical roles appear. Legacy aliases are resolved through
 * normalizeRole() before lookup, so there is one definition per real role
 * rather than thirteen that can drift apart.
 */
export const ROLE_VIEWS: Record<RoleName, ViewKey[]> = {
  VICTIM: ['victim_portal'],

  // Field officer: works the cases assigned to them, drafts the requisition.
  // Cannot sign it - that gate is POL-05 and lives with a gazetted officer.
  INVESTIGATING_OFFICER: ['dashboard', 'cases', 'trace', 'graph', 'canvas', 'transfers', 'notices', 'chat'],

  // Supervisor triages and allocates. Deliberately not given the trace or
  // notice screens: allocation and oversight is the job, and putting the
  // investigative tools here is what made the assign action invisible.
  CYBERCRIME_SUPERVISOR: ['dashboard', 'cases', 'graph', 'canvas', 'audit_logs'],

  // Gazetted officer: reviews the draft and signs the freeze order.
  SENIOR_INVESTIGATOR: ['dashboard', 'notices', 'cases', 'trace', 'graph', 'canvas', 'transfers', 'audit_logs'],

  VASP_COMPLIANCE_OFFICER: ['exchange_portal'],

  // Strictly read-only. No dashboard, no trace, no notice drafting - but the
  // court must be able to open served freeze orders to verify the Ed25519
  // signature and SHA-256 dossier hash, so `notices` is granted read-only
  // (draft/sign/serve controls are gated off in LegalNoticesView).
  COURT_REVIEWER: ['cases', 'notices', 'graph', 'canvas', 'audit_logs'],

  NATIONAL_COORDINATION_ANALYST: ['national_coordination', 'trace', 'graph', 'canvas', 'audit_logs'],

  SYSTEM_ADMIN: ['system_admin', 'audit_logs'],

  // Legacy aliases are never looked up directly (normalizeRole maps them
  // first) but the Record type requires them. Point them at the canonical
  // list so an accidental direct lookup cannot widen access.
  NORMAL_INVESTIGATOR: ['dashboard', 'cases', 'trace', 'graph', 'canvas', 'transfers', 'notices', 'chat'],
  WORKSPACE_ADMIN: ['dashboard', 'cases', 'graph', 'canvas', 'audit_logs'],
  SUPER_ADMIN: ['system_admin', 'audit_logs'],
  EXCHANGE_NODAL_OFFICER: ['exchange_portal'],
  AUDITOR: ['cases', 'notices', 'graph', 'canvas', 'audit_logs'],
};

/** Role-specific wording where the generic label would mislead. */
const ROLE_VIEW_LABELS: Partial<Record<RoleName, Partial<Record<ViewKey, { label?: string; hint?: string }>>>> = {
  CYBERCRIME_SUPERVISOR: {
    dashboard: { label: 'Triage & Allocation', hint: 'Unassigned complaints awaiting an officer' },
    cases: { label: 'Unit Case Register', hint: 'All cases in your jurisdiction' },
    graph: { label: 'Fund Flow Review', hint: 'Read-only attribution canvas' },
  },
  SENIOR_INVESTIGATOR: {
    dashboard: { label: 'Statutory Review Desk', hint: 'Orders awaiting your signature' },
    notices: { label: 'Freeze Orders', hint: 'Review and sign under Section 94 BNSS' },
  },
  COURT_REVIEWER: {
    cases: { label: 'Evidence Dossier', hint: 'Read-only case record and integrity hash' },
    notices: { label: 'Freeze Order Review', hint: 'Verify Ed25519 signatures & SHA-256 integrity' },
    graph: { label: 'Fund Flow Review', hint: 'Read-only attribution canvas' },
    audit_logs: { label: 'Chain of Custody', hint: 'Who did what, and when' },
  },
  NATIONAL_COORDINATION_ANALYST: {
    trace: { label: 'Address Lookup', hint: 'Cross-case address intelligence' },
  },
  INVESTIGATING_OFFICER: {
    dashboard: { label: 'Command Overview', hint: 'Your assigned caseload' },
    cases: { label: 'My Cases', hint: 'Cases assigned to your warrant' },
    notices: { label: 'Draft Requisitions', hint: 'Prepare a Section 94 BNSS order' },
  },
};

export type NavItem = {
  key: ViewKey;
  label: string;
  hint: string;
  group: NavGroup;
};

/** Views this role may open, in nav order, with role-appropriate labels. */
export function viewsForRole(role: string | null | undefined): NavItem[] {
  const norm = normalizeRole(role || '');
  const keys = ROLE_VIEWS[norm] || ROLE_VIEWS[(role as RoleName) ?? 'VICTIM'] || ['victim_portal'];
  const overrides = ROLE_VIEW_LABELS[norm] || {};
  return keys.map((key) => {
    const def = VIEW_DEFS[key];
    const over = overrides[key] || {};
    return {
      key,
      label: over.label ?? def.label,
      hint: over.hint ?? def.hint,
      group: def.group,
    };
  });
}

/** Raw allow-list for a role. */
export function allowedViews(role: string | null | undefined): ViewKey[] {
  const norm = normalizeRole(role || '');
  return ROLE_VIEWS[norm] || ROLE_VIEWS[(role as RoleName) ?? 'VICTIM'] || ['victim_portal'];
}

export function canAccessView(role: string | null | undefined, view: ViewKey): boolean {
  return allowedViews(role).includes(view);
}

/** Where this role lands on sign-in. */
export function landingView(role: string | null | undefined): ViewKey {
  return allowedViews(role)[0] ?? 'victim_portal';
}

/**
 * Consistency check between this allow-list and ROLE_PERMISSIONS. Runs once at
 * module load in development so a permission removed from a role cannot leave
 * an orphaned nav entry behind. Silent in production.
 */
if (process.env.NODE_ENV !== 'production') {
  for (const [role, keys] of Object.entries(ROLE_VIEWS)) {
    const held = ROLE_PERMISSIONS[normalizeRole(role)] || [];
    for (const key of keys) {
      const needed = VIEW_DEFS[key].requires;
      if (!needed.some((p) => held.includes(p))) {
        // eslint-disable-next-line no-console
        console.warn(
          `[access] ${role} is granted view "${key}" but holds none of its backing permissions (${needed.join(', ')}).`
        );
      }
    }
  }
}
