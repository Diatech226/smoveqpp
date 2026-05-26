import { logWarn } from '../utils/observability';

const DEFAULT_API_ORIGIN = 'https://smoveapi-1.onrender.com';

function normalizeApiBaseUrl(rawValue: string | undefined, apiOrigin: string): string {
  const candidate = (rawValue ?? '/api/v1').trim();
  if (candidate.length === 0) {
    return '/api/v1';
  }

  if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
    return candidate.replace(/\/$/, '');
  }

  if (candidate.startsWith('/')) {
    if (apiOrigin) {
      return `${apiOrigin}${candidate}`.replace(/\/$/, '');
    }
    return candidate.replace(/\/$/, '');
  }

  logWarn({
    scope: 'config',
    event: 'invalid_api_base_url_format',
    details: { configuredValue: candidate },
  });
  return '/api/v1';
}

function parseTimeout(rawValue: string | undefined, defaultValue: number): number {
  if (!rawValue) return defaultValue;
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed < 1000) {
    logWarn({
      scope: 'config',
      event: 'invalid_request_timeout',
      details: { configuredValue: rawValue, fallback: defaultValue },
    });
    return defaultValue;
  }
  return parsed;
}

function normalizeApiOrigin(rawValue: string | undefined): string {
  const candidate = (rawValue ?? DEFAULT_API_ORIGIN).trim();
  if (!candidate) return DEFAULT_API_ORIGIN;
  try { return new URL(candidate).origin; } catch {
    logWarn({ scope: 'config', event: 'invalid_api_origin', details: { configuredValue: candidate } });
    return DEFAULT_API_ORIGIN;
  }
}

const apiOrigin = normalizeApiOrigin(import.meta.env.VITE_API_ORIGIN);

export const RUNTIME_CONFIG = {
  apiBaseUrl: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL, apiOrigin),
  requestTimeoutMs: parseTimeout(import.meta.env.VITE_REQUEST_TIMEOUT_MS, 10000),
};
