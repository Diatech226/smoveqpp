import { describe, expect, it } from 'vitest';
import {
  isHttpUrl,
  isValidContentHref,
  isValidMediaFieldValue,
  isValidSlug,
  mediaIdFromReference,
  normalizeSlug,
} from './contentContracts';

describe('shared content contracts', () => {
  it('normalizes slugs deterministically for routing compatibility', () => {
    expect(normalizeSlug('  Création !! Site WEB  ', undefined, 'fallback')).toBe('creation-site-web');
    expect(normalizeSlug('', 'Titre de fallback', 'fallback')).toBe('titre-de-fallback');
    expect(normalizeSlug('###', undefined, 'article-sans-titre')).toBe('article-sans-titre');
  });

  it('validates slug format safely', () => {
    expect(isValidSlug('service-route')).toBe(true);
    expect(isValidSlug('bad route')).toBe(false);
    expect(isValidSlug('UPPER')).toBe(false);
  });

  it('validates url and href contracts consistently', () => {
    expect(isHttpUrl('https://example.com')).toBe(true);
    expect(isHttpUrl('ftp://example.com')).toBe(false);
    expect(isValidContentHref('#contact')).toBe(true);
    expect(isValidContentHref('/contact')).toBe(true);
    expect(isValidContentHref('https://example.com/contact')).toBe(true);
    expect(isValidContentHref('javascript:alert(1)')).toBe(false);
  });

  it('parses and validates media references with optional resolvers', () => {
    expect(mediaIdFromReference('media:asset-1')).toBe('asset-1');
    expect(isValidMediaFieldValue('media:asset-1')).toBe(true);
    expect(isValidMediaFieldValue('media:asset-1', { hasMediaById: (id) => id === 'asset-1' })).toBe(true);
    expect(isValidMediaFieldValue('media:missing', { hasMediaById: () => false })).toBe(false);
    expect(isValidMediaFieldValue('plain-text-image', { allowInlineText: true })).toBe(true);
  });
});
