const DEFAULT_PUBLIC_SITE_URL = 'http://127.0.0.1:5173/#home';

function normalizeAbsoluteUrl(rawValue: string | undefined): string | null {
  const candidate = rawValue?.trim();
  if (!candidate) return null;
  if (!/^https?:\/\//i.test(candidate)) return null;
  try {
    return new URL(candidate).toString();
  } catch {
    return null;
  }
}

function normalizeValueWithRuntimeBase(rawValue: string | undefined): string | null {
  const candidate = rawValue?.trim();
  if (!candidate || typeof window === 'undefined') return null;

  if (candidate.startsWith('#')) {
    return `${window.location.origin}${window.location.pathname}${candidate}`;
  }

  if (candidate.startsWith('/')) {
    return `${window.location.origin}${candidate}`;
  }

  if (/^www\./i.test(candidate)) {
    try {
      return new URL(`https://${candidate}`).toString();
    } catch {
      return null;
    }
  }

  if (/^[a-z0-9.-]+\.[a-z]{2,}(?:\/|$)/i.test(candidate)) {
    try {
      return new URL(`https://${candidate}`).toString();
    } catch {
      return null;
    }
  }

  return null;
}

function getRuntimeSameOriginFallback(): string | null {
  if (typeof window === 'undefined') return null;
  return `${window.location.origin}${window.location.pathname}#home`;
}

export function getPublicSiteUrl(): string {
  const explicitRaw = import.meta.env.VITE_PUBLIC_SITE_URL;
  const explicit = normalizeAbsoluteUrl(explicitRaw) || normalizeValueWithRuntimeBase(explicitRaw);
  if (explicit) return explicit;

  const legacyRaw = import.meta.env.VITE_PUBLIC_APP_URL;
  const legacy = normalizeAbsoluteUrl(legacyRaw) || normalizeValueWithRuntimeBase(legacyRaw);
  if (legacy) return legacy;

  const sameOriginFallback = getRuntimeSameOriginFallback();
  if (sameOriginFallback) return sameOriginFallback;

  return DEFAULT_PUBLIC_SITE_URL;
}
