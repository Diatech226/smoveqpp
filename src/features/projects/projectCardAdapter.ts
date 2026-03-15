import type { Project } from '../../domain/contentSchemas';
import { resolveProjectFeaturedImage } from './projectMedia';

export interface ProjectCardContract {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  year: string;
  client: string;
  tags: string[];
  mediaQuery: string;
  mediaAlt: string;
}

const normalizeSlug = (value: string, fallback: string): string =>
  (value || fallback)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export function toProjectCardContract(project: Project): ProjectCardContract {
  const media = resolveProjectFeaturedImage(project);
  const title = project.title.trim() || 'Projet sans titre';

  return {
    id: project.id,
    slug: normalizeSlug(project.slug || '', title) || `project-${project.id}`,
    title,
    summary: project.summary?.trim() || project.description.trim() || 'Description à venir.',
    category: project.category.trim() || 'Non classé',
    year: project.year.trim() || 'N/A',
    client: project.client.trim() || 'Client confidentiel',
    tags: project.tags.filter((tag) => tag.trim().length > 0),
    mediaQuery: media.query,
    mediaAlt: media.alt,
  };
}
