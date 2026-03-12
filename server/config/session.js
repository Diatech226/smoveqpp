const session = require('express-session');
const { FRONTEND_ORIGIN, SESSION_SECRET, isProduction, SESSION_TTL_SECONDS } = require('./env');

function createSessionMiddleware() {
  return session({
    name: 'smove.sid',
    secret: SESSION_SECRET,
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
