import { mediaRepository, type MediaUploadInput } from '../repositories/mediaRepository';
import type { MediaFile, MediaType } from '../domain/contentSchemas';

export type { MediaFile };

export function getMediaFiles(): MediaFile[] {
  return mediaRepository.getAll();
}

export function getMediaFileById(id: string): MediaFile | undefined {
  return mediaRepository.getById(id);
}

export function saveMediaFile(file: MediaFile): void {
  mediaRepository.save(file);
}

export function deleteMediaFile(id: string): void {
  mediaRepository.delete(id);
}

export function uploadMediaFile(fileData: MediaUploadInput): Promise<MediaFile> {
  return mediaRepository.upload(fileData);
}

export function getMediaFilesByType(type: MediaType): MediaFile[] {
  return mediaRepository.getByType(type);
}

export function searchMediaFiles(query: string): MediaFile[] {
  return mediaRepository.search(query);
}
