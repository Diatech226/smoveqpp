import { describe, it, expect, beforeEach } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { AuthService } = require('../services/authService');

describe('AuthService', () => {
  let users;
  let repository;
  let service;
  let failNextCreateWithDuplicate = false;

  beforeEach(() => {
    users = [];
    repository = {
      existsByEmail: async (email) => users.some((u) => u.email === email),
      create: async (input) => {
        if (failNextCreateWithDuplicate) {
          failNextCreateWithDuplicate = false;
          const error = new Error('duplicate key');
          error.code = 11000;
          throw error;
        }
        const user = {
          id: String(users.length + 1),
          ...input,
          providers: input.providers ?? [input.authProvider ?? 'local'],
          authProvider: input.authProvider ?? 'local',
          providerId: input.providerId ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        users.push(user);
        return user;
      },
      findByEmailWithPassword: async (email) => users.find((u) => u.email === email) ?? null,
      findByEmail: async (email) => users.find((u) => u.email === email) ?? null,
      findByProvider: async (provider, providerId) => users.find((u) => (provider === 'google' ? u.googleId : u.facebookId) === providerId) ?? null,
      updateUser: async (id, patch) => {
        const user = users.find((u) => u.id === String(id));
        if (!user) return null;
        Object.assign(user, patch, { updatedAt: new Date() });
        return user;
      },
      linkOAuthProvider: async (id, payload) => {
        const user = users.find((u) => u.id === String(id));
        if (!user) return null;
        if (payload.authProvider === 'google') user.googleId = payload.providerId;
        if (payload.authProvider === 'facebook') user.facebookId = payload.providerId;
        user.providers = Array.from(new Set([...(user.providers ?? ['local']), payload.authProvider]));
        user.providerId = payload.providerId;
        user.emailVerified = payload.emailVerified;
        user.avatarUrl = payload.avatarUrl ?? user.avatarUrl ?? null;
        user.name = payload.name ?? user.name;
        return user;
      },
      findById: async (id) => users.find((u) => u.id === id) ?? null,
      updateLastLoginAt: async (id, date) => {
        const user = users.find((u) => u.id === String(id));
        if (!user) return null;
        user.lastLoginAt = date;
        return user;
      },
      setPasswordResetToken: async (id, { tokenHash, expiresAt }) => {
        const user = users.find((u) => u.id === String(id));
        if (!user) return null;
        user.passwordResetTokenHash = tokenHash;
        user.passwordResetTokenExpiresAt = expiresAt;
        return user;
      },
      findByPasswordResetTokenHash: async (tokenHash) => users.find((u) => u.passwordResetTokenHash === tokenHash) ?? null,
      resetPasswordByToken: async (id, { passwordHash }) => {
        const user = users.find((u) => u.id === String(id));
        if (!user) return null;
        user.passwordHash = passwordHash;
        user.passwordResetTokenHash = null;
        user.passwordResetTokenExpiresAt = null;
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
    expect(result.user?.role).toBe('client');
    expect(users[0].passwordHash).toBeTruthy();
  });

  it('user registered through public flow can log in', async () => {
    const registerEnabledService = new AuthService({ userRepository: repository, publicRegistrationEnabled: true });

    const registration = await registerEnabledService.register({ email: 'flow@x.com', password: 'password123', name: 'Flow User' });
    const login = await registerEnabledService.login({ email: 'flow@x.com', password: 'password123' });

    expect(registration.ok).toBe(true);
    expect(login.ok).toBe(true);
    expect(login.user?.email).toBe('flow@x.com');
  });

  it('oauth links google account to existing local account by email', async () => {
    users.push({
      id: '1',
      email: 'link@x.com',
      name: 'Local User',
      passwordHash: 'salt:hash',
      providers: ['local'],
      authProvider: 'local',
      role: 'client',
      status: 'client',
      accountStatus: 'active',
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.loginWithOAuthProfile({
      authProvider: 'google',
      providerId: 'g-123',
      email: 'link@x.com',
      name: 'Google User',
      emailVerified: true,
    });

    expect(result.ok).toBe(true);
    expect(users).toHaveLength(1);
    expect(users[0].googleId).toBe('g-123');
    expect(users[0].providers).toContain('google');
  });

  it('oauth creates new user when no matching provider/email exists', async () => {
    const result = await service.loginWithOAuthProfile({
      authProvider: 'google',
      providerId: 'g-999',
      email: 'oauth@x.com',
      name: 'OAuth User',
      emailVerified: true,
    });

    expect(result.ok).toBe(true);
    expect(users).toHaveLength(1);
    expect(users[0].googleId).toBe('g-999');
    expect(users[0].email).toBe('oauth@x.com');
  });

  it('repeat google login reuses provider account', async () => {
    await service.loginWithOAuthProfile({ authProvider: 'google', providerId: 'g-1', email: 'g@x.com', name: 'G' });
    const second = await service.loginWithOAuthProfile({ authProvider: 'google', providerId: 'g-1', email: 'g@x.com', name: 'G' });

    expect(second.ok).toBe(true);
    expect(users).toHaveLength(1);
  });


  it('recovers from duplicate key race during oauth create', async () => {
    failNextCreateWithDuplicate = true;

    const first = await service.loginWithOAuthProfile({
      authProvider: 'google',
      providerId: 'g-race',
      email: 'race@x.com',
      name: 'Race User',
      emailVerified: true,
    });

    expect(first.ok).toBe(false);

    users.push({
      id: '2',
      email: 'race@x.com',
      name: 'Race User',
      providers: ['local'],
      authProvider: 'local',
      role: 'client',
      status: 'client',
      accountStatus: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    failNextCreateWithDuplicate = true;
    const recovered = await service.loginWithOAuthProfile({
      authProvider: 'google',
      providerId: 'g-race',
      email: 'race@x.com',
      name: 'Race User',
      emailVerified: true,
    });

    expect(recovered.ok).toBe(true);
    expect(users.find((u) => u.email === 'race@x.com')?.googleId).toBe('g-race');
  });

  it('facebook oauth without email fails when provider account is not linked', async () => {
    const result = await service.loginWithOAuthProfile({ authProvider: 'facebook', providerId: 'fb-1', email: '', name: 'FB User' });
    expect(result.ok).toBe(false);
    expect(result.code).toBe('OAUTH_EMAIL_REQUIRED');
  });


  it('seedAdminFromEnv repairs existing seeded admin role/status and local provider', async () => {
    users.push({
      id: 'existing-admin',
      email: 'admin@smove.test',
      name: 'Wrong Role',
      passwordHash: null,
      providers: ['google'],
      authProvider: 'google',
      role: 'client',
      status: 'client',
      accountStatus: 'invited',
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.seedAdminFromEnv({
      email: 'admin@smove.test',
      password: 'password123',
      name: 'Administrator',
    });

    expect(result.ok).toBe(true);
    expect(result.created).toBe(false);
    expect(result.repaired).toBe(true);
    expect(result.user?.role).toBe('admin');
    expect(result.user?.status).toBe('staff');
    expect(result.user?.accountStatus).toBe('active');
    expect(result.user?.providers).toContain('local');
  });

  it('facebook oauth reuses existing linked account', async () => {
    users.push({
      id: '1',
      email: 'fb@x.com',
      name: 'Fb User',
      providers: ['facebook'],
      facebookId: 'fb-123',
      authProvider: 'facebook',
      role: 'client',
      status: 'client',
      accountStatus: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.loginWithOAuthProfile({ authProvider: 'facebook', providerId: 'fb-123', email: null, name: 'Fb User' });
    expect(result.ok).toBe(true);
    expect(users).toHaveLength(1);
  });
});
