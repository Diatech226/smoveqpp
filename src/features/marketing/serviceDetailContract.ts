import { resolveAssetReference } from '../media/assetReference';
import type { Service } from '../../domain/contentSchemas';
import { resolveServiceRouteSlug } from './serviceRouting';

const FALLBACK_CTA_HREF = '#contact';
const FALLBACK_CTA_LABEL = 'Parler à un expert';

export interface ServiceDetailContract {
  id: string;
  title: string;
  routeSlug: string;
  shortDescription: string;
  overview: string;
  features: string[];
  processTitle: string;
  processSteps: string[];
  cta: {
    title: string;
    description: string;
    primaryLabel: string;
    primaryHref: string;
  };
  heroMedia: {
    src: string;
    alt: string;
    isMediaAsset: boolean;
  };
}

const isPublicService = (service: Service): boolean => service.status === 'published';

const normalizeText = (value: string | undefined): string => (value || '').trim();

const isSafeHref = (value: string | undefined): boolean => {
  const href = normalizeText(value);
  if (!href) return false;
  if (href.startsWith('#')) return href.length > 1;
  if (href.startsWith('/')) return true;

  try {
    const parsed = new URL(href);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const normalizeContactHref = (href: string): string => {
  const normalized = normalizeText(href);
  if (normalized === '/contact' || normalized === '#/contact') {
    return FALLBACK_CTA_HREF;
  }
  return normalized;
};

export const findPublishedServiceBySlug = (services: Service[], slug: string): Service | undefined => {
  const normalizedSlug = normalizeText(slug).toLowerCase();
  return services.find((service) => {
    if (!isPublicService(service)) return false;
    const routeSlug = resolveServiceRouteSlug(service);
    return routeSlug === normalizedSlug;
  });
};

export const buildServiceDetailContract = (service: Service): ServiceDetailContract => {
  const title = normalizeText(service.title) || 'Service';
  const shortDescription = normalizeText(service.shortDescription) || normalizeText(service.description) || `Découvrir ${title}.`;
  const overview = normalizeText(service.overviewDescription) || normalizeText(service.description) || shortDescription;
  const features = Array.isArray(service.features) && service.features.length > 0
    ? service.features.map((feature) => normalizeText(feature)).filter(Boolean)
    : ['Accompagnement stratégique', 'Exécution opérationnelle', 'Suivi des performances'];
  const processSteps = Array.isArray(service.processSteps) && service.processSteps.length > 0
    ? service.processSteps.map((step) => normalizeText(step)).filter(Boolean)
    : ['Cadrage', 'Production', 'Livraison'];
  const processTitle = normalizeText(service.processTitle) || 'Notre approche';
  const ctaPrimaryLabel = normalizeText(service.ctaPrimaryLabel) || FALLBACK_CTA_LABEL;
  const ctaPrimaryHref = isSafeHref(service.ctaPrimaryHref)
    ? normalizeContactHref(service.ctaPrimaryHref || '')
    : FALLBACK_CTA_HREF;
  const ctaTitle = normalizeText(service.ctaTitle) || `Lancer votre projet ${title}`;
  const ctaDescription = normalizeText(service.ctaDescription) || `${ctaPrimaryLabel} pour discuter de vos objectifs et du planning de mise en œuvre.`;
  const heroMedia = resolveAssetReference(service.iconLikeAsset, title, `${title.toLowerCase()} service`);

  return {
    id: service.id,
    title,
    routeSlug: resolveServiceRouteSlug(service),
    shortDescription,
    overview,
    features,
    processTitle,
    processSteps,
    cta: {
      title: ctaTitle,
      description: ctaDescription,
      primaryLabel: ctaPrimaryLabel,
      primaryHref: ctaPrimaryHref,
    },
    heroMedia: {
      src: heroMedia.src,
      alt: heroMedia.alt,
      isMediaAsset: heroMedia.isMediaAsset,
    },
  };
};
