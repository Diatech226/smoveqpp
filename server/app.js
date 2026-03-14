const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const { FRONTEND_ORIGIN, API_ORIGIN, isProduction } = require('./config/env');
const { createSessionMiddleware, createCorsOptions } = require('./config/session');
const { exposeCsrfToken } = require('./middleware/csrf');
const { MemoryAuthRepository } = require('./repositories/authRepository.memory');
const { MongoAuthRepository } = require('./repositories/authRepository.mongo');
const { getMongoose, getMongoConnectionState } = require('./config/mongo');
const { AuthService } = require('./services/authService');
const { buildAuthController } = require('./controllers/authController');
const { createAuthRoutes } = require('./routes/authRoutes');
const { createContentRoutes } = require('./routes/contentRoutes');
const { sendError } = require('./utils/apiResponse');
const { FileContentRepository } = require('./repositories/contentRepository.file');
const { ContentService } = require('./services/contentService');
const { createOAuthConfig } = require('./config/passport');
const { logInfo, logError } = require('./utils/logger');

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

function createRequestId() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

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

  const sessionInit = deps.sessionInit ?? createSessionMiddleware();

  app.use((req, res, next) => {
    const requestId = req.headers['x-request-id'] || createRequestId();
    req.requestId = String(requestId);
    res.setHeader('x-request-id', req.requestId);
    next();
  });

  app.use((req, res, next) => {
    const startedAt = Date.now();
    res.on('finish', () => {
      logInfo('http_request', {
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
      });
    });
    next();
  });

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', isProduction ? PROD_CSP : DEV_CSP);
    next();
  });

  app.use(cors(createCorsOptions()));
  app.use(cookieParser());
  app.use(express.json());
  app.use(sessionInit.middleware);
  app.use(exposeCsrfToken);

  app.get('/api/v1/health', (_req, res) => {
    res.status(200).json({ ok: true, service: 'smove-api', uptimeSec: Number(process.uptime().toFixed(2)) });
  });

  app.get('/api/v1/ready', (_req, res) => {
    const mongoState = getMongoConnectionState();
    const ready = Boolean(mongoState.connected) && sessionInit.storeMeta.mode === 'mongo';
    const payload = {
      ready,
      dependencies: {
        mongo: mongoState,
        sessionStore: sessionInit.storeMeta,
      },
    };

    if (!ready) {
      return res.status(503).json(payload);
    }

    return res.status(200).json(payload);
  });

  app.use('/api/v1/auth', createAuthRoutes({ authController }));
  app.use('/api/v1/content', createContentRoutes({ contentService }));
  app.use('/api/auth', createAuthRoutes({ authController }));
  app.use('/api/content', createContentRoutes({ contentService }));

  app.use((err, req, res, _next) => {
    logError('api_unhandled_error', {
      requestId: req.requestId,
      path: req.originalUrl,
      method: req.method,
      message: err?.message,
    });
    sendError(res, 500, 'INTERNAL_ERROR', 'Unexpected error');
  });

  return app;
}

module.exports = { createApp };
