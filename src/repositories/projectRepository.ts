import { isProject, isProjectArray, type Project } from '../domain/contentSchemas';
import { projectCategories, projects as staticProjects } from '../data/projects';
import { readFromStorage, writeToStorage } from './storage/localStorageStore';

const PROJECT_STORAGE_KEY = 'smove_projects';

export interface ProjectRepository {
  getAll(): Project[];
  getCategories(): string[];
  getById(id: string): Project | undefined;
  getByCategory(category: string): Project[];
  getFeatured(count?: number): Project[];
  save(project: Project): void;
  delete(id: string): void;
}

class LocalProjectRepository implements ProjectRepository {
  private readonly defaults = this.validateProjects(staticProjects);

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
    return readFromStorage(PROJECT_STORAGE_KEY, isProjectArray, this.defaults, { persistFallback: true });
  }

  getCategories(): string[] {
    const categories = new Set(projectCategories);
    this.getAll().forEach((project) => categories.add(project.category));
    return [...categories];
  }

  getById(id: string): Project | undefined {
    return this.getAll().find((project) => project.id === id);
  }

  getByCategory(category: string): Project[] {
    const projects = this.getAll();
    if (category === 'Tous') return projects;
    return projects.filter((project) => project.category === category);
  }

  getFeatured(count: number = 3): Project[] {
    return this.getAll().slice(0, count);
  }

  save(project: Project): void {
    if (!isProject(project)) {
      throw new Error('Invalid project payload');
    }

    const trustedProject = project;
    const projects = this.getAll();
    const index = projects.findIndex((candidate) => candidate.id === trustedProject.id);

    if (index >= 0) {
      projects[index] = trustedProject;
    } else {
      projects.push(trustedProject);
    }

    writeToStorage(PROJECT_STORAGE_KEY, projects);
  }

  delete(id: string): void {
    writeToStorage(
      PROJECT_STORAGE_KEY,
      this.getAll().filter((project) => project.id !== id),
    );
  }
}

export const projectRepository: ProjectRepository = new LocalProjectRepository();
