import type { MediaFile } from '../domain/contentSchemas';
import { RUNTIME_CONFIG } from '../config/runtimeConfig';

const HTTP_SCHEME_PATTERN = /^[a-zA-Z][a-zA-Z\d+.-]*:/;
const DEFAULT_API_ORIGIN = 'https://smoveapi-1.onrender.com';

export const getCmsApiOrigin = (): string => {
  const configured = (import.meta.env.VITE_API_ORIGIN as string | undefined)?.trim() || RUNTIME_CONFIG.apiBaseUrl;
  if (!configured) return DEFAULT_API_ORIGIN;
  try { return new URL(configured).origin; } catch { return DEFAULT_API_ORIGIN; }
};

const clean = (value: unknown) => `${value || ''}`.trim();

export const absolutizeMediaPath = (value: string): string => {
  const normalized = clean(value);
  if (!normalized || normalized.startsWith('blob:')) return '';
  if (HTTP_SCHEME_PATTERN.test(normalized) || normalized.startsWith('//') || normalized.startsWith('data:')) return normalized;
  const apiOrigin = getCmsApiOrigin();
  if (normalized.startsWith('/uploads/')) return `${apiOrigin}${normalized}`;
  if (normalized.startsWith('uploads/')) return `${apiOrigin}/${normalized}`;
  if (normalized.startsWith('/')) return `${apiOrigin}${normalized}`;
  if (normalized.includes('/')) return `${apiOrigin}/${normalized.replace(/^\/+/, '')}`;
  return `${apiOrigin}/uploads/${normalized}`;
};

const matchById = (id: string, mediaList: MediaFile[]): MediaFile | null => mediaList.find((item) => item.id === id && !item.archivedAt) ?? null;

export const resolveMediaUrl = (value: unknown, mediaList: MediaFile[] = []): string => {
  const normalized = clean(value);
  if (!normalized) return '';

  if (normalized.startsWith('media:')) {
    const mediaId = normalized.slice(6).trim();
    const media = mediaId ? matchById(mediaId, mediaList) : null;
    if (!media) return '';
    return resolveMediaUrl(media, mediaList);
  }

  const byId = matchById(normalized, mediaList);
  if (byId) return resolveMediaUrl(byId, mediaList);

  if (typeof value === 'object') {
    const media = value as Partial<MediaFile>;
    const candidate = clean(media.url) || clean(media.publicPath) || clean(media.filename);
    if (!candidate || candidate.startsWith('media:') || candidate.startsWith('blob:')) return '';
    return absolutizeMediaPath(candidate);
  }

  if (normalized.startsWith('blob:')) return '';
  if (HTTP_SCHEME_PATTERN.test(normalized) || normalized.startsWith('/uploads/') || normalized.startsWith('uploads/')) {
    return absolutizeMediaPath(normalized);
  }

  return normalized.includes('.') ? absolutizeMediaPath(normalized) : '';
};

export const normalizeMediaReference = (value: unknown): string => {
  const normalized = clean(value);
  if (!normalized || normalized.startsWith('blob:')) return '';
  if (normalized.startsWith('media:')) return `media:${normalized.slice(6).trim()}`;
  if (HTTP_SCHEME_PATTERN.test(normalized)) return normalized;
  if (normalized.startsWith('/uploads/') || normalized.startsWith('uploads/')) return absolutizeMediaPath(normalized);
  if (/^[a-zA-Z0-9_-]{6,}$/.test(normalized)) return `media:${normalized}`;
  return normalized.includes('.') ? absolutizeMediaPath(normalized) : '';
};
