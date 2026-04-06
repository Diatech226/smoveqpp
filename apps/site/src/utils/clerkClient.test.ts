import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const clerkLoadMock = vi.fn();
const clerkConstructorMock = vi.fn();
const getTokenMock = vi.fn();

class ClerkMock {
  loaded = false;
  session: { getToken: () => Promise<string | null> } | null = null;
  client = {
    signIn: {
      create: vi.fn(),
      authenticateWithRedirect: vi.fn(),
    },
    signUp: {
      create: vi.fn(),
    },
  };
  setActive = vi.fn();
  signOut = vi.fn();

  constructor(publishableKey: string) {
    clerkConstructorMock(publishableKey);
    this.session = { getToken: getTokenMock };
  }

  async load() {
    await clerkLoadMock();
    this.loaded = true;
  }
}

describe('site clerkClient', () => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    (globalThis as { window: Window }).window = {
      setTimeout,
      clearTimeout,
      Clerk: ClerkMock,
      location: {
        hostname: 'localhost',
        href: 'http://localhost:5173/#login',
        origin: 'http://localhost:5173',
        replace: vi.fn(),
      } as unknown as Location,
    } as Window;

    const appendChild = vi.fn((element: Element) => {
      const script = element as HTMLScriptElement;
      script.dispatchEvent(new Event('load'));
      return element;
    });

    (globalThis as { document: Document }).document = {
      head: {
        appendChild,
      },
      createElement: vi.fn((tagName: string) => {
        const element = {
          tagName,
          dataset: {},
          addEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        } as unknown as HTMLScriptElement;
        return element;
      }),
      querySelector: vi.fn(() => null),
    } as unknown as Document;
  });

  afterEach(() => {
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

    vi.useRealTimers();
  });

  it('loads Clerk runtime and returns session token', async () => {
    clerkLoadMock.mockResolvedValue(undefined);
    getTokenMock.mockResolvedValue('session-token');

    const { getClerkSessionToken } = await import('./clerkClient');
    await expect(getClerkSessionToken('pk_test_123')).resolves.toBe('session-token');

    expect(clerkConstructorMock).toHaveBeenCalledWith('pk_test_123');
  });

  it('resets initialization state after a failed load so retry can succeed', async () => {
    clerkLoadMock
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(undefined);

    const { loadClerk } = await import('./clerkClient');

    await expect(loadClerk('pk_test_retry')).rejects.toThrow('boom');
    await expect(loadClerk('pk_test_retry')).resolves.toBeDefined();
    expect(clerkConstructorMock).toHaveBeenCalledTimes(1);
  });

  it('uses clear initialization timeout error when Clerk never resolves', async () => {
    vi.useFakeTimers();
    (window as Window).setTimeout = setTimeout;
    (window as Window).clearTimeout = clearTimeout;
    clerkLoadMock.mockImplementation(() => new Promise(() => {}));

    const { loadClerk } = await import('./clerkClient');
    const pending = loadClerk('pk_test_timeout').catch((error: unknown) => error as Error);

    await vi.advanceTimersByTimeAsync(12050);
    const error = await pending;
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe('Clerk initialization timed out. Please retry.');
  });
});
