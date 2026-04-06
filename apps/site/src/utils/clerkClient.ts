type OAuthProvider = 'google' | 'facebook';

interface ClerkSession {
  getToken: () => Promise<string | null>;
}

interface ClerkSignInAttempt {
  status: string;
  createdSessionId?: string;
}

interface ClerkSignUpAttempt {
  status: string;
  createdSessionId?: string;
}

interface ClerkClient {
  signIn: {
    create: (params: { identifier: string; password: string }) => Promise<ClerkSignInAttempt>;
    authenticateWithRedirect: (params: {
      strategy: string;
      redirectUrl: string;
      redirectUrlComplete: string;
    }) => Promise<void>;
  };
  signUp: {
    create: (params: { emailAddress: string; password: string; firstName: string }) => Promise<ClerkSignUpAttempt>;
  };
}

interface ClerkInstance {
  loaded: boolean;
  session: ClerkSession | null;
  client: ClerkClient;
  load: () => Promise<void>;
  setActive: (params: { session?: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

type ClerkConstructor = new (publishableKey: string) => ClerkInstance;

declare global {
  interface Window {
    Clerk?: ClerkConstructor;
  }
}

let clerkInstance: ClerkInstance | null = null;
let clerkPublishableKey: string | null = null;
let loadPromise: Promise<ClerkInstance> | null = null;
let scriptLoadPromise: Promise<void> | null = null;

const CALLBACK_PATH = '/sso-callback';
const CLERK_LOAD_TIMEOUT_MS = 12000;
const CLERK_JS_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js';
const CLERK_SCRIPT_SELECTOR = 'script[data-clerk-js-runtime="true"]';

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

function resolveClerkConstructor(): ClerkConstructor {
  const ctor = window.Clerk;
  if (!ctor) {
    throw new Error('Clerk runtime unavailable. Verify that Clerk JS loaded correctly.');
  }
  return ctor;
}

function loadClerkScript(): Promise<void> {
  if (window.Clerk) {
    return Promise.resolve();
  }

  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(CLERK_SCRIPT_SELECTOR);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Clerk runtime script.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = CLERK_JS_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.dataset.clerkJsRuntime = 'true';
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error('Failed to load Clerk runtime script.')), { once: true });
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    scriptLoadPromise = null;
    throw normalizeClerkError(error, 'Unable to load Clerk runtime.');
  });

  return scriptLoadPromise;
}

function getOrCreateClerkInstance(publishableKey: string): ClerkInstance {
  if (!clerkInstance || clerkPublishableKey !== publishableKey) {
    const ClerkRuntime = resolveClerkConstructor();
    clerkInstance = new ClerkRuntime(publishableKey);
    clerkPublishableKey = publishableKey;
  }

  return clerkInstance;
}

export async function loadClerk(publishableKey: string): Promise<ClerkInstance> {
  if (!publishableKey) {
    throw new Error('Missing Clerk publishable key');
  }

  await withTimeout(loadClerkScript(), CLERK_LOAD_TIMEOUT_MS, 'Clerk initialization timed out. Please retry.');

  const clerk = getOrCreateClerkInstance(publishableKey);

  if (clerk.loaded) {
    return clerk;
  }

  if (!loadPromise) {
    loadPromise = withTimeout(
      clerk.load(),
      CLERK_LOAD_TIMEOUT_MS,
      'Clerk initialization timed out. Please retry.',
    )
      .then(() => clerk)
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
