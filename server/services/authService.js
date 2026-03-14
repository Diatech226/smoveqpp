const crypto = require('crypto');
const { normalizeEmail } = require('../models/User');
const { PASSWORD_HASH_ROUNDS, OAUTH_DEFAULT_ROLE, PUBLIC_REGISTRATION_ENABLED } = require('../config/env');

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
    accountStatus: user.accountStatus ?? 'active',
    authProvider: user.authProvider ?? 'local',
    providerId: user.providerId ?? null,
    lastLoginAt: user.lastLoginAt ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

class AuthService {
  constructor({ userRepository, oauthProviders = {}, publicRegistrationEnabled = PUBLIC_REGISTRATION_ENABLED }) {
    this.userRepository = userRepository;
    this.oauthProviders = oauthProviders;
    this.publicRegistrationEnabled = Boolean(publicRegistrationEnabled);
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
      status: 'staff',
      accountStatus: 'active',
      authProvider: 'local',
      providerId: null,
    });

    return { ok: true, created: true, user: sanitizeUser(user) };
  }

  async register(payload) {
    if (!this.publicRegistrationEnabled) {
      return { ok: false, status: 403, code: 'REGISTRATION_DISABLED', message: 'Public registration is disabled' };
    }

    const email = normalizeEmail(payload.email);
    const name = String(payload.name ?? '').trim();
    const password = String(payload.password ?? '');

    if (!email || !name || !password) {
      return { ok: false, status: 400, code: 'VALIDATION_ERROR', message: 'name, email and password are required' };
    }

    if (password.length < 8) {
      return { ok: false, status: 400, code: 'VALIDATION_ERROR', message: 'password must be at least 8 characters' };
    }

    const exists = await this.userRepository.existsByEmail(email);
    if (exists) {
      return { ok: false, status: 409, code: 'EMAIL_ALREADY_EXISTS', message: 'An account already exists with this email' };
    }

    const passwordHash = await hashPassword(password);
    let user;
    try {
      user = await this.userRepository.create({
        email,
        name,
        passwordHash,
        role: 'client',
        status: 'client',
        accountStatus: 'active',
        authProvider: 'local',
        providerId: null,
      });
    } catch (error) {
      if (error?.code === 11000) {
        return { ok: false, status: 409, code: 'EMAIL_ALREADY_EXISTS', message: 'An account already exists with this email' };
      }
      throw error;
    }

    return { ok: true, user: sanitizeUser(user) };
  }

  async login(payload) {
    const email = normalizeEmail(payload.email);
    const password = String(payload.password ?? '');

    if (!email || !password) {
      return { ok: false, status: 400, code: 'VALIDATION_ERROR', message: 'email and password are required' };
    }

    const user = await this.userRepository.findByEmailWithPassword(email);
    if (!user) {
      return { ok: false, status: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid credentials', reason: 'email_not_found' };
    }

    if (user.authProvider !== 'local' || !user.passwordHash) {
      return { ok: false, status: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid credentials', reason: 'local_password_missing' };
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return { ok: false, status: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid credentials', reason: 'password_mismatch' };
    }

    if (user.accountStatus === 'suspended') {
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
      status: 'client',
      accountStatus: 'active',
    });

    if (user.accountStatus === 'suspended') {
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
    if (!user || user.accountStatus === 'suspended') {
      return null;
    }
    return sanitizeUser(user);
  }
}

module.exports = { AuthService, sanitizeUser, hashPassword, verifyPassword };
