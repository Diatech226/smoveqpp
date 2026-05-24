import { logWarn } from '../utils/observability';

function parseTimeout(rawValue: string | undefined, defaultValue: number): number {
  if (!rawValue) return defaultValue;
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed < 1000) {
    logWarn({ scope: 'config', event: 'invalid_request_timeout', details: { configuredValue: rawValue, fallback: defaultValue } });
    return defaultValue;
  }
  return parsed;
}

function normalizeApiBaseUrl(rawValue: string | undefined): string {
  const candidate = (rawValue ?? '').trim();
  if (!candidate) return 'https://smoveapi-1.onrender.com/api/v1';
  if (candidate.startsWith('http://') || candidate.startsWith('https://')) return candidate.replace(/\/$/, '');
  logWarn({ scope: 'config', event: 'invalid_api_base_url_format', details: { configuredValue: candidate } });
  return 'https://smoveapi-1.onrender.com/api/v1';
}

export const RUNTIME_CONFIG = {
  apiBaseUrl: normalizeApiBaseUrl(import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL),
  requestTimeoutMs: parseTimeout(import.meta.env.VITE_REQUEST_TIMEOUT_MS, 10000),
};
