import { beforeEach, describe, expect, it, vi } from 'vitest';
import { submitNewsletterSubscription } from './newsletterApi';

describe('newsletter api', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns success payload when backend confirms subscription', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { action: 'created' } }),
      })),
    );

    const result = await submitNewsletterSubscription('john@example.com', 'footer');
    expect(result.success).toBe(true);
    expect(result.action).toBe('created');
  });

  it('returns graceful duplicate feedback', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { action: 'already_active' } }),
      })),
    );

    const result = await submitNewsletterSubscription('john@example.com');
    expect(result.success).toBe(true);
    expect(result.message).toContain('déjà inscrit');
  });

  it('returns validation failure from backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 400,
        json: async () => ({ success: false, error: { code: 'NEWSLETTER_INVALID_EMAIL', message: 'Email is invalid.' } }),
      })),
    );

    const result = await submitNewsletterSubscription('bad-email');
    expect(result.success).toBe(false);
    expect(result.code).toBe('NEWSLETTER_INVALID_EMAIL');
  });

  it('does not fake success when backend payload is malformed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: {} }),
      })),
    );

    const result = await submitNewsletterSubscription('john@example.com');
    expect(result.success).toBe(false);
    expect(result.code).toBe('NEWSLETTER_PERSISTENCE_UNCONFIRMED');
  });
});
