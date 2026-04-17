import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { defaultHomePageContent } from '../../../data/pageContentSeed';
import { PageContentSection } from './CMSMainSections';
import { appendHeroBackgroundItem, handleAddHeroMediaClick } from './pageContentHeroActions';

describe('pageContentHeroActions', () => {
  it('adds a new hero slide item in CMS form state', () => {
    const updated = appendHeroBackgroundItem(defaultHomePageContent);

    expect(updated.heroBackgroundItems).toHaveLength(1);
    expect(updated.heroBackgroundItems[0]).toMatchObject({
      label: 'Slide 1',
      type: 'image',
      media: '',
      overlayOpacity: defaultHomePageContent.heroBackgroundOverlayOpacity,
    });
  });

  it('prevents default click navigation before adding media item', () => {
    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();

    const updated = handleAddHeroMediaClick(
      {
        preventDefault,
        stopPropagation,
      },
      defaultHomePageContent,
    );

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(updated.heroBackgroundItems).toHaveLength(1);
  });

  it('still appends a new item when no event object is provided', () => {
    const updated = handleAddHeroMediaClick(undefined, defaultHomePageContent);
    expect(updated.heroBackgroundItems).toHaveLength(1);
  });

  it('renders dedicated CMS slider actions without public navigation labels', () => {
    const html = renderToStaticMarkup(
      <PageContentSection
        homeContentError=""
        saveHomePageContent={async () => {}}
        homeContentSaving={false}
        hasUnsavedChanges={false}
        canEditContent
        resetHomePageContent={() => {}}
        openMediaLibrary={() => {}}
        homeContentForm={defaultHomePageContent}
        setHomeContentForm={() => {}}
        mediaFiles={[]}
      />,
    );

    expect(html).toContain('Ajouter un média');
    expect(html).toContain('Ouvrir la médiathèque CMS');
    expect(html).not.toContain('Retour au site');
    expect(html).not.toContain('Voir le site');
    expect(html).toContain('data-testid="hero-add-media-button"');
    expect(html).toContain('type="button"');
    expect(html).not.toContain('data-testid="hero-add-media-button" href=');
  });
});
