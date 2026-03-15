import { RUNTIME_CONFIG } from '../config/runtimeConfig';
import type { BlogPost, MediaFile, Project, Service } from '../domain/contentSchemas';
import type { HomePageContentSettings } from '../data/pageContentSeed';

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
  error?: { code?: string; message?: string };
}

export class ContentApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ContentApiError';
  }
}

export interface EditorialAnalytics {
  drafts: number;
  inReview: number;
  published: number;
  archived: number;
  recentlyUpdated: Array<{ id: string; title: string; status: BlogPost['status']; publishedDate: string }>;
}


export interface MediaUploadPayload {
  filename: string;
  title?: string;
  dataUrl: string;
  alt?: string;
  caption?: string;
  tags?: string[];
}

export interface CmsSettings {
  siteTitle: string;
  supportEmail: string;
  instantPublishing: boolean;
}

const CONTENT_BASE_URL = `${RUNTIME_CONFIG.apiBaseUrl}/content`;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
    const code = body?.error?.code || `CONTENT_API_${response.status}`;
    const message = body?.error?.message || `CONTENT_API_${response.status}`;
    throw new ContentApiError(message, code, response.status);
  }

  return body;
}

export async function requestWithRetry<T>(
  operation: () => Promise<T>,
  options: { retries?: number; retryDelayMs?: number } = {},
): Promise<T> {
  const retries = options.retries ?? 1;
  const retryDelayMs = options.retryDelayMs ?? 250;

  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= retries) {
        throw error;
      }
      attempt += 1;
      await wait(retryDelayMs * attempt);
    }
  }
}

export async function fetchBackendBlogPosts(): Promise<BlogPost[]> {
  const body = await request<{ posts: BlogPost[] }>('/blog');
  return body.data?.posts || [];
}

export async function fetchPublicBlogPosts(): Promise<BlogPost[]> {
  const response = await fetch(`${CONTENT_BASE_URL}/public/blog`, {
    credentials: 'include',
  });

  const body = (await response.json().catch(() => null)) as ApiEnvelope<{ posts: BlogPost[] }> | null;
  if (!response.ok || !body?.success) {
    const code = body?.error?.code || `CONTENT_API_${response.status}`;
    const message = body?.error?.message || `CONTENT_API_${response.status}`;
    throw new ContentApiError(message, code, response.status);
  }

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

export async function fetchBackendProjects(): Promise<Project[]> {
  const body = await request<{ projects: Project[] }>('/projects');
  return body.data?.projects || [];
}

export async function saveBackendProject(project: Project): Promise<Project> {
  const body = await request<{ project: Project }>('/projects', {
    method: 'POST',
    body: JSON.stringify(project),
  });
  return body.data!.project;
}

export async function deleteBackendProject(id: string): Promise<void> {
  await request('/projects/' + id, { method: 'DELETE' });
}


export async function fetchBackendServices(): Promise<Service[]> {
  const body = await request<{ services: Service[] }>('/services');
  return body.data?.services || [];
}

export async function saveBackendService(service: Service): Promise<Service> {
  const body = await request<{ service: Service }>('/services', {
    method: 'POST',
    body: JSON.stringify(service),
  });
  return body.data!.service;
}

export async function deleteBackendService(id: string): Promise<void> {
  await request('/services/' + id, { method: 'DELETE' });
}

export async function fetchBackendMediaFiles(): Promise<MediaFile[]> {
  const body = await request<{ mediaFiles: MediaFile[] }>('/media');
  return body.data?.mediaFiles || [];
}


export async function uploadBackendMediaFile(payload: MediaUploadPayload): Promise<MediaFile> {
  const body = await request<{ mediaFile: MediaFile }>('/media/upload', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return body.data!.mediaFile;
}

export async function saveBackendMediaFile(mediaFile: MediaFile): Promise<MediaFile> {
  const body = await request<{ mediaFile: MediaFile }>('/media', {
    method: 'POST',
    body: JSON.stringify(mediaFile),
  });
  return body.data!.mediaFile;
}

export async function deleteBackendMediaFile(id: string): Promise<void> {
  await request('/media/' + id, { method: 'DELETE' });
}

export async function fetchBackendPageContent(): Promise<HomePageContentSettings> {
  const body = await request<{ pageContent: { home: HomePageContentSettings } }>('/page-content');
  return body.data?.pageContent?.home as HomePageContentSettings;
}

export async function saveBackendPageContent(home: HomePageContentSettings): Promise<HomePageContentSettings> {
  const body = await request<{ pageContent: { home: HomePageContentSettings } }>('/page-content', {
    method: 'POST',
    body: JSON.stringify({ home }),
  });
  return body.data!.pageContent.home;
}

export async function fetchBackendSettings(): Promise<CmsSettings> {
  const body = await request<{ settings: CmsSettings }>('/settings');
  return body.data!.settings;
}

export async function saveBackendSettings(settings: CmsSettings): Promise<CmsSettings> {
  const body = await request<{ settings: CmsSettings }>('/settings', {
    method: 'POST',
    body: JSON.stringify(settings),
  });
  return body.data!.settings;
}
