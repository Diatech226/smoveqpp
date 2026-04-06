import { Clerk } from '@clerk/clerk-js';

type OAuthProvider = 'google' | 'facebook';

let clerkInstance: Clerk | null = null;
let clerkPublishableKey: string | null = null;
let loadPromise: Promise<Clerk> | null = null;

const CALLBACK_PATH = '/sso-callback';
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

function getOrCreateClerkInstance(publishableKey: string): Clerk {
  if (!clerkInstance || clerkPublishableKey !== publishableKey) {
    clerkInstance = new Clerk(publishableKey);
    clerkPublishableKey = publishableKey;
  }

  return clerkInstance;
}

export async function loadClerk(publishableKey: string): Promise<Clerk> {
  if (!publishableKey) {
    throw new Error('Missing Clerk publishable key');
  }

  const clerk = getOrCreateClerkInstance(publishableKey);

  if (clerk.loaded) {
    return clerk;
  }

  if (!loadPromise) {
    loadPromise = withTimeout(
      clerk.load(),
      CLERK_LOAD_TIMEOUT_MS,
      'Clerk initialization timed out. Please retry.',
    ).then(() => clerk)
      .catch((error: unknown) => {
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
