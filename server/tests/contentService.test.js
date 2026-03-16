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

  it('blocks publish transitions when instant publishing is disabled in settings', () => {
    const repo = new MemoryContentRepository({
      settings: {
        siteTitle: 'SMOVE',
        supportEmail: 'contact@smove.africa',
        instantPublishing: false,
      },
      blogPosts: [
        {
          id: 'review-1',
          title: 'Review',
          slug: 'review',
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
          status: 'in_review',
        },
      ],
    });
    const service = new ContentService({ contentRepository: repo });

    const transition = service.transitionBlogStatus('review-1', 'published');

    expect(transition.ok).toBe(false);
    expect(transition.error.code).toBe('BLOG_INSTANT_PUBLISHING_DISABLED');
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
    expect(created.project.featuredImage).toBe('image projet');
    expect(created.project.imageAlt).toBe('Projet CMS Démo');

    const updated = service.saveProject({ ...created.project, title: 'Projet CMS Démo MAJ' });
    expect(updated.ok).toBe(true);

    const listed = service.listProjects();
    expect(listed).toHaveLength(1);
    expect(listed[0].title).toBe('Projet CMS Démo MAJ');
  });



  it('persists project testimonial and case study contract fields', () => {
    const service = new ContentService({ contentRepository: new MemoryContentRepository() });

    const result = service.saveProject({
      id: 'project-contract-1',
      title: 'Projet Contrat',
      slug: 'projet-contrat',
      client: 'Client Contrat',
      category: 'Web',
      year: '2026',
      description: 'Description',
      challenge: 'Challenge',
      solution: 'Solution',
      results: ['Résultat 1'],
      tags: ['cms'],
      mainImage: 'image projet',
      images: ['img-1', 'img-2', 'img-3'],
      status: 'published',
      links: {
        live: 'https://smove.africa/projet',
        caseStudy: 'https://smove.africa/case-study',
      },
      testimonial: {
        text: 'Super accompagnement',
        author: 'Mariam',
        position: 'CMO',
      },
    });

    expect(result.ok).toBe(true);
    expect(result.project.images).toEqual(['img-1', 'img-2', 'img-3']);
    expect(result.project.links.caseStudy).toBe('https://smove.africa/case-study');
    expect(result.project.testimonial.author).toBe('Mariam');
  });


  it('accepts project payloads with only title and image as meaningful required fields', () => {
    const service = new ContentService({ contentRepository: new MemoryContentRepository() });

    const result = service.saveProject({
      id: 'project-minimal-server',
      title: 'Projet minimal serveur',
      slug: '',
      client: '',
      category: '',
      year: '',
      description: '',
      challenge: '',
      solution: '',
      results: [],
      tags: [],
      mainImage: 'minimal server image',
      featuredImage: 'minimal server image',
      images: [],
      status: 'published',
    });

    expect(result.ok).toBe(true);
    expect(result.project.featuredImage).toBe('minimal server image');
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

  it('rejects project URLs and media references that are invalid', () => {
    const service = new ContentService({ contentRepository: new MemoryContentRepository() });

    const result = service.saveProject({
      id: 'project-invalid-links',
      title: 'Projet invalide',
      slug: 'projet-invalide',
      client: 'Client',
      category: 'Web',
      year: '20',
      description: 'Description',
      challenge: 'Challenge',
      solution: 'Solution',
      results: [],
      tags: [],
      mainImage: 'media:missing',
      featuredImage: 'media:missing',
      images: ['ftp://invalid'],
      link: 'not-a-url',
      status: 'published',
    });

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe('PROJECT_VALIDATION_ERROR');
  });
});


describe('ContentService services synchronization', () => {
  it('seeds legacy default services when repository is empty', () => {
    const service = new ContentService({ contentRepository: new MemoryContentRepository() });

    const services = service.listServices();

    expect(services.length).toBeGreaterThan(0);
    expect(services.some((entry) => entry.slug === 'design-branding')).toBe(true);
    expect(services.every((entry) => entry.status === 'published')).toBe(true);
  });

  it('keeps service seed migration idempotent by slug', () => {
    const repo = new MemoryContentRepository();
    const service = new ContentService({ contentRepository: repo });

    const first = service.listServices();
    const second = service.listServices();

    expect(second).toHaveLength(first.length);
    expect(new Set(second.map((entry) => entry.slug)).size).toBe(second.length);
  });
});

describe('ContentService production hardening', () => {

  it('normalizes blog payloads with optional fields omitted and keeps them publishable', () => {
    const service = new ContentService({ contentRepository: new MemoryContentRepository() });

    const result = service.saveBlogPost({
      id: 'blog-minimal-server',
      title: 'Blog minimal serveur',
      slug: '',
      excerpt: '',
      content: '',
      author: '',
      authorRole: '',
      category: '',
      tags: [],
      publishedDate: '',
      readTime: '',
      featuredImage: 'blog minimal image',
      images: [],
      status: 'published',
    });

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe('BLOG_INVALID_STATUS_TRANSITION');

    const draft = service.saveBlogPost({
      id: 'blog-minimal-server',
      title: 'Blog minimal serveur',
      slug: '',
      excerpt: '',
      content: '',
      author: '',
      authorRole: '',
      category: '',
      tags: [],
      publishedDate: '',
      readTime: '',
      featuredImage: 'blog minimal image',
      images: [],
      status: 'draft',
    });

    expect(draft.ok).toBe(true);
    expect(draft.post.excerpt.length).toBeGreaterThan(0);
    expect(draft.post.content.length).toBeGreaterThan(0);
  });

  it('rejects blog payload with invalid date or dangling media reference', () => {
    const service = new ContentService({ contentRepository: new MemoryContentRepository() });

    const result = service.saveBlogPost({
      id: 'blog-invalid',
      title: 'Blog invalide',
      slug: 'blog-invalide',
      excerpt: 'Extrait',
      content: 'Contenu',
      author: 'Auteur',
      authorRole: 'Role',
      category: 'Cat',
      tags: [],
      publishedDate: 'not-a-date',
      readTime: '4 min',
      featuredImage: 'media:missing',
      images: [],
      status: 'draft',
    });

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe('BLOG_VALIDATION_ERROR');
  });


  it('rejects blog payload when seo social image media reference is invalid', () => {
    const service = new ContentService({ contentRepository: new MemoryContentRepository() });

    const result = service.saveBlogPost({
      id: 'blog-invalid-seo-media',
      title: 'Blog SEO invalide',
      slug: 'blog-seo-invalide',
      excerpt: 'Extrait',
      content: 'Contenu',
      author: 'Auteur',
      authorRole: 'Role',
      category: 'Cat',
      tags: [],
      publishedDate: '2024-01-01T00:00:00.000Z',
      readTime: '4 min',
      featuredImage: 'blog article image',
      images: [],
      status: 'draft',
      seo: {
        socialImage: 'media:missing-seo',
      },
    });

    expect(result.ok).toBe(false);
    expect(result.error.code).toBe('BLOG_VALIDATION_ERROR');
  });

  it('enforces service icon and color whitelist', () => {
    const service = new ContentService({ contentRepository: new MemoryContentRepository() });

    const invalid = service.saveService({
      id: 'service-invalid',
      title: 'Service invalide',
      slug: 'service-invalide',
      description: 'Description',
      icon: 'rocket',
      color: 'red',
      features: ['Feature'],
      status: 'published',
    });

    expect(invalid.ok).toBe(false);
    expect(invalid.error.code).toBe('SERVICE_VALIDATION_ERROR');
  });

  it('persists home content but rejects invalid aboutImage media references', () => {
    const service = new ContentService({ contentRepository: new MemoryContentRepository() });

    const rejected = service.savePageContent({
      home: {
        heroBadge: 'Badge',
        heroTitleLine1: 'Line 1',
        heroTitleLine2: 'Line 2',
        heroDescription: 'Description',
        heroPrimaryCtaLabel: 'CTA 1',
        heroSecondaryCtaLabel: 'CTA 2',
        aboutBadge: 'About',
        aboutTitle: 'Title',
        aboutParagraphOne: 'P1',
        aboutParagraphTwo: 'P2',
        aboutImage: 'media:missing',
        servicesIntroTitle: 'Services',
        servicesIntroSubtitle: 'Subtitle',
      },
    });
    expect(rejected.ok).toBe(false);
    expect(rejected.error.code).toBe('PAGE_CONTENT_VALIDATION_ERROR');

    service.saveMediaFile({
      id: 'media-home',
      name: 'about.jpg',
      type: 'image',
      url: 'https://example.com/about.jpg',
      thumbnailUrl: 'https://example.com/about.jpg',
      size: 120,
      uploadedDate: new Date().toISOString(),
      uploadedBy: 'admin',
      alt: 'about',
      tags: [],
    });

    const accepted = service.savePageContent({
      home: {
        heroBadge: 'Badge',
        heroTitleLine1: 'Line 1',
        heroTitleLine2: 'Line 2',
        heroDescription: 'Description',
        heroPrimaryCtaLabel: 'CTA 1',
        heroSecondaryCtaLabel: 'CTA 2',
        aboutBadge: 'About',
        aboutTitle: 'Title',
        aboutParagraphOne: 'P1',
        aboutParagraphTwo: 'P2',
        aboutImage: 'media:media-home',
        servicesIntroTitle: 'Services',
        servicesIntroSubtitle: 'Subtitle',
      },
    });
    expect(accepted.ok).toBe(true);
    expect(service.getPageContent().home.aboutImage).toBe('media:media-home');
  });

  it('returns media usage references to support safe delete guardrails', () => {
    const service = new ContentService({
      contentRepository: new MemoryContentRepository({
        mediaFiles: [
          {
            id: 'asset-1',
            name: 'asset.jpg',
            type: 'image',
            url: 'https://example.com/asset.jpg',
            thumbnailUrl: 'https://example.com/asset.jpg',
            size: 10,
            uploadedDate: '2024-01-01T00:00:00.000Z',
            uploadedBy: 'admin',
            tags: [],
          },
        ],
        blogPosts: [
          {
            id: 'post-1',
            title: 'Post',
            slug: 'post',
            excerpt: 'Excerpt',
            content: 'Content',
            author: 'Author',
            authorRole: 'Role',
            category: 'Cat',
            tags: [],
            publishedDate: '2024-01-01T00:00:00.000Z',
            readTime: '5 min',
            featuredImage: 'media:asset-1',
            images: [],
            status: 'draft',
            seo: { socialImage: 'media:asset-1' },
          },
        ],
      }),
    });

    const refs = service.findMediaReferences('asset-1');
    expect(refs.length).toBeGreaterThan(0);
    expect(refs.some((ref) => ref.domain === 'blog')).toBe(true);
  });
});
