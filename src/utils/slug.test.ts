import { describe, expect, it } from 'vitest';
import { generateUniqueSlug, slugify } from './slug';

describe('slug utils', () => {
  it('normalizes accents and symbols', () => {
    expect(slugify('  Création de Site !! ')).toBe('creation-de-site');
  });

  it('resolves conflicts with incremental suffix and excludeId', () => {
    const items = [
      { id: '1', slug: 'article' },
      { id: '2', slug: 'article-2' },
    ];

    expect(generateUniqueSlug(items, 'article')).toBe('article-3');
    expect(generateUniqueSlug(items, 'article', { excludeId: '1' })).toBe('article');
  });

  it('honors locked slug mode', () => {
    const items = [{ id: '1', slug: 'same' }];
    expect(generateUniqueSlug(items, 'same', { lockSlug: true })).toBe('same');
  });
});
