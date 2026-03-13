const crypto = require('crypto');
const { normalizeEmail } = require('../models/User');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
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
    tenantId: user.tenantId ?? null,
    emailVerified: Boolean(user.emailVerified),
    lastLoginAt: user.lastLoginAt ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

class AuthService {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async register(payload) {
    const email = normalizeEmail(payload.email);
    const password = String(payload.password ?? '');
    const name = String(payload.name ?? '').trim();

    if (!email || !password || !name) {
      return { ok: false, status: 400, code: 'VALIDATION_ERROR', message: 'email, password and name are required' };
    }
    if (password.length < 8) {
      return { ok: false, status: 400, code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters' };
    }

    const exists = await this.userRepository.existsByEmail(email);
    if (exists) {
      return { ok: false, status: 409, code: 'EMAIL_EXISTS', message: 'Email already registered' };
    }

    const passwordHash = hashPassword(password);
    const user = await this.userRepository.create({ email, name, passwordHash, role: 'viewer', status: 'active' });

    return { ok: true, user: sanitizeUser(user) };
  }

  async login(payload) {
    const email = normalizeEmail(payload.email);
    const password = String(payload.password ?? '');

    if (!email || !password) {
      return { ok: false, status: 400, code: 'VALIDATION_ERROR', message: 'email and password are required' };
    }

    const user = await this.userRepository.findByEmailWithPassword(email);
    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return { ok: false, status: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' };
    }

    if (user.status === 'suspended') {
      return { ok: false, status: 403, code: 'ACCOUNT_SUSPENDED', message: 'Account suspended' };
    }

    const updatedUser = await this.userRepository.updateLastLoginAt(user.id, new Date());
    return { ok: true, user: sanitizeUser(updatedUser ?? user) };
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
