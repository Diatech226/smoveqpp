const { verifyClerkJwt } = require('../utils/clerkJwt');
const { CLERK_JWKS_URL, CLERK_ISSUER_URL, CLERK_AUDIENCE } = require('../config/env');

function extractBearerToken(req) {
  const raw = req.headers?.authorization;
  if (!raw || typeof raw !== 'string') return null;
  if (!raw.startsWith('Bearer ')) return null;
  return raw.slice('Bearer '.length).trim();
}

function createClerkAuthMiddleware({ authService }) {
  return async (req, _res, next) => {
    const token = extractBearerToken(req);
    if (!token) {
      req.clerkAuth = null;
      req.appUser = null;
      return next();
    }

    try {
      const claims = await verifyClerkJwt(token, {
        jwksUrl: CLERK_JWKS_URL,
        issuer: CLERK_ISSUER_URL,
        audience: CLERK_AUDIENCE || undefined,
      });

      req.clerkAuth = claims;
      req.appUser = await authService.syncClerkUserFromClaims(claims);
      return next();
    } catch (_error) {
      req.clerkAuth = null;
      req.appUser = null;
      return next();
    }
  };
}

function requireClerkAuth(req, res, next) {
  if (!req.clerkAuth?.sub || !req.appUser) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Clerk authentication required' } });
  }

  return next();
}

module.exports = { createClerkAuthMiddleware, requireClerkAuth };
