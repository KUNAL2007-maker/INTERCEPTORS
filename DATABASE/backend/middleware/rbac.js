// Role-Based Access Control (RBAC) Middleware

function requireRole(allowedRoles) {
  return (req, res, next) => {
    const currentUser = req.app.get('currentUser');
    if (!currentUser || !allowedRoles.includes(currentUser.role_name)) {
      return res.status(403).json({
        error: 'Access Denied (RBAC Restriction)',
        message: `Your role '${currentUser ? currentUser.role_name : 'UNAUTHENTICATED'}' is not authorized to perform this operation. Allowed roles: ${allowedRoles.join(', ')}`
      });
    }
    next();
  };
}

module.exports = { requireRole };
