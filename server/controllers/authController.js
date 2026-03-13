const { getOrCreateCsrfToken } = require('../middleware/csrf');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { logAuthEvent } = require('../utils/authLogger');

function startSession(req, res, user, eventName, statusCode = 200) {
  req.session.regenerate((regenerateError) => {
    if (regenerateError) {
      logAuthEvent(req, eventName, 'failure', { code: 'SESSION_ERROR' });
      return sendError(res, 500, 'SESSION_ERROR', 'Failed to initialize session');
    }

    req.session.userId = user.id;
    req.session.role = user.role;

    logAuthEvent(req, eventName, 'success', { userId: user.id, email: user.email });
    return sendSuccess(res, statusCode, {
      user,
      csrfToken: getOrCreateCsrfToken(req),
    });
  });
}

function buildAuthController({ authService }) {
  return {
    getSession: async (req, res) => {
      const user = await authService.getSessionUser(req.session?.userId);

      if (!user) {
        req.session.userId = null;
        req.session.role = null;
      }

      logAuthEvent(req, 'session', 'success', { authenticated: Boolean(user) });
      return sendSuccess(res, 200, {
        user,
        csrfToken: getOrCreateCsrfToken(req),
      });
    },

    register: async (req, res) => {
      const result = await authService.register(req.body ?? {});
      logAuthEvent(req, 'register', 'failure', { code: result.code, email: req.body?.email ?? null });
      return sendError(res, result.status, result.code, result.message);
    },

    login: async (req, res) => {
      const result = await authService.login(req.body ?? {});
      if (!result.ok) {
        logAuthEvent(req, 'login', 'failure', { code: result.code, email: req.body?.email ?? null });
        return sendError(res, result.status, result.code, result.message);
      }

      return startSession(req, res, result.user, 'login', 200);
    },

    oauthLogin: async (req, res) => {
      const { provider } = req.params;
      const result = await authService.loginWithOAuth({
        email: req.body?.email,
        name: req.body?.name,
        providerId: req.body?.providerId,
        authProvider: provider,
      });

      if (!result.ok) {
        logAuthEvent(req, `oauth_${provider}`, 'failure', { code: result.code });
        return sendError(res, result.status, result.code, result.message);
      }

      return startSession(req, res, result.user, `oauth_${provider}`, 200);
    },

    getOAuthProviders: async (_req, res) => sendSuccess(res, 200, { providers: authService.getOAuthProviders?.() ?? {} }),

    logout: async (req, res) => {
      req.session.destroy((error) => {
        if (error) {
          logAuthEvent(req, 'logout', 'failure', { code: 'SESSION_ERROR' });
          return sendError(res, 500, 'SESSION_ERROR', 'Failed to logout');
        }

        res.clearCookie('smove.sid');
        logAuthEvent(req, 'logout', 'success');
        return sendSuccess(res, 200, {
          user: null,
          csrfToken: null,
        });
      });
    },
  };
}

module.exports = { buildAuthController };
