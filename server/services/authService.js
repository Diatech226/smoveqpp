const crypto = require('crypto');
const { normalizeEmail } = require('../models/User');
const { PASSWORD_HASH_ROUNDS, OAUTH_DEFAULT_ROLE, PUBLIC_REGISTRATION_ENABLED, isProduction } = require('../config/env');

const EMAIL_VERIFICATION_TOKEN_TTL_MS = 1000 * 60 * 60 * 24;
const PASSWORD_RESET_TOKEN_TTL_MS = 1000 * 60 * 30;

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

  if (isProduction) {
    throw new Error('bcryptjs dependency is required in production for password hashing.');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function verifyPassword(password, storedHash) {
  if (bcryptLib) {
    return bcryptLib.compare(password, storedHash);
  }

  if (isProduction) {
    throw new Error('bcryptjs dependency is required in production for password verification.');
  }

  const [salt, hash] = String(storedHash).split(':');
  if (!salt || !hash) return false;
  const compare = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(compare, 'hex'));
}

function hashVerificationToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function createEmailVerificationToken() {
  const token = crypto.randomBytes(32).toString('hex');
  return {
    token,
    tokenHash: hashVerificationToken(token),
    expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS),
  };
}

function createPasswordResetToken() {
  const token = crypto.randomBytes(32).toString('hex');
  return {
    token,
    tokenHash: hashVerificationToken(token),
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS),
  };
}

function buildVerificationMeta(user) {
  const expiresAt = user.emailVerificationTokenExpiresAt ?? null;
  const pending = !user.emailVerified && !!user.emailVerificationTokenHash && (!expiresAt || new Date(expiresAt) > new Date());
  return {
    emailVerified: Boolean(user.emailVerified),
    verificationPending: pending,
    verificationMethod: user.authProvider === 'local' ? 'email_token' : 'provider_trust',
  };
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
    ...buildVerificationMeta(user),
    lastLoginAt: user.lastLoginAt ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

class AuthService {
  constructor({ userRepository, oauthProviders = {}, publicRegistrationEnabled = PUBLIC_REGISTRATION_ENABLED, emailService = null, auditLogger = null }) {
    this.userRepository = userRepository;
    this.oauthProviders = oauthProviders;
    this.publicRegistrationEnabled = Boolean(publicRegistrationEnabled);
    this.emailService = emailService;
    this.auditLogger = auditLogger;
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
      emailVerified: true,
      emailVerificationTokenHash: null,
      emailVerificationTokenExpiresAt: null,
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
    const verification = createEmailVerificationToken();

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
        emailVerified: false,
        emailVerificationTokenHash: verification.tokenHash,
        emailVerificationTokenExpiresAt: verification.expiresAt,
      });
    } catch (error) {
      if (error?.code === 11000) {
        return { ok: false, status: 409, code: 'EMAIL_ALREADY_EXISTS', message: 'An account already exists with this email' };
      }
      throw error;
    }

    const delivery = await this.emailService?.sendVerificationEmail?.({
      to: email,
      name,
      token: verification.token,
      expiresAt: verification.expiresAt,
    });

    return {
      ok: true,
      user: sanitizeUser(user),
      verification: {
        emailDeliveryReady: Boolean(delivery?.delivered),
        expiresAt: verification.expiresAt,
        ...(delivery?.delivered ? {} : { devToken: verification.token, devPreviewUrl: delivery?.previewUrl ?? null }),
      },
    };
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
      emailVerified: true,
      emailVerificationTokenHash: null,
      emailVerificationTokenExpiresAt: null,
    });

    if (user.accountStatus === 'suspended') {
      return { ok: false, status: 403, code: 'ACCOUNT_SUSPENDED', message: 'Account suspended' };
    }

    const updatedUser = await this.userRepository.updateLastLoginAt(user.id, new Date());
    return { ok: true, user: sanitizeUser(updatedUser ?? user) };
  }

  async resendVerification({ userId }) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return { ok: false, status: 404, code: 'USER_NOT_FOUND', message: 'User not found' };
    }

    if (user.emailVerified) {
      return { ok: false, status: 409, code: 'EMAIL_ALREADY_VERIFIED', message: 'Email already verified' };
    }

    const verification = createEmailVerificationToken();
    const updated = await this.userRepository.setEmailVerificationToken(user.id, {
      tokenHash: verification.tokenHash,
      expiresAt: verification.expiresAt,
    });

    const delivery = await this.emailService?.sendVerificationEmail?.({
      to: user.email,
      name: user.name,
      token: verification.token,
      expiresAt: verification.expiresAt,
    });

    return {
      ok: true,
      user: sanitizeUser(updated ?? user),
      verification: {
        emailDeliveryReady: Boolean(delivery?.delivered),
        expiresAt: verification.expiresAt,
        ...(delivery?.delivered ? {} : { devToken: verification.token, devPreviewUrl: delivery?.previewUrl ?? null }),
      },
    };
  }

  async verifyEmailToken({ token }) {
    const tokenHash = hashVerificationToken(token);
    const user = await this.userRepository.findByEmailVerificationTokenHash(tokenHash);
    if (!user) {
      return { ok: false, status: 400, code: 'INVALID_VERIFICATION_TOKEN', message: 'Verification token is invalid' };
    }

    if (user.emailVerified) {
      return { ok: false, status: 409, code: 'EMAIL_ALREADY_VERIFIED', message: 'Email already verified' };
    }

    if (!user.emailVerificationTokenExpiresAt || new Date(user.emailVerificationTokenExpiresAt) < new Date()) {
      return { ok: false, status: 400, code: 'VERIFICATION_TOKEN_EXPIRED', message: 'Verification token is expired' };
    }

    const updated = await this.userRepository.markEmailVerified(user.id);
    return { ok: true, user: sanitizeUser(updated ?? user) };
  }

  async listUsersForAdmin() {
    const users = await this.userRepository.listUsers();
    return users.map((user) => sanitizeUser(user));
  }

  async updateUserByAdmin(targetUserId, payload, actor) {
    const user = await this.userRepository.findById(targetUserId);
    if (!user) {
      return { ok: false, status: 404, code: 'USER_NOT_FOUND', message: 'User not found' };
    }

    const patch = {};

    if (typeof payload.accountStatus === 'string') {
      if (!['active', 'invited', 'suspended'].includes(payload.accountStatus)) {
        return { ok: false, status: 400, code: 'VALIDATION_ERROR', message: 'Invalid account status' };
      }
      patch.accountStatus = payload.accountStatus;
    }

    if (typeof payload.role === 'string') {
      if (actor?.role !== 'admin') {
        return { ok: false, status: 403, code: 'FORBIDDEN_ROLE_CHANGE', message: 'Only admins can change roles' };
      }
      if (!['admin', 'editor', 'author', 'viewer', 'client'].includes(payload.role)) {
        return { ok: false, status: 400, code: 'VALIDATION_ERROR', message: 'Invalid role' };
      }
      if (String(actor?.id) === String(user.id) && payload.role !== user.role) {
        return { ok: false, status: 400, code: 'ADMIN_SELF_ROLE_CHANGE_FORBIDDEN', message: 'Cannot change own role' };
      }
      patch.role = payload.role;
      patch.status = ['admin', 'editor', 'author', 'viewer'].includes(payload.role) ? 'staff' : 'client';
    }

    if (typeof payload.emailVerified === 'boolean') {
      patch.emailVerified = payload.emailVerified;
      if (payload.emailVerified) {
        patch.emailVerificationTokenHash = null;
        patch.emailVerificationTokenExpiresAt = null;
      }
    }

    if (patch.accountStatus === 'suspended' && String(actor?.id) === String(user.id)) {
      return { ok: false, status: 400, code: 'ADMIN_SELF_SUSPEND_FORBIDDEN', message: 'Cannot suspend own account' };
    }

    if (Object.keys(patch).length === 0) {
      return { ok: false, status: 400, code: 'VALIDATION_ERROR', message: 'No valid fields to update' };
    }

    const updated = await this.userRepository.updateUser(user.id, patch);
    return { ok: true, user: sanitizeUser(updated ?? user) };
  }


  async requestPasswordReset({ email }) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      return { ok: true, emailDeliveryReady: Boolean(this.emailService?.isDeliveryReady?.()) };
    }

    const user = await this.userRepository.findByEmailWithPassword(normalizedEmail);
    if (!user || user.authProvider !== 'local') {
      return { ok: true, emailDeliveryReady: Boolean(this.emailService?.isDeliveryReady?.()) };
    }

    const reset = createPasswordResetToken();
    await this.userRepository.setPasswordResetToken(user.id, { tokenHash: reset.tokenHash, expiresAt: reset.expiresAt });

    const delivery = await this.emailService?.sendPasswordResetEmail?.({
      to: user.email,
      name: user.name,
      token: reset.token,
      expiresAt: reset.expiresAt,
    });

    return {
      ok: true,
      emailDeliveryReady: Boolean(delivery?.delivered),
      expiresAt: reset.expiresAt,
      ...(delivery?.delivered ? {} : { devToken: reset.token, devPreviewUrl: delivery?.previewUrl ?? null }),
    };
  }

  async resetPasswordWithToken({ token, password }) {
    if (!token || typeof token !== 'string') {
      return { ok: false, status: 400, code: 'INVALID_RESET_TOKEN', message: 'Invalid reset token' };
    }

    const nextPassword = String(password ?? '');
    if (nextPassword.length < 8) {
      return { ok: false, status: 400, code: 'VALIDATION_ERROR', message: 'password must be at least 8 characters' };
    }

    const tokenHash = hashVerificationToken(token);
    const user = await this.userRepository.findByPasswordResetTokenHash(tokenHash);
    if (!user) {
      return { ok: false, status: 400, code: 'INVALID_RESET_TOKEN', message: 'Invalid reset token' };
    }

    if (!user.passwordResetTokenExpiresAt || new Date(user.passwordResetTokenExpiresAt) < new Date()) {
      return { ok: false, status: 400, code: 'RESET_TOKEN_EXPIRED', message: 'Password reset token expired' };
    }

    const passwordHash = await hashPassword(nextPassword);
    const updated = await this.userRepository.resetPasswordByToken(user.id, { passwordHash });

    return { ok: true, user: sanitizeUser(updated ?? user) };
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

module.exports = {
  AuthService,
  sanitizeUser,
  hashPassword,
  verifyPassword,
  hashVerificationToken,
  createEmailVerificationToken,
  createPasswordResetToken,
};
