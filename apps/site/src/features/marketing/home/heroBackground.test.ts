import { describe, expect, it } from 'vitest';
import { resolveHeroBackgroundItems, nextHeroBackgroundIndex, shouldAutoplayHeroBackground } from './heroBackground';

describe('hero background model', () => {
  it('resolves a single media item for hero rendering', () => {
    const resolved = resolveHeroBackgroundItems([
      { id: 'slide-1', label: 'Main', type: 'image', media: 'https://cdn.example.com/hero-1.jpg', desktopMedia: '', tabletMedia: '', mobileMedia: '', videoMedia: '', alt: 'Main hero', overlayColor: '#04111f', overlayOpacity: 0.3, position: 'center', size: 'cover', enableParallax: true, enable3DEffects: true },
    ]);

    expect(resolved).toHaveLength(1);
    expect(resolved[0].desktopSrc).toContain('hero-1.jpg');
    expect(resolved[0].isValid).toBe(true);
  });

  it('resolves multiple items and keeps invalid media as safe fallback instead of blank', () => {
    const resolved = resolveHeroBackgroundItems([
      { id: 'slide-1', label: 'Valid', type: 'image', media: 'https://cdn.example.com/hero-1.jpg', desktopMedia: '', tabletMedia: '', mobileMedia: '', videoMedia: '', alt: 'Hero 1', overlayColor: '#04111f', overlayOpacity: 0.2, position: 'center', size: 'cover', enableParallax: true, enable3DEffects: true },
      { id: 'slide-2', label: 'Invalid', type: 'image', media: 'media:unknown', desktopMedia: '', tabletMedia: '', mobileMedia: '', videoMedia: '', alt: 'Hero 2', overlayColor: '#04111f', overlayOpacity: 0.5, position: 'top', size: 'cover', enableParallax: true, enable3DEffects: true },
      { id: 'slide-3', label: 'Valid 2', type: 'image', media: 'https://cdn.example.com/hero-2.jpg', desktopMedia: '', tabletMedia: '', mobileMedia: '', videoMedia: '', alt: 'Hero 3', overlayColor: '#04111f', overlayOpacity: 0.4, position: 'bottom', size: 'cover', enableParallax: true, enable3DEffects: true },
    ]);

    expect(resolved).toHaveLength(3);
    expect(resolved[1].isValid).toBe(false);
    expect(resolved[1].desktopSrc.startsWith('data:image/svg+xml')).toBe(true);
  });

  it('computes autoplay and index rotation behavior', () => {
    expect(shouldAutoplayHeroBackground(true, true, 2)).toBe(true);
    expect(shouldAutoplayHeroBackground(true, false, 2)).toBe(false);
    expect(shouldAutoplayHeroBackground(true, true, 1)).toBe(false);
    expect(nextHeroBackgroundIndex(0, 3)).toBe(1);
    expect(nextHeroBackgroundIndex(2, 3)).toBe(0);
  });

  it('resolves responsive sources with fallback chaining', () => {
    const resolved = resolveHeroBackgroundItems([
      {
        id: 'slide-r',
        label: 'Responsive',
        type: 'image',
        media: 'https://cdn.example.com/base.jpg',
        desktopMedia: 'https://cdn.example.com/desktop.jpg',
        tabletMedia: 'https://cdn.example.com/tablet.jpg',
        mobileMedia: 'https://cdn.example.com/mobile.jpg',
        videoMedia: '',
        alt: 'Responsive hero',
        overlayColor: '#000000',
        overlayOpacity: 0.4,
        position: 'center',
        size: 'cover',
        enableParallax: true,
        enable3DEffects: true,
      },
    ]);

    expect(resolved[0].desktopSrc).toContain('desktop.jpg');
    expect(resolved[0].tabletSrc).toContain('tablet.jpg');
    expect(resolved[0].mobileSrc).toContain('mobile.jpg');
  });
});
