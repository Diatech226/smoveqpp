import type { MediaFile } from '../domain/contentSchemas';
import { RUNTIME_CONFIG } from '../config/runtimeConfig';

const HTTP_SCHEME_PATTERN = /^[a-zA-Z][a-zA-Z\d+.-]*:/;
const DEFAULT_API_ORIGIN = 'https://smoveapi-1.onrender.com';

const toApiOrigin = (): string => {
  const configured = (import.meta.env.VITE_API_ORIGIN as string | undefined)?.trim() || RUNTIME_CONFIG.apiBaseUrl;
  if (!configured) return DEFAULT_API_ORIGIN;
  try { return new URL(configured).origin; } catch { return DEFAULT_API_ORIGIN; }
};

const isDev = () => import.meta.env.DEV;
const logUnresolved = (reason: string, value: unknown) => { if (isDev()) console.warn(`[cms-media-resolver] ${reason}`, value); };

export const absolutizeMediaPath = (value: string): string => {
  const normalized = value.trim();
  if (!normalized) return '';
  if (HTTP_SCHEME_PATTERN.test(normalized) || normalized.startsWith('//') || normalized.startsWith('data:') || normalized.startsWith('blob:')) return normalized;
  const apiOrigin = toApiOrigin();
  if (normalized.startsWith('/')) return `${apiOrigin}${normalized}`;
  if (normalized.startsWith('uploads/')) return `${apiOrigin}/${normalized}`;
  return normalized;
};

export const normalizeMediaReference = (value: unknown): string => {
  const normalized = `${value || ''}`.trim();
  if (!normalized) return '';
  if (normalized.startsWith('media:')) return `media:${normalized.slice(6).trim()}`;
  if (HTTP_SCHEME_PATTERN.test(normalized)) return normalized;
  if (normalized.startsWith('/uploads/') || normalized.startsWith('uploads/')) return absolutizeMediaPath(normalized);
  if (/^[a-zA-Z0-9_-]{6,}$/.test(normalized)) return `media:${normalized}`;
  return '';
};

const matchById = (id: string, mediaList: MediaFile[]): MediaFile | null => mediaList.find((item) => item.id === id && !item.archivedAt) ?? null;

export const resolveMediaUrl = (value: unknown, mediaList: MediaFile[] = []): string => {
  const normalized = `${value || ''}`.trim();
  if (!normalized) return '';
  if (normalized.startsWith('media:')) {
    const mediaId = normalized.slice(6).trim();
    const matched = mediaId ? matchById(mediaId, mediaList) : null;
    if (!matched) { logUnresolved('missing media ref', normalized); return ''; }
    return resolveMediaUrl(matched, mediaList);
  }
  const byId = matchById(normalized, mediaList);
  if (byId) return resolveMediaUrl(byId, mediaList);
  if (typeof value === 'object') {
    const candidate = value as Partial<MediaFile> & { publicPath?: string; filename?: string };
    return absolutizeMediaPath((candidate.url || candidate.publicPath || (candidate.filename ? `/uploads/${candidate.filename}` : '') || '').trim());
  }
  if (HTTP_SCHEME_PATTERN.test(normalized) || normalized.startsWith('/uploads/') || normalized.startsWith('uploads/')) return absolutizeMediaPath(normalized);
  logUnresolved('unsupported value', normalized);
  return '';
};
