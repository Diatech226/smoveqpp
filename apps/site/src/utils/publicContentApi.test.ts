import { describe, expect, it, vi } from 'vitest';
import { ContentApiError } from './contentApi';
import { fetchPublicMediaFiles, fetchPublicPageContent, fetchPublicProjects, fetchPublicServices } from './publicContentApi';

describe('publicContentApi', () => {
  it('returns public projects from backend envelope', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { projects: [{ id: 'p-1', title: 'P1' }] } }),
      } as Response);
    vi.stubGlobal('fetch', fetchMock);

    const projects = await fetchPublicProjects();
    expect(projects).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/content/public/projects'),
      expect.objectContaining({ cache: 'no-store' }),
    );
  });


  it('returns public media files from backend envelope', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { mediaFiles: [{ id: 'm-1', name: 'm1', type: 'image', url: 'u', size: 1, uploadedDate: '2026-01-01', uploadedBy: 'cms', tags: [] }] } }),
      } as Response),
    );

    const media = await fetchPublicMediaFiles();
    expect(media).toHaveLength(1);
  });

  it('returns homepage content with hero background slideshow fields from backend envelope', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            pageContent: {
              home: {
                heroBadge: 'Badge',
                heroTitleLine1: 'Line 1',
                heroTitleLine2: 'Line 2',
                heroDescription: 'Desc',
                heroPrimaryCtaLabel: 'CTA1',
                heroPrimaryCtaHref: '#services',
                heroSecondaryCtaLabel: 'CTA2',
                heroSecondaryCtaHref: '#/contact',
                heroBackgroundItems: [
                  {
                    id: 'slide-1',
                    label: 'Slide 1',
                    type: 'image',
                    media: 'media:hero-1',
                    desktopMedia: 'media:hero-1',
                    tabletMedia: '',
                    mobileMedia: '',
                    videoMedia: '',
                    alt: 'Alt',
                    overlayColor: '#04111f',
                    overlayOpacity: 0.4,
                    position: 'center',
                    size: 'cover',
                    enableParallax: true,
                    enable3DEffects: true,
                  },
                ],
                heroBackgroundRotationEnabled: true,
                heroBackgroundAutoplay: true,
                heroBackgroundIntervalMs: 5000,
                heroBackgroundTransitionStyle: 'fade',
                heroBackgroundOverlayOpacity: 0.35,
                heroBackgroundEnable3DEffects: true,
                heroBackgroundEnableParallax: true,
                aboutBadge: 'About',
                aboutTitle: 'Title',
                aboutParagraphOne: 'P1',
                aboutParagraphTwo: 'P2',
                aboutCtaLabel: 'CTA',
                aboutCtaHref: '#about',
                aboutImage: '',
                servicesIntroTitle: 'Services',
                servicesIntroSubtitle: 'Subtitle',
                portfolioBadge: 'Portfolio',
                portfolioTitle: 'Title',
                portfolioSubtitle: 'Subtitle',
                portfolioCtaLabel: 'CTA',
                portfolioCtaHref: '#projects',
                blogBadge: 'Blog',
                blogTitle: 'Title',
                blogSubtitle: 'Subtitle',
                blogCtaLabel: 'CTA',
                blogCtaHref: '#blog',
                contactTitle: 'Contact',
                contactSubtitle: 'Subtitle',
                contactSubmitLabel: 'Send',
              },
            },
          },
        }),
      } as Response),
    );

    const home = await fetchPublicPageContent();
    expect(home.heroBackgroundItems).toHaveLength(1);
    expect(home.heroBackgroundIntervalMs).toBe(5000);
  });

  it('throws when public services endpoint is unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ success: false, error: { code: 'CONTENT_UNAVAILABLE', message: 'down' } }),
      } as Response),
    );

    await expect(fetchPublicServices()).rejects.toBeInstanceOf(ContentApiError);
  });
});
