import type { MediaFile } from '../../domain/contentSchemas';
import { mediaRepository } from '../../repositories/mediaRepository';
import {
  MEDIA_REFERENCE_PREFIX,
  isMediaReference,
  isValidMediaFieldValue as isValidMediaFieldContract,
  mediaIdFromReference,
  mediaReferenceExists,
  toMediaReference,
} from '../../shared/contentContracts';

export { MEDIA_REFERENCE_PREFIX };

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
      return {
        reference: normalizedReference,
        src: media.url,
        alt: normalizeText(media.alt, fallbackAlt),
        caption: normalizeText(media.caption, media.title || media.name || fallbackAlt),
        isMediaAsset: true,
        isFallback: false,
      };
    }

    return {
      reference: normalizedReference,
      src: fallbackQuery,
      alt: fallbackAlt,
      caption: fallbackAlt,
      isMediaAsset: true,
      isFallback: true,
    };
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
