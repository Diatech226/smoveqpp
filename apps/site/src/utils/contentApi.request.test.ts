import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchPublicBlogPosts,
  fetchPublicSettings,
  saveBackendBlogPost,
} from './contentApi';

const okEnvelope = (data: unknown) => ({
  success: true,
  data,
});

describe('contentApi cache strategy', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses no-store for public reads to avoid stale CMS/site drift', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => okEnvelope({ posts: [] }),
    } as Response);

    await fetchPublicBlogPosts();

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init?.cache).toBe('no-store');
  });

  it('uses no-store for public settings reads', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => okEnvelope({ settings: { siteSettings: { siteTitle: 'SMOVE', supportEmail: 'a@b.com', brandMedia: {} } } }),
    } as Response);

    await fetchPublicSettings();

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init?.cache).toBe('no-store');
  });

  it('uses no-store for authenticated mutations to bypass intermediary caches', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => okEnvelope({ post: { id: '1' } }),
    } as Response);

    await saveBackendBlogPost({
      id: '1',
      title: 'Post',
      slug: 'post',
      excerpt: 'Excerpt',
      content: 'Content',
      author: 'Author',
      authorRole: 'Author',
      category: 'Cat',
      tags: [],
      publishedDate: '2026-01-01',
      readTime: '2 min',
      featuredImage: 'https://cdn.example.com/image.jpg',
      images: [],
      status: 'draft',
      seo: { title: 'Post', description: 'Desc', canonicalSlug: 'post', socialImage: 'https://cdn.example.com/image.jpg' },
      mediaRoles: {},
      media: { alt: '', caption: '' },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    } as never);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init?.cache).toBe('no-store');
  });
});
