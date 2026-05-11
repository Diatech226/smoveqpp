import { describe, expect, it } from 'vitest';
import {
  evaluateCmsAccess,
  resolvePostLoginRoute,
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

  it('allows admin/editor/author roles for cms', () => {
    expect(
      evaluateCmsAccess({ cmsEnabled: true, isAuthenticated: true, user: { role: 'admin' } }),
    ).toBe('allow');

    expect(
      evaluateCmsAccess({ cmsEnabled: true, isAuthenticated: true, user: { role: 'editor' } }),
    ).toBe('allow');

    expect(
      evaluateCmsAccess({ cmsEnabled: true, isAuthenticated: true, user: { role: 'author' } }),
    ).toBe('allow');
  });


  it('denies suspended users even with cms role', () => {
    const decision = evaluateCmsAccess({
      cmsEnabled: true,
      isAuthenticated: true,
      user: { role: 'admin', accountStatus: 'suspended' },
    });

    expect(decision).toBe('forbidden');
  });

  it('denies viewer and client roles for cms', () => {
    const decision = evaluateCmsAccess({
      cmsEnabled: true,
      isAuthenticated: true,
      user: { role: 'viewer', accountStatus: 'active' },
    });

    expect(decision).toBe('forbidden');

    expect(
      evaluateCmsAccess({ cmsEnabled: true, isAuthenticated: true, user: { role: 'client', accountStatus: 'active' } }),
    ).toBe('forbidden');
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

  it('returns sanitized server-validated session user', () => {
    const serverUser: AppUser = {
      id: '1',
      email: 'admin@company.test',
      name: 'Company Admin',
      role: 'admin',
      status: 'staff',
      accountStatus: 'active',
      authProvider: 'local',
    };

    expect(resolveTrustedSessionUser(serverUser, null)).toEqual(serverUser);
  });
});

describe('resolvePostLoginRoute', () => {
  it('routes admins to account by default', () => {
    expect(resolvePostLoginRoute(true, { id: '1', email: 'admin@test.com', name: 'Admin', role: 'admin' })).toBe('account');
  });

  it('routes admins to cms dashboard only when they explicitly requested cms', () => {
    expect(resolvePostLoginRoute(true, { id: '1', email: 'admin@test.com', name: 'Admin', role: 'admin' }, 'cms-dashboard')).toBe('cms-dashboard');
  });

  it('routes clients to account', () => {
    expect(resolvePostLoginRoute(true, { id: '2', email: 'client@test.com', name: 'Client', role: 'client' })).toBe('account');
  });

  it('routes clients to forbidden only when they explicitly requested cms', () => {
    expect(resolvePostLoginRoute(true, { id: '2', email: 'client@test.com', name: 'Client', role: 'client' }, 'cms-dashboard')).toBe('cms-forbidden');
  });

  it('treats hash-style cms intent as forbidden for non-admin users', () => {
    expect(
      resolvePostLoginRoute(true, { id: '2', email: 'client@test.com', name: 'Client', role: 'client' }, 'cms/blog'),
    ).toBe('cms-forbidden');
  });
});
