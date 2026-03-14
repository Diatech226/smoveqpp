const crypto = require('crypto');
const { normalizeEmail, normalizeUserInput } = require('../models/User');

const users = new Map();

class MemoryAuthRepository {
  async create(input) {
    const user = normalizeUserInput({ ...input, id: crypto.randomUUID() });
    user.passwordResetTokenHash = null;
    user.passwordResetTokenExpiresAt = null;
    users.set(user.id, user);
    return { ...user };
  }

  async findByEmailWithPassword(email) {
    const normalized = normalizeEmail(email);
    for (const user of users.values()) {
      if (user.email === normalized) return { ...user };
    }
    return null;
  }

  async findByProvider(authProvider, providerId) {
    for (const user of users.values()) {
      if (user.authProvider === authProvider && user.providerId === String(providerId)) return { ...user };
    }
    return null;
  }

  async upsertOAuthUser(input) {
    const existingByProvider = await this.findByProvider(input.authProvider, input.providerId);
    if (existingByProvider) {
      const updated = normalizeUserInput({ ...existingByProvider, ...input, id: existingByProvider.id });
      users.set(updated.id, updated);
      return { ...updated };
    }

    const existingByEmail = await this.findByEmailWithPassword(input.email);
    if (existingByEmail) {
      const updated = normalizeUserInput({ ...existingByEmail, ...input, id: existingByEmail.id });
      users.set(updated.id, updated);
      return { ...updated };
    }

    return this.create(input);
  }

  async findById(id) {
    const user = users.get(String(id));
    return user ? { ...user } : null;
  }

  async existsByEmail(email) {
    const normalized = normalizeEmail(email);
    for (const user of users.values()) {
      if (user.email === normalized) return true;
    }
    return false;
  }

  async updateProfile(id, updates) {
    const user = users.get(String(id));
    if (!user) return null;

    if (typeof updates.name === 'string') {
      user.name = String(updates.name).trim();
    }

    if (typeof updates.email === 'string') {
      user.email = normalizeEmail(updates.email);
    }

    user.updatedAt = new Date();
    users.set(user.id, user);
    return { ...user };
  }

  async findByPasswordResetTokenHash(tokenHash) {
    for (const user of users.values()) {
      if (user.passwordResetTokenHash === tokenHash) {
        return { ...user };
      }
    }
    return null;
  }

  async setPasswordResetToken(id, tokenHash, expiresAt) {
    const user = users.get(String(id));
    if (!user) return null;
    user.passwordResetTokenHash = tokenHash;
    user.passwordResetTokenExpiresAt = expiresAt;
    user.updatedAt = new Date();
    users.set(user.id, user);
    return { ...user };
  }

  async clearPasswordResetToken(id) {
    const user = users.get(String(id));
    if (!user) return null;
    user.passwordResetTokenHash = null;
    user.passwordResetTokenExpiresAt = null;
    user.updatedAt = new Date();
    users.set(user.id, user);
    return { ...user };
  }

  async updatePassword(id, passwordHash) {
    const user = users.get(String(id));
    if (!user) return null;
    user.passwordHash = String(passwordHash);
    user.updatedAt = new Date();
    users.set(user.id, user);
    return { ...user };
  }

  async updateLastLoginAt(id, date) {
    const user = users.get(String(id));
    if (!user) return null;
    user.lastLoginAt = date;
    user.updatedAt = new Date();
    users.set(user.id, user);
    return { ...user };
  }
}

module.exports = { MemoryAuthRepository };
