import { blogRepository } from '../../repositories/blogRepository';
import type { BlogPost } from '../../domain/contentSchemas';

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
}

export interface BlogContentContract {
  categories: string[];
  posts: BlogListItem[];
}

const FALLBACK_CATEGORY = 'Non classé';

const isValidDate = (value: string) => !Number.isNaN(Date.parse(value));

const getSafeExcerpt = (post: BlogPost) => post.excerpt || post.content.slice(0, 160) || 'Contenu indisponible.';

const toListItem = (post: BlogPost, featuredId?: string): BlogListItem => ({
  id: post.id,
  slug: post.slug,
  title: post.title || 'Article sans titre',
  excerpt: getSafeExcerpt(post),
  author: post.author || 'Équipe SMOVE',
  date: isValidDate(post.publishedDate) ? new Date(post.publishedDate).toLocaleDateString('fr-FR') : 'Date indisponible',
  category: post.category || FALLBACK_CATEGORY,
  image: post.featuredImage || 'blog article image',
  readTime: post.readTime || '5 min',
  featured: featuredId ? featuredId === post.id : false,
});

export function getBlogContentContract(): BlogContentContract {
  const publishedPosts = blogRepository
    .getPublished()
    .filter((post) => Boolean(post.id && post.slug && post.title))
    .sort((a, b) => (Date.parse(b.publishedDate) || 0) - (Date.parse(a.publishedDate) || 0));

  const [firstPost] = publishedPosts;
  const posts = publishedPosts.map((post) => toListItem(post, firstPost?.id));
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

  return toListItem(post);
}
