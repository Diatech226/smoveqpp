import APP_CONFIG from '../../config/app.config';
import type { ResolvedPage } from '../../app-routing/navigationTypes';
import { getPublicSiteUrl } from '../../utils/publicSiteUrl';
import { normalizePublicRoutePath, PUBLIC_ROUTE_PATHS } from './publicRoutes';

interface MetadataConfig {
  siteTitle: string;
  defaultSocialImage: string;
}

export interface PageMetadata {
  title: string;
  description: string;
  routePath: string;
  image?: string;
  type?: 'website' | 'article';
}

const metadataConfig: MetadataConfig = {
  siteTitle: APP_CONFIG.app.name,
  defaultSocialImage: APP_CONFIG.seo.socialImage,
};

const upsertMeta = (selector: string, attrs: Record<string, string>): void => {
  const key = Object.keys(attrs).find((item) => item === 'name' || item === 'property');
  if (!key) return;

  const element = document.querySelector(selector) || document.createElement('meta');
  Object.entries(attrs).forEach(([attr, value]) => {
    element.setAttribute(attr, value);
  });
  if (!element.parentNode) document.head.appendChild(element);
};

const upsertCanonical = (href: string): void => {
  const canonicalTag = document.querySelector('link[rel="canonical"]') || document.createElement('link');
  canonicalTag.setAttribute('rel', 'canonical');
  canonicalTag.setAttribute('href', href);
  if (!canonicalTag.parentNode) document.head.appendChild(canonicalTag);
};

export const configurePublicMetadata = (overrides: Partial<MetadataConfig>): void => {
  if (overrides.siteTitle?.trim()) metadataConfig.siteTitle = overrides.siteTitle.trim();
  if (overrides.defaultSocialImage?.trim()) metadataConfig.defaultSocialImage = overrides.defaultSocialImage.trim();
};

export const resolveCanonicalUrl = (routePath: string): string => {
  const baseUrl = new URL(getPublicSiteUrl());
  baseUrl.hash = normalizePublicRoutePath(routePath);
  return baseUrl.toString();
};

export const applyPageMetadata = (metadata: PageMetadata): void => {
  const canonicalUrl = resolveCanonicalUrl(metadata.routePath);
  const image = metadata.image?.trim() || metadataConfig.defaultSocialImage;
  const fullTitle = `${metadata.title} | ${metadataConfig.siteTitle}`;

  document.title = fullTitle;

  upsertMeta('meta[name="description"]', { name: 'description', content: metadata.description });
  upsertCanonical(canonicalUrl);

  upsertMeta('meta[property="og:title"]', { property: 'og:title', content: fullTitle });
  upsertMeta('meta[property="og:description"]', { property: 'og:description', content: metadata.description });
  upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
  upsertMeta('meta[property="og:type"]', { property: 'og:type', content: metadata.type || 'website' });

  upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
  upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: fullTitle });
  upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: metadata.description });

  if (image) {
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: image });
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: image });
  }
};

export const applyResolvedPageMetadata = (page: ResolvedPage): void => {
  const map: Array<{ when: (value: ResolvedPage) => boolean; meta: PageMetadata }> = [
    {
      when: (value) => value === 'home',
      meta: {
        title: 'Accueil',
        description: APP_CONFIG.seo.defaultDescription,
        routePath: PUBLIC_ROUTE_PATHS.home,
      },
    },
    {
      when: (value) => value === 'blog',
      meta: {
        title: 'Blog',
        description: 'Actualités, conseils et insights sur le digital et la communication.',
        routePath: PUBLIC_ROUTE_PATHS.blog,
      },
    },
    {
      when: (value) => value === 'projects',
      meta: {
        title: 'Projets',
        description: 'Découvrez nos réalisations et études de cas en communication digitale.',
        routePath: PUBLIC_ROUTE_PATHS.projects,
      },
    },
    {
      when: (value) => value === 'services-all',
      meta: {
        title: 'Services',
        description: 'Explorez nos services pour structurer, lancer et accélérer votre présence digitale.',
        routePath: PUBLIC_ROUTE_PATHS.services,
      },
    },
    {
      when: (value) => value === 'apropos',
      meta: {
        title: 'À propos',
        description: 'Découvrez l’équipe SMOVE, notre expertise et notre méthode de collaboration.',
        routePath: PUBLIC_ROUTE_PATHS.about,
      },
    },
  ];

  const matched = map.find((entry) => entry.when(page));
  if (matched) {
    applyPageMetadata(matched.meta);
  }
};
