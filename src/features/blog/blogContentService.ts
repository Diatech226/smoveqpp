import { blogRepository } from '../../repositories/blogRepository';
import { toCanonicalBlogEntry } from './blogEntryAdapter';

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
});

export function getBlogContentContract(): BlogContentContract {
  const canonicalEntries = blogRepository
    .getPublished()
    .map(toCanonicalBlogEntry)
    .filter((post) => Boolean(post.id && post.slug && post.title))
    .sort((a, b) => {
      const byDate = Date.parse(b.publishedDate) - Date.parse(a.publishedDate);
      return byDate !== 0 ? byDate : a.slug.localeCompare(b.slug);
    });

  const [firstPost] = canonicalEntries;
  const posts = canonicalEntries.map((entry) => toListItem(entry, firstPost?.id));
  const categories = ['Tous', ...new Set(posts.map((post) => post.category))];

  return {
    categories,
    posts,
  };
}

export function getBlogPostBySlugContract(slug: string): BlogListItem | undefined {
  if (!slug) {
    return undefined;
  }

  const post = blogRepository.getBySlug(slug);

  if (!post || post.status !== 'published') {
    return undefined;
  }

  return toListItem(toCanonicalBlogEntry(post));
}
