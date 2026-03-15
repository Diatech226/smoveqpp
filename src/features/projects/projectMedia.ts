import type { Project } from '../../domain/contentSchemas';

export const PROJECT_MEDIA_FALLBACK_QUERY = 'project cover image';

const asTrimmed = (value?: string): string => (typeof value === 'string' ? value.trim() : '');

export interface ResolvedProjectMedia {
  reference: string;
  query: string;
  alt: string;
}

export function resolveProjectFeaturedImage(project: Pick<Project, 'featuredImage' | 'mainImage' | 'title' | 'imageAlt'>): ResolvedProjectMedia {
  const reference = asTrimmed(project.featuredImage) || asTrimmed(project.mainImage) || PROJECT_MEDIA_FALLBACK_QUERY;

  return {
    reference,
    query: reference,
    alt: asTrimmed(project.imageAlt) || asTrimmed(project.title) || 'Projet SMOVE',
  };
}
