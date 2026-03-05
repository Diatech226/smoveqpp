import { projects } from './projects';
import { getBlogPosts } from './blog';

export type ContentType = 'services' | 'projects' | 'posts' | 'events';
export type ContentStatus = 'draft' | 'review' | 'published' | 'archived';

export interface CMSContentItem {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: ContentStatus;
  coverId: string;
  galleryIds: string[];
  videoUrl?: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'smove_cms_content_v1';

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toSeedItems(): CMSContentItem[] {
  const projectItems: CMSContentItem[] = projects.slice(0, 8).map((project, index) => ({
    id: `project-${project.id}`,
    type: 'projects',
    title: project.title,
    slug: slugify(project.id),
    excerpt: project.description,
    content: `${project.challenge}\n\n${project.solution}`,
    status: index % 4 === 0 ? 'draft' : 'published',
    coverId: '',
    galleryIds: [],
    category: project.category,
    createdAt: new Date(Date.now() - index * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - index * 86400000).toISOString(),
  }));

  const postItems: CMSContentItem[] = getBlogPosts().map((post, index) => ({
    id: `post-${post.id}`,
    type: 'posts',
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    status: post.status === 'published' ? 'published' : 'draft',
    coverId: '',
    galleryIds: [],
    videoUrl: '',
    category: post.category,
    createdAt: new Date(Date.now() - index * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - index * 3600000).toISOString(),
  }));

  const serviceItems: CMSContentItem[] = [
    { id: 'service-branding', type: 'services', title: 'Design & Branding', slug: 'design-branding', excerpt: 'Identité visuelle et supports de marque.', content: 'Service de branding complet.', status: 'published', coverId: '', galleryIds: [], category: 'Branding', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'service-web', type: 'services', title: 'Développement Web', slug: 'developpement-web', excerpt: 'Sites et apps performants.', content: 'Développement sur mesure.', status: 'published', coverId: '', galleryIds: [], category: 'Tech', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];

  const eventItems: CMSContentItem[] = [
    { id: 'event-launch', type: 'events', title: 'Lancement nouvelle offre', slug: 'lancement-offre', excerpt: 'Présentation de la nouvelle offre SMOVE.', content: 'Évènement de lancement client.', status: 'draft', coverId: '', galleryIds: [], category: 'Corporate', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ];

  return [...serviceItems, ...projectItems, ...postItems, ...eventItems];
}

export function getCMSContent(): CMSContentItem[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  const seeds = toSeedItems();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeds));
  return seeds;
}

export function saveCMSContent(items: CMSContentItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function upsertCMSContent(item: CMSContentItem) {
  const items = getCMSContent();
  const index = items.findIndex((existing) => existing.id === item.id);
  if (index >= 0) {
    items[index] = item;
  } else {
    items.unshift(item);
  }
  saveCMSContent(items);
}

export function deleteCMSContent(id: string) {
  const items = getCMSContent().filter((item) => item.id !== id);
  saveCMSContent(items);
}

export function getCMSCategories(items: CMSContentItem[]) {
  return Array.from(new Set(items.map((item) => item.category).filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

export function ensureUniqueSlug(items: CMSContentItem[], slug: string, currentId?: string) {
  const clean = slugify(slug);
  const exists = items.some((item) => item.slug === clean && item.id !== currentId);
  return exists ? `${clean}-${Math.random().toString(36).slice(2, 6)}` : clean;
}
