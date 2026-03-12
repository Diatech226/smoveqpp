import { isProjectArray, type Project } from '../domain/contentSchemas';
import { projectCategories, projects as staticProjects } from '../data/projects';

export interface ProjectRepository {
  getAll(): Project[];
  getCategories(): string[];
  getById(id: string): Project | undefined;
  getByCategory(category: string): Project[];
  getFeatured(count?: number): Project[];
}

class StaticProjectRepository implements ProjectRepository {
  private readonly projects = this.validateProjects(staticProjects);

  private validateProjects(input: unknown): Project[] {
    if (!isProjectArray(input)) {
      if (import.meta.env.DEV) {
        console.warn('[projectRepository] invalid project seed data, using empty array');
      }
      return [];
    }

    return input;
  }

  getAll(): Project[] {
    return this.projects;
  }

  getCategories(): string[] {
    return projectCategories;
  }

  getById(id: string): Project | undefined {
    return this.projects.find((project) => project.id === id);
  }

  getByCategory(category: string): Project[] {
    if (category === 'Tous') return this.projects;
    return this.projects.filter((project) => project.category === category);
  }

  getFeatured(count: number = 3): Project[] {
    return this.projects.slice(0, count);
  }
}

export const projectRepository: ProjectRepository = new StaticProjectRepository();
