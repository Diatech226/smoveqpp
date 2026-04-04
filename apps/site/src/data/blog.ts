import { blogRepository } from '../repositories/blogRepository';
import type { BlogPost } from '../domain/contentSchemas';

export type { BlogPost };

export function getBlogPosts(): BlogPost[] {
  return blogRepository.getAll();
}

export function getBlogPostById(id: string): BlogPost | undefined {
  return blogRepository.getById(id);
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogRepository.getBySlug(slug);
}

export function saveBlogPost(post: BlogPost): void {
  blogRepository.save(post);
}

export function deleteBlogPost(id: string): void {
  blogRepository.delete(id);
}

export function getPublishedBlogPosts(): BlogPost[] {
  return blogRepository.getPublished();
}

export function getDraftBlogPosts(): BlogPost[] {
  return blogRepository.getDrafts();
}

export function searchBlogPosts(query: string): BlogPost[] {
  return blogRepository.search(query);
}
