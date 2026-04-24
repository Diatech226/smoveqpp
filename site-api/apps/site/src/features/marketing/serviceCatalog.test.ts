import { describe, expect, it } from 'vitest';
import { toRenderableService } from './serviceCatalog';
import { normalizeServiceSlug, resolveServiceRouteHref } from './serviceRouting';
import type { Service } from '../../domain/contentSchemas';

const baseService: Service = {
  id: 'service-1',
  title: 'Service',
  slug: 'service',
  description: 'Description',
  icon: 'palette',
  color: 'from-[#00b3e8] to-[#00c0e8]',
  features: ['f1'],
  status: 'published',
};

describe('serviceCatalog', () => {
  it('keeps valid configured gradient colors', () => {
    const renderable = toRenderableService(baseService);
    expect(renderable.color).toBe('from-[#00b3e8] to-[#00c0e8]');
  });


  it('maps known service routeSlug to dedicated service routes', () => {
    expect(resolveServiceRouteHref({ id: '1', slug: 'design-branding', routeSlug: 'design-branding' })).toBe('#service-design');
    expect(resolveServiceRouteHref({ id: '2', slug: 'web-development', routeSlug: 'web-development' })).toBe('#service-web');
  });

  it('falls back to anchored hash route for unknown service slugs', () => {
    expect(resolveServiceRouteHref({ id: '3', slug: 'custom', routeSlug: 'custom' })).toBe('#service/custom');
  });

  it('normalizes service slugs safely', () => {
    expect(normalizeServiceSlug('  Création 3D  ')).toBe('creation-3d');
    expect(normalizeServiceSlug('')).toBe('');
  });

  it('falls back to safe default color for invalid values', () => {
    const renderable = toRenderableService({ ...baseService, color: 'invalid-gradient' });
    expect(renderable.color).toBe('from-[#00b3e8] to-[#00c0e8]');
  });

  it('uses short description for card copy when available', () => {
    const renderable = toRenderableService({ ...baseService, shortDescription: 'Short copy' });
    expect(renderable.cardDescription).toBe('Short copy');
  });
});
