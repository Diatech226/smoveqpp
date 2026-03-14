import { mediaRepository } from '../../repositories/mediaRepository';

const MEDIA_REFERENCE_PREFIX = 'media:';
const FALLBACK_IMAGE_QUERY = 'blog article image';

export interface ResolvedBlogMedia {
  reference: string;
  src: string;
  alt: string;
  caption: string;
  isMediaAsset: boolean;
  isFallback: boolean;
}

export const toMediaReference = (mediaId: string) => `${MEDIA_REFERENCE_PREFIX}${mediaId.trim()}`;

const normalizeText = (value: string | undefined, fallback: string): string => {
  const normalized = value?.trim();
  return normalized ? normalized : fallback;
};

export function resolveBlogMediaReference(reference: string | undefined, fallbackAlt: string): ResolvedBlogMedia {
  const normalizedReference = (reference || '').trim();

  if (normalizedReference.startsWith(MEDIA_REFERENCE_PREFIX)) {
    const mediaId = normalizedReference.slice(MEDIA_REFERENCE_PREFIX.length).trim();
    const media = mediaId ? mediaRepository.getById(mediaId) : undefined;

    if (media) {
      return {
        reference: normalizedReference,
        src: media.url,
        alt: normalizeText(media.alt, fallbackAlt),
        caption: normalizeText(media.caption, media.title || media.name),
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
    reference: FALLBACK_IMAGE_QUERY,
    src: FALLBACK_IMAGE_QUERY,
    alt: fallbackAlt,
    caption: fallbackAlt,
    isMediaAsset: false,
    isFallback: true,
  };
}

export const isMediaReference = (value: string | undefined) =>
  typeof value === 'string' && value.trim().startsWith(MEDIA_REFERENCE_PREFIX);

export const BLOG_MEDIA_FALLBACK_QUERY = FALLBACK_IMAGE_QUERY;
