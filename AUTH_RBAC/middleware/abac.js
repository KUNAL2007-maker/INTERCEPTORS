/**
 * Attribute-Based Access Control (ABAC) Helper
 * Validates resource scoping based on user attributes (workspace_id, victim_id, role).
 */

const { ROLES } = require('../roles');

/**
 * Filter SQL/object query scoping depending on active user's identity attributes.
 * @param {object} currentUser - Active user object
 * @returns {object} { whereClause: string, params: Array }
 */
function getCaseScopeFilter(currentUser) {
  if (!currentUser) {
    return { whereClause: '1 = 0', params: [] }; // Deny all
  }

  // Super Admin & Auditor have nationwide visibility across all cases
  if (currentUser.role_name === ROLES.SUPER_ADMIN || currentUser.role_name === ROLES.AUDITOR) {
    return { whereClause: '1 = 1', params: [] };
  }

  // Victim is restricted strictly to their own cases
  if (currentUser.role_name === ROLES.VICTIM) {
    return { whereClause: 'c.victim_id = $1', params: [currentUser.id] };
  }

  // Police Investigators & District Admins are scoped to their assigned workspace / district unit
  return { whereClause: 'c.workspace_id = $1', params: [currentUser.workspace_id] };
}

/**
 * Validates if the current user can access a specific case entity.
 * @param {object} currentUser 
 * @param {object} caseRecord 
 * @returns {boolean}
 */
function canAccessCase(currentUser, caseRecord) {
  if (!currentUser || !caseRecord) return false;
  if (currentUser.role_name === ROLES.SUPER_ADMIN || currentUser.role_name === ROLES.AUDITOR) return true;
  if (currentUser.role_name === ROLES.VICTIM) return caseRecord.victim_id === currentUser.id;
  return caseRecord.workspace_id === currentUser.workspace_id;
}

module.exports = {
  getCaseScopeFilter,
  canAccessCase
};
