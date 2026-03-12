import type { AppUser } from './securityPolicy';

interface AuthApiPayload {
  user?: AppUser | null;
  csrfToken?: string | null;
}

interface AuthApiResponse {
  success?: boolean;
  data?: AuthApiPayload;
  error?: { code?: string; message?: string };
  user?: AppUser | null;
  csrfToken?: string | null;
}

export interface AuthResult {
  user: AppUser | null;
  csrfToken: string | null;
  success: boolean;
  errorMessage: string | null;
  status: number;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api/v1').replace(/\/$/, '');
const AUTH_BASE_URL = `${API_BASE_URL}/auth`;
const REQUEST_TIMEOUT_MS = 10000;

function normalizeAuthPayload(payload: AuthApiResponse | null, status: number): AuthResult {
  if (!payload) {
    return { user: null, csrfToken: null, success: false, errorMessage: 'Réponse serveur invalide.', status };
  }

  const nestedData = payload.data;
  return {
    user: nestedData?.user ?? payload.user ?? null,
    csrfToken: nestedData?.csrfToken ?? payload.csrfToken ?? null,
    success: payload.success ?? status < 400,
    errorMessage: payload.error?.message ?? null,
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

    if (response.status === 204) {
      return { user: null, csrfToken: null, success: true, errorMessage: null, status: 204 };
    }

    const body = (await response.json().catch(() => null)) as AuthApiResponse | null;
    const normalized = normalizeAuthPayload(body, response.status);

    if (!response.ok) {
      return {
        ...normalized,
        success: false,
        errorMessage: normalized.errorMessage ?? 'Erreur d’authentification.',
      };
    }

    return normalized;
  } catch {
    return {
      user: null,
      csrfToken: null,
      success: false,
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
