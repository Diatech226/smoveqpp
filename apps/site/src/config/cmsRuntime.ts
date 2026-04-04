const DEFAULT_CMS_APP_URL = 'http://localhost:5174';

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function ensureCmsPath(url: string): string {
  return url.includes('#') ? url : `${url}/#cms`;
}

export function getCmsAppUrl(): string {
  const configured = import.meta.env.VITE_CMS_APP_URL;
  const normalized = trimTrailingSlash(configured && configured.trim() ? configured : DEFAULT_CMS_APP_URL);
  return ensureCmsPath(normalized);
}
