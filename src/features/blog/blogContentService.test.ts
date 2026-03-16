import { beforeEach, describe, expect, it, vi } from 'vitest';
import { blogRepository } from '../../repositories/blogRepository';
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

beforeEach(() => {
  localStorage.clear();
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

  it('prefers backend public blog source when available', async () => {
    const published = blogRepository.getPublished()[0];
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          posts: [{ ...published, id: 'remote-1', slug: 'remote-1', title: 'Remote post', status: 'published' }],
        },
      }),
    } as Response);
    vi.stubGlobal('fetch', fetchMock);

    const contract = await getBlogContentContractFromSource();

    expect(contract.posts.length).toBe(1);
    expect(contract.posts[0].slug).toBe('remote-1');
  });
});
