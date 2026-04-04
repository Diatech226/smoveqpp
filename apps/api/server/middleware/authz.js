const { hasPermission } = require('../security/rbac');

function requireAuthenticated(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } });
  }
  return next();
}

function requirePermission(permission) {
  return (req, res, next) => {
    const role = req.session?.role;
    if (!role || !hasPermission(role, permission)) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
    }
    return next();
  };
}

module.exports = { requireAuthenticated, requirePermission };
