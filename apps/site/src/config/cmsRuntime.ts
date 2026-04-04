const DEFAULT_CMS_APP_URL = '/cms/#cms';

function normalizeRelativeOrAbsoluteUrl(rawValue: string | undefined): string {
  const candidate = rawValue?.trim();
  if (!candidate) return DEFAULT_CMS_APP_URL;

  if (candidate.startsWith('/')) {
    return candidate;
  }

  try {
    return new URL(candidate).toString();
  } catch {
    return DEFAULT_CMS_APP_URL;
  }
}

export function getCmsAppUrl(): string {
  const configured = normalizeRelativeOrAbsoluteUrl(import.meta.env.VITE_CMS_APP_URL);
  if (configured.includes('#')) return configured;
  return `${configured.replace(/\/+$/, '')}/#cms`;
}
