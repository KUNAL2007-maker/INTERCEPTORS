/**
 * Attribute-Based Access Control (ABAC) Helper
 * Validates resource scoping based on user attributes (workspace_id, victim_id, vasp_id, role).
 */

const { ROLES } = require('../roles');

/**
 * Filter an array of cases in memory based on the user's ABAC scope.
 * @param {object} currentUser 
 * @param {Array} cases 
 * @returns {Array}
 */
function filterCasesByScope(currentUser, cases = []) {
  if (!currentUser) return [];

  // Super Admin & Auditor have nationwide visibility across all cases
  if (currentUser.role_name === ROLES.SUPER_ADMIN || currentUser.role_name === ROLES.AUDITOR) {
    return cases;
  }

  // Victim: Strictly restricted to their own submitted case files
  if (currentUser.role_name === ROLES.VICTIM) {
    return cases.filter(c => c.victim_id === currentUser.id);
  }

  // Exchange Nodal Officer: Strictly restricted to cases involving their assigned VASP
  if (currentUser.role_name === ROLES.EXCHANGE_NODAL_OFFICER) {
    return cases.filter(c => c.vasp_id === currentUser.vasp_id || c.target_vasp === currentUser.vasp_name);
  }

  // Investigators & Workspace Admins: Scoped to their unit/workspace
  return cases.filter(c => c.workspace_id === currentUser.workspace_id);
}

/**
 * Returns SQL WHERE clause and params for relational database queries
 * @param {object} currentUser 
 * @returns {object} { whereClause: string, params: Array }
 */
function getCaseScopeFilter(currentUser) {
  if (!currentUser) {
    return { whereClause: '1 = 0', params: [] }; // Deny all
  }

  if (currentUser.role_name === ROLES.SUPER_ADMIN || currentUser.role_name === ROLES.AUDITOR) {
    return { whereClause: '1 = 1', params: [] };
  }

  if (currentUser.role_name === ROLES.VICTIM) {
    return { whereClause: 'c.victim_id = $1', params: [currentUser.id] };
  }

  if (currentUser.role_name === ROLES.EXCHANGE_NODAL_OFFICER) {
    return { whereClause: 'c.vasp_id = $1', params: [currentUser.vasp_id] };
  }

  return { whereClause: 'c.workspace_id = $1', params: [currentUser.workspace_id] };
}

/**
 * Check if the user is in a read-only role (e.g. Auditor)
 * @param {object} currentUser 
 * @returns {boolean}
 */
function isReadOnlyRole(currentUser) {
  return currentUser && currentUser.role_name === ROLES.AUDITOR;
}

module.exports = {
  filterCasesByScope,
  getCaseScopeFilter,
  isReadOnlyRole
};
