function requireAuth(req, res, next) { if (!req.appUser?.id && !req.session?.userId) return res.status(401).json({ message: 'Unauthorized' }); next(); }
function requireRole(...roles) { return (req, res, next) => { const role = req.appUser?.role || req.session?.role; if (!roles.includes(role)) return res.status(403).json({ message: 'Forbidden' }); next(); }; }
function validateRequest(required = []) { return (req, res, next) => { const missing = required.filter((f) => req.body?.[f] === undefined || req.body?.[f] === null); if (missing.length) return res.status(400).json({ message: 'Validation failed', missing }); next(); }; }
function errorHandler(err, _req, res, _next) { return res.status(err.status || 500).json({ message: err.message || 'Unexpected error' }); }
module.exports = { requireAuth, requireRole, validateRequest, errorHandler };
