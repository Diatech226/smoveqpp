import { beforeEach, describe, expect, it } from 'vitest';
import { blogRepository } from './blogRepository';
import { mediaRepository } from './mediaRepository';
import { projectRepository } from './projectRepository';
import { cmsRepository } from './cmsRepository';
import type { BlogPost, MediaFile } from '../domain/contentSchemas';

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

describe('blogRepository', () => {
  it('writes and reads posts through validated repository contracts', () => {
    const initialCount = blogRepository.getAll().length;
    const newPost: BlogPost = {
      ...blogRepository.getAll()[0],
      id: 'new-post',
      title: 'Nouvel article',
      slug: 'nouvel-article',
    };

    blogRepository.save(newPost);

    expect(blogRepository.getAll()).toHaveLength(initialCount + 1);
    expect(blogRepository.getById('new-post')?.title).toBe('Nouvel article');
  });

  it('recovers safely from corrupted local storage payloads', () => {
    localStorage.setItem('smove_blog_posts', '{invalid json');

    const posts = blogRepository.getAll();

    expect(posts.length).toBeGreaterThan(0);
    expect(posts[0].id).toBeTruthy();
  });


  it('prevents duplicate slugs across different blog entries', () => {
    const source = blogRepository.getAll()[0];

    expect(() =>
      blogRepository.save({
        ...source,
        id: 'duplicate-slug-post',
      }),
    ).toThrow(/Slug already exists/i);
  });

  it('falls back to defaults when schema is invalid', () => {
    localStorage.setItem('smove_blog_posts', JSON.stringify([{ bad: 'shape' }]));

    const posts = blogRepository.getAll();

    expect(posts.length).toBeGreaterThan(0);
    expect(posts[0].title).toBeTruthy();
  });
});

describe('mediaRepository', () => {
  it('returns safe fallback when stored media payload is malformed', () => {
    localStorage.setItem('smove_media_files', JSON.stringify({ invalid: true }));

    expect(mediaRepository.getAll()).toEqual([]);
  });

  it('round-trips media entities via repository contract', () => {
    const file: MediaFile = {
      id: 'media-1',
      name: 'hero.jpg',
      type: 'image',
      url: 'data:image/png;base64,abc',
      thumbnailUrl: 'data:image/png;base64,abc',
      size: 200,
      uploadedDate: new Date().toISOString(),
      uploadedBy: 'admin',
      alt: 'hero',
      tags: ['homepage'],
    };

    mediaRepository.save(file);

    expect(mediaRepository.getById('media-1')?.name).toBe('hero.jpg');
  });
});

describe('projectRepository and cmsRepository', () => {
  it('exposes validated project contracts', () => {
    const first = projectRepository.getAll()[0];

    expect(first.id).toBeTruthy();
    expect(projectRepository.getByCategory('Tous').length).toBe(projectRepository.getAll().length);
  });

  it('aggregates CMS stats from domain repositories', () => {
    const stats = cmsRepository.getStats();

    expect(stats.projectCount).toBe(projectRepository.getAll().length);
    expect(stats.blogPostCount).toBe(blogRepository.getAll().length);
    expect(stats.mediaCount).toBe(mediaRepository.getAll().length);
  });
});
