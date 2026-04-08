import { describe, expect, it } from 'vitest';
import { resolveAssetReference, resolveCanonicalMedia, resolveRenderableMediaUrl } from './assetReference';
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

  it('rewrites root-relative and relative media URLs to API origin when runtime base is absolute', () => {
    expect(resolveRenderableMediaUrl('/uploads/2026/04/hero.jpg', 'https://api.smove.example/api/v1')).toBe('https://api.smove.example/uploads/2026/04/hero.jpg');
    expect(resolveRenderableMediaUrl('uploads/2026/04/hero.jpg', 'https://api.smove.example/api/v1')).toBe('https://api.smove.example/uploads/2026/04/hero.jpg');
  });

  it('never returns raw media references as img src when asset is missing', () => {
    mediaRepository.replaceAll([]);

    const resolved = resolveAssetReference('media:missing-asset', 'Fallback alt', 'fallback image');
    expect(resolved.src.startsWith('data:image/svg+xml')).toBe(true);
    expect(resolved.src.startsWith('media:')).toBe(false);
    expect(resolved.isFallback).toBe(true);
  });

  it('fails safely when a media reference points to an archived media asset', () => {
    mediaRepository.replaceAll([
      {
        id: 'asset-archived',
        name: 'archived.jpg',
        type: 'image',
        url: 'https://cdn.example.com/archived.jpg',
        thumbnailUrl: 'https://cdn.example.com/archived.jpg',
        size: 2048,
        uploadedDate: new Date().toISOString(),
        uploadedBy: 'cms',
        alt: 'Archived alt',
        caption: 'Archived caption',
        tags: [],
        archivedAt: '2026-03-24T10:00:00.000Z',
      },
    ]);

    const resolved = resolveAssetReference('media:asset-archived', 'Fallback alt', 'fallback image');
    expect(resolved.src.startsWith('data:image/svg+xml')).toBe(true);
    expect(resolved.isFallback).toBe(true);
    expect(resolved.mediaState).toBe('archived');
  });

  it('returns canonical media payload with deterministic validity flag', () => {
    const resolved = resolveCanonicalMedia('', 'Fallback alt');
    expect(resolved.isValid).toBe(false);
    expect(resolved.url.startsWith('data:image/svg+xml')).toBe(true);
  });
});
