import { RUNTIME_CONFIG } from '../config/runtimeConfig';
import type { MediaFile, Project, Service } from '../domain/contentSchemas';
import type { HomePageContentSettings } from '../data/pageContentSeed';
import { ContentApiError } from './contentApi';

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
  error?: { code?: string; message?: string };
}

const CONTENT_BASE_URL = `${RUNTIME_CONFIG.apiBaseUrl}/content/public`;
const inFlightRequests = new Map<string, Promise<unknown>>();

async function request<T>(path: string): Promise<T> {
  const cacheKey = `GET:${path}`;
  const existing = inFlightRequests.get(cacheKey) as Promise<T> | undefined;
  if (existing) return existing;

  const pending = fetch(`${CONTENT_BASE_URL}${path}`, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  })
    .then(async (response) => {
      const body = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

      if (!response.ok || !body?.success || !body.data) {
        const code = body?.error?.code || `CONTENT_API_${response.status || 0}`;
        const message = body?.error?.message || 'Public content source unavailable.';
        throw new ContentApiError(message, code, response.status || 0);
      }

      return body.data;
    })
    .finally(() => {
      inFlightRequests.delete(cacheKey);
    });

  inFlightRequests.set(cacheKey, pending);
  return pending;
}

export async function fetchPublicProjects(): Promise<Project[]> {
  const data = await request<{ projects: Project[] }>('/projects');
  return data.projects;
}

export async function fetchPublicServices(): Promise<Service[]> {
  const data = await request<{ services: Service[] }>('/services');
  return data.services;
}

export async function fetchPublicPageContent(): Promise<HomePageContentSettings> {
  const data = await request<{ pageContent: { home: HomePageContentSettings } }>('/page-content');
  return data.pageContent.home;
}

export async function fetchPublicMediaFiles(): Promise<MediaFile[]> {
  const data = await request<{ mediaFiles: MediaFile[] }>('/media');
  return data.mediaFiles;
}
