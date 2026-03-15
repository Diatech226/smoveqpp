import { describe, expect, it } from 'vitest';
import type { Project } from '../../domain/contentSchemas';
import { toProjectCardContract } from './projectCardAdapter';
import { PROJECT_MEDIA_FALLBACK_QUERY, resolveProjectFeaturedImage, toProjectMediaReference } from './projectMedia';
import { mediaRepository } from '../../repositories/mediaRepository';

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

  it('resolves media references to concrete asset url for public cards', () => {
    mediaRepository.save({
      id: 'project-asset-1',
      name: 'project-cover.jpg',
      type: 'image',
      url: 'data:image/png;base64,project123',
      thumbnailUrl: 'data:image/png;base64,project123',
      size: 128,
      uploadedDate: new Date().toISOString(),
      uploadedBy: 'editor',
      alt: 'Couverture projet',
      caption: 'Visuel projet',
      tags: [],
    });

    const card = toProjectCardContract({
      ...baseProject,
      featuredImage: toProjectMediaReference('project-asset-1'),
    });

    expect(card.mediaQuery).toBe('data:image/png;base64,project123');
    expect(card.mediaAlt).toBe('Couverture projet');
  });

});
