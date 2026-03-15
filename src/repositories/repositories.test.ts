import { beforeEach, describe, expect, it } from 'vitest';
import { blogRepository, BlogRepositoryError } from './blogRepository';
import { mediaRepository } from './mediaRepository';
import { projectRepository } from './projectRepository';
import { serviceRepository } from './serviceRepository';
import { cmsRepository } from './cmsRepository';
import { pageContentRepository } from './pageContentRepository';
import type { BlogPost, MediaFile, Project } from '../domain/contentSchemas';
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



  it('normalizes project slug and preserves created date on update', () => {
    const seed = projectRepository.getAll()[0];

    const created = projectRepository.save({
      ...seed,
      id: 'project-slug-normalize',
      title: 'Projet Démo Accentué',
      slug: '',
      createdAt: '2024-01-01T00:00:00.000Z',
    });

    const updated = projectRepository.save({
      ...created,
      title: 'Projet Démo Accentué MAJ',
      slug: 'projet-demo-accentue-maj',
    });

    expect(created.slug).toBe('projet-demo-accentue');
    expect(updated.createdAt).toBe('2024-01-01T00:00:00.000Z');
  });

  it('filters draft/archived projects from public listing helper', () => {
    const seed = projectRepository.getAll()[0];

    projectRepository.save({ ...seed, id: 'project-draft-only', status: 'draft', slug: 'project-draft-only' });
    projectRepository.save({ ...seed, id: 'project-archived-only', status: 'archived', slug: 'project-archived-only' });

    const publishedIds = projectRepository.getPublished().map((project) => project.id);

    expect(publishedIds).not.toContain('project-draft-only');
    expect(publishedIds).not.toContain('project-archived-only');
  });


  it('normalizes legacy partial project payloads when replacing from backend', () => {
    const legacy: Partial<Project> & { id: string; title: string; client: string; category: string; year: string } = {
      id: 'legacy-project',
      title: 'Legacy Projet',
      client: 'Client Legacy',
      category: 'Legacy',
      year: '2022',
      summary: 'Résumé hérité',
      mainImage: 'legacy image',
      results: [],
      tags: [],
      images: [],
      status: 'published' as const,
    };

    const normalized = projectRepository.replaceAll([legacy as Project]);

    expect(normalized[0].description).toBe('Résumé hérité');
    expect(normalized[0].challenge).toBeTruthy();
    expect(normalized[0].solution).toBeTruthy();
    expect(projectRepository.getById('legacy-project')?.slug).toBe('legacy-projet');
  });

  it('supports CMS project save and delete workflows', () => {
    const seed = projectRepository.getAll()[0];

    projectRepository.save({ ...seed, id: 'project-new', title: 'Projet CMS Ops' });
    expect(projectRepository.getById('project-new')?.title).toBe('Projet CMS Ops');

    projectRepository.delete('project-new');
    expect(projectRepository.getById('project-new')).toBeUndefined();
  });


  it('supports services CRUD with published filtering', () => {
    const first = serviceRepository.getAll()[0];
    expect(first.id).toBeTruthy();

    serviceRepository.save({
      ...first,
      id: 'service-cms-test',
      slug: 'service-cms-test',
      title: 'Service CMS Test',
      status: 'draft',
    });

    expect(serviceRepository.getById('service-cms-test')?.title).toBe('Service CMS Test');
    expect(serviceRepository.getPublished().map((service) => service.id)).not.toContain('service-cms-test');

    serviceRepository.save({
      ...serviceRepository.getById('service-cms-test')!,
      status: 'published',
    });

    expect(serviceRepository.getPublished().map((service) => service.id)).toContain('service-cms-test');

    serviceRepository.delete('service-cms-test');
    expect(serviceRepository.getById('service-cms-test')).toBeUndefined();
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
