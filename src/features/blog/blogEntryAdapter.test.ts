import { describe, expect, it } from 'vitest';
import { evaluatePublishability, fromCmsBlogInput, normalizeSlug, toCanonicalBlogEntry } from './blogEntryAdapter';
import { defaultBlogPosts } from '../../data/blogSeed';
import { toMediaReference } from './mediaReference';
import { mediaRepository } from '../../repositories/mediaRepository';

describe('blogEntryAdapter', () => {
  it('normalizes slugs deterministically', () => {
    expect(normalizeSlug('  Création !! Site WEB  ')).toBe('creation-site-web');
  });

  it('builds a canonical entry with safe SEO defaults', () => {
    const canonical = toCanonicalBlogEntry({
      ...defaultBlogPosts[0],
      slug: '',
      title: '',
    });

    expect(canonical.slug).toBe('article-sans-titre');
    expect(canonical.seo.canonicalSlug).toBe(canonical.slug);
    expect(canonical.seo.title.length).toBeGreaterThan(0);
  });

  it('maps cms form payload to strict BlogPost schema', () => {
    const result = fromCmsBlogInput({
      title: '  Nouveau billet  ',
      slug: 'nouveau billet',
      excerpt: '',
      content: 'Contenu principal',
      author: 'Alice',
      category: 'News',
      status: 'draft',
    });

    expect(result.title).toBe('Nouveau billet');
    expect(result.slug).toBe('nouveau-billet');
    expect(result.excerpt).toContain('Contenu principal');
    expect(result.status).toBe('draft');
    expect(result.seo?.canonicalSlug).toBe('nouveau-billet');
  });



  it('preserves explicit social image and publication date from CMS payload', () => {
    const result = fromCmsBlogInput({
      title: 'Publication programmée',
      slug: 'publication-programmee',
      excerpt: 'Résumé',
      content: 'Contenu',
      author: 'Alice',
      category: 'News',
      status: 'in_review',
      publishedDate: '2026-03-02T10:30:00.000Z',
      featuredImage: 'featured image',
      socialImage: 'social image',
    });

    expect(result.publishedDate).toBe('2026-03-02T10:30:00.000Z');
    expect(result.seo?.socialImage).toBe('social image');
    expect(result.featuredImage).toBe('featured image');
  });

  it('maps CMS tags string into canonical tag array', () => {
    const result = fromCmsBlogInput({
      title: 'Article tags',
      slug: 'article-tags',
      excerpt: 'Résumé',
      content: 'Contenu',
      author: 'Alice',
      category: 'News',
      tags: 'react, cms,  vite ',
      featuredImage: 'hero image',
      status: 'draft',
    });

    expect(result.tags).toEqual(['react', 'cms', 'vite']);
    expect(result.featuredImage).toBe('hero image');
  });
  it('resolves media references through repository assets when available', () => {
    mediaRepository.save({
      id: 'asset-1',
      name: 'cover.jpg',
      type: 'image',
      url: 'data:image/png;base64,abc',
      thumbnailUrl: 'data:image/png;base64,abc',
      size: 100,
      uploadedDate: new Date().toISOString(),
      uploadedBy: 'editor',
      alt: 'Couverture article',
      caption: 'Visuel de couverture',
      tags: [],
    });

    const canonical = toCanonicalBlogEntry({
      ...defaultBlogPosts[0],
      featuredImage: toMediaReference('asset-1'),
    });

    expect(canonical.featuredImage).toBe('data:image/png;base64,abc');
    expect(canonical.media.alt).toBe('Couverture article');
  });


  it('flags non-published entries as not publishable', () => {
    const evaluation = evaluatePublishability(
      toCanonicalBlogEntry({
        ...defaultBlogPosts[0],
        status: 'archived',
      }),
    );

    expect(evaluation.publishable).toBe(false);
    expect(evaluation.reasons).toContain('status_not_published');
  });
});
