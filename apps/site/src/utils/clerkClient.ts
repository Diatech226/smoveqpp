declare global {
  interface Window {
    Clerk?: any;
  }
}

type OAuthProvider = 'google' | 'facebook';

let loadPromise: Promise<any> | null = null;

const CALLBACK_PATH = '/sso-callback';
const CLERK_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js';
const CLERK_LOAD_TIMEOUT_MS = 12000;

function canonicalizeLocalUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.hostname === '127.0.0.1') {
      parsed.hostname = 'localhost';
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

function ensureCanonicalLocalOrigin(): boolean {
  if (window.location.hostname !== '127.0.0.1') return true;

  const canonicalUrl = canonicalizeLocalUrl(window.location.href);
  window.location.replace(canonicalUrl);
  return false;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(errorMessage)), timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error: unknown) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

function normalizeClerkError(error: unknown, fallbackMessage: string): Error {
  if (error instanceof Error && error.message.trim()) {
    return error;
  }
  return new Error(fallbackMessage);
}

function resolveClerkGlobalOrThrow(): any {
  if (!window.Clerk) {
    throw new Error('Clerk script loaded but window.Clerk is unavailable');
  }
  return window.Clerk;
}

function injectClerkScript(): Promise<any> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-clerk-loader="true"]') as HTMLScriptElement | null;

    const handleResolve = () => {
      try {
        resolve(resolveClerkGlobalOrThrow());
      } catch (error: unknown) {
        reject(error);
      }
    };

    const handleReject = () => {
      reject(new Error('Failed to load Clerk script (blocked by Content Security Policy or network error).'));
    };

    if (existing) {
      if (window.Clerk) {
        handleResolve();
        return;
      }

      existing.addEventListener('load', handleResolve, { once: true });
      existing.addEventListener('error', handleReject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.dataset.clerkLoader = 'true';
    script.src = CLERK_SCRIPT_URL;
    script.onload = handleResolve;
    script.onerror = handleReject;
    document.head.appendChild(script);
  });
}

export async function loadClerk(publishableKey: string): Promise<any> {
  if (!publishableKey) {
    throw new Error('Missing Clerk publishable key');
  }

  if (window.Clerk?.loaded) {
    return window.Clerk;
  }

  if (!loadPromise) {
    loadPromise = withTimeout(
      injectClerkScript().then(async (clerk) => {
        await withTimeout(
          clerk.load({ publishableKey }),
          CLERK_LOAD_TIMEOUT_MS,
          'Clerk initialization timed out. Please retry.',
        );
        return clerk;
      }),
      CLERK_LOAD_TIMEOUT_MS,
      'Clerk script failed to load in time. Please retry.',
    ).catch((error: unknown) => {
      loadPromise = null;
      throw normalizeClerkError(error, 'Unable to initialize Clerk.');
    });
  }

  return loadPromise;
}

export async function getClerkSessionToken(publishableKey: string): Promise<string | null> {
  const clerk = await loadClerk(publishableKey);
  if (!clerk.session) return null;
  return clerk.session.getToken();
}

export async function signInWithPassword(publishableKey: string, email: string, password: string): Promise<void> {
  const clerk = await loadClerk(publishableKey);
  const attempt = await clerk.client.signIn.create({ identifier: email, password });
  if (attempt.status !== 'complete') {
    throw new Error('Sign-in incomplete');
  }
  await clerk.setActive({ session: attempt.createdSessionId });
}

export async function signUpWithPassword(publishableKey: string, email: string, password: string, firstName: string): Promise<void> {
  const clerk = await loadClerk(publishableKey);
  const attempt = await clerk.client.signUp.create({ emailAddress: email, password, firstName });
  if (attempt.status !== 'complete') {
    throw new Error('Sign-up requires additional verification in Clerk dashboard configuration.');
  }
  await clerk.setActive({ session: attempt.createdSessionId });
}

export async function oauthRedirect(publishableKey: string, provider: OAuthProvider): Promise<void> {
  if (!ensureCanonicalLocalOrigin()) return;

  const clerk = await loadClerk(publishableKey);
  const callbackUrl = canonicalizeLocalUrl(`${window.location.origin}${CALLBACK_PATH}`);
  const redirectUrlComplete = canonicalizeLocalUrl(window.location.href);

  await clerk.client.signIn.authenticateWithRedirect({
    strategy: `oauth_${provider}`,
    redirectUrl: callbackUrl,
    redirectUrlComplete,
  });
}

export async function signOutClerk(publishableKey: string): Promise<void> {
  const clerk = await loadClerk(publishableKey);
  await clerk.signOut();
}
