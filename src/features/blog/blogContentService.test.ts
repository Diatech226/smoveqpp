import { beforeEach, describe, expect, it } from 'vitest';
import { blogRepository } from '../../repositories/blogRepository';
import { getBlogContentContract, getBlogPostBySlugContract } from './blogContentService';

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
  });

  it('ignores drafts when resolving by slug for blog rendering', () => {
    const post = blogRepository.getAll()[0];
    blogRepository.save({ ...post, id: 'draft-1', slug: 'draft-1', status: 'draft' });

    expect(getBlogPostBySlugContract('draft-1')).toBeUndefined();
  });
});
