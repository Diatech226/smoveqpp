const crypto = require('crypto');
const { normalizeEmail, normalizeUserInput } = require('../models/User');

const users = new Map();

class MemoryAuthRepository {
  async create(input) {
    const user = normalizeUserInput({ ...input, id: crypto.randomUUID() });
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

  async findByEmailVerificationTokenHash(tokenHash) {
    for (const user of users.values()) {
      if (user.emailVerificationTokenHash === String(tokenHash)) return { ...user };
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

  async listUsers() {
    return Array.from(users.values()).map((user) => ({ ...user }));
  }

  async existsByEmail(email) {
    const normalized = normalizeEmail(email);
    for (const user of users.values()) {
      if (user.email === normalized) return true;
    }
    return false;
  }

  async updateLastLoginAt(id, date) {
    const user = users.get(String(id));
    if (!user) return null;
    user.lastLoginAt = date;
    user.updatedAt = new Date();
    users.set(user.id, user);
    return { ...user };
  }

  async setEmailVerificationToken(id, { tokenHash, expiresAt }) {
    const user = users.get(String(id));
    if (!user) return null;
    user.emailVerificationTokenHash = String(tokenHash);
    user.emailVerificationTokenExpiresAt = expiresAt;
    user.updatedAt = new Date();
    users.set(user.id, user);
    return { ...user };
  }

  async markEmailVerified(id) {
    const user = users.get(String(id));
    if (!user) return null;
    user.emailVerified = true;
    user.emailVerificationTokenHash = null;
    user.emailVerificationTokenExpiresAt = null;
    user.updatedAt = new Date();
    users.set(user.id, user);
    return { ...user };
  }

  async updateUser(id, patch) {
    const user = users.get(String(id));
    if (!user) return null;
    const updated = normalizeUserInput({ ...user, ...patch, id: user.id, updatedAt: new Date() });
    users.set(user.id, updated);
    return { ...updated };
  }
}

module.exports = { MemoryAuthRepository };
