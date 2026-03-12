import type { AppUser } from './securityPolicy';

interface AuthApiPayload {
  user?: AppUser | null;
  csrfToken?: string | null;
}

interface AuthApiResponse {
  data?: AuthApiPayload;
  user?: AppUser | null;
  csrfToken?: string | null;
}

export interface AuthResult {
  user: AppUser | null;
  csrfToken: string | null;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');
const AUTH_BASE_URL = `${API_BASE_URL}/auth`;
const REQUEST_TIMEOUT_MS = 10000;

function normalizeAuthPayload(payload: AuthApiResponse | null): AuthResult {
  if (!payload) {
    return { user: null, csrfToken: null };
  }

  const nestedData = payload.data;

  return {
    user: nestedData?.user ?? payload.user ?? null,
    csrfToken: nestedData?.csrfToken ?? payload.csrfToken ?? null,
  };
}

async function requestAuth(
  path: string,
  init: RequestInit = {},
  csrfToken?: string | null,
): Promise<AuthResult> {
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

    if (!response.ok) {
      return { user: null, csrfToken: null };
    }

    if (response.status === 204) {
      return { user: null, csrfToken: null };
    }

    const data = (await response.json()) as AuthApiResponse;
    return normalizeAuthPayload(data);
  } catch {
    return { user: null, csrfToken: null };
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function fetchServerSession(csrfToken?: string | null): Promise<AuthResult> {
  return requestAuth('/session', { method: 'GET' }, csrfToken);
}

export async function loginWithApi(
  email: string,
  password: string,
  csrfToken?: string | null,
): Promise<AuthResult> {
  return requestAuth(
    '/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    },
    csrfToken,
  );
}

export async function registerWithApi(
  email: string,
  password: string,
  name: string,
  csrfToken?: string | null,
): Promise<AuthResult> {
  return requestAuth(
    '/register',
    {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    },
    csrfToken,
  );
}

export async function logoutWithApi(csrfToken?: string | null): Promise<void> {
  await requestAuth('/logout', { method: 'POST' }, csrfToken);
}
