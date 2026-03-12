const { getOrCreateCsrfToken } = require('../middleware/csrf');

function buildAuthController({ authService }) {
  return {
    getSession: async (req, res) => {
      const user = await authService.getSessionUser(req.session?.userId);

      if (!user) {
        req.session.userId = null;
        req.session.role = null;
      }

      return res.json({
        success: true,
        data: {
          user,
          csrfToken: getOrCreateCsrfToken(req),
        },
      });
    },

    register: async (req, res) => {
      const result = await authService.register(req.body ?? {});
      if (!result.ok) {
        return res.status(result.status).json({ success: false, error: { code: result.code, message: result.message } });
      }

      req.session.regenerate((regenerateError) => {
        if (regenerateError) {
          return res.status(500).json({ success: false, error: { code: 'SESSION_ERROR', message: 'Failed to initialize session' } });
        }

        req.session.userId = result.user.id;
        req.session.role = result.user.role;

        return res.status(201).json({
          success: true,
          data: {
            user: result.user,
            csrfToken: getOrCreateCsrfToken(req),
          },
        });
      });
    },

    login: async (req, res) => {
      const result = await authService.login(req.body ?? {});
      if (!result.ok) {
        return res.status(result.status).json({ success: false, error: { code: result.code, message: result.message } });
      }

      req.session.regenerate((regenerateError) => {
        if (regenerateError) {
          return res.status(500).json({ success: false, error: { code: 'SESSION_ERROR', message: 'Failed to initialize session' } });
        }

        req.session.userId = result.user.id;
        req.session.role = result.user.role;

        return res.json({
          success: true,
          data: {
            user: result.user,
            csrfToken: getOrCreateCsrfToken(req),
          },
        });
      });
    },

    logout: async (req, res) => {
      req.session.destroy((error) => {
        if (error) {
          return res.status(500).json({ success: false, error: { code: 'SESSION_ERROR', message: 'Failed to logout' } });
        }

        res.clearCookie('smove.sid');
        return res.json({
          success: true,
          data: {
            user: null,
            csrfToken: null,
          },
        });
      });
    },
  };
}

module.exports = { buildAuthController };
