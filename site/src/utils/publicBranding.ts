import { hydratePublicMediaLibrary } from '../features/media/publicMediaLibrary';
import { mediaRepository } from '../repositories/mediaRepository';
import { readFromStorage, writeToStorage } from '../repositories/storage/localStorageStore';
import { getCloudinaryVariant } from './cloudinaryVariant';
import { fetchPublicSettings, type PublicSiteSettings } from './contentApi';
import { resolveMediaUrl } from './mediaResolver';
import { logDebug } from './observability';

export const DEFAULT_BRAND_LOGO = '/favicon.svg';
export const DEFAULT_LOGO_SIZE = { desktop: 120, tablet: 100, mobile: 80 } as const;
const PUBLIC_BRANDING_STORAGE_KEY = 'smove_public_branding_v1';

type LogoSize = { desktop: number; tablet: number; mobile: number };

export interface PublicBrandingSnapshot {
  logoSrc: string;
  logoSize: LogoSize;
}

export interface PublicBrandingBootstrap {
  branding: PublicBrandingSnapshot;
  settings: PublicSiteSettings;
}

const isPositiveNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0;

export const isPublicBrandingSnapshot = (value: unknown): value is PublicBrandingSnapshot => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<PublicBrandingSnapshot>;
  return (
    typeof candidate.logoSrc === 'string' &&
    candidate.logoSrc.trim().length > 0 &&
    Boolean(candidate.logoSize) &&
    isPositiveNumber(candidate.logoSize?.desktop) &&
    isPositiveNumber(candidate.logoSize?.tablet) &&
    isPositiveNumber(candidate.logoSize?.mobile)
  );
};

const fallbackSnapshot: PublicBrandingSnapshot = {
  logoSrc: DEFAULT_BRAND_LOGO,
  logoSize: { ...DEFAULT_LOGO_SIZE },
};

let snapshot = readFromStorage(PUBLIC_BRANDING_STORAGE_KEY, isPublicBrandingSnapshot, fallbackSnapshot);
let bootstrapPromise: Promise<PublicBrandingBootstrap> | null = null;
const listeners = new Set<() => void>();

export const getPublicBrandingSnapshot = (): PublicBrandingSnapshot => snapshot;
export const subscribeToPublicBranding = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const preloadLogo = async (logoSrc: string): Promise<void> => {
  if (typeof Image === 'undefined') return;
  const image = new Image();
  image.src = getCloudinaryVariant(logoSrc, 'contain');
  if (typeof image.decode === 'function') {
    await image.decode();
    return;
  }
  if (image.complete) return;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Unable to preload public brand logo.'));
  });
};

/** Loads settings and media together so media:<id> branding is resolvable on the first render cycle. */
export function bootstrapPublicBranding(): Promise<PublicBrandingBootstrap> {
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = Promise.all([fetchPublicSettings(), hydratePublicMediaLibrary().catch((error) => {
    logDebug({ scope: 'branding', event: 'public_media_load_failed', error });
    return mediaRepository.getAll();
  })])
    .then(async ([settings, mediaFiles]) => {
      const logoReference = settings.siteSettings.brandMedia.logo.trim();
      const publishedLogo = resolveMediaUrl(logoReference, mediaFiles.length ? mediaFiles : mediaRepository.getAll());
      const nextSnapshot: PublicBrandingSnapshot = {
        // Preserve the cached, already-rendered logo if the newest reference cannot resolve.
        logoSrc: publishedLogo || snapshot.logoSrc || DEFAULT_BRAND_LOGO,
        logoSize: settings.branding.logoSize,
      };

      if (nextSnapshot.logoSrc !== snapshot.logoSrc) {
        try {
          await preloadLogo(nextSnapshot.logoSrc);
        } catch (error) {
          logDebug({ scope: 'branding', event: 'logo_preload_failed', details: { logoReference }, error });
          return { branding: snapshot, settings };
        }
      }

      snapshot = nextSnapshot;
      writeToStorage(PUBLIC_BRANDING_STORAGE_KEY, snapshot);
      listeners.forEach((listener) => listener());
      return { branding: snapshot, settings };
    })
    .finally(() => {
      bootstrapPromise = null;
    });

  return bootstrapPromise;
}

export async function refreshPublicBranding(): Promise<PublicBrandingSnapshot> {
  return (await bootstrapPublicBranding()).branding;
}
