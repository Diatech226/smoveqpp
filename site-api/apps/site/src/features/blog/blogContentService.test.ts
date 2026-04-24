import { beforeEach, describe, expect, it, vi } from 'vitest';
import { blogRepository } from '../../repositories/blogRepository';
import { mediaRepository } from '../../repositories/mediaRepository';
import { toMediaReference } from './mediaReference';
import { getBlogContentContract, getBlogContentContractFromSource, getBlogPostBySlugContract } from './blogContentService';

class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

const localStorage = new MemoryStorage();

const toPublicMediaResponse = (mediaFiles: unknown[] = []) => ({
  ok: true,
  status: 200,
  json: async () => ({ success: true, data: { mediaFiles } }),
}) as Response;

const withPublicMediaBootstrap = (resolver: (url: string) => Response) =>
  vi.fn(async (input: RequestInfo | URL) => {
    const url = `${input}`;
    if (url.includes('/content/public/media')) {
      return toPublicMediaResponse();
    }
    return resolver(url);
  });

beforeEach(() => {
  localStorage.clear();
  mediaRepository.replaceAll([]);
  vi.restoreAllMocks();
  (globalThis as unknown as { window: Window }).window = {
    localStorage,
  } as unknown as Window;
});

describe('blogContentService', () => {
  it('exposes a canonical contract backed by published repository data', () => {
    const contract = getBlogContentContract();

    expect(contract.categories[0]).toBe('Tous');
    expect(contract.posts.length).toBeGreaterThan(0);
    expect(contract.posts.every((post) => post.slug.length > 0)).toBe(true);
    expect(contract.posts[0].seo.canonicalSlug).toBe(contract.posts[0].slug);
    expect(contract.posts[0].media.alt.length).toBeGreaterThan(0);
  });

  it('normalizes empty/whitespace categories to Non classé in public contract categories', () => {
    const seed = blogRepository.getAll()[0];
    blogRepository.save({ ...seed, id: 'cat-space', slug: 'cat-space', category: '   ', status: 'published' });
    const contract = getBlogContentContract();
    expect(contract.categories).toContain('Non classé');
  });

  it('orders posts deterministically by date then slug', () => {
    const seed = blogRepository.getAll()[0];

    blogRepository.save({ ...seed, id: 'order-b', slug: 'bbb-order', publishedDate: '2024-01-01', status: 'published' });
    blogRepository.save({ ...seed, id: 'order-a', slug: 'aaa-order', publishedDate: '2024-01-01', status: 'published' });

    const contract = getBlogContentContract();
    const a = contract.posts.findIndex((post) => post.slug === 'aaa-order');
    const b = contract.posts.findIndex((post) => post.slug === 'bbb-order');

    expect(a).toBeLessThan(b);
  });

  it('resolves a published post by canonical slug', async () => {
    const published = blogRepository.getPublished()[0];
    const fetchMock = withPublicMediaBootstrap(() => ({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { post: published } }),
    } as Response));
    vi.stubGlobal('fetch', fetchMock);
    const result = await getBlogPostBySlugContract(published.slug);

    expect(result?.slug).toBe(published.slug);
    expect(result?.seo.canonicalSlug).toBe(published.slug);
  });

  it('ignores drafts when resolving by slug for blog rendering', async () => {
    const post = blogRepository.getAll()[0];
    blogRepository.save({ ...post, id: 'draft-1', slug: 'draft-1', status: 'draft' });

    await expect(getBlogPostBySlugContract('draft-1')).resolves.toBeUndefined();
  });

  it('excludes archived content from public contracts', async () => {
    const post = blogRepository.getAll()[0];
    blogRepository.save({ ...post, id: 'archived-1', slug: 'archived-1', status: 'archived' });

    await expect(getBlogPostBySlugContract('archived-1')).resolves.toBeUndefined();
    expect(getBlogContentContract().posts.some((entry) => entry.slug === 'archived-1')).toBe(false);
  });


  it('keeps published posts visible in public contract with optional fields empty', () => {
    const seed = blogRepository.getAll()[0];
    blogRepository.save({
      ...seed,
      id: 'published-minimal',
      title: 'Publié minimal',
      slug: 'publie-minimal',
      excerpt: '',
      content: '',
      author: '',
      category: '',
      featuredImage: 'published minimal image',
      status: 'published',
    });

    const contract = getBlogContentContract();
    expect(contract.posts.some((post) => post.slug === 'publie-minimal')).toBe(true);
  });


  it('returns a detail-safe payload with metadata fallbacks', async () => {
    const seed = blogRepository.getAll()[0];
    blogRepository.save({
      ...seed,
      id: 'detail-safe',
      slug: 'detail-safe',
      title: 'Detail Safe',
      seo: { canonicalSlug: 'detail-safe' },
      category: '',
      status: 'published',
    });

    const detail = await getBlogPostBySlugContract('detail-safe');
    expect(detail?.slug).toBe('detail-safe');
    expect(detail?.category).toBe('Non classé');
    expect(detail?.seo.socialImage?.length).toBeGreaterThan(0);
  });

  it('resolves detail from authoritative remote source without requiring local repository parity', async () => {
    const published = blogRepository.getPublished()[0];
    blogRepository.delete(published.id);

    const fetchMock = withPublicMediaBootstrap(() => ({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          post: {
            ...published,
            id: 'remote-detail-1',
            slug: 'remote-detail-1',
            seo: { ...(published.seo || {}), canonicalSlug: 'remote-detail-canonical' },
            content: 'Remote authoritative body',
            status: 'published',
          },
        },
      }),
    } as Response));
    vi.stubGlobal('fetch', fetchMock);

    const detail = await getBlogPostBySlugContract('remote-detail-canonical');
    expect(detail?.slug).toBe('remote-detail-canonical');
    expect(detail?.content).toBe('Remote authoritative body');
  });

  it('returns undefined when remote detail source is unavailable (no local fallback drift)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const detail = await getBlogPostBySlugContract('collision-slug');
    expect(detail).toBeUndefined();
  });

  it('prefers backend public blog source when available', async () => {
    const published = blogRepository.getPublished()[0];
    const fetchMock = withPublicMediaBootstrap(() => ({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          posts: [{ ...published, id: 'remote-1', slug: 'remote-1', title: 'Remote post', status: 'published' }],
        },
      }),
    } as Response));
    vi.stubGlobal('fetch', fetchMock);

    const contract = await getBlogContentContractFromSource();

    expect(contract.posts.length).toBe(1);
    expect(contract.posts[0].slug).toBe('remote-1');
  });

  it('exposes a renderable card image src when featuredImage is a direct URL', () => {
    const seed = blogRepository.getAll()[0];
    blogRepository.save({
      ...seed,
      id: 'url-image-post',
      slug: 'url-image-post',
      featuredImage: 'https://cdn.example.com/blog/url-cover.jpg',
      status: 'published',
    });

    const post = getBlogContentContract().posts.find((entry) => entry.slug === 'url-image-post');
    expect(post?.image).toBe('https://cdn.example.com/blog/url-cover.jpg');
  });

  it('resolves media references to a renderable card image src in the blog list contract', () => {
    mediaRepository.save({
      id: 'blog-asset-1',
      name: 'blog-hero.jpg',
      type: 'image',
      url: 'data:image/png;base64,blogasset123',
      thumbnailUrl: 'data:image/png;base64,blogasset123',
      size: 128,
      uploadedDate: new Date().toISOString(),
      uploadedBy: 'editor',
      alt: 'Blog image alt',
      caption: 'Blog image caption',
      tags: [],
    });

    const seed = blogRepository.getAll()[0];
    blogRepository.save({
      ...seed,
      id: 'media-image-post',
      slug: 'media-image-post',
      featuredImage: toMediaReference('blog-asset-1'),
      status: 'published',
    });

    const post = getBlogContentContract().posts.find((entry) => entry.slug === 'media-image-post');
    expect(post?.image).toBe('data:image/png;base64,blogasset123');
  });

  it('handles unresolved featured media references deterministically in public blog card contract', () => {
    const seed = blogRepository.getAll()[0];
    blogRepository.save({
      ...seed,
      id: 'media-image-missing-post',
      slug: 'media-image-missing-post',
      featuredImage: toMediaReference('missing-blog-asset'),
      status: 'published',
    });

    const post = getBlogContentContract().posts.find((entry) => entry.slug === 'media-image-missing-post');
    expect(post?.image).toBeDefined();
    expect(post?.image.startsWith('media:')).toBe(false);
  });

  it('returns undefined for detail rendering when remote API is offline', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const detail = await getBlogPostBySlugContract('media-detail-post');
    expect(detail).toBeUndefined();
  });

  it('keeps unresolved media references out of rendered src values in list contracts', async () => {
    const seed = blogRepository.getAll()[0];
    blogRepository.save({
      ...seed,
      id: 'media-detail-missing-post',
      slug: 'media-detail-missing-post',
      featuredImage: toMediaReference('missing-blog-detail-asset'),
      status: 'published',
    });

    const contract = getBlogContentContract();
    const entry = contract.posts.find((post) => post.slug === 'media-detail-missing-post');
    expect(entry?.image).toBeDefined();
    expect(entry?.image.startsWith('media:')).toBe(false);
  });

  it('hydrates public media before mapping remote blog list entries in cold sessions', async () => {
    const published = blogRepository.getPublished()[0];
    mediaRepository.replaceAll([]);

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = `${input}`;
      if (url.includes('/content/public/media')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              mediaFiles: [{
                id: 'remote-blog-asset',
                name: 'remote-blog.jpg',
                type: 'image',
                url: 'https://cdn.example.com/remote-blog.jpg',
                thumbnailUrl: 'https://cdn.example.com/remote-blog.jpg',
                size: 120,
                uploadedDate: new Date().toISOString(),
                uploadedBy: 'api',
                alt: 'Remote blog image',
                caption: 'Remote blog image',
                tags: [],
              }],
            },
          }),
        } as Response;
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            posts: [{ ...published, id: 'remote-list-post', slug: 'remote-list-post', featuredImage: toMediaReference('remote-blog-asset') }],
          },
        }),
      } as Response;
    });

    vi.stubGlobal('fetch', fetchMock);

    const contract = await getBlogContentContractFromSource();
    expect(contract.posts[0]?.image).toBe('https://cdn.example.com/remote-blog.jpg');
  });

  it('hydrates public media before mapping remote blog detail entries in cold sessions', async () => {
    const published = blogRepository.getPublished()[0];
    mediaRepository.replaceAll([]);

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = `${input}`;
      if (url.includes('/content/public/media')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              mediaFiles: [{
                id: 'remote-blog-detail-asset',
                name: 'remote-blog-detail.jpg',
                type: 'image',
                url: 'https://cdn.example.com/remote-blog-detail.jpg',
                thumbnailUrl: 'https://cdn.example.com/remote-blog-detail.jpg',
                size: 120,
                uploadedDate: new Date().toISOString(),
                uploadedBy: 'api',
                alt: 'Remote detail image',
                caption: 'Remote detail image',
                tags: [],
              }],
            },
          }),
        } as Response;
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            post: { ...published, id: 'remote-detail-post', slug: 'remote-detail-post', featuredImage: toMediaReference('remote-blog-detail-asset') },
          },
        }),
      } as Response;
    });

    vi.stubGlobal('fetch', fetchMock);

    const detail = await getBlogPostBySlugContract('remote-detail-post');
    expect(detail?.featuredImage).toBe('https://cdn.example.com/remote-blog-detail.jpg');
  });

});
