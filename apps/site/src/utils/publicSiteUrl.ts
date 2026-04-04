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

export function getPublicSiteUrl(): string {
  const explicit = normalizeAbsoluteUrl(import.meta.env.VITE_PUBLIC_SITE_URL);
  if (explicit) return explicit;

  const legacy = normalizeAbsoluteUrl(import.meta.env.VITE_PUBLIC_APP_URL);
  if (legacy) return legacy;

  return DEFAULT_PUBLIC_SITE_URL;
}
