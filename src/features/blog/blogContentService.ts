import { blogRepository } from '../../repositories/blogRepository';
import type { BlogPost } from '../../domain/contentSchemas';
import { fetchPublicBlogPostBySlug, fetchPublicBlogPosts } from '../../utils/contentApi';
import { evaluatePublishability, toCanonicalBlogEntry } from './blogEntryAdapter';
import { hydratePublicMediaLibrary } from '../media/publicMediaLibrary';

export interface BlogListItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  image: string;
  readTime: string;
  featured: boolean;
  seo: {
    title: string;
    description: string;
    canonicalSlug: string;
    socialImage: string;
  };
  media: {
    alt: string;
    caption: string;
  };
}


export interface BlogDetailContract {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedDate: string;
  readTime: string;
  category: string;
  featuredImage: string;
  seo: {
    title: string;
    description: string;
    canonicalSlug: string;
    socialImage: string;
  };
  media: {
    alt: string;
    caption: string;
  };
}

export interface BlogContentContract {
  categories: string[];
  posts: BlogListItem[];
}

type CanonicalEntry = ReturnType<typeof toCanonicalBlogEntry>;

const formatDate = (value: string) => {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return 'Date indisponible';
  }
  return new Date(parsed).toLocaleDateString('fr-FR');
};

const isRenderablePublishedEntry = (entry: CanonicalEntry) =>
  evaluatePublishability(entry).publishable;

const toListItem = (entry: CanonicalEntry, featuredId?: string): BlogListItem => ({
  id: entry.id,
  slug: entry.slug,
  title: entry.title,
  excerpt: entry.excerpt,
  author: entry.author,
  date: formatDate(entry.publishedDate),
  category: entry.category,
  image: entry.featuredImage,
  readTime: entry.readTime,
  featured: featuredId ? featuredId === entry.id : false,
  seo: entry.seo,
  media: {
    alt: entry.media.alt,
    caption: entry.media.caption,
  },
});


const toDetailContract = (entry: CanonicalEntry): BlogDetailContract => ({
  id: entry.id,
  slug: entry.seo.canonicalSlug || entry.slug,
  title: entry.title,
  excerpt: entry.excerpt,
  content: entry.content || '',
  author: entry.author,
  publishedDate: entry.publishedDate,
  readTime: entry.readTime,
  category: entry.category || 'Non classé',
  featuredImage: entry.featuredImage,
  seo: entry.seo,
  media: {
    alt: entry.media.alt,
    caption: entry.media.caption,
  },
});

const toContractFromPosts = (posts: BlogPost[]): BlogContentContract => {
  const canonicalEntries = posts
    .map(toCanonicalBlogEntry)
    .filter(isRenderablePublishedEntry)
    .sort((a, b) => {
      const byDate = Date.parse(b.publishedDate) - Date.parse(a.publishedDate);
      return byDate !== 0 ? byDate : a.slug.localeCompare(b.slug);
    });

  const [firstPost] = canonicalEntries;
  const items = canonicalEntries.map((entry) => toListItem(entry, firstPost?.id));
  const categories = ['Tous', ...new Set(items.map((post) => post.category.trim() || 'Non classé'))];

  return {
    categories,
    posts: items,
  };
};

const toRenderableCanonicalEntries = (posts: BlogPost[]): CanonicalEntry[] =>
  posts
    .map(toCanonicalBlogEntry)
    .filter(isRenderablePublishedEntry)
    .sort((a, b) => {
      const byDate = Date.parse(b.publishedDate) - Date.parse(a.publishedDate);
      return byDate !== 0 ? byDate : a.slug.localeCompare(b.slug);
    });

const normalizedSlug = (slug: string) =>
  slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const findBySlug = (entries: CanonicalEntry[], slug: string): CanonicalEntry | undefined => {
  const normalized = normalizedSlug(slug);
  if (!normalized) return undefined;

  // Deterministic precedence:
  // 1) canonical SEO slug
  // 2) normalized primary slug
  // 3) id fallback (legacy compatibility)
  return (
    entries.find((entry) => entry.seo.canonicalSlug === normalized) ||
    entries.find((entry) => entry.slug === normalized) ||
    entries.find((entry) => entry.id === normalized)
  );
};

export function getBlogContentContract(): BlogContentContract {
  return toContractFromPosts(blogRepository.getAll());
}

export async function getBlogContentContractFromSource(): Promise<BlogContentContract> {
  try {
    await hydratePublicMediaLibrary();
    const remotePosts = await fetchPublicBlogPosts();
    if (remotePosts.length > 0) {
      return toContractFromPosts(remotePosts);
    }
  } catch (error) {
    console.warn('[public-content] blog API unavailable, using local repository snapshot.', error);
  }

  return getBlogContentContract();
}

export async function getBlogPostBySlugContract(slug: string): Promise<BlogDetailContract | undefined> {
  if (!slug) {
    return undefined;
  }

  try {
    await hydratePublicMediaLibrary();
    const remotePost = await fetchPublicBlogPostBySlug(slug);
    if (remotePost) {
      const canonical = toCanonicalBlogEntry(remotePost);
      if (isRenderablePublishedEntry(canonical)) return toDetailContract(canonical);
    }
  } catch (error) {
    console.warn('[public-content] blog detail API unavailable, using local repository snapshot.', error);
  }

  const fallback = findBySlug(toRenderableCanonicalEntries(blogRepository.getAll()), slug);
  return fallback ? toDetailContract(fallback) : undefined;
}
