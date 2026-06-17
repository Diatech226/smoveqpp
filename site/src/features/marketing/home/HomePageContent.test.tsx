import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HomePageContent from './HomePageContent';
import { defaultHomePageContent } from '../../../data/pageContentSeed';
import { submitContactForm } from '../../../utils/contactApi';

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
  beforeEach(() => {
    vi.mocked(submitContactForm).mockResolvedValue({ success: true, message: 'ok' });
    fetchPublicPageContentMock.mockResolvedValue({ ...defaultHomePageContent });
    fetchPublicServicesMock.mockResolvedValue([]);
    fetchPublicMediaFilesMock.mockResolvedValue([]);
    getBlogContentContractFromSourceMock.mockResolvedValue({ categories: [], posts: [] });
  });

  it('hydrates hero from page-content even while media catalog sync is still pending', async () => {
    const blockedMedia = deferred<unknown[]>();

    fetchPublicPageContentMock.mockResolvedValue({
      ...defaultHomePageContent,
      heroBadge: 'Remote Before Media',
      heroBackgroundItems: [
        {
          id: 'slide-early',
          sortOrder: 0,
          label: 'Slide Early',
          title: 'Slide Early',
          description: '',
          ctaLabel: '',
          ctaHref: '',
          type: 'image',
          media: 'media:hero-asset-1',
          desktopMedia: '',
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
    fetchPublicMediaFilesMock.mockReturnValue(blockedMedia.promise);
    getBlogContentContractFromSourceMock.mockResolvedValue({ categories: [], posts: [] });

    render(<HomePageContent />);

    await waitFor(() => {
      expect(screen.getByTestId('hero-badge').textContent).toBe('Remote Before Media');
    });
    expect(screen.getByTestId('hero-slide-count').textContent).toBe('1');
  });

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

  it('keeps a stable form reference across async contact submission and resets only after success', async () => {
    let resolveSubmission!: (value: { success: boolean; message: string }) => void;
    vi.mocked(submitContactForm).mockReturnValue(new Promise((resolve) => {
      resolveSubmission = resolve;
    }));

    render(<HomePageContent />);

    const nameInput = screen.getByLabelText(/nom complet/i) as HTMLInputElement;
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const subjectInput = screen.getByLabelText(/sujet/i) as HTMLInputElement;
    const messageInput = screen.getByLabelText(/message/i) as HTMLTextAreaElement;

    fireEvent.change(nameInput, { target: { value: 'Jane Visitor' } });
    fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });
    fireEvent.change(subjectInput, { target: { value: 'Projet web' } });
    fireEvent.change(messageInput, { target: { value: 'Bonjour, je souhaite discuter de mon projet.' } });
    fireEvent.submit(messageInput.closest('form')!);

    expect(nameInput.value).toBe('Jane Visitor');

    resolveSubmission({ success: true, message: 'Message envoyé.' });

    await waitFor(() => {
      expect(screen.getByRole('status').textContent).toBe('Message envoyé.');
    });
    expect(nameInput.value).toBe('');
    expect(emailInput.value).toBe('');
    expect(subjectInput.value).toBe('');
    expect(messageInput.value).toBe('');
  });

  it('preserves contact form inputs when API returns an error', async () => {
    vi.mocked(submitContactForm).mockResolvedValue({ success: false, message: 'Erreur API' });

    render(<HomePageContent />);

    const nameInput = screen.getByLabelText(/nom complet/i) as HTMLInputElement;
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const messageInput = screen.getByLabelText(/message/i) as HTMLTextAreaElement;

    fireEvent.change(nameInput, { target: { value: 'Jane Visitor' } });
    fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });
    fireEvent.change(messageInput, { target: { value: 'Bonjour, je souhaite discuter de mon projet.' } });
    fireEvent.submit(messageInput.closest('form')!);

    await waitFor(() => {
      expect(screen.getByRole('status').textContent).toBe('Erreur API');
    });
    expect(nameInput.value).toBe('Jane Visitor');
    expect(emailInput.value).toBe('jane@example.com');
    expect(messageInput.value).toBe('Bonjour, je souhaite discuter de mon projet.');
  });
});
