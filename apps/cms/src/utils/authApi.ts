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

async function request(path: string, init: RequestInit = {}, clerkToken?: string | null): Promise<AuthResult> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (clerkToken) {
    headers.set('Authorization', `Bearer ${clerkToken}`);
  }

  const response = await fetch(`${AUTH_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  const json = (await response.json().catch(() => null)) as AuthApiResponse | null;
  return normalizeAuthPayload(json, response.status);
}

export function fetchClerkSession(token: string): Promise<AuthResult> {
  return request('/me', { method: 'GET' }, token);
}

export function startClerkBackendSession(token: string): Promise<AuthResult> {
  return request('/session/clerk', { method: 'POST' }, token);
}

export function fetchSession(): Promise<AuthResult> {
  return request('/session', { method: 'GET' });
}

export async function loginWithPassword(email: string, password: string): Promise<AuthResult> {
  const csrfSource = await fetchSession();
  const headers = new Headers();
  if (csrfSource.csrfToken) {
    headers.set('X-CSRF-Token', csrfSource.csrfToken);
  }
  return request('/login', { method: 'POST', headers, body: JSON.stringify({ email, password }) });
}

export async function registerWithPassword(email: string, password: string, name: string): Promise<AuthResult> {
  const csrfSource = await fetchSession();
  const headers = new Headers();
  if (csrfSource.csrfToken) {
    headers.set('X-CSRF-Token', csrfSource.csrfToken);
  }
  return request('/register', { method: 'POST', headers, body: JSON.stringify({ email, password, name }) });
}

export async function logoutWithSession(): Promise<AuthResult> {
  const csrfSource = await fetchSession();
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
