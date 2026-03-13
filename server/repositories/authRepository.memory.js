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
