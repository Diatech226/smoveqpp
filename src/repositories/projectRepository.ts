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

const asTrimmedString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const normalizeProject = (project: Partial<Project> & { id: string }): Project => {
  const title = asTrimmedString(project.title);
  const now = new Date().toISOString();
  const slug = toSlug(asTrimmedString(project.slug) || title || project.id);
  const summary = asTrimmedString(project.summary);
  const description = asTrimmedString(project.description) || summary || 'Description à compléter.';

  return {
    ...project,
    id: asTrimmedString(project.id),
    title,
    client: asTrimmedString(project.client),
    category: asTrimmedString(project.category),
    year: asTrimmedString(project.year) || new Date().getFullYear().toString(),
    description,
    challenge: asTrimmedString(project.challenge) || 'Challenge à compléter.',
    solution: asTrimmedString(project.solution) || 'Solution à compléter.',
    results: Array.isArray(project.results) ? project.results.map((entry) => asTrimmedString(entry)).filter(Boolean) : [],
    tags: Array.isArray(project.tags) ? project.tags.map((entry) => asTrimmedString(entry)).filter(Boolean) : [],
    mainImage: asTrimmedString(project.mainImage) || 'project cover image',
    images: Array.isArray(project.images) ? project.images.map((entry) => asTrimmedString(entry)).filter(Boolean) : [],
    slug,
    summary: summary || undefined,
    featured: Boolean(project.featured),
    status: project.status ?? 'published',
    createdAt: toIsoOrNow(project.createdAt),
    updatedAt: now,
    links: project.links
      ? {
          live: asTrimmedString(project.links.live) || undefined,
          caseStudy: asTrimmedString(project.links.caseStudy) || undefined,
        }
      : undefined,
    testimonial:
      project.testimonial &&
      asTrimmedString(project.testimonial.text) &&
      asTrimmedString(project.testimonial.author) &&
      asTrimmedString(project.testimonial.position)
        ? {
            text: asTrimmedString(project.testimonial.text),
            author: asTrimmedString(project.testimonial.author),
            position: asTrimmedString(project.testimonial.position),
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
  replaceAll(projects: Project[]): Project[];
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

  replaceAll(projects: Project[]): Project[] {
    const normalized = this.validateProjects(projects);
    writeToStorage(PROJECT_STORAGE_KEY, normalized);
    return normalized;
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
