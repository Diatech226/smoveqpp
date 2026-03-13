const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const { FRONTEND_ORIGIN, API_ORIGIN, isProduction } = require('./config/env');
const { createSessionMiddleware, createCorsOptions } = require('./config/session');
const { exposeCsrfToken } = require('./middleware/csrf');
const { MemoryAuthRepository } = require('./repositories/authRepository.memory');
const { MongoAuthRepository } = require('./repositories/authRepository.mongo');
const { getMongoose } = require('./config/mongo');
const { AuthService } = require('./services/authService');
const { buildAuthController } = require('./controllers/authController');
const { createAuthRoutes } = require('./routes/authRoutes');
const { createContentRoutes } = require('./routes/contentRoutes');
const { sendError } = require('./utils/apiResponse');
const { FileContentRepository } = require('./repositories/contentRepository.file');
const { ContentService } = require('./services/contentService');
const { createOAuthConfig } = require('./config/passport');

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

  const mongoose = getMongoose();
  const userRepository = deps.userRepository ?? (mongoose ? new MongoAuthRepository({ mongoose }) : new MemoryAuthRepository());
  const oauthConfig = createOAuthConfig();
  const authService = deps.authService ?? new AuthService({
    userRepository,
    oauthProviders: {
      google: { enabled: oauthConfig.googleEnabled },
      facebook: { enabled: oauthConfig.facebookEnabled },
    },
  });
  const authController = deps.authController ?? buildAuthController({ authService });

  const contentRepository = deps.contentRepository ?? new FileContentRepository();
  const contentService = deps.contentService ?? new ContentService({ contentRepository });

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
  app.use('/api/v1/content', createContentRoutes({ contentService }));
  app.use('/api/auth', createAuthRoutes({ authController }));
  app.use('/api/content', createContentRoutes({ contentService }));

  app.use((err, _req, res, _next) => {
    console.error('[api] unhandled error', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Unexpected error');
  });

  return app;
}

module.exports = { createApp };
