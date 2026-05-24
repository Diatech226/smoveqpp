import { RUNTIME_CONFIG } from '../config/runtimeConfig';
const AUTH_TOKEN_KEY = 'smove.cms.auth.token';
export type ApiErrorCode = 'UNAUTHENTICATED' | 'FORBIDDEN' | 'SERVER_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN';
export class ApiClientError extends Error { constructor(message: string, public readonly status: number, public readonly code: ApiErrorCode, public readonly details?: unknown) { super(message); this.name = 'ApiClientError'; } }
function devDebug(...args: unknown[]) { if (import.meta.env.DEV && import.meta.env.VITE_AUTH_DEBUG === 'true') console.debug('[api-client]', ...args); }
export function getAuthToken(): string | null { if (typeof window === 'undefined') return null; return window.localStorage.getItem(AUTH_TOKEN_KEY); }
export function setAuthToken(token: string | null): void { if (typeof window === 'undefined') return; if (!token) { window.localStorage.removeItem(AUTH_TOKEN_KEY); return; } window.localStorage.setItem(AUTH_TOKEN_KEY, token); }
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers); const token = getAuthToken();
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const url = `${RUNTIME_CONFIG.apiBaseUrl}${path}`; devDebug('request', { url, method: init.method ?? 'GET' });
  let response: Response; try { response = await fetch(url, { ...init, headers, credentials: 'include', cache: 'no-store' }); } catch { throw new ApiClientError('API indisponible. Vérifiez la connexion réseau.', 503, 'NETWORK_ERROR'); }
  const body = (await response.json().catch(() => null)) as any;
  if (response.ok && body?.success !== false) return (body?.data !== undefined ? body.data : body) as T;
  if (response.status === 401) { setAuthToken(null); throw new ApiClientError('Session expirée ou token manquant. Merci de vous reconnecter.', 401, 'UNAUTHENTICATED', body?.error?.details); }
  if (response.status === 403) throw new ApiClientError('Accès refusé. Vous n’avez pas les permissions nécessaires.', 403, 'FORBIDDEN', body?.error?.details);
  if (response.status >= 500) throw new ApiClientError('Erreur serveur. Réessayez plus tard.', response.status, 'SERVER_ERROR', body?.error?.details);
  throw new ApiClientError(body?.error?.message ?? 'Erreur API inconnue.', response.status, 'UNKNOWN', body?.error?.details);
}
