import type { MediaFile } from '../domain/contentSchemas';
import {
  deleteBackendMediaFile,
  fetchBackendMediaFiles,
  replaceBackendMediaFile,
  uploadBackendMediaFile,
} from '../utils/contentApi';

type MediaMetadata = {
  name?: string;
  label?: string;
  title?: string;
  alt?: string;
  caption?: string;
  tags?: string[];
};

export function normalizeMedia(input: unknown): MediaFile {
  const source = (input || {}) as Partial<MediaFile> & { mediaType?: string; path?: string };
  const filename = `${source.filename || source.name || source.label || ''}`.trim();
  const now = new Date().toISOString();
  return {
    id: `${source.id || ''}`,
    name: `${source.name || source.label || filename || source.id || 'media'}`,
    label: `${source.label || source.title || source.name || filename || 'Media'}`,
    filename,
    title: `${source.title || source.label || source.name || filename || ''}`,
    type: (source.type || source.mediaType || (source.mimeType || '').startsWith('image/') ? 'image' : 'document') as MediaFile['type'],
    mimeType: `${source.mimeType || source.metadata?.mimeType || ''}`,
    size: Number(source.size || 0),
    url: `${source.url || source.publicPath || source.path || (filename ? `/uploads/${filename}` : '')}`,
    publicPath: `${source.publicPath || source.path || (filename ? `/uploads/${filename}` : '')}`,
    alt: `${source.alt || ''}`,
    caption: `${source.caption || ''}`,
    createdAt: `${source.createdAt || source.uploadedDate || now}`,
    updatedAt: `${source.updatedAt || source.createdAt || source.uploadedDate || now}`,
    uploadedDate: `${source.uploadedDate || source.createdAt || now}`,
    tags: Array.isArray(source.tags) ? source.tags : [],
    archivedAt: source.archivedAt ?? null,
    source: source.source || 'api',
  } as MediaFile;
}

export function normalizeMediaList(payload: unknown): MediaFile[] {
  const list = Array.isArray(payload)
    ? payload
    : (payload as { mediaFiles?: unknown[]; media?: unknown[]; data?: unknown[] } | null)?.mediaFiles
      || (payload as { media?: unknown[] } | null)?.media
      || (payload as { data?: unknown[] } | null)?.data
      || [];
  return list.map((entry) => normalizeMedia(entry)).filter((entry) => Boolean(entry.id));
}

export async function listMedia(): Promise<MediaFile[]> {
  const mediaFiles = await fetchBackendMediaFiles();
  return normalizeMediaList(mediaFiles);
}

export async function uploadMedia(file: File, metadata: MediaMetadata = {}): Promise<MediaFile> {
  const uploaded = await uploadBackendMediaFile({
    file,
    filename: file.name,
    title: metadata.title || metadata.label || metadata.name || file.name,
    alt: metadata.alt || file.name,
    caption: metadata.caption || '',
    tags: metadata.tags || [],
  });

  const candidate = normalizeMedia(uploaded);
  if (!candidate.id) {
    throw new Error('Réponse API invalide: média uploadé sans identifiant.');
  }

  const refreshed = await listMedia();
  const uploadedInList = refreshed.find((item) => item.id === candidate.id);
  if (!uploadedInList) {
    throw new Error('Fichier uploadé mais absent de la liste média après rafraîchissement.');
  }
  return uploadedInList;
}

export async function updateMedia(id: string, payload: Partial<MediaFile>): Promise<MediaFile> {
  return normalizeMedia(await replaceBackendMediaFile(id, payload));
}

export async function deleteMedia(id: string): Promise<void> {
  return deleteBackendMediaFile(id);
}
