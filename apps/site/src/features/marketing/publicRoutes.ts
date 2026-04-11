import { normalizeSlug } from '../../shared/contentContracts';

const ensureLeadingSlash = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '/';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
};

const stripTrailingSlash = (value: string): string => {
  if (value === '/') return value;
  return value.replace(/\/+$/, '') || '/';
};

export const normalizePublicRoutePath = (value: string): string => {
  const withoutQuery = value.split('?')[0] || '';
  return stripTrailingSlash(ensureLeadingSlash(withoutQuery));
};

export const toHashHref = (routePath: string): string => `#${normalizePublicRoutePath(routePath)}`;

export const PUBLIC_ROUTE_PATHS = {
  home: '/',
  blog: '/blog',
  projects: '/projects',
  services: '/services',
  portfolio: '/portfolio',
  about: '/about',
  contact: '/contact',
} as const;

export const buildBlogDetailPath = (slug: string): string => {
  const canonicalSlug = normalizeSlug(slug);
  return canonicalSlug ? `/blog/${canonicalSlug}` : PUBLIC_ROUTE_PATHS.blog;
};

export const buildProjectDetailPath = (slug: string): string => {
  const canonicalSlug = normalizeSlug(slug);
  return canonicalSlug ? `/projects/${canonicalSlug}` : PUBLIC_ROUTE_PATHS.projects;
};

export const buildServiceDetailPath = (slug: string): string => {
  const canonicalSlug = normalizeSlug(slug);
  return canonicalSlug ? `/services/${canonicalSlug}` : PUBLIC_ROUTE_PATHS.services;
};

export const PUBLIC_ROUTE_HASH = {
  home: toHashHref(PUBLIC_ROUTE_PATHS.home),
  blog: toHashHref(PUBLIC_ROUTE_PATHS.blog),
  projects: toHashHref(PUBLIC_ROUTE_PATHS.projects),
  services: toHashHref(PUBLIC_ROUTE_PATHS.services),
  portfolio: toHashHref(PUBLIC_ROUTE_PATHS.portfolio),
  about: toHashHref(PUBLIC_ROUTE_PATHS.about),
  contact: toHashHref(PUBLIC_ROUTE_PATHS.contact),
  blogDetail: (slug: string) => toHashHref(buildBlogDetailPath(slug)),
  projectDetail: (slug: string) => toHashHref(buildProjectDetailPath(slug)),
  serviceDetail: (slug: string) => toHashHref(buildServiceDetailPath(slug)),
} as const;
