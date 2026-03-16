import { blogRepository } from '../../repositories/blogRepository';
import type { BlogPost } from '../../domain/contentSchemas';
import { fetchPublicBlogPosts } from '../../utils/contentApi';
import { evaluatePublishability, toCanonicalBlogEntry } from './blogEntryAdapter';

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

const formatDate = (value: string) => {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return 'Date indisponible';
  }
  return new Date(parsed).toLocaleDateString('fr-FR');
};

const isRenderablePublishedEntry = (entry: ReturnType<typeof toCanonicalBlogEntry>) =>
  evaluatePublishability(entry).publishable;

const toListItem = (entry: ReturnType<typeof toCanonicalBlogEntry>, featuredId?: string): BlogListItem => ({
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


const toDetailContract = (entry: ReturnType<typeof toCanonicalBlogEntry>): BlogDetailContract => ({
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
  const categories = ['Tous', ...new Set(items.map((post) => post.category))];

  return {
    categories,
    posts: items,
  };
};

export function getBlogContentContract(): BlogContentContract {
  return toContractFromPosts(blogRepository.getAll());
}

export async function getBlogContentContractFromSource(): Promise<BlogContentContract> {
  try {
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

  const normalizedSlug = slug.trim().toLowerCase();
  const sourcePosts = await getBlogContentContractFromSource();
  const fromList = sourcePosts.posts.find((post) => post.slug === normalizedSlug || post.seo.canonicalSlug === normalizedSlug);
  if (fromList) {
    const repositoryPost = blogRepository.getAll().find((entry) => entry.slug === fromList.slug && entry.status === 'published');
    if (repositoryPost) {
      const canonical = toCanonicalBlogEntry(repositoryPost);
      if (evaluatePublishability(canonical).publishable) return toDetailContract(canonical);
    }
  }

  const fallback = blogRepository
    .getAll()
    .map(toCanonicalBlogEntry)
    .find((entry) => evaluatePublishability(entry).publishable && (entry.slug === normalizedSlug || entry.seo.canonicalSlug === normalizedSlug));
  return fallback ? toDetailContract(fallback) : undefined;
}
