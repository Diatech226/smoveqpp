import { RUNTIME_CONFIG } from '../config/runtimeConfig';
import type { BlogPost } from '../domain/contentSchemas';

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
  error?: { code?: string; message?: string };
}

export interface EditorialAnalytics {
  drafts: number;
  inReview: number;
  published: number;
  archived: number;
  recentlyUpdated: Array<{ id: string; title: string; status: BlogPost['status']; publishedDate: string }>;
}

const CONTENT_BASE_URL = `${RUNTIME_CONFIG.apiBaseUrl}/content`;

async function request<T>(path: string, init: RequestInit = {}): Promise<ApiEnvelope<T>> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${CONTENT_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  const body = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || !body?.success) {
    throw new Error(body?.error?.message || `CONTENT_API_${response.status}`);
  }

  return body;
}

export async function fetchBackendBlogPosts(): Promise<BlogPost[]> {
  const body = await request<{ posts: BlogPost[] }>('/blog');
  return body.data?.posts || [];
}

export async function saveBackendBlogPost(post: BlogPost): Promise<BlogPost> {
  const body = await request<{ post: BlogPost }>('/blog', {
    method: 'POST',
    body: JSON.stringify(post),
  });
  return body.data!.post;
}

export async function transitionBackendBlogPost(id: string, status: BlogPost['status']): Promise<BlogPost> {
  const body = await request<{ post: BlogPost }>(`/blog/${id}/transition`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  });
  return body.data!.post;
}

export async function deleteBackendBlogPost(id: string): Promise<void> {
  await request('/blog/' + id, { method: 'DELETE' });
}

export async function fetchEditorialAnalytics(): Promise<EditorialAnalytics> {
  const body = await request<{ analytics: EditorialAnalytics }>('/analytics');
  return body.data!.analytics;
}
