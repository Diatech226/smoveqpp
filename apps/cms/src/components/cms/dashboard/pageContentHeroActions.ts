import type { HomePageContentSettings } from '../../../data/pageContentSeed';

type HeroBackgroundItem = HomePageContentSettings['heroBackgroundItems'][number];

export function createHeroBackgroundItem(itemIndex: number, overlayOpacity: number): HeroBackgroundItem {
  const randomSuffix =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return {
    id: `hero-bg-${Date.now()}-${itemIndex + 1}-${randomSuffix}`,
    label: `Slide ${itemIndex + 1}`,
    title: '',
    description: '',
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

export function updateHeroBackgroundItemMediaField(
  item: HeroBackgroundItem,
  field: HeroBackgroundMediaField,
  mediaReference: string,
): HeroBackgroundItem {
  const nextValue = mediaReference.trim();
  const nextItem: HeroBackgroundItem = { ...item, [field]: nextValue };

  if (!nextValue) {
    return nextItem;
  }

  if (field === 'media') {
    if (!nextItem.desktopMedia.trim()) {
      nextItem.desktopMedia = nextValue;
    }
    return nextItem;
  }

  if (!nextItem.media.trim()) {
    nextItem.media = nextValue;
  }

  if (field === 'tabletMedia' && !nextItem.desktopMedia.trim()) {
    nextItem.desktopMedia = nextValue;
  }

  return nextItem;
}

export function assignHeroBackgroundMedia(
  content: HomePageContentSettings,
  itemId: string,
  field: HeroBackgroundMediaField,
  mediaReference: string,
): HomePageContentSettings {
  return {
    ...content,
    heroBackgroundItems: content.heroBackgroundItems.map((item) => (
      item.id === itemId
        ? updateHeroBackgroundItemMediaField(item, field, mediaReference)
        : item
    )),
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
  nativeEvent?: {
    stopImmediatePropagation?: () => void;
  };
};

export function handleAddHeroMediaClick(
  event: AddHeroMediaClickEvent | undefined,
  content: HomePageContentSettings,
): HomePageContentSettings {
  event?.preventDefault();
  event?.stopPropagation();
  event?.nativeEvent?.stopImmediatePropagation?.();
  return appendHeroBackgroundItem(content);
}
