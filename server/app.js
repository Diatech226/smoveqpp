const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const { FRONTEND_ORIGIN, API_ORIGIN, isProduction } = require('./config/env');
const { createSessionMiddleware, createCorsOptions } = require('./config/session');
const { exposeCsrfToken } = require('./middleware/csrf');
const { UserRepository } = require('./repositories/userRepository');
const { AuthService } = require('./services/authService');
const { buildAuthController } = require('./controllers/authController');
const { createAuthRoutes } = require('./routes/authRoutes');
const { sendError } = require('./utils/apiResponse');

const API_WS_ORIGIN = API_ORIGIN.replace(/^http/, 'ws');

const DEV_CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${FRONTEND_ORIGIN}`,
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${FRONTEND_ORIGIN} ${FRONTEND_ORIGIN.replace('http', 'ws')} ${API_ORIGIN} ${API_WS_ORIGIN}`,
].join('; ');

const PROD_CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self'",
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
].join('; ');

function createApp(deps = {}) {
  const app = express();

  const userRepository = deps.userRepository ?? new UserRepository();
  const authService = deps.authService ?? new AuthService({ userRepository });
  const authController = deps.authController ?? buildAuthController({ authService });

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', isProduction ? PROD_CSP : DEV_CSP);
    next();
  });

  app.use(cors(createCorsOptions()));
  app.use(cookieParser());
  app.use(express.json());
  app.use(deps.sessionMiddleware ?? createSessionMiddleware());
  app.use(exposeCsrfToken);

  app.use('/api/v1/auth', createAuthRoutes({ authController }));
  app.use('/api/auth', createAuthRoutes({ authController }));

  app.use((err, _req, res, _next) => {
    console.error('[api] unhandled error', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Unexpected error');
  });

  return app;
}

module.exports = { createApp };
