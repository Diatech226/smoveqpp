import { projects } from './projects';
import { getBlogPosts } from './blog';
import { generateUniqueSlug, slugify } from '../utils/slug';

export type ContentType = 'services' | 'projects' | 'posts' | 'events';
export type ContentStatus = 'draft' | 'review' | 'scheduled' | 'published' | 'archived' | 'removed';

export type PostBlockType = 'heading' | 'subheading' | 'paragraph' | 'image' | 'gallery' | 'video' | 'quote' | 'cta';
export interface PostBlock {
  id: string;
  type: PostBlockType;
  data: Record<string, string | string[] | undefined>;
}

export interface CMSContentItem {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: ContentStatus;
  coverId: string;
  coverAltText?: string;
  galleryIds: string[];
  videoUrl?: string;
  category: string;
  publishedAt?: string | null;
  viewsCount?: number;
  commentsCount?: number;
  contentBlocks?: PostBlock[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'smove_cms_content_v2';

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
    coverAltText: '',
    galleryIds: [],
    category: project.category,
    viewsCount: 0,
    commentsCount: 0,
    createdAt: new Date(Date.now() - index * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - index * 86400000).toISOString(),
    publishedAt: index % 4 === 0 ? null : new Date(Date.now() - index * 86400000).toISOString(),
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
    coverAltText: '',
    galleryIds: [],
    videoUrl: '',
    category: post.category,
    viewsCount: Math.max(0, 100 - (index * 9)),
    commentsCount: Math.max(0, 24 - (index * 2)),
    contentBlocks: [
      { id: `b-${index}-1`, type: 'heading', data: { text: post.title } },
      { id: `b-${index}-2`, type: 'paragraph', data: { text: post.excerpt } },
      { id: `b-${index}-3`, type: 'paragraph', data: { text: post.content.slice(0, 220) } },
    ],
    createdAt: new Date(Date.now() - index * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - index * 3600000).toISOString(),
    publishedAt: post.status === 'published' ? new Date(Date.now() - index * 3600000).toISOString() : null,
  }));

  const now = new Date().toISOString();

  const serviceItems: CMSContentItem[] = [
    { id: 'service-branding', type: 'services', title: 'Design & Branding', slug: 'design-branding', excerpt: 'Identité visuelle et supports de marque.', content: 'Service de branding complet.', status: 'published', coverId: '', coverAltText: '', galleryIds: [], category: 'Branding', viewsCount: 0, commentsCount: 0, createdAt: now, updatedAt: now, publishedAt: now },
    { id: 'service-web', type: 'services', title: 'Développement Web', slug: 'developpement-web', excerpt: 'Sites et apps performants.', content: 'Développement sur mesure.', status: 'published', coverId: '', coverAltText: '', galleryIds: [], category: 'Tech', viewsCount: 0, commentsCount: 0, createdAt: now, updatedAt: now, publishedAt: now },
  ];

  const eventItems: CMSContentItem[] = [
    { id: 'event-launch', type: 'events', title: 'Lancement nouvelle offre', slug: 'lancement-offre', excerpt: 'Présentation de la nouvelle offre SMOVE.', content: 'Évènement de lancement client.', status: 'scheduled', coverId: '', coverAltText: '', galleryIds: [], category: 'Corporate', viewsCount: 0, commentsCount: 0, createdAt: now, updatedAt: now, publishedAt: new Date(Date.now() + 86400000).toISOString() },
  ];

  return [...serviceItems, ...projectItems, ...postItems, ...eventItems];
}

export function getCMSContent(): CMSContentItem[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored).map(resolveScheduledPublication);
  const seeds = toSeedItems();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeds));
  return seeds;
}

function resolveScheduledPublication(item: CMSContentItem): CMSContentItem {
  if (item.status === 'scheduled' && item.publishedAt && Date.now() >= new Date(item.publishedAt).getTime()) {
    return { ...item, status: 'published' };
  }
  return item;
}

export function getPublicPublishedContent(type: ContentType) {
  return getCMSContent().filter((item) => item.type === type && item.status === 'published');
}

export function saveCMSContent(items: CMSContentItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function upsertCMSContent(item: CMSContentItem) {
  const items = getCMSContent();
  const index = items.findIndex((existing) => existing.id === item.id);
  if (index >= 0) items[index] = item;
  else items.unshift(item);
  saveCMSContent(items);
}

export function deleteCMSContent(id: string) {
  const items = getCMSContent().filter((item) => item.id !== id);
  saveCMSContent(items);
}

export function getCMSCategories(items: CMSContentItem[]) {
  return Array.from(new Set(items.map((item) => item.category).filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

export function ensureUniqueSlug(items: CMSContentItem[], slug: string, currentId?: string, lockSlug = false) {
  return generateUniqueSlug(items, slug, { excludeId: currentId, lockSlug });
}
