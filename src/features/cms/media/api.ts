import { cmsApiClient } from '../../../lib/cmsApiClient';
import type { CmsMediaItem } from './types';

interface ListData { items: CmsMediaItem[] }
interface ItemData { item: CmsMediaItem }

export function fetchMedia(q?: string) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : '';
  return cmsApiClient.get<ListData>(`/v1/media${qs}`);
}
export function uploadMedia(payload: { file: File; alt?: string; folder?: string }) {
  return new Promise<ItemData>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const response = await cmsApiClient.post<ItemData>('/v1/media', {
          originalName: payload.file.name,
          mimeType: payload.file.type || 'application/octet-stream',
          data: String(reader.result || ''),
          alt: payload.alt || '',
          folder: payload.folder || '',
        });
        resolve(response.data as ItemData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(payload.file);
  });
}
export function deleteMedia(id: string) { return cmsApiClient.delete<{}>(`/v1/media/${id}`); }
