import type { HomePageContentSettings } from '../../../data/pageContentSeed';
import { resolveCanonicalMedia } from '../../media/assetReference';

export interface RenderableHeroBackgroundItem {
  id: string;
  src: string;
  alt: string;
  overlayOpacity: number;
  focalPoint: string;
  isValid: boolean;
  mediaState: ReturnType<typeof resolveCanonicalMedia>['mediaState'];
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const resolveHeroBackgroundItems = (
  items: HomePageContentSettings['heroBackgroundItems'],
): RenderableHeroBackgroundItem[] => {
  const list = Array.isArray(items) ? items : [];
  return list
    .map((item, index) => {
      const media = item?.media?.trim();
      if (!media) return null;

      const canonical = resolveCanonicalMedia(media, item.alt?.trim() || `Hero background ${index + 1}`);
      return {
        id: item.id || `hero-background-${index + 1}`,
        src: canonical.url,
        alt: item.alt?.trim() || canonical.alt,
        overlayOpacity: clamp(item.overlayOpacity, 0, 0.9),
        focalPoint: item.focalPoint?.trim() || 'center',
        isValid: canonical.isValid,
        mediaState: canonical.mediaState,
      };
    })
    .filter((item): item is RenderableHeroBackgroundItem => Boolean(item));
};

export const shouldAutoplayHeroBackground = (
  enabled: boolean,
  autoplay: boolean,
  itemsCount: number,
): boolean => enabled && autoplay && itemsCount > 1;

export const nextHeroBackgroundIndex = (current: number, itemsCount: number): number => {
  if (itemsCount <= 1) return 0;
  return (current + 1) % itemsCount;
};
