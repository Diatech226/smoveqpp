import { isBlogPost, isBlogPostArray, type BlogPost } from '../domain/contentSchemas';
import { defaultBlogPosts } from '../data/blogSeed';
import { readFromStorage, writeToStorage } from './storage/localStorageStore';

const BLOG_STORAGE_KEY = 'smove_blog_posts';

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
      throw new Error('Invalid blog post payload');
    }

    const trustedPost = post;
    const posts = this.getAll();
    const slugConflict = posts.find(
      (candidate) =>
        candidate.slug.toLowerCase() === trustedPost.slug.toLowerCase() &&
        candidate.id !== trustedPost.id,
    );

    if (slugConflict) {
      throw new Error('Slug already exists for another blog post');
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
    return this.getAll()
      .filter((post) => post.status === 'published')
      .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
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
