import type { BlogListItem } from '../../blog/blogContentService';
import type { Project, Service } from '../../../domain/contentSchemas';

export const HOMEPAGE_PREVIEW_LIMIT = 3;

export function selectHomepageProjects(projects: Project[]): Project[] {
  const published = projects.filter((project) => project.status === 'published');
  const featured = published.filter((project) => Boolean(project.featured));
  const regular = published.filter((project) => !project.featured);
  return [...featured, ...regular].slice(0, HOMEPAGE_PREVIEW_LIMIT);
}

export function selectHomepageServices(services: Service[]): Service[] {
  const published = services.filter((service) => service.status === 'published');
  const featured = published.filter((service) => Boolean(service.featured));
  const regular = published.filter((service) => !service.featured);
  return [...featured, ...regular].slice(0, HOMEPAGE_PREVIEW_LIMIT);
}

export function selectHomepageBlogPosts(posts: BlogListItem[]): BlogListItem[] {
  return posts.slice(0, HOMEPAGE_PREVIEW_LIMIT);
}
