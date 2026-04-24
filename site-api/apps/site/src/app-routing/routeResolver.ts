import { HOME_SECTIONS, isCmsRoute, resolveAuthPageGuard, resolveCmsRouteGuard } from './guards';
import type { AppRoute, AuthRoutingState, RouteResolution } from './navigationTypes';
import { PREMIUM_SERVICE_ROUTES, normalizeServiceSlug } from '../features/marketing/serviceRouting';
import { normalizePublicRoutePath } from '../features/marketing/publicRoutes';
import { normalizeSlug } from '../shared/contentContracts';

export function parseHashRoute(hash: string): AppRoute {
  const rawRoute = (hash.startsWith('#') ? hash.slice(1) : hash) || 'home';
  return rawRoute.split('?')[0] as AppRoute;
}

const routeFromPathAlias = (route: string): string => {
  const normalizedPath = normalizePublicRoutePath(route);
  const detailMatchers: Array<{ prefix: string; format: (slug: string) => string | null }> = [
    {
      prefix: '/blog/',
      format: (slug) => {
        const canonicalSlug = normalizeSlug(slug);
        return canonicalSlug ? `blog-${canonicalSlug}` : null;
      },
    },
    {
      prefix: '/projects/',
      format: (slug) => {
        const canonicalSlug = normalizeSlug(slug);
        return canonicalSlug ? `project-${canonicalSlug}` : null;
      },
    },
    {
      prefix: '/services/',
      format: (slug) => {
        const canonicalSlug = normalizeServiceSlug(slug);
        return canonicalSlug ? `service-${canonicalSlug}` : null;
      },
    },
  ];

  for (const matcher of detailMatchers) {
    if (normalizedPath.startsWith(matcher.prefix)) {
      return matcher.format(normalizedPath.slice(matcher.prefix.length)) || 'home';
    }
  }

  const aliases: Record<string, string> = {
    '/': 'home',
    '/home': 'home',
    '/blog': 'blog',
    '/projects': 'projects',
    '/services': 'services-all',
    '/portfolio': 'portfolio',
    '/about': 'apropos',
    '/apropos': 'apropos',
    '/contact': 'contact',
    '/login': 'login',
    '/register': 'register',
    '/forgot-password': 'forgot-password',
    '/reset-password': 'reset-password',
    '/account': 'account',
    '/cms': 'cms-dashboard',
    '/cms-dashboard': 'cms-dashboard',
  };

  return aliases[normalizedPath] || route;
};

const extractServiceSlug = (route: string): string | null => {
  const normalized = route.trim();
  if (!normalized) return null;

  if (normalized.startsWith('/services/')) {
    return normalizeServiceSlug(normalized.slice('/services/'.length));
  }

  if (normalized.startsWith('services/')) {
    return normalizeServiceSlug(normalized.slice('services/'.length));
  }

  if (normalized.startsWith('service/')) {
    return normalizeServiceSlug(normalized.slice('service/'.length));
  }

  if (normalized.startsWith('service-')) {
    return normalizeServiceSlug(normalized.slice('service-'.length));
  }

  return null;
};

export function resolveRoute(hash: string, auth: AuthRoutingState): RouteResolution {
  const requestedRoute = parseHashRoute(hash);
  const route = routeFromPathAlias(requestedRoute);

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
    const normalizedHash = page === 'cms-dashboard' ? '/cms' : page;
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
      normalizedHash: '/account',
    };
  }

  if (HOME_SECTIONS.has(route)) {
    return {
      page: 'home',
      sectionToScroll: route,
      normalizedHash: '/',
    };
  }

  if (route === 'contact') {
    return {
      page: 'contact',
      sectionToScroll: null,
      normalizedHash: '/contact',
    };
  }

  if (route === 'service-design' || route === 'service-web') {
    return {
      page: route,
      sectionToScroll: null,
      normalizedHash: route === 'service-design' ? '/services/design-branding' : '/services/web-development',
    };
  }

  const serviceSlug = extractServiceSlug(route);
  if (serviceSlug !== null) {
    const slug = normalizeServiceSlug(serviceSlug);
    if (!slug) {
      return { page: 'services-all', sectionToScroll: null, normalizedHash: '/services' };
    }
    const premiumRoute = PREMIUM_SERVICE_ROUTES[slug];
    if (premiumRoute) {
      return {
        page: premiumRoute,
        sectionToScroll: null,
        normalizedHash: `/services/${slug}`,
      };
    }
    return { page: `service-${slug}`, sectionToScroll: null, normalizedHash: `/services/${slug}` };
  }

  if (route.startsWith('blog/')) {
    const slug = normalizeSlug(route.slice('blog/'.length));
    if (slug) {
      return {
        page: `blog-${slug}`,
        sectionToScroll: null,
        normalizedHash: `/blog/${slug}`,
      };
    }
  }

  if (route.startsWith('project-')) {
    const slug = normalizeSlug(route.slice('project-'.length));
    if (slug) {
      return {
        page: `project-${slug}`,
        sectionToScroll: null,
        normalizedHash: `/projects/${slug}`,
      };
    }
  }

  const knownPages = new Set(['home', 'projects', 'services-all', 'portfolio', 'blog', 'apropos', 'contact', 'forgot-password', 'reset-password', 'cms-unavailable', 'cms-forbidden', 'auth-loading']);

  if (knownPages.has(route)) {
    const normalizedHashByPage: Partial<Record<typeof route, string>> = {
      home: '/',
      projects: '/projects',
      'services-all': '/services',
      portfolio: '/portfolio',
      blog: '/blog',
      apropos: '/about',
      contact: '/contact',
      'forgot-password': '/forgot-password',
      'reset-password': '/reset-password',
    };
    return {
      page: route,
      sectionToScroll: null,
      normalizedHash: normalizedHashByPage[route],
    };
  }

  return {
    page: 'home',
    sectionToScroll: null,
    normalizedHash: '/',
  };
}
