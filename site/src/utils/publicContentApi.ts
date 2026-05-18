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
const TRANSIENT_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isTransientError(error: unknown): boolean {
  if (error instanceof ContentApiError) {
    return error.status === 0 || TRANSIENT_STATUS_CODES.has(error.status);
  }

  return error instanceof TypeError;
}

function normalizeBodyData<T>(body: unknown): T {
  if (Array.isArray(body)) {
    return body as T;
  }

  if (body && typeof body === 'object') {
    const envelope = body as ApiEnvelope<T>;
    if (envelope.success && envelope.data) return envelope.data;
    return body as T;
  }

  throw new ContentApiError('Public content source unavailable.', 'CONTENT_API_INVALID_PAYLOAD', 500);
}

async function requestWithRetry<T>(path: string, retries = 3): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      const response = await fetch(`${CONTENT_BASE_URL}${path}`, {
        cache: 'no-store',
        credentials: 'omit',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      const body = await response.json().catch(() => null);

      if (!response.ok || !body) {
        const envelope = (body || {}) as ApiEnvelope<T>;
        const code = envelope?.error?.code || `CONTENT_API_${response.status || 0}`;
        const message = envelope?.error?.message || 'Public content source unavailable.';
        throw new ContentApiError(message, code, response.status || 0);
      }

      return normalizeBodyData<T>(body);
    } catch (error) {
      if (attempt >= retries || !isTransientError(error)) {
        throw error;
      }
      attempt += 1;
      await wait(300 * attempt);
    }
  }
}

async function request<T>(path: string): Promise<T> {
  const cacheKey = `GET:${path}`;
  const existing = inFlightRequests.get(cacheKey) as Promise<T> | undefined;
  if (existing) return existing;

  const pending = requestWithRetry<T>(path).finally(() => {
    inFlightRequests.delete(cacheKey);
  });

  inFlightRequests.set(cacheKey, pending);
  return pending;
}

export async function fetchPublicProjects(): Promise<Project[]> {
  const data = await request<{ projects?: Project[] } | Project[]>('/projects');
  return Array.isArray(data) ? data : data.projects || [];
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
