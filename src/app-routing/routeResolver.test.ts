import { describe, expect, it } from 'vitest';
import { resolveRoute } from './routeResolver';
import { resolveAuthPageGuard, resolveCmsRouteGuard } from './guards';
import type { AuthRoutingState } from './navigationTypes';

const baseAuth: AuthRoutingState = {
  isAuthenticated: false,
  isAuthReady: true,
  canAccessCMS: false,
  cmsEnabled: true,
  registrationEnabled: true,
  postLoginRoute: 'account',
};

describe('routeResolver', () => {
  it('maps home section hashes to home page + section scroll', () => {
    const resolution = resolveRoute('#services', baseAuth);

    expect(resolution.page).toBe('home');
    expect(resolution.sectionToScroll).toBe('services');
  });

  it('keeps deep project routes untouched', () => {
    const resolution = resolveRoute('#project-alpha-123', baseAuth);

    expect(resolution.page).toBe('project-alpha-123');
    expect(resolution.sectionToScroll).toBeNull();
  });

  it('falls back invalid routes to home', () => {
    const resolution = resolveRoute('#not-a-real-route', baseAuth);

    expect(resolution.page).toBe('home');
  });


  it('protects account route for unauthenticated users', () => {
    const resolution = resolveRoute('#account', baseAuth);

    expect(resolution.page).toBe('login');
    expect(resolution.normalizedHash).toBe('login');
  });

  it('redirects cms routes to login when unauthenticated', () => {
    const resolution = resolveRoute('#cms-dashboard', baseAuth);

    expect(resolution.page).toBe('login');
    expect(resolution.normalizedHash).toBe('login');
  });
});

describe('guards', () => {
  it('redirects authenticated user away from login/register', () => {
    const decision = resolveAuthPageGuard('login', {
      ...baseAuth,
      isAuthenticated: true,
      postLoginRoute: 'cms-dashboard',
    });

    expect(decision).toBe('cms-dashboard');
  });

  it('allows register when registration is enabled', () => {
    const decision = resolveAuthPageGuard('register', {
      ...baseAuth,
      registrationEnabled: true,
    });

    expect(decision).toBe('register');
  });

  it('denies register when registration is disabled', () => {
    const decision = resolveAuthPageGuard('register', {
      ...baseAuth,
      registrationEnabled: false,
    });

    expect(decision).toBe('login');
  });

  it('denies cms when feature is disabled', () => {
    const decision = resolveCmsRouteGuard({
      ...baseAuth,
      cmsEnabled: false,
    });

    expect(decision).toBe('cms-unavailable');
  });

  it('allows cms dashboard when session is ready and authorized', () => {
    const decision = resolveCmsRouteGuard({
      ...baseAuth,
      isAuthenticated: true,
      canAccessCMS: true,
    });

    expect(decision).toBe('cms-dashboard');
  });
});
