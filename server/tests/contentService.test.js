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
