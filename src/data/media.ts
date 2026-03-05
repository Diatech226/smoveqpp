export type MediaType = 'image' | 'video' | 'doc';
export type MediaFolder = 'Brand' | 'Blog' | 'Projects' | 'Social' | 'Archive';
export type MediaStatus = 'draft' | 'approved' | 'archived';

export interface MediaVariant {
  url: string;
  width?: number;
  height?: number;
}

export interface MediaFile {
  id: string;
  name: string;
  type: MediaType;
  folder: MediaFolder;
  originalUrl: string;
  variants: Partial<Record<'thumb' | 'sm' | 'md' | 'lg' | 'og', MediaVariant>>;
  mime: string;
  size: number;
  width?: number;
  height?: number;
  posterUrl?: string;
  duration?: number;
  altText?: string;
  credits?: string;
  source?: string;
  licence?: string;
  tags: string[];
  hash?: string;
  status: MediaStatus;
  uploadedDate: string;
  uploadedBy: string;
}

const MEDIA_STORAGE_KEY = 'smove_media_files_v2';

export function getMediaFiles(): MediaFile[] {
  const stored = localStorage.getItem(MEDIA_STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  return [];
}

export function getMediaFileById(id: string): MediaFile | undefined {
  return getMediaFiles().find((file) => file.id === id);
}

export function saveMediaFile(file: MediaFile): void {
  const files = getMediaFiles();
  const index = files.findIndex((f) => f.id === file.id);
  if (index >= 0) files[index] = file;
  else files.unshift(file);
  localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(files));
}

export function deleteMediaFile(id: string): void {
  const files = getMediaFiles().filter((f) => f.id !== id);
  localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(files));
}

export function uploadMediaFile(fileData: {
  name: string;
  type: MediaType;
  file: File;
  uploadedBy: string;
  folder?: MediaFolder;
  altText?: string;
  tags?: string[];
}): Promise<MediaFile> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const variants = {
        thumb: { url: base64, width: 320 },
        sm: { url: base64, width: 640 },
        md: { url: base64, width: 1024 },
        lg: { url: base64, width: 1600 },
        og: { url: base64, width: 1200, height: 630 },
      };

      const mediaFile: MediaFile = {
        id: `${Date.now()}`,
        name: fileData.name,
        type: fileData.type,
        folder: fileData.folder ?? 'Archive',
        originalUrl: base64,
        variants,
        mime: fileData.file.type || 'application/octet-stream',
        size: fileData.file.size,
        altText: fileData.altText || '',
        tags: fileData.tags || [],
        status: 'draft',
        uploadedDate: new Date().toISOString(),
        uploadedBy: fileData.uploadedBy,
      };

      saveMediaFile(mediaFile);
      resolve(mediaFile);
    };

    reader.readAsDataURL(fileData.file);
  });
}
