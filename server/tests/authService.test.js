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
        const user = {
          id: String(users.length + 1),
          ...input,
          authProvider: input.authProvider ?? 'local',
          providerId: input.providerId ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        users.push(user);
        return user;
      },
      findByEmailWithPassword: async (email) => users.find((u) => u.email === email) ?? null,
      findByProvider: async (provider, providerId) => users.find((u) => u.authProvider === provider && u.providerId === providerId) ?? null,
      findById: async (id) => users.find((u) => u.id === id) ?? null,
      upsertOAuthUser: async (input) => {
        const existing = users.find((u) => u.email === input.email || (u.authProvider === input.authProvider && u.providerId === input.providerId));
        if (existing) {
          Object.assign(existing, input);
          return existing;
        }
        const user = { id: String(users.length + 1), ...input, passwordHash: null, createdAt: new Date(), updatedAt: new Date() };
        users.push(user);
        return user;
      },
      updateLastLoginAt: async (id, date) => {
        const user = users.find((u) => u.id === String(id));
        if (!user) return null;
        user.lastLoginAt = date;
        return user;
      },
    };
    service = new AuthService({ userRepository: repository, oauthProviders: { google: { enabled: true }, facebook: { enabled: true } } });
  });

  it('public register is disabled', async () => {
    const result = await service.register({});
    expect(result.ok).toBe(false);
    expect(result.code).toBe('REGISTRATION_DISABLED');
  });


  it('register creates user when public registration is enabled', async () => {
    const registerEnabledService = new AuthService({ userRepository: repository, publicRegistrationEnabled: true });

    const result = await registerEnabledService.register({ email: 'new@x.com', password: 'password123', name: 'New User' });

    expect(result.ok).toBe(true);
    expect(result.user?.email).toBe('new@x.com');
    expect(result.user?.status).toBe('client');
    expect(result.user?.role).toBe('viewer');
    expect(users[0].passwordHash).toBeTruthy();
  });


  it('register rejects invalid payload when enabled', async () => {
    const registerEnabledService = new AuthService({ userRepository: repository, publicRegistrationEnabled: true });

    const result = await registerEnabledService.register({ email: 'bad@x.com', password: 'short', name: '' });

    expect(result.ok).toBe(false);
    expect(result.code).toBe('VALIDATION_ERROR');
  });

  it('register rejects duplicate email when enabled', async () => {
    const registerEnabledService = new AuthService({ userRepository: repository, publicRegistrationEnabled: true });

    await registerEnabledService.register({ email: 'dup@x.com', password: 'password123', name: 'Dup One' });
    const duplicate = await registerEnabledService.register({ email: 'dup@x.com', password: 'password123', name: 'Dup Two' });

    expect(duplicate.ok).toBe(false);
    expect(duplicate.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('admin seed creates admin only once', async () => {
    const first = await service.seedAdminFromEnv({ email: 'admin@x.com', password: 'password123', name: 'Admin' });
    const second = await service.seedAdminFromEnv({ email: 'admin@x.com', password: 'password123', name: 'Admin' });

    expect(first.ok).toBe(true);
    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(users[0].role).toBe('admin');
  });


  it('admin seed and login normalize email casing', async () => {
    const seed = await service.seedAdminFromEnv({ email: 'Admin@Example.com ', password: 'password123', name: 'Admin' });
    const login = await service.login({ email: ' ADMIN@example.COM', password: 'password123' });

    expect(seed.ok).toBe(true);
    expect(seed.created).toBe(true);
    expect(users[0].email).toBe('admin@example.com');
    expect(login.ok).toBe(true);
  });


  it('user registered through public flow can log in', async () => {
    const registerEnabledService = new AuthService({ userRepository: repository, publicRegistrationEnabled: true });

    const registration = await registerEnabledService.register({ email: 'flow@x.com', password: 'password123', name: 'Flow User' });
    const login = await registerEnabledService.login({ email: 'flow@x.com', password: 'password123' });

    expect(registration.ok).toBe(true);
    expect(login.ok).toBe(true);
    expect(login.user?.email).toBe('flow@x.com');
  });

  it('valid login succeeds and updates lastLoginAt', async () => {
    await service.seedAdminFromEnv({ email: 'x@x.com', password: 'password123', name: 'X' });

    const result = await service.login({ email: 'x@x.com', password: 'password123' });

    expect(result.ok).toBe(true);
    expect(result.user?.lastLoginAt).toBeTruthy();
  });

  it('invalid login fails cleanly', async () => {
    const result = await service.login({ email: 'missing@x.com', password: 'pass' });
    expect(result.ok).toBe(false);
    expect(result.code).toBe('INVALID_CREDENTIALS');
  });

  it('suspended user login is refused', async () => {
    await service.seedAdminFromEnv({ email: 's@x.com', password: 'password123', name: 'S' });
    users[0].accountStatus = 'suspended';
    const result = await service.login({ email: 's@x.com', password: 'password123' });
    expect(result.ok).toBe(false);
    expect(result.code).toBe('ACCOUNT_SUSPENDED');
  });

  it('google oauth creates or reuses user', async () => {
    const first = await service.loginWithOAuth({ email: 'g@x.com', name: 'G', authProvider: 'google', providerId: 'g-1' });
    const second = await service.loginWithOAuth({ email: 'g@x.com', name: 'G', authProvider: 'google', providerId: 'g-1' });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(users).toHaveLength(1);
  });
});
