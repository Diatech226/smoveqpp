import { isBlogPost, isBlogPostArray, type BlogPost } from '../domain/contentSchemas';
import { defaultBlogPosts } from '../data/blogSeed';
import { readFromStorage, writeToStorage } from './storage/localStorageStore';

const BLOG_STORAGE_KEY = 'smove_blog_posts';

export type BlogRepositoryErrorCode = 'BLOG_VALIDATION_ERROR' | 'BLOG_SLUG_CONFLICT';

export class BlogRepositoryError extends Error {
  constructor(
    message: string,
    public readonly code: BlogRepositoryErrorCode,
  ) {
    super(message);
    this.name = 'BlogRepositoryError';
  }
}

export interface BlogRepository {
  getAll(): BlogPost[];
  getById(id: string): BlogPost | undefined;
  getBySlug(slug: string): BlogPost | undefined;
  save(post: BlogPost): void;
  delete(id: string): void;
  getPublished(): BlogPost[];
  getDrafts(): BlogPost[];
  search(query: string): BlogPost[];
}

class LocalBlogRepository implements BlogRepository {
  getAll(): BlogPost[] {
    return readFromStorage(BLOG_STORAGE_KEY, isBlogPostArray, defaultBlogPosts, { persistFallback: true });
  }

  getById(id: string): BlogPost | undefined {
    return this.getAll().find((post) => post.id === id);
  }

  getBySlug(slug: string): BlogPost | undefined {
    return this.getAll().find((post) => post.slug === slug);
  }

  save(post: BlogPost): void {
    if (!isBlogPost(post)) {
      throw new BlogRepositoryError('Invalid blog post payload', 'BLOG_VALIDATION_ERROR');
    }

    const trustedPost = post;
    const posts = this.getAll();

    const slugOwner = posts.find(
      (candidate) => candidate.slug === trustedPost.slug && candidate.id !== trustedPost.id,
    );

    if (slugOwner) {
      throw new BlogRepositoryError('Ce slug est déjà utilisé par un autre article.', 'BLOG_SLUG_CONFLICT');
    }

    const index = posts.findIndex((candidate) => candidate.id === trustedPost.id);

    if (index >= 0) {
      posts[index] = trustedPost;
    } else {
      posts.push(trustedPost);
    }

    writeToStorage(BLOG_STORAGE_KEY, posts);
  }

  delete(id: string): void {
    writeToStorage(
      BLOG_STORAGE_KEY,
      this.getAll().filter((post) => post.id !== id),
    );
  }

  getPublished(): BlogPost[] {
    return this.getAll().filter((post) => post.status === 'published');
  }

  getDrafts(): BlogPost[] {
    return this.getAll().filter((post) => post.status === 'draft');
  }

  search(query: string): BlogPost[] {
    const normalizedQuery = query.toLowerCase();

    return this.getAll().filter(
      (post) =>
        post.title.toLowerCase().includes(normalizedQuery) ||
        post.excerpt.toLowerCase().includes(normalizedQuery) ||
        post.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery)),
    );
  }
}

export const blogRepository: BlogRepository = new LocalBlogRepository();
