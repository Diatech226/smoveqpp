import { isProjectArray, type Project } from '../domain/contentSchemas';
import { projectCategories, projects as staticProjects } from '../data/projects';
import { readFromStorage, writeToStorage } from './storage/localStorageStore';

const PROJECT_STORAGE_KEY = 'smove_projects';

const toSlug = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const toIsoOrNow = (value?: string): string => {
  if (!value) return new Date().toISOString();
  const date = Date.parse(value);
  if (Number.isNaN(date)) return new Date().toISOString();
  return new Date(date).toISOString();
};

const normalizeProject = (project: Project): Project => {
  const title = project.title.trim();
  const now = new Date().toISOString();
  const slug = toSlug(project.slug?.trim() || title || project.id);
  const summary = (project.summary || '').trim();

  return {
    ...project,
    title,
    client: project.client.trim(),
    category: project.category.trim(),
    year: project.year.trim() || new Date().getFullYear().toString(),
    description: project.description.trim(),
    challenge: project.challenge.trim(),
    solution: project.solution.trim(),
    results: project.results.map((entry) => entry.trim()).filter(Boolean),
    tags: project.tags.map((entry) => entry.trim()).filter(Boolean),
    mainImage: project.mainImage.trim() || 'project cover image',
    images: project.images.map((entry) => entry.trim()).filter(Boolean),
    slug,
    summary: summary || undefined,
    featured: Boolean(project.featured),
    status: project.status ?? 'published',
    createdAt: toIsoOrNow(project.createdAt),
    updatedAt: now,
    links: project.links
      ? {
          live: project.links.live?.trim() || undefined,
          caseStudy: project.links.caseStudy?.trim() || undefined,
        }
      : undefined,
  };
};

const compareProjects = (a: Project, b: Project): number => {
  const featuredCompare = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
  if (featuredCompare !== 0) return featuredCompare;

  const yearCompare = Number.parseInt(b.year, 10) - Number.parseInt(a.year, 10);
  if (!Number.isNaN(yearCompare) && yearCompare !== 0) return yearCompare;

  const updatedCompare = Date.parse(b.updatedAt || '') - Date.parse(a.updatedAt || '');
  if (!Number.isNaN(updatedCompare) && updatedCompare !== 0) return updatedCompare;

  return a.title.localeCompare(b.title, 'fr');
};

export interface ProjectRepository {
  getAll(): Project[];
  getPublished(): Project[];
  getCategories(): string[];
  getById(id: string): Project | undefined;
  getBySlug(slug: string): Project | undefined;
  getByCategory(category: string): Project[];
  getFeatured(count?: number): Project[];
  save(project: Project): Project;
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

    return input.map((project) => normalizeProject(project)).sort(compareProjects);
  }

  private read(): Project[] {
    const projects = readFromStorage(PROJECT_STORAGE_KEY, isProjectArray, this.defaults, { persistFallback: true });
    return projects.map((project) => normalizeProject(project)).sort(compareProjects);
  }

  getAll(): Project[] {
    return this.read();
  }

  getPublished(): Project[] {
    return this.getAll().filter((project) => project.status !== 'archived' && project.status !== 'draft');
  }

  getCategories(): string[] {
    const categories = new Set(projectCategories);
    this.getAll().forEach((project) => categories.add(project.category));
    return [...categories];
  }

  getById(id: string): Project | undefined {
    return this.getAll().find((project) => project.id === id);
  }

  getBySlug(slug: string): Project | undefined {
    return this.getAll().find((project) => project.slug === slug);
  }

  getByCategory(category: string): Project[] {
    const projects = this.getPublished();
    if (category === 'Tous') return projects;
    return projects.filter((project) => project.category === category);
  }

  getFeatured(count: number = 3): Project[] {
    return this.getPublished().slice(0, count);
  }

  save(project: Project): Project {
    const trustedProject = normalizeProject(project);
    const projects = this.getAll();

    if (!trustedProject.id.trim() || !trustedProject.title || !trustedProject.client || !trustedProject.category) {
      throw new Error('Invalid project payload');
    }

    const slugConflict = projects.find((candidate) => candidate.slug === trustedProject.slug && candidate.id !== trustedProject.id);
    if (slugConflict) {
      throw new Error('Project slug already exists');
    }

    const index = projects.findIndex((candidate) => candidate.id === trustedProject.id);

    if (index >= 0) {
      trustedProject.createdAt = projects[index].createdAt || trustedProject.createdAt;
      projects[index] = trustedProject;
    } else {
      projects.push(trustedProject);
    }

    const ordered = projects.sort(compareProjects);
    writeToStorage(PROJECT_STORAGE_KEY, ordered);
    return trustedProject;
  }

  delete(id: string): void {
    writeToStorage(
      PROJECT_STORAGE_KEY,
      this.getAll().filter((project) => project.id !== id),
    );
  }
}

export const projectRepository: ProjectRepository = new LocalProjectRepository();
