import type { AppUser } from './securityPolicy';

interface AuthApiPayload {
  user?: AppUser | null;
  csrfToken?: string | null;
}

interface AuthApiError {
  code?: string;
  message?: string;
}

interface AuthApiResponse {
  success?: boolean;
  data?: AuthApiPayload | null;
  error?: AuthApiError | null;
}

export interface AuthResult {
  user: AppUser | null;
  csrfToken: string | null;
  success: boolean;
  errorMessage: string | null;
  errorCode: string | null;
  status: number;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api/v1').replace(/\/$/, '');
const AUTH_BASE_URL = `${API_BASE_URL}/auth`;
const REQUEST_TIMEOUT_MS = 10000;

function fallbackErrorMessage(code: string | null, status: number): string {
  if (code === 'INVALID_CREDENTIALS') return 'Identifiants invalides.';
  if (code === 'INVALID_CSRF') return 'Session expirée, merci de réessayer.';
  if (code === 'RATE_LIMITED') return 'Trop de tentatives. Réessayez plus tard.';
  if (status >= 500) return 'Erreur serveur. Réessayez plus tard.';
  return 'Erreur d’authentification.';
}

function normalizeAuthPayload(payload: AuthApiResponse | null, status: number): AuthResult {
  const data = payload?.data ?? null;
  const error = payload?.error ?? null;
  const success = payload?.success === true && status < 400;
  const errorCode = typeof error?.code === 'string' ? error.code : null;
  const explicitMessage = typeof error?.message === 'string' ? error.message : null;

  return {
    user: data?.user ?? null,
    csrfToken: data?.csrfToken ?? null,
    success,
    errorCode,
    errorMessage: success ? null : explicitMessage ?? fallbackErrorMessage(errorCode, status),
    status,
  };
}

async function requestAuth(path: string, init: RequestInit = {}, csrfToken?: string | null): Promise<AuthResult> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const headers = new Headers(init.headers);
    if (!headers.has('Content-Type') && init.body) {
      headers.set('Content-Type', 'application/json');
    }
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
    }

    const response = await fetch(`${AUTH_BASE_URL}${path}`, {
      ...init,
      headers,
      credentials: 'include',
      signal: controller.signal,
    });

    const body = (await response.json().catch(() => null)) as AuthApiResponse | null;
    const normalized = normalizeAuthPayload(body, response.status);

    if (!response.ok) {
      return { ...normalized, success: false };
    }

    return normalized;
  } catch {
    return {
      user: null,
      csrfToken: null,
      success: false,
      errorCode: 'NETWORK_ERROR',
      errorMessage: 'Serveur indisponible. Réessayez plus tard.',
      status: 0,
    };
  } finally {
    window.clearTimeout(timeout);
  }
}

export function fetchServerSession(csrfToken?: string | null): Promise<AuthResult> {
  return requestAuth('/session', { method: 'GET' }, csrfToken);
}

export function loginWithApi(email: string, password: string, csrfToken?: string | null): Promise<AuthResult> {
  return requestAuth('/login', { method: 'POST', body: JSON.stringify({ email, password }) }, csrfToken);
}

export function registerWithApi(email: string, password: string, name: string, csrfToken?: string | null): Promise<AuthResult> {
  return requestAuth('/register', { method: 'POST', body: JSON.stringify({ email, password, name }) }, csrfToken);
}

export function logoutWithApi(csrfToken?: string | null): Promise<AuthResult> {
  return requestAuth('/logout', { method: 'POST' }, csrfToken);
}
