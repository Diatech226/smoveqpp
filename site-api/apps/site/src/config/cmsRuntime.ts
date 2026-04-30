const LOCAL_CMS_ORIGIN = 'http://localhost:5174';
const DEFAULT_LOCAL_CMS_APP_URL = `${LOCAL_CMS_ORIGIN}/#cms`;
const DEFAULT_PRODUCTION_CMS_APP_URL = 'https://smoovecms.vercel.app/#cms';

function normalizeLoopbackHost(url: URL): URL {
  if (url.hostname === '127.0.0.1') {
    url.hostname = 'localhost';
  }
  return url;
}

function isLocalRuntime(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

function normalizeRelativeOrAbsoluteUrl(rawValue: string | undefined): string {
  const candidate = rawValue?.trim();
  if (!candidate) {
    return isLocalRuntime() ? DEFAULT_LOCAL_CMS_APP_URL : DEFAULT_PRODUCTION_CMS_APP_URL;
  }

  if (candidate.startsWith('/')) {
    return candidate;
  }

  try {
    const normalized = normalizeLoopbackHost(new URL(candidate));
    return normalized.toString();
  } catch {
    return isLocalRuntime() ? DEFAULT_LOCAL_CMS_APP_URL : DEFAULT_PRODUCTION_CMS_APP_URL;
  }
}

export function getCmsAppUrl(): string {
  const configured = normalizeRelativeOrAbsoluteUrl(import.meta.env.VITE_CMS_APP_URL);
  if (configured.includes('#')) return configured;
  return `${configured.replace(/\/+$/, '')}/#cms`;
}
