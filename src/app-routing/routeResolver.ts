import { HOME_SECTIONS, isCmsRoute, resolveAuthPageGuard, resolveCmsRouteGuard } from './guards';
import type { AppRoute, AuthRoutingState, RouteResolution } from './navigationTypes';

export function parseHashRoute(hash: string): AppRoute {
  const rawRoute = (hash.startsWith('#') ? hash.slice(1) : hash) || 'home';
  return rawRoute.split('?')[0] as AppRoute;
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
    const normalizedHash = page === 'cms-dashboard' ? 'cms' : page;
    return {
      page,
      sectionToScroll: null,
      normalizedHash,
    };
  }


  if (route === 'account') {
    if (!auth.isAuthReady) {
      return {
        page: 'auth-loading',
        sectionToScroll: null,
        normalizedHash: 'auth-loading',
      };
    }

    if (!auth.isAuthenticated) {
      return {
        page: 'login',
        sectionToScroll: null,
        normalizedHash: 'login',
      };
    }

    return {
      page: 'account',
      sectionToScroll: null,
    };
  }

  if (HOME_SECTIONS.has(route)) {
    return {
      page: 'home',
      sectionToScroll: route,
    };
  }



  if (route.startsWith('service/')) {
    const slug = route.slice('service/'.length).trim().toLowerCase();
    if (slug === 'design-branding') {
      return { page: 'service-design', sectionToScroll: null };
    }
    if (slug === 'web-development') {
      return { page: 'service-web', sectionToScroll: null };
    }
    return { page: 'services-all', sectionToScroll: null };
  }

  if (route.startsWith('blog/')) {
    const slug = route.slice('blog/'.length).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (slug) {
      return {
        page: `blog-${slug}`,
        sectionToScroll: null,
      };
    }
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
