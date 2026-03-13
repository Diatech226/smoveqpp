import { describe, expect, it } from 'vitest';
import { fromCmsBlogInput, normalizeSlug, toCanonicalBlogEntry } from './blogEntryAdapter';
import { defaultBlogPosts } from '../../data/blogSeed';

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
  });
});
