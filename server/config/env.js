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

function parseBoolean(value, fallback = false) {
  if (value === undefined) return fallback;
  return value === 'true';
}

const API_PORT = parseIntOrDefault(process.env.API_PORT, 3001);
const FRONTEND_PORT = parseIntOrDefault(process.env.CLIENT_PORT ?? process.env.VITE_PORT, 5173);
const SESSION_SECRET = process.env.SESSION_SECRET ?? 'dev-session-secret-change-me';

const AUTH_STORAGE_MODE = ['auto', 'mongo', 'memory'].includes(process.env.AUTH_STORAGE_MODE)
  ? process.env.AUTH_STORAGE_MODE
  : 'auto';

const PUBLIC_REGISTRATION_ENABLED = parseBoolean(
  process.env.PUBLIC_REGISTRATION_ENABLED ?? process.env.VITE_ENABLE_REGISTRATION,
  true,
);

function assertSessionSecretStrength() {
  const looksDefault = SESSION_SECRET === 'dev-session-secret-change-me';
  const tooShort = SESSION_SECRET.length < 32;

  if (isProduction && (looksDefault || tooShort)) {
    throw new Error('SESSION_SECRET must be configured with a strong value (>= 32 chars) in production.');
  }
}

function validateCriticalEnv() {
  assertSessionSecretStrength();

  if (AUTH_STORAGE_MODE === 'mongo' && !process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required when AUTH_STORAGE_MODE is set to "mongo".');
  }
}

const GOOGLE_CALLBACK_PATH = process.env.GOOGLE_CALLBACK_PATH ?? '/api/v1/auth/oauth/google/callback';
const FACEBOOK_CALLBACK_PATH = process.env.FACEBOOK_CALLBACK_PATH ?? '/api/v1/auth/oauth/facebook/callback';

module.exports = {
  isProduction,
  API_PORT,
  AUTH_STORAGE_MODE,
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN ?? `http://localhost:${FRONTEND_PORT}`,
  API_ORIGIN: process.env.API_ORIGIN ?? `http://localhost:${API_PORT}`,
  SESSION_SECRET,
  MONGO_URI: process.env.MONGO_URI ?? '',
  MONGO_DB_NAME: process.env.MONGO_DB_NAME ?? undefined,
  SESSION_TTL_SECONDS: parseIntOrDefault(process.env.SESSION_TTL_SECONDS, 60 * 60 * 24),
  PASSWORD_HASH_ROUNDS: parseIntOrDefault(process.env.PASSWORD_HASH_ROUNDS, 12),
  AUTH_RATE_LIMIT_MAX: parseIntOrDefault(process.env.AUTH_RATE_LIMIT_MAX, 10),
  AUTH_RATE_LIMIT_WINDOW_MS: parseIntOrDefault(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  SEED_ADMIN_ON_START: parseBoolean(process.env.SEED_ADMIN_ON_START, false),
  ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? '',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? '',
  ADMIN_NAME: process.env.ADMIN_NAME ?? 'Administrator',
  OAUTH_DEFAULT_ROLE: process.env.OAUTH_DEFAULT_ROLE ?? 'viewer',
  PUBLIC_REGISTRATION_ENABLED,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? '',
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL ?? `${process.env.API_ORIGIN ?? `http://localhost:${API_PORT}`}${GOOGLE_CALLBACK_PATH}`,
  FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID ?? '',
  FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET ?? '',
  FACEBOOK_CALLBACK_URL: process.env.FACEBOOK_CALLBACK_URL ?? `${process.env.API_ORIGIN ?? `http://localhost:${API_PORT}`}${FACEBOOK_CALLBACK_PATH}`,
  validateCriticalEnv,
};
