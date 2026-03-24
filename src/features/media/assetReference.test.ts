import { describe, expect, it } from 'vitest';
import { resolveAssetReference } from './assetReference';
import { mediaRepository } from '../../repositories/mediaRepository';

describe('assetReference', () => {
  it('keeps direct URL references unchanged', () => {
    const resolved = resolveAssetReference('https://cdn.example.com/image.jpg', 'Example', 'fallback image');
    expect(resolved.src).toBe('https://cdn.example.com/image.jpg');
    expect(resolved.isFallback).toBe(false);
  });

  it('resolves media references when the asset exists', () => {
    mediaRepository.replaceAll([
      {
        id: 'asset-1',
        name: 'hero.jpg',
        type: 'image',
        url: 'https://cdn.example.com/hero.jpg',
        thumbnailUrl: 'https://cdn.example.com/hero.jpg',
        size: 1024,
        uploadedDate: new Date().toISOString(),
        uploadedBy: 'cms',
        alt: 'Hero alt',
        caption: 'Hero caption',
        tags: [],
      },
    ]);

    const resolved = resolveAssetReference('media:asset-1', 'Fallback alt', 'fallback image');
    expect(resolved.src).toBe('https://cdn.example.com/hero.jpg');
    expect(resolved.alt).toBe('Hero alt');
    expect(resolved.isFallback).toBe(false);
  });

  it('never returns raw media references as img src when asset is missing', () => {
    mediaRepository.replaceAll([]);

    const resolved = resolveAssetReference('media:missing-asset', 'Fallback alt', 'fallback image');
    expect(resolved.src).toBe('fallback image');
    expect(resolved.src.startsWith('media:')).toBe(false);
    expect(resolved.isFallback).toBe(true);
  });
});
