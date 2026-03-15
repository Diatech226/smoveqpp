import { describe, expect, it } from 'vitest';
import type { Project } from '../../domain/contentSchemas';
import { toProjectCardContract } from './projectCardAdapter';
import { PROJECT_MEDIA_FALLBACK_QUERY, resolveProjectFeaturedImage } from './projectMedia';

const baseProject: Project = {
  id: 'project-1',
  title: 'Projet Démo',
  slug: 'projet-demo',
  summary: 'Résumé court',
  client: 'Client Démo',
  category: 'Web',
  year: '2026',
  description: 'Description longue',
  challenge: 'Challenge',
  solution: 'Solution',
  results: [],
  tags: ['react'],
  mainImage: 'legacy cover image',
  featuredImage: 'modern project cover',
  imageAlt: 'Visuel projet',
  images: [],
  status: 'published',
};

describe('projectCardAdapter', () => {
  it('builds deterministic card contract and prioritizes explicit featured media', () => {
    const card = toProjectCardContract(baseProject);

    expect(card.id).toBe('project-1');
    expect(card.slug).toBe('projet-demo');
    expect(card.mediaQuery).toBe('modern project cover');
    expect(card.mediaAlt).toBe('Visuel projet');
    expect(card.summary).toBe('Résumé court');
  });



  it('uses description fallback when summary is missing for project cards', () => {
    const card = toProjectCardContract({ ...baseProject, summary: '', featuredImage: '' });

    expect(card.summary).toBe('Description longue');
    expect(card.mediaQuery).toBe('legacy cover image');
  });

  it('uses safe fallback for legacy payloads missing explicit featured image', () => {
    const media = resolveProjectFeaturedImage({
      featuredImage: '',
      mainImage: '',
      title: '',
      imageAlt: '',
    });

    expect(media.query).toBe(PROJECT_MEDIA_FALLBACK_QUERY);
    expect(media.alt).toBe('Projet SMOVE');
  });
});
