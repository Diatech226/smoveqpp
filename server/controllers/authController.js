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
      if (!result.ok) {
        logAuthEvent(req, 'register', 'failure', { code: result.code, reason: result.reason ?? null, email: req.body?.email ?? null });
        return sendError(res, result.status, result.code, result.message);
      }

      return startSession(req, res, result.user, 'register', 201);
    },

    login: async (req, res) => {
      const result = await authService.login(req.body ?? {});
      if (!result.ok) {
        logAuthEvent(req, 'login', 'failure', { code: result.code, reason: result.reason ?? null, email: req.body?.email ?? null });
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


    updateProfile: async (req, res) => {
      const result = await authService.updateProfile(req.session?.userId, req.body ?? {});
      if (!result.ok) {
        logAuthEvent(req, 'profile_update', 'failure', { code: result.code });
        return sendError(res, result.status, result.code, result.message);
      }

      req.session.role = result.user.role;
      logAuthEvent(req, 'profile_update', 'success', { userId: result.user.id });
      return sendSuccess(res, 200, {
        user: result.user,
        csrfToken: getOrCreateCsrfToken(req),
      });
    },

    forgotPassword: async (req, res) => {
      const result = await authService.requestPasswordReset(req.body ?? {});
      if (!result.ok) {
        logAuthEvent(req, 'forgot_password', 'failure', { code: result.code });
        return sendError(res, result.status, result.code, result.message);
      }

      const data = {
        accepted: true,
        csrfToken: getOrCreateCsrfToken(req),
      };

      if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
        data.resetToken = result.resetToken ?? null;
        data.expiresAt = result.expiresAt ?? null;
      }

      logAuthEvent(req, 'forgot_password', 'success');
      return sendSuccess(res, 200, data);
    },

    resetPassword: async (req, res) => {
      const result = await authService.resetPassword(req.body ?? {});
      if (!result.ok) {
        logAuthEvent(req, 'reset_password', 'failure', { code: result.code });
        return sendError(res, result.status, result.code, result.message);
      }

      return startSession(req, res, result.user, 'reset_password', 200);
    },

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
