import { HOME_SECTIONS, isCmsRoute, resolveAuthPageGuard, resolveCmsRouteGuard } from './guards';
import type { AppRoute, AuthRoutingState, RouteResolution } from './navigationTypes';

export function parseHashRoute(hash: string): AppRoute {
  return (hash.startsWith('#') ? hash.slice(1) : hash) || 'home';
}

export function resolveRoute(hash: string, auth: AuthRoutingState): RouteResolution {
  const route = parseHashRoute(hash);

  const guardedAuthRoute = resolveAuthPageGuard(route, auth);
  if (guardedAuthRoute) {
    return {
      page: guardedAuthRoute,
      sectionToScroll: null,
      normalizedHash: guardedAuthRoute,
    };
  }

  if (isCmsRoute(route)) {
    const page = resolveCmsRouteGuard(auth);
    return {
      page,
      sectionToScroll: null,
      normalizedHash: page,
    };
  }

  if (HOME_SECTIONS.has(route)) {
    return {
      page: 'home',
      sectionToScroll: route,
    };
  }

  if (route.startsWith('project-')) {
    return {
      page: route,
      sectionToScroll: null,
    };
  }

  const knownPages = new Set([
    'home',
    'projects',
    'services-all',
    'service-design',
    'service-web',
    'portfolio',
    'blog',
    'apropos',
    'cms-unavailable',
    'cms-forbidden',
    'auth-loading',
  ]);

  if (knownPages.has(route)) {
    return {
      page: route,
      sectionToScroll: null,
    };
  }

  return {
    page: 'home',
    sectionToScroll: null,
  };
}
