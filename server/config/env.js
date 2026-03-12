const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['\"]|['\"]$/g, '');

    process.env[key] = value;
  }
}

loadEnvFile(path.resolve(process.cwd(), '.env'));
loadEnvFile(path.resolve(process.cwd(), '.env.local'));

const isProduction = process.env.NODE_ENV === 'production';

function parseIntOrDefault(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const API_PORT = parseIntOrDefault(process.env.API_PORT, 3001);
const FRONTEND_PORT = parseIntOrDefault(process.env.CLIENT_PORT ?? process.env.VITE_PORT, 5173);
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
  API_PORT,
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN ?? `http://localhost:${FRONTEND_PORT}`,
  API_ORIGIN: process.env.API_ORIGIN ?? `http://localhost:${API_PORT}`,
  SESSION_SECRET,
  MONGO_URI: process.env.MONGO_URI ?? '',
  MONGO_DB_NAME: process.env.MONGO_DB_NAME ?? undefined,
  SESSION_TTL_SECONDS: parseIntOrDefault(process.env.SESSION_TTL_SECONDS, 60 * 60 * 24),
  BCRYPT_ROUNDS: parseIntOrDefault(process.env.BCRYPT_ROUNDS, 12),
  AUTH_RATE_LIMIT_MAX: parseIntOrDefault(process.env.AUTH_RATE_LIMIT_MAX, 10),
  AUTH_RATE_LIMIT_WINDOW_MS: parseIntOrDefault(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  validateCriticalEnv,
};
