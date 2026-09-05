/**
 * Role-Based Access Control (RBAC) Middleware
 * Enforces permissions and allowed roles on incoming requests.
 */

const { ROLES, PERMISSIONS, ROLE_PERMISSIONS, hasPermission } = require('../roles');

/**
 * Express middleware requiring one of the specified roles.
 * @param {string[]} allowedRoles 
 */
function requireRole(allowedRoles) {
  return (req, res, next) => {
    const currentUser = req.user || req.app.get('currentUser');
    if (!currentUser) {
      return res.status(401).json({
        error: 'Authentication Required',
        message: 'You must be authenticated to perform this operation.'
      });
    }

    if (!allowedRoles.includes(currentUser.role_name)) {
      return res.status(403).json({
        error: 'Access Denied (RBAC Violation)',
        message: `Your active role '${currentUser.role_name}' is not authorized. Required: [${allowedRoles.join(', ')}].`,
        userRole: currentUser.role_name,
        requiredRoles: allowedRoles
      });
    }

    next();
  };
}

/**
 * Express middleware requiring a specific granular permission.
 * @param {string} permission 
 */
function requirePermission(permission) {
  return (req, res, next) => {
    const currentUser = req.user || req.app.get('currentUser');
    if (!currentUser) {
      return res.status(401).json({
        error: 'Authentication Required',
        message: 'You must be authenticated to perform this operation.'
      });
    }

    if (!hasPermission(currentUser.role_name, permission)) {
      return res.status(403).json({
        error: 'Access Denied (Insufficient Permissions)',
        message: `Your role '${currentUser.role_name}' lacks required permission '${permission}'.`,
        userRole: currentUser.role_name,
        requiredPermission: permission
      });
    }

    next();
  };
}

module.exports = {
  requireRole,
  requirePermission
};
