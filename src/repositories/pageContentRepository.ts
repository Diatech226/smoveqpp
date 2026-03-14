import { defaultHomePageContent, type HomePageContentSettings } from '../data/pageContentSeed';
import { readFromStorage, writeToStorage } from './storage/localStorageStore';

const PAGE_CONTENT_STORAGE_KEY = 'smove_page_content';

interface PageContentPayload {
  home: HomePageContentSettings;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const isHomePageContentSettings = (value: unknown): value is HomePageContentSettings => {
  if (!isRecord(value)) return false;
  const keys: Array<keyof HomePageContentSettings> = [
    'heroBadge',
    'heroTitleLine1',
    'heroTitleLine2',
    'heroDescription',
    'heroPrimaryCtaLabel',
    'heroSecondaryCtaLabel',
    'aboutBadge',
    'aboutTitle',
    'aboutParagraphOne',
    'aboutParagraphTwo',
    'aboutImage',
    'servicesIntroTitle',
    'servicesIntroSubtitle',
  ];

  return keys.every((key) => typeof value[key] === 'string');
};

const isPageContentPayload = (value: unknown): value is PageContentPayload =>
  isRecord(value) && isHomePageContentSettings(value.home);

const normalizeHomeContent = (value: HomePageContentSettings): HomePageContentSettings => ({
  ...defaultHomePageContent,
  ...value,
  heroBadge: value.heroBadge.trim() || defaultHomePageContent.heroBadge,
  heroTitleLine1: value.heroTitleLine1.trim() || defaultHomePageContent.heroTitleLine1,
  heroTitleLine2: value.heroTitleLine2.trim() || defaultHomePageContent.heroTitleLine2,
  heroDescription: value.heroDescription.trim() || defaultHomePageContent.heroDescription,
  heroPrimaryCtaLabel: value.heroPrimaryCtaLabel.trim() || defaultHomePageContent.heroPrimaryCtaLabel,
  heroSecondaryCtaLabel: value.heroSecondaryCtaLabel.trim() || defaultHomePageContent.heroSecondaryCtaLabel,
  aboutBadge: value.aboutBadge.trim() || defaultHomePageContent.aboutBadge,
  aboutTitle: value.aboutTitle.trim() || defaultHomePageContent.aboutTitle,
  aboutParagraphOne: value.aboutParagraphOne.trim() || defaultHomePageContent.aboutParagraphOne,
  aboutParagraphTwo: value.aboutParagraphTwo.trim() || defaultHomePageContent.aboutParagraphTwo,
  aboutImage: value.aboutImage.trim(),
  servicesIntroTitle: value.servicesIntroTitle.trim() || defaultHomePageContent.servicesIntroTitle,
  servicesIntroSubtitle: value.servicesIntroSubtitle.trim() || defaultHomePageContent.servicesIntroSubtitle,
});

export interface PageContentRepository {
  getHomePageContent(): HomePageContentSettings;
  saveHomePageContent(content: HomePageContentSettings): HomePageContentSettings;
}

class LocalPageContentRepository implements PageContentRepository {
  private getPayload(): PageContentPayload {
    const payload = readFromStorage(
      PAGE_CONTENT_STORAGE_KEY,
      isPageContentPayload,
      { home: defaultHomePageContent },
      { persistFallback: true },
    );

    const normalized: PageContentPayload = { home: normalizeHomeContent(payload.home) };

    if (JSON.stringify(payload) !== JSON.stringify(normalized)) {
      writeToStorage(PAGE_CONTENT_STORAGE_KEY, normalized);
    }

    return normalized;
  }

  getHomePageContent(): HomePageContentSettings {
    return this.getPayload().home;
  }

  saveHomePageContent(content: HomePageContentSettings): HomePageContentSettings {
    const normalized = normalizeHomeContent(content);
    writeToStorage(PAGE_CONTENT_STORAGE_KEY, { home: normalized });
    return normalized;
  }
}

export const pageContentRepository: PageContentRepository = new LocalPageContentRepository();
