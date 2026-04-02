import type { MediaFile } from '../../domain/contentSchemas';
import { mediaRepository } from '../../repositories/mediaRepository';
import { RUNTIME_CONFIG } from '../../config/runtimeConfig';
import {
  MEDIA_REFERENCE_PREFIX,
  isMediaReference,
  isValidMediaFieldValue as isValidMediaFieldContract,
  mediaIdFromReference,
  mediaReferenceExists,
  toMediaReference,
} from '../../shared/contentContracts';

export { MEDIA_REFERENCE_PREFIX };



const HTTP_SCHEME_PATTERN = /^[a-zA-Z][a-zA-Z\d+.-]*:/;

const toApiOrigin = (apiBaseUrl: string): string => {
  if (!apiBaseUrl.startsWith('http://') && !apiBaseUrl.startsWith('https://')) {
    return '';
  }

  try {
    return new URL(apiBaseUrl).origin;
  } catch {
    return '';
  }
};

export const resolveRenderableMediaUrl = (url: string, apiBaseUrl = RUNTIME_CONFIG.apiBaseUrl): string => {
  const normalizedUrl = url.trim();
  if (!normalizedUrl) return normalizedUrl;

  if (HTTP_SCHEME_PATTERN.test(normalizedUrl) || normalizedUrl.startsWith('//')) {
    return normalizedUrl;
  }

  if (!normalizedUrl.startsWith('/')) {
    return normalizedUrl;
  }

  const apiOrigin = toApiOrigin(apiBaseUrl);
  return apiOrigin ? `${apiOrigin}${normalizedUrl}` : normalizedUrl;
};

export interface ResolvedAssetReference {
  reference: string;
  src: string;
  alt: string;
  caption: string;
  isMediaAsset: boolean;
  isFallback: boolean;
  mediaState: 'resolved' | 'missing' | 'archived' | 'direct-url' | 'fallback';
}

const normalizeText = (value: string | undefined, fallback: string): string => {
  const normalized = value?.trim();
  return normalized ? normalized : fallback;
};

export const isMediaReferenceValue = (value: string | undefined): boolean => isMediaReference(value);

export const toMediaReferenceValue = (mediaId: string): string => toMediaReference(mediaId);

export { mediaIdFromReference };

export const mediaReferenceExistsInRepository = (reference: string): boolean =>
  mediaReferenceExists(reference, (mediaId) => Boolean(mediaRepository.getById(mediaId)));

export const isValidMediaFieldValue = (value: string): boolean =>
  isValidMediaFieldContract(value, {
    allowInlineText: true,
    hasMediaById: (mediaId) => Boolean(mediaRepository.getById(mediaId)),
  });

export const resolveAssetReference = (
  reference: string | undefined,
  fallbackAlt: string,
  fallbackQuery: string,
): ResolvedAssetReference => {
  const normalizedReference = (reference || '').trim();

  if (isMediaReferenceValue(normalizedReference)) {
    const mediaId = mediaIdFromReference(normalizedReference);
    const media: MediaFile | undefined = mediaId ? mediaRepository.getById(mediaId) : undefined;

    if (media?.url) {
      if (media.archivedAt) {
        return {
          reference: normalizedReference,
          src: fallbackQuery,
          alt: fallbackAlt,
          caption: fallbackAlt,
          isMediaAsset: true,
          isFallback: true,
          mediaState: 'archived',
        };
      }

      return {
        reference: normalizedReference,
        src: resolveRenderableMediaUrl(media.url),
        alt: normalizeText(media.alt, fallbackAlt),
        caption: normalizeText(media.caption, media.title || media.name || fallbackAlt),
        isMediaAsset: true,
        isFallback: false,
        mediaState: 'resolved',
      };
    }

    return {
      reference: normalizedReference,
      src: fallbackQuery,
      alt: fallbackAlt,
      caption: fallbackAlt,
      isMediaAsset: true,
      isFallback: true,
      mediaState: 'missing',
    };
  }

  if (normalizedReference) {
    return {
      reference: normalizedReference,
      src: resolveRenderableMediaUrl(normalizedReference),
      alt: fallbackAlt,
      caption: fallbackAlt,
      isMediaAsset: false,
      isFallback: false,
      mediaState: 'direct-url',
    };
  }

  return {
    reference: fallbackQuery,
    src: fallbackQuery,
    alt: fallbackAlt,
    caption: fallbackAlt,
    isMediaAsset: false,
    isFallback: true,
    mediaState: 'fallback',
  };
};
