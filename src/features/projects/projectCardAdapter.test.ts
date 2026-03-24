import { describe, expect, it } from 'vitest';
import type { Project } from '../../domain/contentSchemas';
import { toProjectCardContract } from './projectCardAdapter';
import { PROJECT_MEDIA_FALLBACK_QUERY, resolveProjectFeaturedImage, resolveProjectGalleryMedia, resolveProjectHeroMedia, toCanonicalProjectMediaRoles, toProjectMediaReference } from './projectMedia';
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
    expect(card.mediaSrc).toBe('modern project cover');
    expect(card.mediaAlt).toBe('Visuel projet');
    expect(card.summary).toBe('Résumé court');
  });




  it('normalizes canonical project media roles with backward-compatible fallbacks', () => {
    const roles = toCanonicalProjectMediaRoles({
      featuredImage: 'legacy-card',
      mainImage: 'legacy-hero',
      images: ['legacy-gallery'],
      seo: { socialImage: 'seo-social' },
      mediaRoles: {
        cardImage: 'role-card',
        heroImage: 'role-hero',
        socialImage: 'role-social',
        galleryImages: ['role-gallery-1', 'role-gallery-2'],
      },
    });

    expect(roles.cardImage).toBe('role-card');
    expect(roles.heroImage).toBe('role-hero');
    expect(roles.socialImage).toBe('role-social');
    expect(roles.galleryImages).toEqual(['role-gallery-1', 'role-gallery-2']);
  });

  it('uses role-driven fallback when only hero/cover role is provided', () => {
    const roles = toCanonicalProjectMediaRoles({
      featuredImage: '',
      mainImage: '',
      images: [],
      mediaRoles: {
        heroImage: 'role-hero-only',
      },
    });

    expect(roles.cardImage).toBe('role-hero-only');
    expect(roles.heroImage).toBe('role-hero-only');
  });

  it('prefers cover role as secondary hero source before legacy fields', () => {
    const roles = toCanonicalProjectMediaRoles({
      featuredImage: 'legacy-card',
      mainImage: 'legacy-main',
      images: [],
      mediaRoles: {
        coverImage: 'role-cover',
      },
    });

    expect(roles.heroImage).toBe('role-cover');
    expect(roles.cardImage).toBe('role-cover');
  });

  it('uses deterministic social fallback precedence (role social > seo social > card)', () => {
    const fromSeo = toCanonicalProjectMediaRoles({
      featuredImage: 'legacy-card',
      mainImage: 'legacy-hero',
      images: [],
      seo: { socialImage: 'seo-social' },
      mediaRoles: {},
    });
    const fromCard = toCanonicalProjectMediaRoles({
      featuredImage: 'legacy-card',
      mainImage: 'legacy-hero',
      images: [],
      mediaRoles: {},
    });

    expect(fromSeo.socialImage).toBe('seo-social');
    expect(fromCard.socialImage).toBe('legacy-card');
  });

  it('uses hero role for detail hero rendering when available', () => {
    const hero = resolveProjectHeroMedia({
      ...baseProject,
      mediaRoles: { cardImage: 'card-image', heroImage: 'hero-image', galleryImages: [] },
    });

    expect(hero.src).toBe('hero-image');
  });

  it('uses description fallback when summary is missing for project cards', () => {
    const card = toProjectCardContract({ ...baseProject, summary: '', featuredImage: '' });

    expect(card.summary).toBe('Description longue');
    expect(card.mediaSrc).toBe('legacy cover image');
  });

  it('uses safe fallback for legacy payloads missing explicit featured image', () => {
    const media = resolveProjectFeaturedImage({
      featuredImage: '',
      mainImage: '',
      title: '',
      imageAlt: '',
    });

    expect(media.src).toBe(PROJECT_MEDIA_FALLBACK_QUERY);
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

    expect(card.mediaSrc).toBe('data:image/png;base64,project123');
    expect(card.mediaAlt).toBe('Couverture projet');
  });

  it('resolves gallery media references into render-safe contracts', () => {
    mediaRepository.save({
      id: 'project-gallery-1',
      name: 'project-gallery.jpg',
      type: 'image',
      url: 'data:image/png;base64,gallery1',
      thumbnailUrl: 'data:image/png;base64,gallery1',
      size: 128,
      uploadedDate: new Date().toISOString(),
      uploadedBy: 'editor',
      alt: 'Galerie projet',
      caption: 'Galerie',
      tags: [],
    });

    const gallery = resolveProjectGalleryMedia({
      ...baseProject,
      images: [toProjectMediaReference('project-gallery-1'), 'manual fallback image'],
    });

    expect(gallery[0].src).toBe('data:image/png;base64,gallery1');
    expect(gallery[0].alt).toBe('Galerie projet');
    expect(gallery[1].src).toBe('manual fallback image');
  });

});
