import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Hero3DEnhanced from './Hero3DEnhanced';

describe('Hero3DEnhanced', () => {
  const slide = (id: string, media: string, label: string) => ({
    id,
    sortOrder: Number(id.replace(/\D/g, '')) || 0,
    label,
    title: `${label} title`,
    description: `${label} description`,
    ctaLabel: 'Découvrir',
    ctaHref: '#services',
    type: 'image' as const,
    media,
    desktopMedia: media,
    tabletMedia: media,
    mobileMedia: media,
    videoMedia: '',
    alt: `${label} alt`,
    overlayColor: '#04111f',
    overlayOpacity: 0.4,
    position: 'center',
    size: 'cover' as const,
    enableParallax: true,
    enable3DEffects: true,
  });

  it('renders slider controls and dots when multiple slides are available', () => {
    const html = renderToStaticMarkup(
      <Hero3DEnhanced
        backgroundItems={[
          slide('slide-1', 'https://cdn.example.com/hero-1.jpg', 'Slide one'),
          slide('slide-2', 'https://cdn.example.com/hero-2.jpg', 'Slide two'),
        ]}
        backgroundRotationEnabled
        backgroundAutoplay
        backgroundIntervalMs={4500}
      />,
    );

    expect(html).toContain('Diapositive précédente');
    expect(html).toContain('Diapositive suivante');
    expect(html).toContain('1/2');
    expect(html).toContain('Aller à la diapositive 1');
    expect(html).toContain('Aller à la diapositive 2');
    expect(html).toContain('aria-current="true"');
  });

  it('does not render carousel controls for a single slide', () => {
    const html = renderToStaticMarkup(
      <Hero3DEnhanced
        backgroundItems={[slide('slide-1', 'https://cdn.example.com/hero-1.jpg', 'Slide one')]}
        backgroundRotationEnabled
        backgroundAutoplay
      />,
    );

    expect(html).not.toContain('Diapositive précédente');
    expect(html).not.toContain('Diapositive suivante');
    expect(html).not.toContain('Aller à la diapositive 1');
  });

  it('auto-advances slides when multiple backgrounds are available', () => {
    vi.useFakeTimers();

    render(
      <Hero3DEnhanced
        backgroundItems={[
          slide('slide-1', 'https://cdn.example.com/hero-1.jpg', 'Slide one'),
          slide('slide-2', 'https://cdn.example.com/hero-2.jpg', 'Slide two'),
        ]}
        backgroundRotationEnabled
        backgroundAutoplay
        backgroundIntervalMs={2100}
      />,
    );

    expect(screen.getByText('1/2')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2200);
    });

    expect(screen.getByText('2/2')).toBeInTheDocument();
    vi.useRealTimers();
  });
});
