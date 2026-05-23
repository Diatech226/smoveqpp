import type { MediaFile } from '../domain/contentSchemas';
import {
  deleteBackendMediaFile,
  fetchBackendMediaFiles,
  replaceBackendMediaFile,
  saveBackendMediaFile,
  uploadBackendMediaFile,
} from '../utils/contentApi';

type MediaMetadata = {
  title?: string;
  alt?: string;
  caption?: string;
  tags?: string[];
};

export async function listMedia(): Promise<MediaFile[]> {
  return fetchBackendMediaFiles();
}

export async function uploadMedia(file: File, metadata: MediaMetadata = {}): Promise<MediaFile> {
  const media = await uploadBackendMediaFile({
    file,
    filename: file.name,
    title: metadata.title || file.name,
    alt: metadata.alt || file.name,
    caption: metadata.caption || '',
    tags: metadata.tags || [],
  });
  if (!media?.id) {
    throw new Error('Upload succeeded but no media id was returned by API.');
  }
  return media;
}

export async function createExternalMedia(payload: MediaFile): Promise<MediaFile> {
  return saveBackendMediaFile(payload);
}

export async function updateMedia(id: string, payload: Partial<MediaFile>): Promise<MediaFile> {
  return replaceBackendMediaFile(id, payload);
}

export async function deleteMedia(id: string): Promise<void> {
  return deleteBackendMediaFile(id);
}
