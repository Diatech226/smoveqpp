import type { MediaFile } from '../../domain/contentSchemas';
import { mediaRepository } from '../../repositories/mediaRepository';
import { fetchPublicMediaFiles } from '../../utils/publicContentApi';

let hydrationPromise: Promise<MediaFile[]> | null = null;

export async function hydratePublicMediaLibrary(force = false): Promise<MediaFile[]> {
  if (!force && hydrationPromise) {
    return hydrationPromise;
  }

  hydrationPromise = fetchPublicMediaFiles()
    .then((mediaFiles) => {
      mediaRepository.replaceAll(mediaFiles);
      return mediaFiles;
    })
    .finally(() => {
      hydrationPromise = null;
    });

  return hydrationPromise;
}
