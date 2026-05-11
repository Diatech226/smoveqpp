import { afterEach, describe, expect, it, vi } from 'vitest';
import { submitContactForm } from './contactApi';

describe('submitContactForm', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns success when API accepts payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        ({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: { delivered: true, submissionId: 'lead_1', message: 'Stored' } }),
        }) as Response,
      ),
    );

    const result = await submitContactForm({
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Need a quote',
      message: 'Hello, I need a quote.',
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe('Stored');
  });

  it('returns user-safe error message on API failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        ({
          ok: false,
          status: 502,
          json: async () => ({ success: false, error: { code: 'CONTACT_EMAIL_FAILED', message: 'Unable to send' } }),
        }) as Response,
      ),
    );

    const result = await submitContactForm({
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Need a quote',
      message: 'Hello, I need a quote.',
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('CONTACT_EMAIL_FAILED');
  });

  it('returns network-safe error when API is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('offline');
    }));

    const result = await submitContactForm({
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Need a quote',
      message: 'Hello, I need a quote.',
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('CONTACT_NETWORK_ERROR');
  });

  it('fails safely when API returns success without persistence id', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        ({
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: {} }),
        }) as Response,
      ),
    );

    const result = await submitContactForm({
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Need a quote',
      message: 'Hello, I need a quote.',
    });

    expect(result.success).toBe(false);
    expect(result.code).toBe('CONTACT_PERSISTENCE_MISSING');
  });
});
