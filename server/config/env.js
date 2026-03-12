const isProduction = process.env.NODE_ENV === 'production';

function parseIntOrDefault(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const FRONTEND_PORT = parseIntOrDefault(process.env.PORT ?? process.env.VITE_PORT, 3000);
const SESSION_SECRET = process.env.SESSION_SECRET ?? 'dev-session-secret-change-me';

function assertSessionSecretStrength() {
  const looksDefault = SESSION_SECRET === 'dev-session-secret-change-me';
  const tooShort = SESSION_SECRET.length < 32;

  if (isProduction && (looksDefault || tooShort)) {
    throw new Error('SESSION_SECRET must be configured with a strong value (>= 32 chars) in production.');
  }
}

function validateCriticalEnv() {
  assertSessionSecretStrength();
}

module.exports = {
  isProduction,
  API_PORT: parseIntOrDefault(process.env.API_PORT, 3001),
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN ?? `http://localhost:${FRONTEND_PORT}`,
  SESSION_SECRET,
  MONGO_URI: process.env.MONGO_URI ?? '',
  MONGO_DB_NAME: process.env.MONGO_DB_NAME ?? undefined,
  SESSION_TTL_SECONDS: parseIntOrDefault(process.env.SESSION_TTL_SECONDS, 60 * 60 * 24),
  BCRYPT_ROUNDS: parseIntOrDefault(process.env.BCRYPT_ROUNDS, 12),
  AUTH_RATE_LIMIT_MAX: parseIntOrDefault(process.env.AUTH_RATE_LIMIT_MAX, 10),
  AUTH_RATE_LIMIT_WINDOW_MS: parseIntOrDefault(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  validateCriticalEnv,
};
