import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  fetchAdminUsers as fetchAdminUsersApi,
  fetchAuthAuditEvents,
  fetchSession,
  loginWithPassword,
  logoutWithSession,
  registerWithPassword,
  updateAdminUserWithApi,
} from '../utils/authApi';
import { evaluateCmsAccess, resolvePostLoginRoute, resolveTrustedSessionUser, SECURITY_FLAGS, type AppUser, type PostLoginRoute } from '../utils/securityPolicy';

interface OAuthProviderState { google: boolean; facebook: boolean }
interface AuthSessionState { sessionId: string | null; authenticatedAt: string | null; lastActivityAt: string | null; authProvider: string | null; role: string | null }

export interface AuthActionResult { success: boolean; error: string | null; destination: PostLoginRoute | null; infoMessage?: string | null }
export interface AuthAuditEvent { [key: string]: unknown }

interface AuthContextType {
  user: AppUser | null;
  authError: string | null;
  authNotice: string | null;
  login: (email: string, password: string) => Promise<AuthActionResult>;
  loginWithOAuth: (provider: 'google' | 'facebook', payload: { email: string; name: string; providerId: string }) => Promise<AuthActionResult>;
  beginOAuthLogin: (provider: 'google' | 'facebook') => Promise<AuthActionResult>;
  register: (email: string, password: string, name: string) => Promise<AuthActionResult>;
  verifyEmail: (_token: string) => Promise<AuthActionResult>;
  resendVerification: () => Promise<AuthActionResult>;
  fetchAdminUsers: () => Promise<AppUser[]>;
  fetchAdminAuditEvents: () => Promise<AuthAuditEvent[]>;
  updateAdminUser: (userId: string, patch: Partial<Pick<AppUser, 'role' | 'accountStatus' | 'emailVerified'>>) => Promise<AuthActionResult>;
  clearAuthNotice: () => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  cmsEnabled: boolean;
  registrationEnabled: boolean;
  canAccessCMS: boolean;
  oauthProviders: OAuthProviderState;
  postLoginRoute: PostLoginRoute;
  sessionState: AuthSessionState | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

function mapSession(raw: Record<string, unknown> | null | undefined): AuthSessionState | null {
  if (!raw) return null;
  return {
    sessionId: raw.sessionId as string | null,
    authenticatedAt: raw.authenticatedAt as string | null,
    lastActivityAt: raw.lastActivityAt as string | null,
    authProvider: (raw.authProvider as string | null) ?? 'local',
    role: raw.role as string | null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [sessionState, setSessionState] = useState<AuthSessionState | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const cmsEnabled = SECURITY_FLAGS.cmsEnabled;
  const registrationEnabled = SECURITY_FLAGS.registrationEnabled;
  const isAuthenticated = Boolean(user);
  const canAccessCMS = evaluateCmsAccess({ cmsEnabled, isAuthenticated, user }) === 'allow';
  const postLoginRoute = resolvePostLoginRoute(cmsEnabled, user);

  const refresh = async (): Promise<AppUser | null> => {
    const result = await fetchSession();
    const trusted = resolveTrustedSessionUser(result.user);
    setUser(trusted);
    setSessionState(mapSession((result.session as Record<string, unknown> | null | undefined) ?? null));
    setAuthError(result.success ? null : result.errorMessage);
    return trusted;
  };

  useEffect(() => { void refresh().finally(() => setIsAuthReady(true)); }, []);

  const login = async (email: string, password: string): Promise<AuthActionResult> => {
    const result = await loginWithPassword(email, password);
    if (!result.success) return { success: false, error: result.errorMessage, destination: null };
    const trusted = resolveTrustedSessionUser(result.user);
    setUser(trusted);
    setSessionState(mapSession((result.session as Record<string, unknown> | null | undefined) ?? null));
    return { success: true, error: null, destination: resolvePostLoginRoute(cmsEnabled, trusted) };
  };

  const register = async (email: string, password: string, name: string): Promise<AuthActionResult> => {
    const result = await registerWithPassword(email, password, name);
    if (!result.success) return { success: false, error: result.errorMessage, destination: null };
    const trusted = resolveTrustedSessionUser(result.user);
    setUser(trusted);
    setSessionState(mapSession((result.session as Record<string, unknown> | null | undefined) ?? null));
    return { success: true, error: null, destination: resolvePostLoginRoute(cmsEnabled, trusted) };
  };

  const beginOAuthLogin = async (provider: 'google' | 'facebook'): Promise<AuthActionResult> => {
    window.location.href = `/api/v1/auth/oauth/${provider}/start?redirectTo=${encodeURIComponent(window.location.href)}`;
    return { success: true, error: null, destination: null };
  };

  const logout = async () => { await logoutWithSession(); setUser(null); setSessionState(null); setAuthNotice(null); };

  const ctx = useMemo<AuthContextType>(() => ({
    user, authError, authNotice, login, loginWithOAuth: beginOAuthLogin, beginOAuthLogin, register,
    verifyEmail: async () => ({ success: false, error: 'Use backend email token endpoint.', destination: null }),
    resendVerification: async () => ({ success: false, error: 'Use backend resend verification endpoint.', destination: null }),
    fetchAdminUsers: async () => (await fetchAdminUsersApi()).users ?? [],
    fetchAdminAuditEvents: async () => (await fetchAuthAuditEvents()).events ?? [],
    updateAdminUser: async (userId, patch) => {
      const result = await updateAdminUserWithApi(userId, patch);
      return { success: result.success, error: result.errorMessage, destination: null };
    },
    clearAuthNotice: () => setAuthNotice(null), logout, isAuthenticated, isAuthReady, cmsEnabled, registrationEnabled,
    canAccessCMS, oauthProviders: { google: true, facebook: true }, postLoginRoute, sessionState,
  }), [user, authError, authNotice, isAuthenticated, isAuthReady, cmsEnabled, registrationEnabled, canAccessCMS, postLoginRoute, sessionState]);

  return <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
