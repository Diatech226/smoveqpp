const session = require('express-session');
const { FRONTEND_ORIGIN, SESSION_SECRET, isProduction, SESSION_TTL_SECONDS, MONGO_URI } = require('./env');
const { getMongoose } = require('./mongo');

function createMongoSessionStore() {
  if (!getMongoose() || !MONGO_URI) {
    return null;
  }

  try {
    // Lazy-load optional dependency.
    // eslint-disable-next-line global-require
    const connectMongo = require('connect-mongo');
    return connectMongo.create({
      mongoUrl: MONGO_URI,
      ttl: SESSION_TTL_SECONDS,
      autoRemove: 'native',
    });
  } catch (error) {
    console.warn('[session] connect-mongo not installed, using MemoryStore for sessions.');
    return null;
  }
}

function createSessionMiddleware() {
  const store = createMongoSessionStore();

  return session({
    name: 'smove.sid',
    secret: SESSION_SECRET,
    store: store ?? undefined,
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
  });
}

function createCorsOptions() {
  return {
    origin: FRONTEND_ORIGIN,
    credentials: true,
  };
}

module.exports = { createSessionMiddleware, createCorsOptions };
