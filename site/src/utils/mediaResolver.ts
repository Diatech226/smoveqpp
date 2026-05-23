import type { MediaFile } from '../domain/contentSchemas';
import { RUNTIME_CONFIG } from '../config/runtimeConfig';

const HTTP_SCHEME_PATTERN = /^[a-zA-Z][a-zA-Z\d+.-]*:/;
const DEFAULT_API_ORIGIN = 'https://smoveapi-1.onrender.com';

const toApiOrigin = (): string => {
  const configured = (import.meta.env.VITE_API_ORIGIN as string | undefined)?.trim() || RUNTIME_CONFIG.apiBaseUrl;
  if (!configured) return DEFAULT_API_ORIGIN;
  try {
    return new URL(configured).origin;
  } catch {
    return DEFAULT_API_ORIGIN;
  }
};

export const absolutizeMediaPath = (value: string): string => {
  const normalized = value.trim();
  if (!normalized) return '';
  if (HTTP_SCHEME_PATTERN.test(normalized) || normalized.startsWith('//') || normalized.startsWith('data:') || normalized.startsWith('blob:')) return normalized;

  const apiOrigin = toApiOrigin();
  if (normalized.startsWith('/')) return `${apiOrigin}${normalized}`;
  if (normalized.startsWith('uploads/')) return `${apiOrigin}/${normalized}`;
  return normalized;
};

const matchById = (id: string, mediaList: MediaFile[]): MediaFile | null => mediaList.find((item) => item.id === id) ?? null;

export const resolveMediaUrl = (value: unknown, mediaList: MediaFile[] = []): string => {
  if (!value) return '';
  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!normalized) return '';
    if (normalized.startsWith('media:')) {
      const mediaId = normalized.slice('media:'.length).trim();
      const matched = mediaId ? matchById(mediaId, mediaList) : null;
      return matched ? resolveMediaUrl(matched, mediaList) : '';
    }
    const byId = matchById(normalized, mediaList);
    if (byId) return resolveMediaUrl(byId, mediaList);
    return absolutizeMediaPath(normalized);
  }

  if (typeof value === 'object') {
    const candidate = value as Partial<MediaFile> & { publicPath?: string; filename?: string };
    const direct = candidate.url || candidate.publicPath || (candidate.filename ? `/uploads/${candidate.filename}` : '') || '';
    return resolveMediaUrl(direct, mediaList);
  }

  return '';
};
