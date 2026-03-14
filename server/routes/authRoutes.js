const express = require('express');
const { requireCsrf } = require('../middleware/csrf');
const { createAuthRateLimiter } = require('../middleware/authRateLimit');
const { AUTH_RATE_LIMIT_MAX, AUTH_RATE_LIMIT_WINDOW_MS } = require('../config/env');

function createAuthRoutes({ authController }) {
  const router = express.Router();

  const limiter = createAuthRateLimiter({
    windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
    max: AUTH_RATE_LIMIT_MAX,
  });

  router.get('/session', authController.getSession);
  router.get('/oauth/providers', authController.getOAuthProviders);
  router.post('/register', limiter, requireCsrf, authController.register);
  router.post('/login', limiter, requireCsrf, authController.login);
  router.post('/oauth/:provider', limiter, requireCsrf, authController.oauthLogin);
  router.patch('/profile', requireCsrf, authController.updateProfile);
  router.post('/forgot-password', limiter, requireCsrf, authController.forgotPassword);
  router.post('/reset-password', limiter, requireCsrf, authController.resetPassword);
  router.post('/logout', requireCsrf, authController.logout);

  return router;
}

module.exports = { createAuthRoutes };
