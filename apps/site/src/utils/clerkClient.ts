declare global {
  interface Window {
    Clerk?: any;
  }
}

let loadPromise: Promise<any> | null = null;

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

export async function loadClerk(publishableKey: string): Promise<any> {
  if (!publishableKey) {
    throw new Error('Missing Clerk publishable key');
  }

  if (window.Clerk?.loaded) {
    return window.Clerk;
  }

  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-clerk-loader="true"]') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve(window.Clerk));
        existing.addEventListener('error', () => reject(new Error('Failed to load Clerk script')));
        return;
      }

      const script = document.createElement('script');
      script.async = true;
      script.dataset.clerkLoader = 'true';
      script.src = 'https://cdn.jsdelivr.net/npm/@clerk/clerk-js@latest/dist/clerk.browser.js';
      script.onload = () => resolve(window.Clerk);
      script.onerror = () => reject(new Error('Failed to load Clerk script'));
      document.head.appendChild(script);
    }).then(async (clerk) => {
      await clerk.load({ publishableKey });
      return clerk;
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

export async function oauthRedirect(publishableKey: string, provider: 'google' | 'facebook'): Promise<void> {
  const clerk = await loadClerk(publishableKey);
  const redirectUrl = canonicalizeLocalUrl(window.location.href);
  await clerk.client.signIn.authenticateWithRedirect({
    strategy: `oauth_${provider}`,
    redirectUrl,
    redirectUrlComplete: redirectUrl,
  });
}

export async function signOutClerk(publishableKey: string): Promise<void> {
  const clerk = await loadClerk(publishableKey);
  await clerk.signOut();
}
