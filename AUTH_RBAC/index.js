const {
  ROLES,
  SCOPES,
  ROLE_METADATA,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission
} = require('./roles');

const {
  requireRole,
  requirePermission
} = require('./middleware/rbac');

const {
  filterCasesByScope,
  getCaseScopeFilter,
  isReadOnlyRole
} = require('./middleware/abac');

module.exports = {
  ROLES,
  SCOPES,
  ROLE_METADATA,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  requireRole,
  requirePermission,
  filterCasesByScope,
  getCaseScopeFilter,
  isReadOnlyRole
};
