import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { AuthService } = require('../services/authService');

describe('AuthService', () => {
  let users;
  let repository;
  let service;

  beforeEach(() => {
    users = [];
    repository = {
      existsByEmail: async (email) => users.some((u) => u.email === email),
      create: async (input) => {
        const user = { id: String(users.length + 1), ...input, createdAt: new Date(), updatedAt: new Date() };
        users.push(user);
        return user;
      },
      findByEmailWithPassword: async (email) => users.find((u) => u.email === email) ?? null,
      findById: async (id) => users.find((u) => u.id === id) ?? null,
      updateLastLoginAt: async (id, date) => {
        const user = users.find((u) => u.id === String(id));
        if (user) user.lastLoginAt = date;
      },
    };
    service = new AuthService({ userRepository: repository });
  });

  it('register creates a user', async () => {
    const result = await service.register({ email: 'x@x.com', password: 'password123', name: 'X' });
    expect(result.ok).toBe(true);
    expect(users).toHaveLength(1);
    expect(users[0].passwordHash).not.toBe('password123');
  });

  it('invalid login fails cleanly', async () => {
    const result = await service.login({ email: 'missing@x.com', password: 'pass' });
    expect(result.ok).toBe(false);
    expect(result.code).toBe('INVALID_CREDENTIALS');
  });

  it('suspended user login is refused', async () => {
    const registered = await service.register({ email: 's@x.com', password: 'password123', name: 'S' });
    users[0].status = 'suspended';
    const result = await service.login({ email: registered.user.email, password: 'password123' });
    expect(result.ok).toBe(false);
    expect(result.code).toBe('ACCOUNT_SUSPENDED');
  });
});
