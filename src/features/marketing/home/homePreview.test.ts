import { describe, expect, it } from 'vitest';
import type { BlogListItem } from '../../blog/blogContentService';
import type { Project, Service } from '../../../domain/contentSchemas';
import { selectRenderablePublicServices } from '../serviceCatalog';
import { HOMEPAGE_PREVIEW_LIMIT, selectHomepageBlogPosts, selectHomepageProjects, selectHomepageServices } from './homePreview';

const makeProject = (id: string, status: Project['status'] = 'published'): Project => ({
  id,
  title: `Projet ${id}`,
  slug: id,
  summary: 'Résumé',
  client: 'Client',
  category: 'Web',
  year: '2026',
  description: 'Description',
  challenge: 'Challenge',
  solution: 'Solution',
  results: ['Résultat'],
  tags: ['tag'],
  mainImage: 'image',
  images: ['image'],
  status,
});

const makeService = (id: string, status: Service['status'] = 'published'): Service => ({
  id,
  title: `Service ${id}`,
  slug: id,
  description: 'Description',
  shortDescription: 'Court',
  icon: 'palette',
  color: 'from-[#00b3e8] to-[#00c0e8]',
  features: ['Feature'],
  status,
});

const makeBlogPost = (id: string): BlogListItem => ({
  id,
  slug: id,
  title: `Post ${id}`,
  excerpt: 'Excerpt',
  author: 'Auteur',
  date: '01/01/2026',
  category: 'News',
  image: 'image-query',
  readTime: '4 min',
  featured: false,
  seo: { title: '', description: '', canonicalSlug: id, socialImage: '' },
  media: { alt: 'Alt', caption: '' },
});

describe('homepage preview selectors', () => {
  it('limits homepage projects to 3 published entries while keeping order', () => {
    const projects = [
      makeProject('project-1'),
      makeProject('project-2'),
      makeProject('project-3'),
      makeProject('project-4'),
      makeProject('project-5', 'draft'),
    ];

    expect(selectHomepageProjects(projects).map((project) => project.id)).toEqual(['project-1', 'project-2', 'project-3']);
    expect(selectHomepageProjects(projects)).toHaveLength(HOMEPAGE_PREVIEW_LIMIT);
  });

  it('limits homepage services to 3 published entries while keeping order', () => {
    const services = [
      makeService('service-1'),
      makeService('service-2', 'archived'),
      makeService('service-3'),
      makeService('service-4'),
      makeService('service-5'),
    ];

    expect(selectHomepageServices(services).map((service) => service.id)).toEqual(['service-1', 'service-3', 'service-4']);
    expect(selectHomepageServices(services)).toHaveLength(HOMEPAGE_PREVIEW_LIMIT);
  });

  it('limits homepage blog posts to 3 entries', () => {
    const posts = [makeBlogPost('post-1'), makeBlogPost('post-2'), makeBlogPost('post-3'), makeBlogPost('post-4')];

    expect(selectHomepageBlogPosts(posts).map((post) => post.id)).toEqual(['post-1', 'post-2', 'post-3']);
    expect(selectHomepageBlogPosts(posts)).toHaveLength(HOMEPAGE_PREVIEW_LIMIT);
  });

  it('keeps dedicated services listing on full published dataset', () => {
    const services = [makeService('service-1'), makeService('service-2'), makeService('service-3'), makeService('service-4')];

    expect(selectRenderablePublicServices(services)).toHaveLength(4);
    expect(selectHomepageServices(services)).toHaveLength(3);
  });
});
