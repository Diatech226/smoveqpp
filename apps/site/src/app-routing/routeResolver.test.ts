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
    expect(resolution.normalizedHash).toBe('/projects/alpha-123');
  });


  it('maps blog detail slug hashes to canonical blog detail route', () => {
    const resolution = resolveRoute('#blog/Mon Super-Article', baseAuth);

    expect(resolution.page).toBe('blog-mon-super-article');
    expect(resolution.sectionToScroll).toBeNull();
    expect(resolution.normalizedHash).toBe('/blog/mon-super-article');
  });

  it('resolves canonical hash paths for public list routes', () => {
    expect(resolveRoute('#/blog', baseAuth).page).toBe('blog');
    expect(resolveRoute('#/projects', baseAuth).page).toBe('projects');
    expect(resolveRoute('#/services', baseAuth).page).toBe('services-all');
    expect(resolveRoute('#/about', baseAuth).page).toBe('apropos');
    expect(resolveRoute('#/contact', baseAuth).page).toBe('contact');
    expect(resolveRoute('#/contact?source=project', baseAuth).page).toBe('contact');
  });



  it('resolves forgot and reset password routes', () => {
    expect(resolveRoute('#/forgot-password', baseAuth).page).toBe('forgot-password');
    expect(resolveRoute('#/reset-password?token=test', baseAuth).page).toBe('reset-password');
  });
  it('maps canonical service slugs to deterministic service pages', () => {
    expect(resolveRoute('#service/design-branding', baseAuth).page).toBe('service-design');
    expect(resolveRoute('#/services/design-branding', baseAuth).page).toBe('service-design');
    expect(resolveRoute('#service/web-development', baseAuth).page).toBe('service-web');
    expect(resolveRoute('#/services/web-development', baseAuth).page).toBe('service-web');
    expect(resolveRoute('#service-growth-marketing', baseAuth).page).toBe('service-growth-marketing');
    expect(resolveRoute('#/services/growth-marketing', baseAuth).page).toBe('service-growth-marketing');
    expect(resolveRoute('#service/unknown', baseAuth).page).toBe('service-unknown');
  });


  it('falls back service root route to services hub when slug is empty', () => {
    expect(resolveRoute('#service///', baseAuth).page).toBe('services-all');
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


  it('normalizes cms root route for authorized admins', () => {
    const resolution = resolveRoute('#cms', {
      ...baseAuth,
      isAuthenticated: true,
      canAccessCMS: true,
    });

    expect(resolution.page).toBe('cms-dashboard');
    expect(resolution.normalizedHash).toBe('/cms');
  });

  it('normalizes legacy cms dashboard hash to cms root', () => {
    const resolution = resolveRoute('#cms-dashboard', {
      ...baseAuth,
      isAuthenticated: true,
      canAccessCMS: true,
    });

    expect(resolution.page).toBe('cms-dashboard');
    expect(resolution.normalizedHash).toBe('/cms');
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



  it('redirects authenticated users away from forgot/reset password pages', () => {
    const forgotDecision = resolveAuthPageGuard('forgot-password', {
      ...baseAuth,
      isAuthenticated: true,
      postLoginRoute: 'account',
    });
    const resetDecision = resolveAuthPageGuard('reset-password', {
      ...baseAuth,
      isAuthenticated: true,
      postLoginRoute: 'account',
    });

    expect(forgotDecision).toBe('account');
    expect(resetDecision).toBe('account');
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
