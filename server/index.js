const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const app = express();

const FRONTEND_PORT = Number(process.env.PORT ?? process.env.VITE_PORT ?? 3000);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? `http://localhost:${FRONTEND_PORT}`;
const API_PORT = Number(process.env.API_PORT ?? 3001);
const SESSION_SECRET = process.env.SESSION_SECRET ?? 'dev-session-secret-change-me';

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
  `connect-src 'self' ${FRONTEND_ORIGIN} ${FRONTEND_ORIGIN.replace('http', 'ws')}`,
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

const isDevelopment = process.env.NODE_ENV !== 'production';

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', isDevelopment ? DEV_CSP : PROD_CSP);
  next();
});

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(
  session({
    name: 'smove.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: !isDevelopment,
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);

function getCsrfToken(req) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = Math.random().toString(36).slice(2);
  }
  return req.session.csrfToken;
}

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

app.get('/api/auth/session', (req, res) => {
  res.json({
    data: {
      user: sanitizeUser(req.session.user),
      csrfToken: getCsrfToken(req),
    },
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ data: { user: null, csrfToken: getCsrfToken(req) } });
  }

  req.session.user = {
    id: 'admin-1',
    email,
    name: 'SMOVE Admin',
    role: 'admin',
  };

  return res.json({ data: { user: sanitizeUser(req.session.user), csrfToken: getCsrfToken(req) } });
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body ?? {};
  if (!email || !password || !name) {
    return res.status(400).json({ data: { user: null, csrfToken: getCsrfToken(req) } });
  }

  req.session.user = { id: 'user-1', email, name, role: 'editor' };
  return res.json({ data: { user: sanitizeUser(req.session.user), csrfToken: getCsrfToken(req) } });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.user = null;
  res.json({ data: { user: null, csrfToken: getCsrfToken(req) } });
});

app.listen(API_PORT, () => {
  console.log(`Auth server listening on http://localhost:${API_PORT}`);
});
