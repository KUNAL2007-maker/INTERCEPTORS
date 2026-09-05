// Role-Based Access Control (RBAC) Middleware

function requireRole(allowedRoles) {
  return (req, res, next) => {
    const currentUser = req.user || req.app.get('currentUser');
    if (!currentUser || !allowedRoles.includes(currentUser.role_name)) {
      return res.status(403).json({
        error: 'Access Denied (RBAC Restriction)',
        message: `Your role '${currentUser ? currentUser.role_name : 'UNAUTHENTICATED'}' is not authorized to perform this operation. Required: [${allowedRoles.join(', ')}]`,
        userRole: currentUser ? currentUser.role_name : 'UNAUTHENTICATED',
        requiredRoles: allowedRoles
      });
    }
    next();
  };
}

module.exports = { requireRole };
