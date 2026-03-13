const crypto = require('crypto');
const { normalizeEmail } = require('../models/User');
const { PASSWORD_HASH_ROUNDS, OAUTH_DEFAULT_ROLE } = require('../config/env');

let bcryptLib = null;
try {
  // eslint-disable-next-line global-require
  bcryptLib = require('bcryptjs');
} catch (_error) {
  bcryptLib = null;
}

async function hashPassword(password) {
  if (bcryptLib) {
    return bcryptLib.hash(password, PASSWORD_HASH_ROUNDS);
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function verifyPassword(password, storedHash) {
  if (bcryptLib) {
    return bcryptLib.compare(password, storedHash);
  }

  const [salt, hash] = String(storedHash).split(':');
  if (!salt || !hash) return false;
  const compare = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(compare, 'hex'));
}

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: String(user.id),
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    authProvider: user.authProvider ?? 'local',
    providerId: user.providerId ?? null,
    lastLoginAt: user.lastLoginAt ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

class AuthService {
  constructor({ userRepository, oauthProviders = {} }) {
    this.userRepository = userRepository;
    this.oauthProviders = oauthProviders;
  }

  async seedAdminFromEnv({ email, password, name }) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !password) {
      return { ok: false, reason: 'missing_config' };
    }

    const exists = await this.userRepository.existsByEmail(normalizedEmail);
    if (exists) {
      return { ok: true, created: false };
    }

    const passwordHash = await hashPassword(String(password));
    const user = await this.userRepository.create({
      email: normalizedEmail,
      name: String(name ?? 'Administrator').trim() || 'Administrator',
      passwordHash,
      role: 'admin',
      status: 'active',
      authProvider: 'local',
      providerId: null,
    });

    return { ok: true, created: true, user: sanitizeUser(user) };
  }

  async register() {
    return { ok: false, status: 403, code: 'REGISTRATION_DISABLED', message: 'Public registration is disabled' };
  }

  async login(payload) {
    const email = normalizeEmail(payload.email);
    const password = String(payload.password ?? '');

    if (!email || !password) {
      return { ok: false, status: 400, code: 'VALIDATION_ERROR', message: 'email and password are required' };
    }

    const user = await this.userRepository.findByEmailWithPassword(email);
    if (!user || user.authProvider !== 'local' || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
      return { ok: false, status: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' };
    }

    if (user.status === 'suspended') {
      return { ok: false, status: 403, code: 'ACCOUNT_SUSPENDED', message: 'Account suspended' };
    }

    const updatedUser = await this.userRepository.updateLastLoginAt(user.id, new Date());
    return { ok: true, user: sanitizeUser(updatedUser ?? user) };
  }

  async loginWithOAuth({ email, name, authProvider, providerId }) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !providerId || !['google', 'facebook'].includes(authProvider)) {
      return { ok: false, status: 400, code: 'OAUTH_PROFILE_INVALID', message: 'Invalid OAuth profile' };
    }

    const user = await this.userRepository.upsertOAuthUser({
      email: normalizedEmail,
      name: String(name ?? normalizedEmail.split('@')[0]).trim(),
      authProvider,
      providerId,
      role: OAUTH_DEFAULT_ROLE,
      status: 'active',
    });

    if (user.status === 'suspended') {
      return { ok: false, status: 403, code: 'ACCOUNT_SUSPENDED', message: 'Account suspended' };
    }

    const updatedUser = await this.userRepository.updateLastLoginAt(user.id, new Date());
    return { ok: true, user: sanitizeUser(updatedUser ?? user) };
  }

  getOAuthProviders() {
    return this.oauthProviders;
  }

  async getSessionUser(sessionUserId) {
    if (!sessionUserId) return null;
    const user = await this.userRepository.findById(sessionUserId);
    if (!user || user.status === 'suspended') {
      return null;
    }
    return sanitizeUser(user);
  }
}

module.exports = { AuthService, sanitizeUser, hashPassword, verifyPassword };
