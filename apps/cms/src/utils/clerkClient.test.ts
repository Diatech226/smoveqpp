import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface ScriptElementMock {
  dataset: Record<string, string>;
  async: boolean;
  src: string;
  onload: (() => void) | null;
  onerror: (() => void) | null;
  addEventListener: (event: string, callback: () => void) => void;
}

describe('clerkClient', () => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;

  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    if (originalWindow) {
      globalThis.window = originalWindow;
    } else {
      delete (globalThis as { window?: Window }).window;
    }

    if (originalDocument) {
      globalThis.document = originalDocument;
    } else {
      delete (globalThis as { document?: Document }).document;
    }
  });

  function setDom(appendBehavior: (script: ScriptElementMock) => void) {
    const documentMock = {
      querySelector: vi.fn(() => null),
      createElement: vi.fn(() => {
        const listeners = new Map<string, () => void>();
        return {
          dataset: {},
          async: false,
          src: '',
          onload: null,
          onerror: null,
          addEventListener: (event: string, callback: () => void) => {
            listeners.set(event, callback);
          },
          trigger: (event: string) => listeners.get(event)?.(),
        } as unknown as ScriptElementMock;
      }),
      head: {
        appendChild: vi.fn((script: ScriptElementMock) => {
          appendBehavior(script);
        }),
      },
    };

    (globalThis as { document: typeof documentMock }).document = documentMock;
    (globalThis as { window: Window & { Clerk?: any } }).window = {
      setTimeout,
      clearTimeout,
      location: {
        hostname: 'localhost',
        href: 'http://localhost:5174/#login',
        origin: 'http://localhost:5174',
        replace: vi.fn(),
      } as unknown as Location,
      Clerk: undefined,
    } as Window & { Clerk?: any };

    return documentMock;
  }

  it('loads Clerk and returns a session token when script and SDK load succeed', async () => {
    const clerk = {
      loaded: false,
      load: vi.fn(async () => {
        clerk.loaded = true;
      }),
      session: { getToken: vi.fn(async () => 'token-123') },
    };

    setDom((script) => {
      (window as Window & { Clerk?: any }).Clerk = clerk;
      setTimeout(() => script.onload?.(), 0);
    });

    const { getClerkSessionToken } = await import('./clerkClient');
    const tokenPromise = getClerkSessionToken('pk_test_123');
    await vi.runAllTimersAsync();

    await expect(tokenPromise).resolves.toBe('token-123');
    expect(clerk.load).toHaveBeenCalledTimes(1);
  });

  it('surfaces a clear error when Clerk script loading fails', async () => {
    setDom((script) => {
      setTimeout(() => script.onerror?.(), 0);
    });

    const { loadClerk } = await import('./clerkClient');
    const assertion = expect(loadClerk('pk_test_123')).rejects.toThrow('Failed to load Clerk script');
    await vi.runAllTimersAsync();
    await assertion;
  });

  it('falls back to secondary Clerk CDN when primary fails', async () => {
    let appendCount = 0;
    const clerk = {
      loaded: false,
      load: vi.fn(async () => {
        clerk.loaded = true;
      }),
      session: null,
    };

    const documentMock = setDom((script) => {
      appendCount += 1;
      if (appendCount === 1) {
        setTimeout(() => script.onerror?.(), 0);
        return;
      }
      (window as Window & { Clerk?: any }).Clerk = clerk;
      setTimeout(() => script.onload?.(), 0);
    });

    const { loadClerk } = await import('./clerkClient');
    const assertion = expect(loadClerk('pk_test_123')).resolves.toBe(clerk);
    await vi.runAllTimersAsync();
    await assertion;

    expect(documentMock.head.appendChild).toHaveBeenCalledTimes(2);
  });

  it('resets loading state after timeout so a retry can succeed', async () => {
    let appendCount = 0;
    const clerk = {
      loaded: false,
      load: vi.fn(async () => {
        clerk.loaded = true;
      }),
      session: null,
    };

    setDom((script) => {
      appendCount += 1;
      if (appendCount <= 2) {
        return;
      }

      (window as Window & { Clerk?: any }).Clerk = clerk;
      setTimeout(() => script.onload?.(), 0);
    });

    const { loadClerk } = await import('./clerkClient');

    const firstAssertion = expect(loadClerk('pk_test_retry')).rejects.toThrow('Clerk initialization timed out');
    await vi.advanceTimersByTimeAsync(24100);
    await firstAssertion;

    const secondAssertion = expect(loadClerk('pk_test_retry')).resolves.toBe(clerk);
    await vi.runAllTimersAsync();
    await secondAssertion;
    expect(clerk.load).toHaveBeenCalledTimes(1);
  });
});
