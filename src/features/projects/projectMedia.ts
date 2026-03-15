import type { Project } from '../../domain/contentSchemas';
import { mediaRepository } from '../../repositories/mediaRepository';

export const PROJECT_MEDIA_FALLBACK_QUERY = 'project cover image';
const MEDIA_REFERENCE_PREFIX = 'media:';

const asTrimmed = (value?: string): string => (typeof value === 'string' ? value.trim() : '');

export interface ResolvedProjectMedia {
  reference: string;
  query: string;
  alt: string;
}

export const toProjectMediaReference = (mediaId: string) => `${MEDIA_REFERENCE_PREFIX}${mediaId.trim()}`;

export const isProjectMediaReference = (value?: string) =>
  typeof value === 'string' && value.trim().startsWith(MEDIA_REFERENCE_PREFIX);

export function resolveProjectFeaturedImage(project: Pick<Project, 'featuredImage' | 'mainImage' | 'title' | 'imageAlt'>): ResolvedProjectMedia {
  const reference = asTrimmed(project.featuredImage) || asTrimmed(project.mainImage) || PROJECT_MEDIA_FALLBACK_QUERY;
  const fallbackAlt = asTrimmed(project.imageAlt) || asTrimmed(project.title) || 'Projet SMOVE';

  if (isProjectMediaReference(reference)) {
    const mediaId = reference.slice(MEDIA_REFERENCE_PREFIX.length).trim();
    const mediaAsset = mediaId ? mediaRepository.getById(mediaId) : undefined;
    if (mediaAsset?.url) {
      return {
        reference,
        query: mediaAsset.url,
        alt: asTrimmed(mediaAsset.alt) || fallbackAlt,
      };
    }
  }

  return {
    reference,
    query: reference,
    alt: fallbackAlt,
  };
}
