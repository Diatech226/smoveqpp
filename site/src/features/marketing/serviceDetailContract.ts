import type { Service } from '../../domain/contentSchemas';
import { resolveServiceRouteSlug } from './serviceRouting';

import { CONTACT_CTA_HREF, resolveServiceContactHref } from './navigationCta';

const FALLBACK_CTA_HREF = CONTACT_CTA_HREF;
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
  illustrationCards: Array<{ id: string; title: string; caption: string; image: { src: string; alt: string } }>;
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
  const shortDescription = normalizeText(service.shortDescription) || normalizeText(service.summary) || normalizeText(service.description) || `Découvrir ${title}.`;
  const overview = normalizeText(service.description) || normalizeText(service.overviewDescription) || shortDescription;
  const detailImage = normalizeText(service.detailImage) || normalizeText(service.representativeImage) || normalizeText(service.visualMedia) || normalizeText(service.image) || normalizeText(service.media);
  const features = Array.isArray(service.features) && service.features.length > 0
    ? service.features.map((feature) => normalizeText(feature)).filter(Boolean)
    : ['Accompagnement stratégique', 'Exécution opérationnelle', 'Suivi des performances'];
  const processSteps = Array.isArray(service.processSteps) && service.processSteps.length > 0
    ? service.processSteps.map((step) => normalizeText(step)).filter(Boolean)
    : ['Cadrage', 'Production', 'Livraison'];
  const processTitle = normalizeText(service.processTitle) || 'Notre approche';
  const requestedCtaHref = normalizeText(service.detailCta?.buttonUrl) || normalizeText(service.ctaPrimaryHref);
  const ctaPrimaryLabel = normalizeText(service.detailCta?.buttonLabel) || normalizeText(service.ctaPrimaryLabel) || FALLBACK_CTA_LABEL;
  const ctaPrimaryHref = isSafeHref(requestedCtaHref)
    ? resolveServiceContactHref(requestedCtaHref)
    : FALLBACK_CTA_HREF;
  const ctaTitle = normalizeText(service.detailCta?.title) || normalizeText(service.ctaTitle) || `Lancer votre projet ${title}`;
  const ctaDescription = normalizeText(service.detailCta?.text) || normalizeText(service.ctaDescription) || `${ctaPrimaryLabel} pour discuter de vos objectifs et du planning de mise en œuvre.`;

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
      src: detailImage,
      alt: `${title.toLowerCase()} service`,
      isMediaAsset: Boolean(detailImage),
    },
    illustrationCards: [],
  };
};
