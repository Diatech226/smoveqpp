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

export function fetchAdminUsers(token: string): Promise<AuthResult> {
  return request('/admin/users', { method: 'GET' }, token);
}

export function updateAdminUserWithApi(userId: string, patch: Partial<Pick<AppUser, 'role' | 'accountStatus' | 'emailVerified'>>, token: string): Promise<AuthResult> {
  return request(`/admin/users/${userId}`, { method: 'PATCH', body: JSON.stringify(patch) }, token);
}

export function fetchAuthAuditEvents(token: string): Promise<AuthResult> {
  return request('/admin/audit-events', { method: 'GET' }, token);
}

