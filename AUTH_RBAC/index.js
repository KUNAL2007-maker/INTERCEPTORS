const { ROLES, PERMISSIONS, ROLE_PERMISSIONS } = require('./roles');
const { requireRole, requirePermission } = require('./middleware/rbac');
const { getCaseScopeFilter, canAccessCase } = require('./middleware/abac');

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  requireRole,
  requirePermission,
  getCaseScopeFilter,
  canAccessCase
};
