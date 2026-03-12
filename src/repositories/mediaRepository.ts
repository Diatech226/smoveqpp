import { isMediaFile, isMediaFileArray, type MediaFile, type MediaType } from '../domain/contentSchemas';
import { readFromStorage, writeToStorage } from './storage/localStorageStore';

const MEDIA_STORAGE_KEY = 'smove_media_files';

export interface MediaUploadInput {
  name: string;
  type: MediaType;
  file: File;
  uploadedBy: string;
  alt?: string;
  tags?: string[];
}

export interface MediaRepository {
  getAll(): MediaFile[];
  getById(id: string): MediaFile | undefined;
  save(file: MediaFile): void;
  delete(id: string): void;
  upload(data: MediaUploadInput): Promise<MediaFile>;
  getByType(type: MediaType): MediaFile[];
  search(query: string): MediaFile[];
}

class LocalMediaRepository implements MediaRepository {
  getAll(): MediaFile[] {
    return readFromStorage(MEDIA_STORAGE_KEY, isMediaFileArray, []);
  }

  getById(id: string): MediaFile | undefined {
    return this.getAll().find((file) => file.id === id);
  }

  save(file: MediaFile): void {
    if (!isMediaFile(file)) {
      throw new Error('Invalid media file payload');
    }

    const trustedFile = file;
    const files = this.getAll();
    const index = files.findIndex((candidate) => candidate.id === trustedFile.id);

    if (index >= 0) {
      files[index] = trustedFile;
    } else {
      files.push(trustedFile);
    }

    writeToStorage(MEDIA_STORAGE_KEY, files);
  }

  delete(id: string): void {
    writeToStorage(
      MEDIA_STORAGE_KEY,
      this.getAll().filter((file) => file.id !== id),
    );
  }

  upload(data: MediaUploadInput): Promise<MediaFile> {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const mediaFile: MediaFile = {
          id: Date.now().toString(),
          name: data.name,
          type: data.type,
          url: event.target?.result as string,
          thumbnailUrl: event.target?.result as string,
          size: data.file.size,
          uploadedDate: new Date().toISOString(),
          uploadedBy: data.uploadedBy,
          alt: data.alt || data.name,
          tags: data.tags || [],
        };

        if (!isMediaFile(mediaFile)) {
          throw new Error('Invalid uploaded media payload');
        }

        this.save(mediaFile);
        resolve(mediaFile);
      };

      reader.readAsDataURL(data.file);
    });
  }

  getByType(type: MediaType): MediaFile[] {
    return this.getAll().filter((file) => file.type === type);
  }

  search(query: string): MediaFile[] {
    const normalizedQuery = query.toLowerCase();

    return this.getAll().filter(
      (file) =>
        file.name.toLowerCase().includes(normalizedQuery) ||
        file.alt?.toLowerCase().includes(normalizedQuery) ||
        file.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery)),
    );
  }
}

export const mediaRepository: MediaRepository = new LocalMediaRepository();
