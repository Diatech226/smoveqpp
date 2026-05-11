import { isMediaReferenceValue, resolveAssetReference, toMediaReferenceValue, type MediaVariantKey } from '../media/assetReference';

const FALLBACK_IMAGE_QUERY = 'blog article image';

export interface ResolvedBlogMedia {
  reference: string;
  src: string;
  alt: string;
  caption: string;
  isMediaAsset: boolean;
  isFallback: boolean;
}

export const toMediaReference = (mediaId: string) => toMediaReferenceValue(mediaId);

export function resolveBlogMediaReference(reference: string | undefined, fallbackAlt: string, preferredVariant: MediaVariantKey = 'card'): ResolvedBlogMedia {
  return resolveAssetReference(reference, fallbackAlt, FALLBACK_IMAGE_QUERY, { preferredVariant });
}

export const isMediaReference = (value: string | undefined) => isMediaReferenceValue(value);

export const BLOG_MEDIA_FALLBACK_QUERY = FALLBACK_IMAGE_QUERY;
