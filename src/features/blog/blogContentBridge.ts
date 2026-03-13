import type { BlogPost } from '../../domain/contentSchemas';
import { blogRepository } from '../../repositories/blogRepository';

export interface BlogSeoMetadata {
  title: string;
  description: string;
  canonicalPath: string;
}

export interface BlogListItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  category: string;
  readTime: string;
  publishedDateLabel: string;
  featuredImage: string;
  featured: boolean;
  seo: BlogSeoMetadata;
}

const FALLBACK_IMAGE_QUERY = 'digital marketing content';

const formatRelativeDate = (dateValue: string): string => {
  const publishedDate = new Date(dateValue);
  if (Number.isNaN(publishedDate.getTime())) {
    return 'Date non disponible';
  }

  const diffInDays = Math.floor((Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffInDays <= 0) return "Aujourd'hui";
  if (diffInDays === 1) return 'Il y a 1 jour';
  if (diffInDays < 7) return `Il y a ${diffInDays} jours`;

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks === 1) return 'Il y a 1 semaine';
  if (diffInWeeks < 5) return `Il y a ${diffInWeeks} semaines`;

  return publishedDate.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const mapToListItem = (post: BlogPost, index: number): BlogListItem => ({
  id: post.id,
  slug: post.slug,
  title: post.title,
  excerpt: post.excerpt,
  author: post.author,
  category: post.category,
  readTime: post.readTime,
  publishedDateLabel: formatRelativeDate(post.publishedDate),
  featuredImage: post.featuredImage || FALLBACK_IMAGE_QUERY,
  featured: index === 0,
  seo: {
    title: post.title,
    description: post.excerpt,
    canonicalPath: `/blog/${post.slug}`,
  },
});

export interface BlogContentBridge {
  getPublishedListItems(): BlogListItem[];
}

class DefaultBlogContentBridge implements BlogContentBridge {
  getPublishedListItems(): BlogListItem[] {
    return blogRepository
      .getPublished()
      .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime())
      .map((post, index) => mapToListItem(post, index));
  }
}

export const blogContentBridge: BlogContentBridge = new DefaultBlogContentBridge();
