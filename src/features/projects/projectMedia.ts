import type { Project } from '../../domain/contentSchemas';
import { isMediaReferenceValue, resolveAssetReference, toMediaReferenceValue } from '../media/assetReference';

export const PROJECT_MEDIA_FALLBACK_QUERY = 'project cover image';

const asTrimmed = (value?: string): string => (typeof value === 'string' ? value.trim() : '');

export interface ResolvedProjectMedia {
  reference: string;
  query: string;
  alt: string;
}

export const toProjectMediaReference = (mediaId: string) => toMediaReferenceValue(mediaId);

export const isProjectMediaReference = (value?: string) => isMediaReferenceValue(value);

export function resolveProjectFeaturedImage(project: Pick<Project, 'featuredImage' | 'mainImage' | 'title' | 'imageAlt'>): ResolvedProjectMedia {
  const reference = asTrimmed(project.featuredImage) || asTrimmed(project.mainImage) || PROJECT_MEDIA_FALLBACK_QUERY;
  const fallbackAlt = asTrimmed(project.imageAlt) || asTrimmed(project.title) || 'Projet SMOVE';
  const resolved = resolveAssetReference(reference, fallbackAlt, PROJECT_MEDIA_FALLBACK_QUERY);

  return {
    reference: resolved.reference,
    query: resolved.src,
    alt: resolved.alt,
  };
}

export function resolveProjectGalleryMedia(project: Pick<Project, 'images' | 'title' | 'imageAlt' | 'featuredImage' | 'mainImage'>): ResolvedProjectMedia[] {
  const fallback = resolveProjectFeaturedImage(project);
  const gallery = project.images.length > 0 ? project.images : [fallback.reference];

  return gallery.map((reference) => {
    const resolved = resolveAssetReference(reference, project.imageAlt || project.title || 'Projet SMOVE', PROJECT_MEDIA_FALLBACK_QUERY);
    return {
      reference: resolved.reference,
      query: resolved.src,
      alt: resolved.alt,
    };
  });
}
