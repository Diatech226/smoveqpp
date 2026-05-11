import type { Project } from '../../domain/contentSchemas';

export function selectPublishedProjects(projects: Project[]): Project[] {
  return projects.filter((project) => project.status === 'published');
}

