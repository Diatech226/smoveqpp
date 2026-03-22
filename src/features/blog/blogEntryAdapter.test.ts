import { describe, expect, it } from 'vitest';
import { evaluatePublishability, fromCmsBlogInput, fromCmsBlogInputWithExisting, normalizeSlug, toCanonicalBlogEntry } from './blogEntryAdapter';
import { defaultBlogPosts } from '../../data/blogSeed';
import { toMediaReference } from './mediaReference';
import { mediaRepository } from '../../repositories/mediaRepository';

describe('blogEntryAdapter', () => {
  it('normalizes slugs deterministically', () => {
    expect(normalizeSlug('  Création !! Site WEB  ')).toBe('creation-site-web');
  });

  it('deduplicates tags from CMS comma-separated input', () => {
    const post = fromCmsBlogInput({
      title: 'Tag test',
      slug: 'tag-test',
      excerpt: 'excerpt',
      content: 'content',
      author: 'author',
      category: 'Branding',
      tags: 'React, react, CMS',
      status: 'draft',
    });

    expect(post.tags).toEqual(['React', 'CMS']);
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


  it('falls back social image to featured role when social role is missing', () => {
    const canonical = toCanonicalBlogEntry({
      ...defaultBlogPosts[0],
      seo: { ...defaultBlogPosts[0].seo, socialImage: '' },
      mediaRoles: {
        featuredImage: 'role-featured-image',
      },
    });

    expect(canonical.featuredImage).toBe('role-featured-image');
    expect(canonical.seo.socialImage).toBe('role-featured-image');
  });

  it('uses deterministic featured media precedence for rendering (featured > cover > card > legacy)', () => {
    const canonical = toCanonicalBlogEntry({
      ...defaultBlogPosts[0],
      featuredImage: 'legacy-image',
      mediaRoles: {
        coverImage: 'cover-image',
        cardImage: 'card-image',
      },
    });

    expect(canonical.featuredImage).toBe('cover-image');
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
    expect(result.mediaRoles?.featuredImage).toBe('blog article image');
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

  it('hydrates legacy role images when updating an existing blog article', () => {
    const existing = {
      ...defaultBlogPosts[0],
      featuredImage: '',
      images: ['legacy-inline-image'],
      mediaRoles: {
        coverImage: 'legacy-cover-image',
        socialImage: 'legacy-social-image',
      },
    };
    const updated = fromCmsBlogInputWithExisting(
      {
        id: existing.id,
        title: existing.title,
        slug: existing.slug,
        excerpt: existing.excerpt,
        content: existing.content,
        author: existing.author,
        category: existing.category,
        status: 'draft',
      },
      existing,
    );

    expect(updated.featuredImage).toBe('legacy-cover-image');
    expect(updated.seo?.socialImage).toBe('legacy-social-image');
    expect(updated.images).toEqual(['legacy-cover-image', 'legacy-inline-image']);
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



  it('treats published entries with title + image as renderable even when optional metadata is empty', () => {
    const evaluation = evaluatePublishability(
      toCanonicalBlogEntry({
        ...defaultBlogPosts[0],
        title: 'Minimal',
        slug: 'minimal',
        excerpt: '',
        content: '',
        author: '',
        category: '',
        featuredImage: 'minimal featured image',
        status: 'published',
      }),
    );

    expect(evaluation.publishable).toBe(true);
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
