import { beforeEach, describe, expect, it } from 'vitest';
import { serviceRepository } from './serviceRepository';

describe('site serviceRepository', () => {
  beforeEach(() => {
    localStorage.removeItem('smove_services');
  });

  it('keeps valid services when backend payload contains malformed entries', () => {
    const services = serviceRepository.replaceAll([
      {
        id: 'service-valid',
        title: 'Valid service',
        slug: 'valid-service',
        routeSlug: 'valid-service',
        description: 'Valid description',
        icon: 'palette',
        color: 'from-[#00b3e8] to-[#00c0e8]',
        features: ['Feature'],
        status: 'published',
      },
      {
        id: 'service-invalid',
        title: '',
        slug: '',
        description: '',
        icon: 'palette',
        color: 'invalid-gradient',
        features: [],
      },
    ] as never[]);

    expect(services).toHaveLength(1);
    expect(services[0].id).toBe('service-valid');
  });
});
