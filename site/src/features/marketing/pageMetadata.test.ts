import { describe, expect, it } from 'vitest';
import { resolveCanonicalUrl } from './pageMetadata';
import { CONTACT_CTA_HREF, resolveProjectInquiryHref, resolveServiceContactHref } from './navigationCta';

describe('public metadata canonical URL', () => {
  it('builds canonical URLs from normalized hash route paths', () => {
    expect(resolveCanonicalUrl('/blog')).toContain('#/blog');
    expect(resolveCanonicalUrl('/projects/sample-project')).toContain('#/projects/sample-project');
  });
});

describe('CTA consistency', () => {
  it('normalizes service and project inquiry CTAs to the same contact destination', () => {
    expect(resolveServiceContactHref('/services')).toBe(CONTACT_CTA_HREF);
    expect(resolveProjectInquiryHref('/projects/demo')).toBe(CONTACT_CTA_HREF);
  });
});
