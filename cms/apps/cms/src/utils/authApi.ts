import { RUNTIME_CONFIG } from '../config/runtimeConfig';
import { apiRequest, ApiClientError, setAuthToken } from '../services/apiClient';
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
  reset?: {
    emailDeliveryReady?: boolean;
    expiresAt?: string | null;
    devToken?: string | null;
    devPreviewUrl?: string | null;
  };
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
  reset?: AuthApiPayload['reset'];
  success: boolean;
  errorCode: string | null;
  errorMessage: string | null;
  status: number;
}


function fallbackErrorMessage(code: string | null, status: number): string {
  if (code === 'UNAUTHENTICATED') return 'Session invalide. Merci de vous reconnecter.';
  if (code === 'FORBIDDEN') return 'Compte non autorisé pour le CMS.';
  if (code === 'INVALID_CREDENTIALS') return 'Email ou mot de passe invalide.';
  if (code === 'ACCOUNT_SUSPENDED') return 'Ce compte est suspendu. Contactez un administrateur.';
  if (code === 'INVALID_CSRF') return 'Session expirée. Rechargez la page puis réessayez.';
  if (code === 'REQUEST_TIMEOUT') return "L'initialisation du serveur a expiré. Veuillez réessayer.";
  if (status >= 500) return 'Erreur serveur. Réessayez plus tard.';
  return 'Erreur technique d’authentification.';
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
    reset: body?.data?.reset,
    success,
    errorCode: body?.error?.code ?? null,
    errorMessage: body?.error?.message ?? null,
    status,
  };
}

export function normalizeAuthPayload(payload: AuthApiResponse | null, status: number): AuthResult {
  const result = normalize(payload, status);
  if (!result.success && !result.errorMessage) {
    return { ...result, errorMessage: fallbackErrorMessage(result.errorCode, status) };
  }
  return result;
}

function timeoutResult(status = 408): AuthResult {
  return normalizeAuthPayload({ success: false, error: { code: 'REQUEST_TIMEOUT' } }, status);
}

async function request(path: string, init: RequestInit = {}, timeoutMs = RUNTIME_CONFIG.requestTimeoutMs): Promise<AuthResult> {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const data = await apiRequest<AuthApiPayload>(`/auth${path}`, { ...init, signal: controller.signal });
    return normalizeAuthPayload({ success: true, data }, 200);
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') return timeoutResult();
    if (error instanceof ApiClientError) {
      return normalizeAuthPayload({ success: false, error: { code: error.code, message: error.message } }, error.status || 500);
    }
    return normalizeAuthPayload({ success: false, error: { code: 'NETWORK_ERROR', message: 'Service d’authentification indisponible.' } }, 503);
  } finally { globalThis.clearTimeout(timeoutId); }
}

export function fetchSession(options?: { timeoutMs?: number }): Promise<AuthResult> {
  return request('/session', { method: 'GET' }, options?.timeoutMs);
}

export function fetchOAuthProviders(): Promise<AuthResult> {
  return request('/oauth/providers', { method: 'GET' });
}

async function buildCsrfHeaders(): Promise<AuthResult | Headers> {
  const csrfSource = await fetchSession();
  if (!csrfSource.success) {
    return csrfSource;
  }

  const headers = new Headers();
  if (csrfSource.csrfToken) {
    headers.set('X-CSRF-Token', csrfSource.csrfToken);
  }
  return headers;
}

export async function loginWithPassword(email: string, password: string): Promise<AuthResult> {
  const headers = await buildCsrfHeaders();
  if ('success' in headers) return headers;
  const result = await request('/login', { method: 'POST', headers, body: JSON.stringify({ email, password }) });
  setAuthToken(result.success ? result.session?.sessionId ?? null : null);
  return result;
}

export async function registerWithPassword(email: string, password: string, name: string): Promise<AuthResult> {
  const headers = await buildCsrfHeaders();
  if ('success' in headers) return headers;
  const result = await request('/register', { method: 'POST', headers, body: JSON.stringify({ email, password, name }) });
  setAuthToken(result.success ? result.session?.sessionId ?? null : null);
  return result;
}

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  const headers = await buildCsrfHeaders();
  if ('success' in headers) return headers;
  return request('/password-reset/request', { method: 'POST', headers, body: JSON.stringify({ email }) });
}

export async function confirmPasswordReset(token: string, password: string): Promise<AuthResult> {
  const headers = await buildCsrfHeaders();
  if ('success' in headers) return headers;
  return request('/password-reset/confirm', { method: 'POST', headers, body: JSON.stringify({ token, password }) });
}

export async function logoutWithSession(): Promise<AuthResult> {
  const headers = await buildCsrfHeaders();
  if ('success' in headers) return headers;
  const result = await request('/logout', { method: 'POST', headers });
  setAuthToken(null);
  return result;
}

export function fetchAdminUsers(): Promise<AuthResult> {
  return request('/admin/users', { method: 'GET' });
}

export function updateAdminUserWithApi(
  userId: string,
  patch: Partial<Pick<AppUser, 'role' | 'accountStatus' | 'emailVerified'>>,
): Promise<AuthResult> {
  return request(`/admin/users/${userId}`, { method: 'PATCH', body: JSON.stringify(patch) });
}

export function fetchAuthAuditEvents(): Promise<AuthResult> {
  return request('/admin/audit-events', { method: 'GET' });
}
