import { describe, expect, it } from 'vitest';
import type { Service } from '../../domain/contentSchemas';
import { buildServiceDetailContract, findPublishedServiceBySlug } from './serviceDetailContract';

const publishedService: Service = {
  id: 'svc-custom',
  title: 'Custom Service',
  slug: 'custom-service',
  routeSlug: 'custom-service',
  description: 'Long description for custom service.',
  icon: 'palette',
  color: 'from-[#00b3e8] to-[#00c0e8]',
  features: ['Feature A'],
  processSteps: ['Step 1'],
  ctaPrimaryLabel: 'Contact us',
  ctaPrimaryHref: '#/contact',
  status: 'published',
};

describe('serviceDetailContract', () => {
  it('builds a safe generic detail contract from CMS data', () => {
    const detail = buildServiceDetailContract(publishedService);

    expect(detail.title).toBe('Custom Service');
    expect(detail.features).toEqual(['Feature A']);
    expect(detail.processSteps).toEqual(['Step 1']);
    expect(detail.cta.primaryLabel).toBe('Contact us');
    expect(detail.cta.primaryHref).toBe('#/contact');
  });

  it('uses safe fallbacks when optional CTA and process data are missing', () => {
    const detail = buildServiceDetailContract({
      ...publishedService,
      ctaPrimaryLabel: '',
      ctaPrimaryHref: 'javascript:alert(1)',
      processSteps: [],
      features: [],
    });

    expect(detail.cta.primaryLabel).toBe('Parler à un expert');
    expect(detail.cta.primaryHref).toBe('#/contact');
    expect(detail.features.length).toBeGreaterThan(0);
    expect(detail.processSteps.length).toBeGreaterThan(0);
  });

  it('does not resolve unpublished services for public routes', () => {
    const found = findPublishedServiceBySlug(
      [publishedService, { ...publishedService, id: 'svc-draft', routeSlug: 'draft-service', status: 'draft' }],
      'draft-service',
    );
    expect(found).toBeUndefined();
  });

  it('uses icon-like media as detail hero media when provided by CMS', () => {
    const detail = buildServiceDetailContract({
      ...publishedService,
      iconLikeAsset: 'https://cdn.example.com/service-hero.png',
    });

    expect(detail.heroMedia.src).toBe('https://cdn.example.com/service-hero.png');
    expect(detail.heroMedia.isMediaAsset).toBe(false);
  });
});
