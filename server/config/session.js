const session = require('express-session');
const { FRONTEND_ORIGIN, FRONTEND_ORIGINS, SESSION_SECRET, isProduction, SESSION_TTL_SECONDS, MONGO_URI, SESSION_STORE_MODE } = require('./env');
const { getMongoose } = require('./mongo');
const { logInfo, logWarn } = require('../utils/logger');

function resolveSessionStoreMode() {
  if (SESSION_STORE_MODE === 'memory') {
    return { mode: 'memory', reason: 'configured_memory_mode' };
  }

  if (!MONGO_URI || !getMongoose()) {
    if (SESSION_STORE_MODE === 'mongo') {
      return { mode: 'memory', reason: 'mongo_unavailable_hard_requirement' };
    }
    return { mode: 'memory', reason: !MONGO_URI ? 'mongo_uri_missing' : 'mongoose_not_connected' };
  }

  try {
    // eslint-disable-next-line global-require
    const connectMongo = require('connect-mongo');
    return {
      mode: 'mongo',
      store: connectMongo.create({
        mongoUrl: MONGO_URI,
        ttl: SESSION_TTL_SECONDS,
        autoRemove: 'native',
      }),
      reason: 'mongo_store_ready',
    };
  } catch (_error) {
    return { mode: 'memory', reason: 'connect_mongo_dependency_missing' };
  }
}

function createSessionMiddleware() {
  const resolvedStore = resolveSessionStoreMode();

  if (isProduction && resolvedStore.mode !== 'mongo') {
    throw new Error(`[session] production requires mongo session store (reason=${resolvedStore.reason}).`);
  }

  if (resolvedStore.mode === 'mongo') {
    logInfo('session_store_ready', { mode: 'mongo' });
  } else {
    logWarn('session_store_fallback', {
      mode: 'memory',
      reason: resolvedStore.reason,
      production: isProduction,
    });
  }

  return {
    middleware: session({
      name: 'smove.sid',
      secret: SESSION_SECRET,
      store: resolvedStore.store ?? undefined,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: SESSION_TTL_SECONDS * 1000,
      },
      proxy: isProduction,
    }),
    storeMeta: {
      mode: resolvedStore.mode,
      reason: resolvedStore.reason,
    },
  };
}

function createCorsOptions() {
  const allowedOrigins = new Set(FRONTEND_ORIGINS ?? [FRONTEND_ORIGIN]);

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'X-Requested-With'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  };
}

module.exports = { createSessionMiddleware, createCorsOptions };
