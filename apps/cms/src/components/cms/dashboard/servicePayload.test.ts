import { describe, expect, it } from 'vitest';
import { buildServicePayload, type ServiceFormPayloadState } from './servicePayload';

const baseForm: ServiceFormPayloadState = {
  id: 'svc-legacy',
  title: 'Legacy Service',
  slug: 'legacy-service',
  description: '',
  shortDescription: '',
  icon: '',
  iconLikeAsset: '',
  color: '',
  features: '',
  status: 'published',
  featured: false,
  routeSlug: '',
  overviewDescription: '',
  ctaTitle: '',
  ctaDescription: '',
  ctaPrimaryLabel: '',
  ctaPrimaryHref: '',
  processTitle: '',
  processSteps: '',
};

describe('buildServicePayload', () => {
  it('builds tolerant update payloads for single-detail edits without empty wipes', () => {
    const payload = buildServicePayload(
      {
        ...baseForm,
        overviewDescription: 'Nouveau détail ajouté',
      },
      'edit',
    );

    expect(payload).toMatchObject({
      id: 'svc-legacy',
      title: 'Legacy Service',
      slug: 'legacy-service',
      routeSlug: 'legacy-service',
      overviewDescription: 'Nouveau détail ajouté',
    });
    expect(payload).not.toHaveProperty('description');
    expect(payload).not.toHaveProperty('features');
    expect(payload).not.toHaveProperty('processSteps');
  });

  it('builds strict create payload with required create-time fields', () => {
    const payload = buildServicePayload(
      {
        ...baseForm,
        id: undefined,
        title: 'New Service',
        description: 'Description',
        icon: 'palette',
        color: 'from-[#00b3e8] to-[#00c0e8]',
        features: 'Feature 1\nFeature 2',
      },
      'create',
    );

    expect(payload.description).toBe('Description');
    expect(payload.features).toEqual(['Feature 1', 'Feature 2']);
    expect(payload.icon).toBe('palette');
    expect(payload.color).toBe('from-[#00b3e8] to-[#00c0e8]');
  });
});
