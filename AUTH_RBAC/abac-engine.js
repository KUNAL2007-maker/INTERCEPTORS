/**
 * Production-Grade Attribute-Based Access Control (ABAC) Policy Engine
 * Problem Statement: Real-Time Identification of Fraud-Linked Cryptocurrency Exchanges (SIH 2026)
 * 
 * Evaluates fine-grained access decisions using the quadruple:
 * Decision = f(Subject, Resource, Action, Environment)
 */

const { ROLES } = require('./roles');

// System Environment State (Can be dynamically toggled)
const systemEnvironment = {
  isEmergencyLockdown: false,
  networkDomain: 'gov.in.vpn',
  allowedHoursStart: 0,
  allowedHoursEnd: 24
};

/**
 * ABAC Policy Definitions
 */
const ABAC_POLICIES = [
  // 1. EMERGENCY LOCKDOWN OVERRIDE
  {
    id: 'POL-01-EMERGENCY-LOCKDOWN',
    name: 'National Cyber Crisis Lockdown Rule',
    description: 'During emergency lockdown, all mutations and state actions are suspended except for Super Admin.',
    evaluate: (subject, resource, action, env) => {
      if (env.isEmergencyLockdown && subject.role_name !== ROLES.SUPER_ADMIN) {
        return {
          allowed: false,
          reason: 'Emergency Platform Lockdown is ACTIVE. All state operations suspended by I4C National Nodal Authority.'
        };
      }
      return { allowed: true };
    }
  },

  // 2. JUDICIAL READ-ONLY RULE
  {
    id: 'POL-02-JUDICIAL-READ-ONLY',
    name: 'Judicial & Auditor Strict Read-Only Rule',
    description: 'Auditor and judicial officers have zero write, delete, or mutation execution permissions.',
    evaluate: (subject, resource, action, env) => {
      if (subject.role_name === ROLES.AUDITOR) {
        const mutatingActions = ['CREATE', 'UPDATE', 'DELETE', 'APPROVE_FREEZE', 'DRAFT_FREEZE', 'RUN_TRACE', 'FILE_COMPLAINT'];
        if (mutatingActions.includes(action)) {
          return {
            allowed: false,
            reason: `Auditor role is restricted to read-only evidence inspection (Action '${action}' prohibited under Sec 65B BSA compliance).`
          };
        }
      }
      return { allowed: true };
    }
  },

  // 3. VICTIM DATA ISOLATION RULE
  {
    id: 'POL-03-VICTIM-ISOLATION',
    name: 'Citizen / Victim Privacy Boundary',
    description: 'Victim can only view and update case files matching their exact victim ID.',
    evaluate: (subject, resource, action, env) => {
      if (subject.role_name === ROLES.VICTIM) {
        if (resource && resource.victim_id && resource.victim_id !== subject.id) {
          return {
            allowed: false,
            reason: `Victim Ownership Mismatch: Active Citizen ID (#${subject.id}) cannot access Case File belonging to Victim #${resource.victim_id}.`
          };
        }
      }
      return { allowed: true };
    }
  },

  // 4. JURISDICTIONAL WORKSPACE BOUNDARY RULE
  {
    id: 'POL-04-JURISDICTION-BOUNDARY',
    name: 'State / Regional Unit Jurisdictional Isolation',
    description: 'Field cyber officers and unit admins are strictly restricted to cases originating within their territorial workspace.',
    evaluate: (subject, resource, action, env) => {
      const unitScopedRoles = [ROLES.NORMAL_INVESTIGATOR, ROLES.SENIOR_INVESTIGATOR, ROLES.WORKSPACE_ADMIN];
      if (unitScopedRoles.includes(subject.role_name)) {
        if (resource && resource.workspace_id && subject.workspace_id && resource.workspace_id !== subject.workspace_id) {
          return {
            allowed: false,
            reason: `Jurisdictional Boundary Violation: User is stationed at Workspace #${subject.workspace_id} (${subject.jurisdiction_code || 'State Unit'}), but target case belongs to Workspace #${resource.workspace_id}.`
          };
        }
      }
      return { allowed: true };
    }
  },

  // 5. STATUTORY GAZETTED OFFICER FREEZE APPROVAL RULE
  {
    id: 'POL-05-STATUTORY-FREEZE-APPROVAL',
    name: 'Section 94 BNSS Legal Freeze Gate',
    description: 'Freezing VASP accounts requires Gazetted status / Senior Investigator authority and completed trace attribution.',
    evaluate: (subject, resource, action, env) => {
      if (action === 'APPROVE_FREEZE') {
        // Must be Senior Investigator or Super Admin
        if (subject.role_name !== ROLES.SENIOR_INVESTIGATOR && subject.role_name !== ROLES.SUPER_ADMIN) {
          return {
            allowed: false,
            reason: `Statutory Authority Missing: Under Sec 94 BNSS, statutory freeze orders require Gazetted Senior Investigator or Central Nodal rank.`
          };
        }
        // Case must have already traced the suspect wallet
        if (resource && resource.status === 'PENDING_TRACING') {
          return {
            allowed: false,
            reason: `Premature Approval: Case is still in 'PENDING_TRACING' status. Blockchain graph attribution must complete before issuing a statutory freeze notice.`
          };
        }
      }
      return { allowed: true };
    }
  },

  // 6. VASP COMPLIANCE DESK ISOLATION RULE
  {
    id: 'POL-06-VASP-DESK-ISOLATION',
    name: 'Exchange Platform Isolation',
    description: 'Exchange Nodal Officers can only inspect notices and upload KYC for cases involving their own registered exchange.',
    evaluate: (subject, resource, action, env) => {
      if (subject.role_name === ROLES.EXCHANGE_NODAL_OFFICER) {
        if (resource && resource.vasp_id && subject.vasp_id && resource.vasp_id !== subject.vasp_id) {
          return {
            allowed: false,
            reason: `VASP Boundary Mismatch: Officer represents VASP #${subject.vasp_id} (${subject.vasp_name || 'Assigned Exchange'}), but case target is VASP #${resource.vasp_id} (${resource.target_vasp}).`
          };
        }
      }
      return { allowed: true };
    }
  },

  // 7. CLASSIFICATION & CONFIDENTIALITY RULE
  {
    id: 'POL-07-DATA-CLASSIFICATION',
    name: 'National Intelligence Classification Filter',
    description: 'Cases marked as TOP_SECRET / CONFIDENTIAL require high clearance level (LEVEL_3+ or SUPER_ADMIN).',
    evaluate: (subject, resource, action, env) => {
      if (resource && resource.classification === 'TOP_SECRET') {
        const hasClearance = subject.clearance_level === 'TOP_SECRET' || subject.role_name === ROLES.SUPER_ADMIN;
        if (!hasClearance) {
          return {
            allowed: false,
            reason: `Security Clearance Insufficient: Case classification is 'TOP_SECRET'. Active clearance level: ${subject.clearance_level || 'LEVEL_1'}.`
          };
        }
      }
      return { allowed: true };
    }
  }
];

/**
 * Main ABAC Evaluation Engine
 * @param {object} subject - Active user with identity & attributes
 * @param {object} resource - Target resource (case, freeze order, report)
 * @param {string} action - Action verb (VIEW_CASE, APPROVE_FREEZE, etc.)
 * @param {object} envOverrides - Optional environment overrides
 * @returns {object} { allowed: boolean, failedPolicy: string, reason: string, details: object }
 */
function evaluateABAC(subject, resource, action, envOverrides = {}) {
  if (!subject) {
    return {
      allowed: false,
      failedPolicy: 'UNAUTHENTICATED',
      reason: 'No authenticated subject identity provided.'
    };
  }

  const env = { ...systemEnvironment, ...envOverrides };

  // Evaluate against all active ABAC policies
  for (const policy of ABAC_POLICIES) {
    const result = policy.evaluate(subject, resource, action, env);
    if (!result.allowed) {
      return {
        allowed: false,
        policyId: policy.id,
        policyName: policy.name,
        reason: result.reason,
        evaluatedContext: {
          subject: {
            id: subject.id,
            role: subject.role_name,
            workspace_id: subject.workspace_id,
            clearance: subject.clearance_level
          },
          resource: resource ? {
            id: resource.id,
            workspace_id: resource.workspace_id,
            victim_id: resource.victim_id,
            target_vasp: resource.target_vasp,
            classification: resource.classification
          } : null,
          action,
          environment: env
        }
      };
    }
  }

  return {
    allowed: true,
    reason: 'Access granted by all evaluated ABAC policies.',
    evaluatedContext: { subject: subject.name, action, resource: resource ? resource.id : null }
  };
}

module.exports = {
  systemEnvironment,
  ABAC_POLICIES,
  evaluateABAC
};
