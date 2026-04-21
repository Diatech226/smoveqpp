import { describe, expect, it } from 'vitest';
import {
  nextHeroBackgroundIndex,
  normalizeHeroBackgroundIntervalMs,
  previousHeroBackgroundIndex,
  resolveHeroBackgroundItems,
  shouldAutoplayHeroBackground,
} from './heroBackground';
import { mediaRepository } from '../../../repositories/mediaRepository';

describe('hero background model', () => {
  it('resolves a single media item for hero rendering', () => {
    const resolved = resolveHeroBackgroundItems([
      { id: 'slide-1', sortOrder: 0, label: 'Main', title: '', description: '', ctaLabel: '', ctaHref: '', type: 'image', media: 'https://cdn.example.com/hero-1.jpg', desktopMedia: '', tabletMedia: '', mobileMedia: '', videoMedia: '', alt: 'Main hero', overlayColor: '#04111f', overlayOpacity: 0.3, position: 'center', size: 'cover', enableParallax: true, enable3DEffects: true },
    ]);

    expect(resolved).toHaveLength(1);
    expect(resolved[0].desktopSrc).toContain('hero-1.jpg');
    expect(resolved[0].isValid).toBe(true);
  });

  it('resolves multiple items and keeps invalid media as safe fallback instead of blank', () => {
    const resolved = resolveHeroBackgroundItems([
      { id: 'slide-1', sortOrder: 0, label: 'Valid', title: '', description: '', ctaLabel: '', ctaHref: '', type: 'image', media: 'https://cdn.example.com/hero-1.jpg', desktopMedia: '', tabletMedia: '', mobileMedia: '', videoMedia: '', alt: 'Hero 1', overlayColor: '#04111f', overlayOpacity: 0.2, position: 'center', size: 'cover', enableParallax: true, enable3DEffects: true },
      { id: 'slide-2', sortOrder: 1, label: 'Invalid', title: '', description: '', ctaLabel: '', ctaHref: '', type: 'image', media: 'media:unknown', desktopMedia: '', tabletMedia: '', mobileMedia: '', videoMedia: '', alt: 'Hero 2', overlayColor: '#04111f', overlayOpacity: 0.5, position: 'top', size: 'cover', enableParallax: true, enable3DEffects: true },
      { id: 'slide-3', sortOrder: 2, label: 'Valid 2', title: '', description: '', ctaLabel: '', ctaHref: '', type: 'image', media: 'https://cdn.example.com/hero-2.jpg', desktopMedia: '', tabletMedia: '', mobileMedia: '', videoMedia: '', alt: 'Hero 3', overlayColor: '#04111f', overlayOpacity: 0.4, position: 'bottom', size: 'cover', enableParallax: true, enable3DEffects: true },
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
    expect(previousHeroBackgroundIndex(0, 3)).toBe(2);
    expect(previousHeroBackgroundIndex(1, 3)).toBe(0);
    expect(normalizeHeroBackgroundIntervalMs(1000)).toBe(2000);
    expect(normalizeHeroBackgroundIntervalMs(4500)).toBe(4500);
    expect(normalizeHeroBackgroundIntervalMs(45000)).toBe(30000);
  });

  it('resolves responsive sources with fallback chaining', () => {
    const resolved = resolveHeroBackgroundItems([
      {
        id: 'slide-r',
        sortOrder: 0,
        label: 'Responsive',
        title: '',
        description: '',
        ctaLabel: '',
        ctaHref: '',
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

  it('resolves media library references when the public media catalog is synced', () => {
    mediaRepository.replaceAll([
      {
        id: 'hero-library-1',
        name: 'hero-library-1.jpg',
        type: 'image',
        url: 'https://cdn.example.com/hero-library-1.jpg',
        thumbnailUrl: 'https://cdn.example.com/hero-library-1-thumb.jpg',
        size: 12345,
        uploadedDate: '2026-04-17T00:00:00.000Z',
        uploadedBy: 'cms',
        alt: 'Hero media from library',
        tags: [],
      },
    ]);

    const resolved = resolveHeroBackgroundItems([
      { id: 'slide-lib', sortOrder: 0, label: 'Library', title: '', description: '', ctaLabel: '', ctaHref: '', type: 'image', media: 'media:hero-library-1', desktopMedia: '', tabletMedia: '', mobileMedia: '', videoMedia: '', alt: '', overlayColor: '#04111f', overlayOpacity: 0.4, position: 'center', size: 'cover', enableParallax: true, enable3DEffects: true },
    ]);

    expect(resolved).toHaveLength(1);
    expect(resolved[0].isValid).toBe(true);
    expect(resolved[0].desktopSrc).toContain('hero-library-1.jpg');
  });

  it('falls back to safe overlay opacity when incoming content is malformed', () => {
    const resolved = resolveHeroBackgroundItems([
      {
        id: 'slide-malformed-overlay',
        sortOrder: 0,
        label: 'Malformed overlay',
        title: '',
        description: '',
        ctaLabel: '',
        ctaHref: '',
        type: 'image',
        media: 'https://cdn.example.com/hero-safe.jpg',
        desktopMedia: '',
        tabletMedia: '',
        mobileMedia: '',
        videoMedia: '',
        alt: 'Safe hero',
        overlayColor: '#04111f',
        overlayOpacity: Number.NaN,
        position: 'center',
        size: 'cover',
        enableParallax: true,
        enable3DEffects: true,
      },
    ]);

    expect(resolved).toHaveLength(1);
    expect(resolved[0].overlayOpacity).toBe(0.45);
  });

  it('does not treat document assets as valid hero background images', () => {
    mediaRepository.replaceAll([
      {
        id: 'hero-doc-1',
        name: 'hero-doc.pdf',
        type: 'document',
        url: 'https://cdn.example.com/hero-doc.pdf',
        size: 123,
        uploadedDate: '2026-04-20T00:00:00.000Z',
        uploadedBy: 'cms',
        tags: [],
      },
    ]);

    const resolved = resolveHeroBackgroundItems([
      { id: 'slide-doc', sortOrder: 0, label: 'Doc', title: '', description: '', ctaLabel: '', ctaHref: '', type: 'image', media: 'media:hero-doc-1', desktopMedia: '', tabletMedia: '', mobileMedia: '', videoMedia: '', alt: '', overlayColor: '#04111f', overlayOpacity: 0.4, position: 'center', size: 'cover', enableParallax: true, enable3DEffects: true },
    ]);

    expect(resolved).toHaveLength(1);
    expect(resolved[0].isValid).toBe(false);
  });

  it('keeps video slides renderable when image sources are absent', () => {
    mediaRepository.replaceAll([
      {
        id: 'hero-video-1',
        name: 'hero-video.mp4',
        type: 'video',
        url: 'https://cdn.example.com/hero-video.mp4',
        size: 1024,
        uploadedDate: '2026-04-21T00:00:00.000Z',
        uploadedBy: 'cms',
        tags: [],
      },
    ]);

    const resolved = resolveHeroBackgroundItems([
      {
        id: 'slide-video-only',
        sortOrder: 0,
        label: 'Video only',
        title: '',
        description: '',
        ctaLabel: '',
        ctaHref: '',
        type: 'video',
        media: '',
        desktopMedia: '',
        tabletMedia: '',
        mobileMedia: '',
        videoMedia: 'media:hero-video-1',
        alt: 'Video hero',
        overlayColor: '#04111f',
        overlayOpacity: 0.4,
        position: 'center',
        size: 'cover',
        enableParallax: true,
        enable3DEffects: true,
      },
    ]);

    expect(resolved).toHaveLength(1);
    expect(resolved[0].type).toBe('video');
    expect(resolved[0].videoSrc).toContain('hero-video.mp4');
  });
});
