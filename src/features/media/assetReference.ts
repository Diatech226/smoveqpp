import type { MediaFile } from '../../domain/contentSchemas';
import { mediaRepository } from '../../repositories/mediaRepository';

export const MEDIA_REFERENCE_PREFIX = 'media:';

export interface ResolvedAssetReference {
  reference: string;
  src: string;
  alt: string;
  caption: string;
  isMediaAsset: boolean;
  isFallback: boolean;
}

const normalizeText = (value: string | undefined, fallback: string): string => {
  const normalized = value?.trim();
  return normalized ? normalized : fallback;
};

export const isMediaReferenceValue = (value: string | undefined): boolean =>
  typeof value === 'string' && value.trim().startsWith(MEDIA_REFERENCE_PREFIX);

export const toMediaReferenceValue = (mediaId: string): string => `${MEDIA_REFERENCE_PREFIX}${mediaId.trim()}`;

export const mediaIdFromReference = (reference: string): string => reference.slice(MEDIA_REFERENCE_PREFIX.length).trim();

export const mediaReferenceExists = (reference: string): boolean => {
  if (!isMediaReferenceValue(reference)) return false;
  const mediaId = mediaIdFromReference(reference);
  return Boolean(mediaId && mediaRepository.getById(mediaId));
};

export const isValidMediaFieldValue = (value: string): boolean => {
  const normalized = value.trim();
  if (!normalized) return false;
  if (isMediaReferenceValue(normalized)) return mediaReferenceExists(normalized);

  try {
    const parsed = new URL(normalized);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return !normalized.includes('://');
  }
};

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
      return {
        reference: normalizedReference,
        src: media.url,
        alt: normalizeText(media.alt, fallbackAlt),
        caption: normalizeText(media.caption, media.title || media.name || fallbackAlt),
        isMediaAsset: true,
        isFallback: false,
      };
    }
  }

  if (normalizedReference) {
    return {
      reference: normalizedReference,
      src: normalizedReference,
      alt: fallbackAlt,
      caption: fallbackAlt,
      isMediaAsset: false,
      isFallback: false,
    };
  }

  return {
    reference: fallbackQuery,
    src: fallbackQuery,
    alt: fallbackAlt,
    caption: fallbackAlt,
    isMediaAsset: false,
    isFallback: true,
  };
};
