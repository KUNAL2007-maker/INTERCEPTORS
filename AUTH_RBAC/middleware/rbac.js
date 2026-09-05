/**
 * Role-Based Access Control (RBAC) Middleware
 * Checks if the authenticated user's role has permission to access the route.
 */

const { ROLE_PERMISSIONS } = require('../roles');

/**
 * Middleware requiring specific roles.
 * @param {string[]} allowedRoles - Array of role strings allowed to access
 */
function requireRole(allowedRoles) {
  return (req, res, next) => {
    const currentUser = req.user || req.app.get('currentUser');
    if (!currentUser || !allowedRoles.includes(currentUser.role_name)) {
      return res.status(403).json({
        error: 'Access Denied (RBAC Restriction)',
        message: `Your role '${currentUser ? currentUser.role_name : 'UNAUTHENTICATED'}' is not authorized. Allowed: ${allowedRoles.join(', ')}`
      });
    }
    next();
  };
}

/**
 * Middleware requiring specific granular permissions.
 * @param {string} permission - The permission key required
 */
function requirePermission(permission) {
  return (req, res, next) => {
    const currentUser = req.user || req.app.get('currentUser');
    if (!currentUser) {
      return res.status(401).json({ error: 'Authentication Required' });
    }

    const userPermissions = ROLE_PERMISSIONS[currentUser.role_name] || [];
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        error: 'Access Denied (Insufficient Permissions)',
        message: `Role '${currentUser.role_name}' lacks required permission '${permission}'.`
      });
    }
    next();
  };
}

module.exports = {
  requireRole,
  requirePermission
};
