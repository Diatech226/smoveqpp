import { describe, expect, it, vi } from 'vitest';

async function withWindowLocation<T>(href: string, run: () => Promise<T>): Promise<T> {
  const originalWindow = globalThis.window;
  const location = new URL(href);
  const fakeWindow = {
    location: {
      hostname: location.hostname,
    },
  } as unknown as Window & typeof globalThis;

  vi.stubGlobal('window', fakeWindow);

  try {
    return await run();
  } finally {
    if (originalWindow === undefined) {
      vi.unstubAllGlobals();
    } else {
      vi.stubGlobal('window', originalWindow);
    }
  }
}

describe('cmsRuntime', () => {
  it('prefers canonical localhost cms URL in local runtime when env is empty', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_CMS_APP_URL', '');

    await withWindowLocation('http://127.0.0.1:5173/#home', async () => {
      const { getCmsAppUrl } = await import('./cmsRuntime');
      expect(getCmsAppUrl()).toBe('http://localhost:5174/#cms');
    });
  });

  it('normalizes absolute loopback env values to localhost', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_CMS_APP_URL', 'http://127.0.0.1:5174');

    await withWindowLocation('http://localhost:5173/#home', async () => {
      const { getCmsAppUrl } = await import('./cmsRuntime');
      expect(getCmsAppUrl()).toBe('http://localhost:5174/#cms');
    });
  });
});
