import { RUNTIME_CONFIG } from '../config/runtimeConfig';
import type { AppUser } from './securityPolicy';

interface SessionMeta {
  sessionId?: string | null;
  authenticatedAt?: string | null;
  lastActivityAt?: string | null;
  authProvider?: string | null;
  role?: string | null;
}

interface AuthApiPayload {
  user?: AppUser | null;
  users?: AppUser[];
  events?: Array<Record<string, unknown>>;
  session?: SessionMeta | null;
  csrfToken?: string | null;
  providers?: Record<string, { enabled: boolean }>;
}

interface AuthApiResponse {
  success?: boolean;
  data?: AuthApiPayload | null;
  error?: { code?: string; message?: string } | null;
}

export interface AuthResult {
  user: AppUser | null;
  users?: AppUser[];
  events?: Array<Record<string, unknown>>;
  session?: SessionMeta | null;
  csrfToken?: string | null;
  providers?: Record<string, { enabled: boolean }>;
  success: boolean;
  errorCode: string | null;
  errorMessage: string | null;
  status: number;
}

const AUTH_BASE_URL = `${RUNTIME_CONFIG.apiBaseUrl}/auth`;

function fallbackErrorMessage(code: string | null, status: number): string {
  if (code === 'UNAUTHENTICATED') return 'Session invalide. Merci de vous reconnecter.';
  if (code === 'FORBIDDEN') return 'Accès refusé.';
  if (code === 'INVALID_CREDENTIALS') return 'Email ou mot de passe invalide.';
  if (code === 'ACCOUNT_SUSPENDED') return 'Ce compte est suspendu. Contactez un administrateur.';
  if (code === 'INVALID_CSRF') return 'Session expirée. Rechargez la page puis réessayez.';
  if (code === 'REQUEST_TIMEOUT') return "L'initialisation du serveur a expiré. Veuillez réessayer.";
  if (status >= 500) return 'Erreur serveur. Réessayez plus tard.';
  return 'Erreur d’authentification.';
}

export function normalizeAuthPayload(payload: AuthApiResponse | null, status: number): AuthResult {
  const result = normalize(payload, status);
  if (!result.success && !result.errorMessage) {
    return { ...result, errorMessage: fallbackErrorMessage(result.errorCode, status) };
  }
  return result;
}

function normalize(body: AuthApiResponse | null, status: number): AuthResult {
  const success = status < 400 && body?.success === true;
  return {
    user: body?.data?.user ?? null,
    users: body?.data?.users,
    events: body?.data?.events,
    session: body?.data?.session,
    csrfToken: body?.data?.csrfToken ?? null,
    providers: body?.data?.providers,
    success,
    errorCode: body?.error?.code ?? null,
    errorMessage: body?.error?.message ?? null,
    status,
  };
}

function timeoutResult(status = 408): AuthResult {
  return normalizeAuthPayload(
    { success: false, error: { code: 'REQUEST_TIMEOUT' } },
    status,
  );
}

async function request(path: string, init: RequestInit = {}, clerkToken?: string | null, timeoutMs = RUNTIME_CONFIG.requestTimeoutMs): Promise<AuthResult> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (clerkToken) {
    headers.set('Authorization', `Bearer ${clerkToken}`);
  }

  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${AUTH_BASE_URL}${path}`, {
      ...init,
      headers,
      credentials: 'include',
      signal: controller.signal,
    });

    const json = (await response.json().catch(() => null)) as AuthApiResponse | null;
    return normalizeAuthPayload(json, response.status);
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return timeoutResult();
    }
    return normalizeAuthPayload({ success: false, error: { code: 'NETWORK_ERROR', message: 'Service d’authentification indisponible.' } }, 503);
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

export function fetchClerkSession(token: string): Promise<AuthResult> {
  return request('/me', { method: 'GET' }, token);
}

export function startClerkBackendSession(token: string): Promise<AuthResult> {
  return request('/session/clerk', { method: 'POST' }, token);
}

export function fetchSession(options?: { timeoutMs?: number }): Promise<AuthResult> {
  return request('/session', { method: 'GET' }, undefined, options?.timeoutMs);
}

export async function loginWithPassword(email: string, password: string): Promise<AuthResult> {
  const csrfSource = await fetchSession();
  if (!csrfSource.success) {
    return csrfSource;
  }

  const headers = new Headers();
  if (csrfSource.csrfToken) {
    headers.set('X-CSRF-Token', csrfSource.csrfToken);
  }
  return request('/login', { method: 'POST', headers, body: JSON.stringify({ email, password }) });
}

export async function registerWithPassword(email: string, password: string, name: string): Promise<AuthResult> {
  const csrfSource = await fetchSession();
  if (!csrfSource.success) {
    return csrfSource;
  }

  const headers = new Headers();
  if (csrfSource.csrfToken) {
    headers.set('X-CSRF-Token', csrfSource.csrfToken);
  }
  return request('/register', { method: 'POST', headers, body: JSON.stringify({ email, password, name }) });
}

export async function logoutWithSession(): Promise<AuthResult> {
  const csrfSource = await fetchSession();
  if (!csrfSource.success) {
    return csrfSource;
  }

  const headers = new Headers();
  if (csrfSource.csrfToken) {
    headers.set('X-CSRF-Token', csrfSource.csrfToken);
  }
  return request('/logout', { method: 'POST', headers });
}

export function fetchAdminUsers(token?: string | null): Promise<AuthResult> {
  return request('/admin/users', { method: 'GET' }, token);
}

export function updateAdminUserWithApi(
  userId: string,
  patch: Partial<Pick<AppUser, 'role' | 'accountStatus' | 'emailVerified'>>,
  token?: string | null,
): Promise<AuthResult> {
  return request(`/admin/users/${userId}`, { method: 'PATCH', body: JSON.stringify(patch) }, token);
}

export function fetchAuthAuditEvents(token?: string | null): Promise<AuthResult> {
  return request('/admin/audit-events', { method: 'GET' }, token);
}
