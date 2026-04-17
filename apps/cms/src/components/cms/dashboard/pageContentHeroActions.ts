import type { HomePageContentSettings } from '../../../data/pageContentSeed';

type HeroBackgroundItem = HomePageContentSettings['heroBackgroundItems'][number];

export function createHeroBackgroundItem(itemIndex: number, overlayOpacity: number): HeroBackgroundItem {
  return {
    id: `hero-bg-${Date.now()}-${itemIndex + 1}`,
    label: `Slide ${itemIndex + 1}`,
    type: 'image',
    media: '',
    desktopMedia: '',
    tabletMedia: '',
    mobileMedia: '',
    videoMedia: '',
    alt: '',
    overlayColor: '#04111f',
    overlayOpacity,
    position: 'center',
    size: 'cover',
    enableParallax: true,
    enable3DEffects: true,
  };
}

export function appendHeroBackgroundItem(content: HomePageContentSettings): HomePageContentSettings {
  const nextItem = createHeroBackgroundItem(content.heroBackgroundItems.length, content.heroBackgroundOverlayOpacity);
  return {
    ...content,
    heroBackgroundItems: [...content.heroBackgroundItems, nextItem],
  };
}

export function handleAddHeroMediaClick(
  event: Pick<MouseEvent, 'preventDefault' | 'stopPropagation'> | undefined,
  content: HomePageContentSettings,
): HomePageContentSettings {
  event?.preventDefault();
  event?.stopPropagation();
  return appendHeroBackgroundItem(content);
}
