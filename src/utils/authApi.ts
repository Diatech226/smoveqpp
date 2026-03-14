import { RUNTIME_CONFIG } from '../config/runtimeConfig';
import { logWarn } from './observability';
import type { AppUser } from './securityPolicy';

interface AuthApiPayload {
  user?: AppUser | null;
  csrfToken?: string | null;
  providers?: Record<string, { enabled: boolean }>;
  accepted?: boolean;
  resetToken?: string | null;
  expiresAt?: string | null;
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
  providers?: Record<string, { enabled: boolean }>;
  accepted?: boolean;
  resetToken?: string | null;
  expiresAt?: string | null;
  success: boolean;
  errorMessage: string | null;
  errorCode: string | null;
  status: number;
}

const AUTH_BASE_URL = `${RUNTIME_CONFIG.apiBaseUrl}/auth`;
const REQUEST_TIMEOUT_MS = RUNTIME_CONFIG.requestTimeoutMs;

function fallbackErrorMessage(code: string | null, status: number): string {
  if (code === 'INVALID_CREDENTIALS') return 'Identifiants invalides.';
  if (code === 'INVALID_CSRF') return 'Session expirée, merci de réessayer.';
  if (code === 'RATE_LIMITED') return 'Trop de tentatives. Réessayez plus tard.';
  if (code === 'SESSION_UNAUTHORIZED') return 'Session invalide. Merci de vous reconnecter.';
  if (code === 'AUTH_TIMEOUT') return 'Le serveur tarde à répondre. Réessayez.';
  if (code === 'AUTH_OFFLINE') return 'Connexion indisponible. Vérifiez votre réseau.';
  if (code === 'REGISTRATION_DISABLED') return 'Inscription publique désactivée.';
  if (code === 'EMAIL_ALREADY_EXISTS') return 'Un compte existe déjà avec cet email.';
  if (code === 'VALIDATION_ERROR') return 'Vérifiez les champs saisis.';
  if (code === 'RESET_TOKEN_INVALID') return 'Le lien de réinitialisation est invalide ou expiré.';
  if (code === 'OAUTH_PROVIDER_UNAVAILABLE') return 'Ce fournisseur OAuth est indisponible.';
  if (status >= 500) return 'Erreur serveur. Réessayez plus tard.';
  return 'Erreur d’authentification.';
}

export function normalizeAuthPayload(payload: AuthApiResponse | null, status: number): AuthResult {
  const data = payload?.data ?? null;
  const error = payload?.error ?? null;
  const success = payload?.success === true && status < 400;
  const errorCode = typeof error?.code === 'string' ? error.code : null;
  const explicitMessage = typeof error?.message === 'string' ? error.message : null;

  return {
    user: data?.user ?? null,
    csrfToken: data?.csrfToken ?? null,
    providers: data?.providers,
    accepted: data?.accepted,
    resetToken: data?.resetToken ?? null,
    expiresAt: data?.expiresAt ?? null,
    success,
    errorCode,
    errorMessage: success ? null : explicitMessage ?? fallbackErrorMessage(errorCode, status),
    status,
  };
}

function networkFailure(errorCode: string): AuthResult {
  return {
    user: null,
    csrfToken: null,
    providers: undefined,
    accepted: false,
    resetToken: null,
    expiresAt: null,
    success: false,
    errorCode,
    errorMessage: fallbackErrorMessage(errorCode, 0),
    status: 0,
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
    if (!body) {
      logWarn({ scope: 'auth_api', event: 'malformed_payload', details: { path, status: response.status } });
    }

    const normalized = normalizeAuthPayload(body, response.status);
    if (response.status === 401 && !normalized.errorCode) {
      return {
        ...normalized,
        accepted: false,
    resetToken: null,
    expiresAt: null,
    success: false,
        errorCode: 'SESSION_UNAUTHORIZED',
        errorMessage: fallbackErrorMessage('SESSION_UNAUTHORIZED', 401),
      };
    }

    if (!response.ok) {
      return { ...normalized, success: false };
    }

    return normalized;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return networkFailure('AUTH_TIMEOUT');
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return networkFailure('AUTH_OFFLINE');
    }

    return networkFailure('NETWORK_ERROR');
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

export function fetchOAuthProviders(csrfToken?: string | null): Promise<AuthResult> {
  return requestAuth('/oauth/providers', { method: 'GET' }, csrfToken);
}

export function oauthLoginWithApi(
  provider: 'google' | 'facebook',
  payload: { email: string; name: string; providerId: string },
  csrfToken?: string | null,
): Promise<AuthResult> {
  return requestAuth(`/oauth/${provider}`, { method: 'POST', body: JSON.stringify(payload) }, csrfToken);
}

export function logoutWithApi(csrfToken?: string | null): Promise<AuthResult> {
  return requestAuth('/logout', { method: 'POST' }, csrfToken);
}


export function updateProfileWithApi(payload: { name: string; email?: string }, csrfToken?: string | null): Promise<AuthResult> {
  return requestAuth('/profile', { method: 'PATCH', body: JSON.stringify(payload) }, csrfToken);
}

export function forgotPasswordWithApi(email: string, csrfToken?: string | null): Promise<AuthResult> {
  return requestAuth('/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }, csrfToken);
}

export function resetPasswordWithApi(token: string, password: string, csrfToken?: string | null): Promise<AuthResult> {
  return requestAuth('/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }, csrfToken);
}
