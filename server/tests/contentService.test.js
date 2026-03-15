const { describe, it, expect } = require('vitest');
const { ContentService } = require('../services/contentService');

class MemoryContentRepository {
  constructor(state = {}) {
    this.state = {
      blogPosts: [],
      projects: [],
      mediaFiles: [],
      services: [],
      pageContent: null,
      settings: null,
      ...state,
    };
  }

  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  saveState(state) {
    this.state = JSON.parse(JSON.stringify(state));
  }
}

describe('ContentService blog persistence', () => {
  it('seeds legacy public blog posts when repository is empty', () => {
    const service = new ContentService({ contentRepository: new MemoryContentRepository() });

    const posts = service.listBlogPosts();

    expect(posts.length).toBeGreaterThan(0);
    expect(posts.every((post) => post.status === 'published')).toBe(true);
  });

  it('keeps seed migration idempotent by slug', () => {
    const repo = new MemoryContentRepository();
    const service = new ContentService({ contentRepository: repo });

    const first = service.listBlogPosts();
    const second = service.listBlogPosts();

    expect(second).toHaveLength(first.length);
    expect(new Set(second.map((post) => post.slug)).size).toBe(second.length);
  });

  it('supports status lifecycle and prevents publishing invalid posts', () => {
    const repo = new MemoryContentRepository({
      blogPosts: [
        {
          id: 'draft-1',
          title: 'Draft',
          slug: 'draft',
          excerpt: 'Excerpt',
          content: 'Content',
          author: 'Author',
          authorRole: 'Role',
          category: 'Cat',
          tags: [],
          publishedDate: '2024-01-01',
          readTime: '2 min',
          featuredImage: 'img',
          images: [],
          status: 'draft',
        },
      ],
    });
    const service = new ContentService({ contentRepository: repo });

    expect(service.transitionBlogStatus('draft-1', 'published').ok).toBe(false);
    expect(service.transitionBlogStatus('draft-1', 'in_review').ok).toBe(true);
    expect(service.transitionBlogStatus('draft-1', 'published').ok).toBe(true);
  });
});


describe('ContentService project persistence', () => {
  it('creates and updates projects with normalized slug/status contract', () => {
    const service = new ContentService({ contentRepository: new MemoryContentRepository() });

    const created = service.saveProject({
      id: 'project-cms-1',
      title: 'Projet CMS Démo',
      slug: '',
      client: 'Client Démo',
      category: 'Web',
      year: '2026',
      summary: 'Résumé court',
      description: 'Description complète',
      challenge: 'Challenge',
      solution: 'Solution',
      results: ['Résultat 1'],
      tags: ['cms'],
      mainImage: 'image projet',
      images: [],
      status: 'published',
    });

    expect(created.ok).toBe(true);
    expect(created.project.slug).toBe('projet-cms-demo');

    const updated = service.saveProject({ ...created.project, title: 'Projet CMS Démo MAJ' });
    expect(updated.ok).toBe(true);

    const listed = service.listProjects();
    expect(listed).toHaveLength(1);
    expect(listed[0].title).toBe('Projet CMS Démo MAJ');
  });


  it('rejects duplicate project slugs across different ids', () => {
    const service = new ContentService({ contentRepository: new MemoryContentRepository() });

    const first = service.saveProject({
      id: 'project-1',
      title: 'Projet Alpha',
      slug: 'projet-alpha',
      client: 'Client Alpha',
      category: 'Web',
      year: '2026',
      description: 'Description',
      challenge: 'Challenge',
      solution: 'Solution',
      results: [],
      tags: [],
      mainImage: 'cover',
      images: [],
      status: 'published',
    });

    expect(first.ok).toBe(true);

    const duplicate = service.saveProject({
      id: 'project-2',
      title: 'Projet Beta',
      slug: 'projet-alpha',
      client: 'Client Beta',
      category: 'Web',
      year: '2026',
      description: 'Description',
      challenge: 'Challenge',
      solution: 'Solution',
      results: [],
      tags: [],
      mainImage: 'cover',
      images: [],
      status: 'published',
    });

    expect(duplicate.ok).toBe(false);
    expect(duplicate.error.code).toBe('PROJECT_SLUG_CONFLICT');
  });

  it('rejects invalid project payloads', () => {
    const service = new ContentService({ contentRepository: new MemoryContentRepository() });

    const result = service.saveProject({
      id: 'project-invalid',
      title: '',
      client: '',
      category: '',
      year: '2026',
      description: '',
      challenge: '',
      solution: '',
      results: [],
      tags: [],
      mainImage: '',
      images: [],
    });

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe('PROJECT_VALIDATION_ERROR');
  });
});
