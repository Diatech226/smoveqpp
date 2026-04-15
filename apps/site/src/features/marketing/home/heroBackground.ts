import type { HomePageContentSettings } from '../../../data/pageContentSeed';
import { resolveCanonicalMedia } from '../../media/assetReference';

export interface RenderableHeroBackgroundItem {
  id: string;
  type: 'image' | 'video';
  desktopSrc: string;
  tabletSrc: string;
  mobileSrc: string;
  videoSrc: string;
  alt: string;
  overlayColor: string;
  overlayOpacity: number;
  position: string;
  size: 'cover' | 'contain';
  enableParallax: boolean;
  enable3DEffects: boolean;
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

      const fallbackAlt = item.alt?.trim() || `Hero background ${index + 1}`;
      const desktop = resolveCanonicalMedia(item.desktopMedia || media, fallbackAlt, 'hero');
      const tablet = resolveCanonicalMedia(item.tabletMedia || item.desktopMedia || media, fallbackAlt, 'card');
      const mobile = resolveCanonicalMedia(item.mobileMedia || item.tabletMedia || item.desktopMedia || media, fallbackAlt, 'thumbnail');
      const hasVideoMedia = Boolean(item.videoMedia?.trim());
      const video = hasVideoMedia ? resolveCanonicalMedia(item.videoMedia, fallbackAlt) : null;
      return {
        id: item.id || `hero-background-${index + 1}`,
        type: item.type === 'video' ? 'video' : 'image',
        desktopSrc: desktop.url,
        tabletSrc: tablet.url,
        mobileSrc: mobile.url,
        videoSrc: video?.url || '',
        alt: item.alt?.trim() || desktop.alt,
        overlayColor: item.overlayColor?.trim() || '#04111f',
        overlayOpacity: clamp(item.overlayOpacity, 0, 0.9),
        position: item.position?.trim() || 'center',
        size: item.size === 'contain' ? 'contain' : 'cover',
        enableParallax: item.enableParallax !== false,
        enable3DEffects: item.enable3DEffects !== false,
        isValid: desktop.isValid,
        mediaState: desktop.mediaState,
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
