import { describe, expect, it } from 'vitest';
import { buildServicePayload, validateServiceForm } from './serviceEditorPayload';

const baseForm = {
  id: 'service-legacy',
  title: 'Legacy Service',
  slug: 'legacy-service',
  description: '',
  shortDescription: '',
  icon: 'legacy-icon',
  iconLikeAsset: '',
  color: 'legacy-color',
  features: '',
  status: 'published' as const,
  featured: false,
  routeSlug: 'legacy-service',
  overviewDescription: '',
  ctaTitle: '',
  ctaDescription: '',
  ctaPrimaryLabel: '',
  ctaPrimaryHref: '',
  processTitle: '',
  processSteps: '',
};

describe('serviceEditorPayload', () => {
  it('keeps update form tolerant for legacy records missing optional/strict fields', () => {
    const errors = validateServiceForm(baseForm, 'edit');
    expect(errors).toEqual({});
  });

  it('builds edit payload without wiping existing arrays/optional values with empties', () => {
    const payload = buildServicePayload(
      {
        ...baseForm,
        overviewDescription: 'Updated overview detail',
      },
      'edit',
    );

    expect(payload).toMatchObject({
      id: 'service-legacy',
      title: 'Legacy Service',
      slug: 'legacy-service',
      routeSlug: 'legacy-service',
      overviewDescription: 'Updated overview detail',
    });
    expect(payload.features).toBeUndefined();
    expect(payload.processSteps).toBeUndefined();
    expect(payload.description).toBeUndefined();
  });
});
