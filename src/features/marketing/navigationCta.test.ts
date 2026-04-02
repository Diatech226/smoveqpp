import { describe, expect, it } from 'vitest';
import { CONTACT_CTA_HREF, TEAM_CTA_HREF, resolveAboutTeamHref, resolveServiceContactHref } from './navigationCta';

describe('marketing CTA navigation', () => {
  it('forces service primary CTAs to contact section', () => {
    expect(resolveServiceContactHref(undefined)).toBe(CONTACT_CTA_HREF);
    expect(resolveServiceContactHref('/contact')).toBe(CONTACT_CTA_HREF);
    expect(resolveServiceContactHref('#/contact')).toBe(CONTACT_CTA_HREF);
    expect(resolveServiceContactHref('/services')).toBe(CONTACT_CTA_HREF);
  });

  it('normalizes about team CTA to portfolio/team destination', () => {
    expect(resolveAboutTeamHref(undefined)).toBe(TEAM_CTA_HREF);
    expect(resolveAboutTeamHref('/team')).toBe(TEAM_CTA_HREF);
    expect(resolveAboutTeamHref('#team')).toBe(TEAM_CTA_HREF);
    expect(resolveAboutTeamHref('/portfolio')).toBe(TEAM_CTA_HREF);
  });
});
