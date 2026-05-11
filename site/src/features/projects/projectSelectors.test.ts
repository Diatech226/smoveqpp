import { describe, expect, it } from 'vitest';
import type { Project } from '../../domain/contentSchemas';
import { selectPublishedProjects } from './projectSelectors';

const makeProject = (id: string, status: Project['status']): Project => ({
  id,
  title: id,
  slug: id,
  summary: 'Résumé projet',
  client: 'Client',
  category: 'Web',
  year: '2026',
  description: 'Description projet',
  challenge: 'Challenge projet',
  solution: 'Solution projet',
  results: ['Result'],
  tags: ['tag'],
  mainImage: 'project image',
  images: ['project image'],
  status,
});

describe('selectPublishedProjects', () => {
  it('returns only published entries and preserves order', () => {
    const selected = selectPublishedProjects([
      makeProject('project-1', 'in_review'),
      makeProject('project-2', 'published'),
      makeProject('project-3', 'draft'),
      makeProject('project-4', 'published'),
      makeProject('project-5', 'archived'),
    ]);

    expect(selected.map((entry) => entry.id)).toEqual(['project-2', 'project-4']);
  });
});

