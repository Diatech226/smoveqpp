import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import HomePageContent from './HomePageContent';
import { defaultHomePageContent } from '../../../data/pageContentSeed';

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

const inMemoryHomeState = { ...defaultHomePageContent };

vi.mock('../../../components/Hero3DEnhanced', () => ({
  default: ({ badgeLabel, backgroundItems }: { badgeLabel?: string; backgroundItems?: unknown[] }) => (
    <div data-testid="hero-shell">
      <span data-testid="hero-badge">{badgeLabel}</span>
      <span data-testid="hero-slide-count">{Array.isArray(backgroundItems) ? backgroundItems.length : 0}</span>
    </div>
  ),
}));

vi.mock('../../../components/Footer', () => ({ default: () => <div data-testid="footer" /> }));
vi.mock('../../../components/ProjectsSection', () => ({ default: () => <div data-testid="projects-section" /> }));
vi.mock('../../../components/figma/ImageWithFallback', () => ({ ImageWithFallback: () => <div data-testid="image-with-fallback" /> }));
vi.mock('../../../utils/contactApi', () => ({ submitContactForm: vi.fn(async () => ({ success: true, message: 'ok' })) }));
vi.mock('../../../utils/analytics', () => ({ trackSiteEvent: vi.fn() }));
vi.mock('../serviceCatalog', () => ({
  selectRenderablePublicServices: (services: unknown[]) => services,
}));
vi.mock('./homePreview', () => ({
  selectHomepageBlogPosts: (posts: unknown[]) => posts,
  selectHomepageServices: (services: unknown[]) => services,
}));

vi.mock('../../../repositories/serviceRepository', () => ({
  serviceRepository: {
    getAll: vi.fn(() => []),
    replaceAll: vi.fn((services) => services),
  },
}));

vi.mock('../../../repositories/mediaRepository', () => ({
  mediaRepository: {
    replaceAll: vi.fn(),
  },
}));

vi.mock('../../../repositories/pageContentRepository', () => ({
  pageContentRepository: {
    getHomePageContent: vi.fn(() => ({ ...inMemoryHomeState })),
    saveHomePageContent: vi.fn((content) => {
      Object.assign(inMemoryHomeState, content);
      return { ...inMemoryHomeState };
    }),
  },
}));

const fetchPublicPageContentMock = vi.fn();
const fetchPublicServicesMock = vi.fn();
const fetchPublicMediaFilesMock = vi.fn();

vi.mock('../../../utils/publicContentApi', () => ({
  fetchPublicPageContent: () => fetchPublicPageContentMock(),
  fetchPublicServices: () => fetchPublicServicesMock(),
  fetchPublicMediaFiles: () => fetchPublicMediaFilesMock(),
}));

const getBlogContentContractFromSourceMock = vi.fn();
vi.mock('../../blog/blogContentService', () => ({
  getBlogContentContractFromSource: () => getBlogContentContractFromSourceMock(),
  resolveBlogMediaReference: () => ({ src: '', alt: '' }),
}));

describe('HomePageContent', () => {
  it('hydrates hero from public page-content without waiting for blog endpoint', async () => {
    const blockedBlog = deferred<{ categories: string[]; posts: unknown[] }>();

    fetchPublicPageContentMock.mockResolvedValue({
      ...defaultHomePageContent,
      heroBadge: 'Remote Hero Badge',
      heroBackgroundItems: [
        {
          id: 'slide-1',
          sortOrder: 0,
          label: 'Slide 1',
          title: 'Slide 1',
          description: '',
          ctaLabel: '',
          ctaHref: '',
          type: 'image',
          media: 'https://cdn.example.com/hero-1.jpg',
          desktopMedia: 'https://cdn.example.com/hero-1.jpg',
          tabletMedia: '',
          mobileMedia: '',
          videoMedia: '',
          alt: 'slide',
          overlayColor: '#04111f',
          overlayOpacity: 0.4,
          position: 'center',
          size: 'cover',
          enableParallax: true,
          enable3DEffects: true,
        },
      ],
    });
    fetchPublicServicesMock.mockResolvedValue([]);
    fetchPublicMediaFilesMock.mockResolvedValue([]);
    getBlogContentContractFromSourceMock.mockReturnValue(blockedBlog.promise);

    render(<HomePageContent />);

    await waitFor(() => {
      expect(screen.getByTestId('hero-badge').textContent).toBe('Remote Hero Badge');
    });

    expect(screen.getByTestId('hero-slide-count').textContent).toBe('1');
  });
});
