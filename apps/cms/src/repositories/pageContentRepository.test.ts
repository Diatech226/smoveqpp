import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appendHeroBackgroundItem } from '../components/cms/dashboard/pageContentHeroActions';
import { defaultHomePageContent } from '../data/pageContentSeed';
import { pageContentRepository } from './pageContentRepository';

const createStorage = () => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
};

describe('pageContentRepository hero background persistence', () => {
  beforeEach(() => {
    const localStorage = createStorage();
    vi.stubGlobal('window', { localStorage });
  });

  it('persists and reloads a newly added hero background media item', () => {
    const withSlide = appendHeroBackgroundItem(defaultHomePageContent);
    const saved = pageContentRepository.saveHomePageContent({
      ...withSlide,
      heroBackgroundItems: withSlide.heroBackgroundItems.map((item) => ({
        ...item,
        media: 'media:hero-library-1',
        desktopMedia: 'media:hero-library-1',
        alt: 'Slide persistance',
      })),
    });

    expect(saved.heroBackgroundItems).toHaveLength(1);
    expect(saved.heroBackgroundItems[0].media).toBe('media:hero-library-1');

    const reloaded = pageContentRepository.getHomePageContent();
    expect(reloaded.heroBackgroundItems).toHaveLength(1);
    expect(reloaded.heroBackgroundItems[0].media).toBe('media:hero-library-1');
    expect(reloaded.heroBackgroundItems[0].desktopMedia).toBe('media:hero-library-1');
  });
});
