import { beforeEach, describe, expect, it } from 'vitest';
import { blogRepository, BlogRepositoryError } from './blogRepository';
import { mediaRepository } from './mediaRepository';
import { projectRepository } from './projectRepository';
import { cmsRepository } from './cmsRepository';
import { pageContentRepository } from './pageContentRepository';
import type { BlogPost, MediaFile } from '../domain/contentSchemas';
import { toMediaReference } from '../features/blog/mediaReference';

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



  it('rejects duplicated slugs to preserve canonical routing', () => {
    const post = blogRepository.getAll()[0];

    expect(() =>
      blogRepository.save({
        ...post,
        id: 'duplicate-slug-post',
        slug: post.slug,
      }),
    ).toThrowError(BlogRepositoryError);
  });

  it('recovers safely from corrupted local storage payloads', () => {
    localStorage.setItem('smove_blog_posts', '{invalid json');

    const posts = blogRepository.getAll();

    expect(posts.length).toBeGreaterThan(0);
    expect(posts[0].id).toBeTruthy();
  });

  it('falls back to defaults when schema is invalid', () => {
    localStorage.setItem('smove_blog_posts', JSON.stringify([{ bad: 'shape' }]));

    const posts = blogRepository.getAll();

    expect(posts.length).toBeGreaterThan(0);
    expect(posts[0].title).toBeTruthy();
  });


  it('supports explicit publish/unpublish/archive transitions', () => {
    const seed = blogRepository.getAll()[0];
    const postId = 'status-transition-post';

    blogRepository.save({ ...seed, id: postId, slug: 'status-transition-post', status: 'draft' });

    expect(blogRepository.publish(postId).status).toBe('published');
    expect(blogRepository.unpublish(postId).status).toBe('draft');
    expect(blogRepository.archive(postId).status).toBe('archived');
  });

  it('migrates legacy persisted entries without status to draft safely', () => {
    const seed = blogRepository.getAll()[0];
    localStorage.setItem('smove_blog_posts', JSON.stringify([{ ...seed, id: 'legacy-without-status', slug: 'legacy-without-status', status: undefined }]));

    const migrated = blogRepository.getById('legacy-without-status');

    expect(migrated?.status).toBe('draft');
  });

  it('rejects dangling media references during save', () => {
    const seed = blogRepository.getAll()[0];

    expect(() =>
      blogRepository.save({
        ...seed,
        id: 'invalid-media-ref-post',
        slug: 'invalid-media-ref-post',
        featuredImage: toMediaReference('missing-asset'),
      }),
    ).toThrowError(BlogRepositoryError);
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
      title: 'Hero image',
      label: 'Homepage hero',
      source: 'test-seed',
      metadata: { origin: 'unit-test' },
      tags: ['homepage'],
    };

    mediaRepository.save(file);

    expect(mediaRepository.getById('media-1')?.name).toBe('hero.jpg');
    expect(mediaRepository.getById('media-1')?.caption).toBe('hero');
    expect(mediaRepository.getById('media-1')?.title).toBe('Hero image');
    expect(mediaRepository.getById('media-1')?.source).toBe('test-seed');
  });
});

describe('projectRepository and cmsRepository', () => {
  it('exposes validated project contracts', () => {
    const first = projectRepository.getAll()[0];

    expect(first.id).toBeTruthy();
    expect(projectRepository.getByCategory('Tous').length).toBe(projectRepository.getAll().length);
  });


  it('supports CMS project save and delete workflows', () => {
    const seed = projectRepository.getAll()[0];

    projectRepository.save({ ...seed, id: 'project-new', title: 'Projet CMS Ops' });
    expect(projectRepository.getById('project-new')?.title).toBe('Projet CMS Ops');

    projectRepository.delete('project-new');
    expect(projectRepository.getById('project-new')).toBeUndefined();
  });

  it('aggregates CMS stats from domain repositories', () => {
    const stats = cmsRepository.getStats();

    expect(stats.projectCount).toBe(projectRepository.getAll().length);
    expect(stats.blogPostCount).toBe(blogRepository.getAll().length);
    expect(stats.mediaCount).toBe(mediaRepository.getAll().length);
  });
});


describe('pageContentRepository', () => {
  it('persists centralized home page editable content', () => {
    const current = pageContentRepository.getHomePageContent();
    const saved = pageContentRepository.saveHomePageContent({
      ...current,
      heroTitleLine1: 'Titre CMS',
      heroTitleLine2: 'Piloté par le CMS',
      aboutImage: 'media:asset-home',
    });

    expect(saved.heroTitleLine1).toBe('Titre CMS');
    expect(pageContentRepository.getHomePageContent().heroTitleLine2).toBe('Piloté par le CMS');
    expect(pageContentRepository.getHomePageContent().aboutImage).toBe('media:asset-home');
  });
});
