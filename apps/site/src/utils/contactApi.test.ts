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
          json: async () => ({ success: true, data: { delivered: true } }),
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
});
