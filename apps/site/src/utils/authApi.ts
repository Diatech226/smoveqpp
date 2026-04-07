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

async function request(path: string, init: RequestInit = {}): Promise<AuthResult> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const response = await fetch(`${AUTH_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  const json = (await response.json().catch(() => null)) as AuthApiResponse | null;
  return normalize(json, response.status);
}

export function fetchSession(): Promise<AuthResult> {
  return request('/session', { method: 'GET' });
}

export async function loginWithPassword(email: string, password: string): Promise<AuthResult> {
  const csrf = await fetchSession();
  if (!csrf.success) return csrf;
  return request('/login', { method: 'POST', headers: { 'X-CSRF-Token': csrf.csrfToken ?? '' }, body: JSON.stringify({ email, password }) });
}

export async function registerWithPassword(email: string, password: string, name: string): Promise<AuthResult> {
  const csrf = await fetchSession();
  if (!csrf.success) return csrf;
  return request('/register', { method: 'POST', headers: { 'X-CSRF-Token': csrf.csrfToken ?? '' }, body: JSON.stringify({ email, password, name }) });
}

export async function logoutWithSession(): Promise<AuthResult> {
  const csrf = await fetchSession();
  if (!csrf.success) return csrf;
  return request('/logout', { method: 'POST', headers: { 'X-CSRF-Token': csrf.csrfToken ?? '' } });
}

export function fetchAdminUsers(): Promise<AuthResult> { return request('/admin/users', { method: 'GET' }); }
export function fetchAuthAuditEvents(): Promise<AuthResult> { return request('/admin/audit-events', { method: 'GET' }); }
export function updateAdminUserWithApi(userId: string, patch: Partial<Pick<AppUser, 'role' | 'accountStatus' | 'emailVerified'>>): Promise<AuthResult> {
  return request(`/admin/users/${userId}`, { method: 'PATCH', body: JSON.stringify(patch) });
}
