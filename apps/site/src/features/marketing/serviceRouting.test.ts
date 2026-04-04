import { describe, expect, it } from 'vitest';
import { resolveServiceRouteHref, resolveServiceRouteSlug } from './serviceRouting';

describe('serviceRouting', () => {
  it('uses routeSlug as canonical route key with slug fallback', () => {
    expect(
      resolveServiceRouteSlug({
        id: 'svc-1',
        slug: 'legacy-slug',
        routeSlug: 'canonical-slug',
      }),
    ).toBe('canonical-slug');

    expect(
      resolveServiceRouteSlug({
        id: 'svc-2',
        slug: 'legacy-slug',
        routeSlug: '',
      }),
    ).toBe('legacy-slug');
  });

  it('builds hash routes that always resolve through the dynamic services router', () => {
    expect(
      resolveServiceRouteHref({
        id: 'svc-1',
        slug: 'legacy-slug',
        routeSlug: 'design-branding',
      }),
    ).toBe('#/services/design-branding');

    expect(
      resolveServiceRouteHref({
        id: 'svc-2',
        slug: 'growth-marketing',
        routeSlug: '',
      }),
    ).toBe('#/services/growth-marketing');
  });
});
