import { RUNTIME_CONFIG } from '../config/runtimeConfig';
import type { MediaFile, Project, Service, TeamMember } from '../domain/contentSchemas';
import type { HomePageContentSettings } from '../data/pageContentSeed';
import { ContentApiError } from './contentApi';

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
  error?: { code?: string; message?: string };
}

const CONTENT_BASE_URL = safeJoinUrl(RUNTIME_CONFIG.apiBaseUrl, 'content', 'public');
const CONTENT_PUBLIC_PATH_PREFIX = /^\/?content\/public(?:\/|$)/;

function safeJoinUrl(...parts: Array<string | undefined>): string {
  const [first = '', ...rest] = parts;
  const base = first.replace(/\/+$/, '');
  const suffix = rest
    .map((part) => `${part || ''}`.trim())
    .filter(Boolean)
    .map((part) => part.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');
  return suffix ? `${base}/${suffix}` : base;
}
const inFlightRequests = new Map<string, Promise<unknown>>();
const TRANSIENT_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizeCollection<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.team)) return record.team as T[];
    if (Array.isArray(record.members)) return record.members as T[];
    if (Array.isArray(record.projects)) return record.projects as T[];
    if (Array.isArray(record.items)) return record.items as T[];
    if (Array.isArray(record.data)) return record.data as T[];
    if (record.data && typeof record.data === 'object') return normalizeCollection<T>(record.data);
  }
  return [];
}

function isTransientError(error: unknown): boolean {
  if (error instanceof ContentApiError) {
    return error.status === 0 || TRANSIENT_STATUS_CODES.has(error.status);
  }

  return error instanceof TypeError;
}

async function requestWithRetry<T>(path: string, retries = 3): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      const normalizedPath = path.replace(CONTENT_PUBLIC_PATH_PREFIX, '').replace(/^\/+/, '');
      const response = await fetch(safeJoinUrl(CONTENT_BASE_URL, normalizedPath), {
        cache: 'no-store',
        credentials: 'omit',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      const body = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

      if (!response.ok || !body?.success || !body.data) {
        const code = body?.error?.code || `CONTENT_API_${response.status || 0}`;
        const message = body?.error?.message || 'Public content source unavailable.';
        throw new ContentApiError(message, code, response.status || 0);
      }

      return body.data;
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
  const data = await request<unknown>('/projects');
  return normalizeCollection<Project>(data);
}

export async function fetchPublicServices(): Promise<Service[]> {
  const data = await request<{ services: Service[] }>('/services');
  return data.services;
}

export async function fetchPublicPageContent(): Promise<HomePageContentSettings> {
  const data = await request<{ pageContent: { home: HomePageContentSettings } }>('/page-content');
  return data.pageContent.home;
}

export async function fetchPublicTeam(): Promise<TeamMember[]> {
  const data = await request<unknown>('/team');
  return normalizeCollection<TeamMember>(data);
}

export async function fetchPublicMediaFiles(): Promise<MediaFile[]> {
  const data = await request<{ mediaFiles: MediaFile[] }>('/media');
  return data.mediaFiles;
}
