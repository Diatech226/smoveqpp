import { describe, expect, it } from 'vitest';
import { resolveHeroBackgroundItems, nextHeroBackgroundIndex, shouldAutoplayHeroBackground } from './heroBackground';

describe('hero background model', () => {
  it('resolves a single media item for hero rendering', () => {
    const resolved = resolveHeroBackgroundItems([
      { id: 'slide-1', label: 'Main', media: 'https://cdn.example.com/hero-1.jpg', alt: 'Main hero', overlayOpacity: 0.3, focalPoint: 'center' },
    ]);

    expect(resolved).toHaveLength(1);
    expect(resolved[0].src).toContain('hero-1.jpg');
    expect(resolved[0].isValid).toBe(true);
  });

  it('resolves multiple items and keeps invalid media as safe fallback instead of blank', () => {
    const resolved = resolveHeroBackgroundItems([
      { id: 'slide-1', label: 'Valid', media: 'https://cdn.example.com/hero-1.jpg', alt: 'Hero 1', overlayOpacity: 0.2, focalPoint: 'center' },
      { id: 'slide-2', label: 'Invalid', media: 'media:unknown', alt: 'Hero 2', overlayOpacity: 0.5, focalPoint: 'top' },
      { id: 'slide-3', label: 'Valid 2', media: 'https://cdn.example.com/hero-2.jpg', alt: 'Hero 3', overlayOpacity: 0.4, focalPoint: 'bottom' },
    ]);

    expect(resolved).toHaveLength(3);
    expect(resolved[1].isValid).toBe(false);
    expect(resolved[1].src.startsWith('data:image/svg+xml')).toBe(true);
  });

  it('computes autoplay and index rotation behavior', () => {
    expect(shouldAutoplayHeroBackground(true, true, 2)).toBe(true);
    expect(shouldAutoplayHeroBackground(true, false, 2)).toBe(false);
    expect(shouldAutoplayHeroBackground(true, true, 1)).toBe(false);
    expect(nextHeroBackgroundIndex(0, 3)).toBe(1);
    expect(nextHeroBackgroundIndex(2, 3)).toBe(0);
  });
});
