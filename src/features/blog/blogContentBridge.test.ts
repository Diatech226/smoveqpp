import { beforeEach, describe, expect, it, vi } from 'vitest';
import { blogRepository } from '../../repositories/blogRepository';
import { blogContentBridge } from './blogContentBridge';

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
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-02-05T00:00:00.000Z'));
  (globalThis as unknown as { window: Window }).window = { localStorage } as unknown as Window;
});

describe('blogContentBridge', () => {
  it('maps published content into canonical list items sorted by publish date', () => {
    const items = blogContentBridge.getPublishedListItems();

    expect(items.length).toBeGreaterThan(0);
    expect(items[0]?.featured).toBe(true);
    expect(items[0]?.seo.canonicalPath).toContain('/blog/');

    for (let i = 1; i < items.length; i += 1) {
      const previous = blogRepository.getBySlug(items[i - 1].slug);
      const current = blogRepository.getBySlug(items[i].slug);
      expect(new Date(previous?.publishedDate ?? '').getTime()).toBeGreaterThanOrEqual(
        new Date(current?.publishedDate ?? '').getTime(),
      );
    }
  });
});
