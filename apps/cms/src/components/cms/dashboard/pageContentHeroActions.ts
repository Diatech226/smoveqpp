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

type HeroBackgroundMediaField = 'media' | 'desktopMedia' | 'tabletMedia' | 'mobileMedia' | 'videoMedia';

export function assignHeroBackgroundMedia(
  content: HomePageContentSettings,
  itemId: string,
  field: HeroBackgroundMediaField,
  mediaReference: string,
): HomePageContentSettings {
  return {
    ...content,
    heroBackgroundItems: content.heroBackgroundItems.map((item) => (item.id === itemId ? { ...item, [field]: mediaReference } : item)),
  };
}

export function appendHeroBackgroundItemWithMedia(
  content: HomePageContentSettings,
  mediaReference: string,
): HomePageContentSettings {
  const nextItem = createHeroBackgroundItem(content.heroBackgroundItems.length, content.heroBackgroundOverlayOpacity);
  return {
    ...content,
    heroBackgroundItems: [...content.heroBackgroundItems, { ...nextItem, media: mediaReference, desktopMedia: mediaReference }],
  };
}

type AddHeroMediaClickEvent = {
  preventDefault: () => void;
  stopPropagation: () => void;
};

export function handleAddHeroMediaClick(
  event: AddHeroMediaClickEvent | undefined,
  content: HomePageContentSettings,
): HomePageContentSettings {
  event?.preventDefault();
  event?.stopPropagation();
  return appendHeroBackgroundItem(content);
}
