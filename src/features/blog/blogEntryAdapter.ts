import type { BlogPost } from '../../domain/contentSchemas';

export interface CanonicalBlogSeo {
  title: string;
  description: string;
  canonicalSlug: string;
}

export interface CanonicalBlogEntry {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  featuredImage: string;
  readTime: string;
  publishedDate: string;
  status: BlogPost['status'];
  seo: CanonicalBlogSeo;
}

export interface CmsBlogInput {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  featuredImage?: string;
  readTime?: string;
  status: BlogPost['status'];
  publishedDate?: string;
}

const FALLBACK_IMAGE_QUERY = 'blog article image';

export function normalizeSlug(rawSlug: string, fallbackTitle?: string): string {
  const base = (rawSlug || fallbackTitle || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  return base || 'article-sans-titre';
}

function safeDateString(value: string): string {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? new Date(0).toISOString() : new Date(parsed).toISOString();
}

export function toCanonicalBlogEntry(post: BlogPost): CanonicalBlogEntry {
  const excerpt = post.excerpt || post.content.slice(0, 160) || 'Contenu indisponible.';
  const title = post.title || 'Article sans titre';
  const slug = normalizeSlug(post.slug, title);

  return {
    id: post.id,
    slug,
    title,
    excerpt,
    content: post.content || '',
    author: post.author || 'Équipe SMOVE',
    category: post.category || 'Non classé',
    featuredImage: post.featuredImage || FALLBACK_IMAGE_QUERY,
    readTime: post.readTime || '5 min',
    publishedDate: safeDateString(post.publishedDate),
    status: post.status,
    seo: {
      title,
      description: excerpt,
      canonicalSlug: slug,
    },
  };
}

export function fromCmsBlogInput(input: CmsBlogInput): BlogPost {
  const title = input.title.trim();
  const slug = normalizeSlug(input.slug, title);
  const excerpt = input.excerpt.trim() || input.content.trim().slice(0, 160);

  return {
    id: input.id || `post-${Date.now()}`,
    title,
    slug,
    excerpt,
    content: input.content.trim(),
    author: input.author.trim() || 'Équipe SMOVE',
    authorRole: 'CMS Editor',
    category: input.category.trim() || 'Non classé',
    tags: [],
    publishedDate: input.publishedDate || new Date().toISOString(),
    readTime: input.readTime?.trim() || '5 min',
    featuredImage: input.featuredImage?.trim() || FALLBACK_IMAGE_QUERY,
    images: input.featuredImage?.trim() ? [input.featuredImage.trim()] : [],
    status: input.status,
  };
}
