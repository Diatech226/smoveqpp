import { describe, expect, it } from 'vitest';
import {
  evaluateCmsAccess,
  resolveTrustedSessionUser,
  type AppUser,
} from './securityPolicy';

describe('evaluateCmsAccess', () => {
  it('denies access when cms feature is disabled', () => {
    const decision = evaluateCmsAccess({
      cmsEnabled: false,
      isAuthenticated: true,
      user: { role: 'admin' },
    });

    expect(decision).toBe('disabled');
  });

  it('denies access for unauthenticated users', () => {
    const decision = evaluateCmsAccess({
      cmsEnabled: true,
      isAuthenticated: false,
      user: null,
    });

    expect(decision).toBe('unauthenticated');
  });

  it('allows editor and author roles for cms', () => {
    expect(
      evaluateCmsAccess({ cmsEnabled: true, isAuthenticated: true, user: { role: 'editor' } }),
    ).toBe('allow');

    expect(
      evaluateCmsAccess({ cmsEnabled: true, isAuthenticated: true, user: { role: 'author' } }),
    ).toBe('allow');
  });

  it('denies viewer role for cms', () => {
    const decision = evaluateCmsAccess({
      cmsEnabled: true,
      isAuthenticated: true,
      user: { role: 'viewer' },
    });

    expect(decision).toBe('forbidden');
  });
});

describe('resolveTrustedSessionUser', () => {
  it('ignores client-side session objects when server session is missing', () => {
    const forgedClientUser = {
      id: 'forged',
      email: 'attacker@fake.local',
      name: 'Attacker',
      role: 'admin',
    };

    expect(resolveTrustedSessionUser(null, forgedClientUser)).toBeNull();
  });

  it('returns server-validated session user', () => {
    const serverUser: AppUser = {
      id: '1',
      email: 'admin@company.test',
      name: 'Company Admin',
      role: 'admin',
    };

    expect(resolveTrustedSessionUser(serverUser, null)).toEqual(serverUser);
  });
});
