import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trackSiteEvent } from './analytics';

describe('trackSiteEvent', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('sends event payload to public analytics endpoint', async () => {
    trackSiteEvent({
      name: 'cta_clicked',
      route: 'home',
      ctaId: 'hero_primary',
      targetRoute: '#/contact',
    });

    await Promise.resolve();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect((global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]).toContain('/content/public/events');
    const init = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit;
    const parsed = JSON.parse(String(init.body));
    expect(parsed.name).toBe('cta_clicked');
    expect(parsed.route).toBe('home');
    expect(parsed.happenedAt).toBeTruthy();
  });
});
