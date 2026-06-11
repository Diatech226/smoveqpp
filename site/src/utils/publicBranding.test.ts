import { describe, expect, it } from 'vitest';
import { isPublicBrandingSnapshot } from './publicBranding';

describe('public branding cache contract', () => {
  it('accepts a resolved logo and responsive positive dimensions', () => {
    expect(isPublicBrandingSnapshot({
      logoSrc: 'https://res.cloudinary.com/example/image/upload/logo.png',
      logoSize: { desktop: 160, tablet: 120, mobile: 80 },
    })).toBe(true);
  });

  it('rejects incomplete cache entries so the bundled logo remains available', () => {
    expect(isPublicBrandingSnapshot({ logoSrc: '', logoSize: { desktop: 160, tablet: 120, mobile: 80 } })).toBe(false);
    expect(isPublicBrandingSnapshot({ logoSrc: '/favicon.svg', logoSize: { desktop: 0, tablet: 120, mobile: 80 } })).toBe(false);
  });
});
