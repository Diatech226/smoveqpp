import { describe, expect, it } from 'vitest';
import { toRenderableService } from './serviceCatalog';
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

  it('falls back to safe default color for invalid values', () => {
    const renderable = toRenderableService({ ...baseService, color: 'invalid-gradient' });
    expect(renderable.color).toBe('from-[#00b3e8] to-[#00c0e8]');
  });
});
