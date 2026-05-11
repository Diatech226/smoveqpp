import { describe, expect, it } from 'vitest';
import { evaluateBlogEditorialReadiness } from './blogEditorialContract';

const validDraft = {
  title: 'Article test',
  slug: 'article-test',
  excerpt: 'Résumé complet',
  content: 'Contenu complet',
  featuredImage: 'https://example.com/image.jpg',
  publishedDate: '2026-03-22T00:00:00.000Z',
  seoTitle: 'SEO title',
  seoDescription: 'SEO description',
  canonicalSlug: 'article-test',
  tags: 'React, CMS',
};

describe('blogEditorialContract', () => {
  it('returns no blockers for publish-ready payload', () => {
    const readiness = evaluateBlogEditorialReadiness(validDraft, {
      isValidMediaField: () => true,
      managedTags: ['React', 'CMS'],
      enforceManagedTags: true,
    });

    expect(readiness.blockers).toHaveLength(0);
    expect(readiness.warnings).toHaveLength(0);
  });

  it('flags publish blockers for missing title/slug/image/date', () => {
    const readiness = evaluateBlogEditorialReadiness(
      {
        ...validDraft,
        title: '',
        slug: '***',
        featuredImage: '',
        publishedDate: 'invalid',
      },
      {
        isValidMediaField: () => true,
        managedTags: ['React', 'CMS'],
        enforceManagedTags: true,
      },
    );

    expect(readiness.blockers).toEqual(
      expect.arrayContaining([
        'Titre manquant.',
        'Slug invalide (mots-separes-par-tirets).',
        'Image vedette manquante.',
        'Date de publication invalide.',
      ]),
    );
  });

  it('warns for missing detail/seo and non-managed tags without blocking save', () => {
    const readiness = evaluateBlogEditorialReadiness(
      {
        ...validDraft,
        excerpt: '',
        content: '',
        seoTitle: '',
        tags: 'React, UnknownTag',
      },
      {
        isValidMediaField: () => true,
        managedTags: ['React', 'CMS'],
        enforceManagedTags: true,
      },
    );

    expect(readiness.blockers).toHaveLength(0);
    expect(readiness.warnings).toEqual(
      expect.arrayContaining([
        'Résumé absent: les cartes publiques perdront du contexte.',
        'Contenu détaillé absent: la page détail sera vide.',
        'SEO incomplet (title/description/canonicalSlug).',
        'Tags hors taxonomie gérée: UnknownTag.',
      ]),
    );
  });
});
