const { getOrCreateCsrfToken } = require('../middleware/csrf');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { logAuthEvent } = require('../utils/authLogger');

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
        logAuthEvent(req, 'register', 'failure', { code: result.code, email: req.body?.email ?? null });
        return sendError(res, result.status, result.code, result.message);
      }

      req.session.regenerate((regenerateError) => {
        if (regenerateError) {
          logAuthEvent(req, 'register', 'failure', { code: 'SESSION_ERROR' });
          return sendError(res, 500, 'SESSION_ERROR', 'Failed to initialize session');
        }

        req.session.userId = result.user.id;
        req.session.role = result.user.role;

        logAuthEvent(req, 'register', 'success', { userId: result.user.id, email: result.user.email });
        return sendSuccess(res, 201, {
          user: result.user,
          csrfToken: getOrCreateCsrfToken(req),
        });
      });
    },

    login: async (req, res) => {
      const result = await authService.login(req.body ?? {});
      if (!result.ok) {
        logAuthEvent(req, 'login', 'failure', { code: result.code, email: req.body?.email ?? null });
        return sendError(res, result.status, result.code, result.message);
      }

      req.session.regenerate((regenerateError) => {
        if (regenerateError) {
          logAuthEvent(req, 'login', 'failure', { code: 'SESSION_ERROR' });
          return sendError(res, 500, 'SESSION_ERROR', 'Failed to initialize session');
        }

        req.session.userId = result.user.id;
        req.session.role = result.user.role;

        logAuthEvent(req, 'login', 'success', { userId: result.user.id, email: result.user.email });
        return sendSuccess(res, 200, {
          user: result.user,
          csrfToken: getOrCreateCsrfToken(req),
        });
      });
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
