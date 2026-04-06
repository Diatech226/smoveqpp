import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  fetchAdminUsers as fetchAdminUsersApi,
  fetchAuthAuditEvents,
  fetchClerkSession,
  fetchSession,
  loginWithPassword as loginWithPasswordApi,
  logoutWithSession,
  startClerkBackendSession,
  updateAdminUserWithApi,
} from '../utils/authApi';
import { evaluateCmsAccess, resolvePostLoginRoute, resolveTrustedSessionUser, SECURITY_FLAGS, type AppUser, type PostLoginRoute } from '../utils/securityPolicy';
import { getClerkSessionToken, oauthRedirect, signInWithPassword, signOutClerk, signUpWithPassword } from '../utils/clerkClient';

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
  beginOAuthLogin: (provider: 'google' | 'facebook') => void;
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
const RAW_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
const PUBLISHABLE_KEY = RAW_PUBLISHABLE_KEY?.trim() || undefined;
const FACEBOOK_ENABLED = import.meta.env.VITE_CLERK_ENABLE_FACEBOOK === 'true';

function mapSession(raw: Record<string, unknown> | null | undefined): AuthSessionState | null {
  if (!raw) return null;
  return {
    sessionId: raw.sessionId ?? null,
    authenticatedAt: raw.authenticatedAt ?? null,
    lastActivityAt: raw.lastActivityAt ?? null,
    authProvider: raw.authProvider ?? 'clerk',
    role: raw.role ?? null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [sessionState, setSessionState] = useState<AuthSessionState | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const cmsEnabled = SECURITY_FLAGS.cmsEnabled;
  const registrationEnabled = SECURITY_FLAGS.registrationEnabled;
  const isAuthenticated = Boolean(user);
  const canAccessCMS = evaluateCmsAccess({ cmsEnabled, isAuthenticated, user }) === 'allow';
  const postLoginRoute = resolvePostLoginRoute(cmsEnabled, user);

  const refresh = async (): Promise<AppUser | null> => {
    if (PUBLISHABLE_KEY) {
      const clerkToken = await getClerkSessionToken(PUBLISHABLE_KEY);
      setToken(clerkToken);

      if (clerkToken) {
        const result = await fetchClerkSession(clerkToken);
        if (!result.success) {
          setAuthError(result.errorMessage ?? 'Session Clerk indisponible.');
          setUser(null);
          setSessionState(null);
          return null;
        }

        const trusted = resolveTrustedSessionUser(result.user);
        if (trusted) {
          await startClerkBackendSession(clerkToken);
        }
        setUser(trusted);
        setSessionState(mapSession(result.session));
        setAuthError(null);
        return trusted;
      }
    }

    const fallbackSession = await fetchSession();
    const trusted = resolveTrustedSessionUser(fallbackSession.user);
    setUser(trusted);
    setSessionState(mapSession(fallbackSession.session));
    setAuthError(fallbackSession.success ? null : fallbackSession.errorMessage);
    return trusted;
  };

  const finalizeLogin = (nextUser: AppUser | null): AuthActionResult => {
    if (!nextUser) {
      return { success: false, error: 'Session utilisateur introuvable après connexion.', destination: null };
    }
    if (nextUser.accountStatus === 'suspended') {
      return { success: false, error: 'Compte suspendu. Contactez un administrateur.', destination: null };
    }

    const destination = resolvePostLoginRoute(cmsEnabled, nextUser);
    if (destination === 'cms-forbidden') {
      return {
        success: false,
        error: 'Connexion réussie, mais ce compte ne possède pas les droits administrateur CMS.',
        destination,
      };
    }

    return { success: true, error: null, destination };
  };

  useEffect(() => {
    let mounted = true;
    void refresh().finally(() => {
      if (mounted) setIsAuthReady(true);
    });
    return () => { mounted = false; };
  }, []);

  const login = async (email: string, password: string): Promise<AuthActionResult> => {
    setAuthError(null);
    try {
      if (PUBLISHABLE_KEY) {
        await signInWithPassword(PUBLISHABLE_KEY, email, password);
        const refreshedUser = await refresh();
        return finalizeLogin(refreshedUser);
      }
    } catch (error: unknown) {
      const errorRecord = error as { errors?: Array<{ longMessage?: string }>; message?: string } | null;
      const message = errorRecord?.errors?.[0]?.longMessage || errorRecord?.message || null;
      if (message) {
        setAuthError(message);
      }
    }

    const localResult = await loginWithPasswordApi(email, password);
    if (!localResult.success) {
      const message = localResult.errorMessage ?? authError ?? 'Connexion impossible.';
      setAuthError(message);
      return { success: false, error: message, destination: null };
    }

    const trusted = resolveTrustedSessionUser(localResult.user);
    setUser(trusted);
    setSessionState(mapSession(localResult.session));
    return finalizeLogin(trusted);
  };

  const register = async (email: string, password: string, name: string): Promise<AuthActionResult> => {
    try {
      if (!PUBLISHABLE_KEY) throw new Error('Missing Clerk publishable key');
      await signUpWithPassword(PUBLISHABLE_KEY, email, password, name);
      const refreshedUser = await refresh();
      return { success: true, error: null, destination: resolvePostLoginRoute(cmsEnabled, refreshedUser) };
    } catch (error: unknown) {
      const errorRecord = error as { errors?: Array<{ longMessage?: string }>; message?: string } | null;
      const message = errorRecord?.errors?.[0]?.longMessage || errorRecord?.message || 'Inscription Clerk impossible';
      setAuthError(message);
      return { success: false, error: message, destination: null };
    }
  };

  const beginOAuthLogin = (provider: 'google' | 'facebook') => {
    if (!PUBLISHABLE_KEY) {
      setAuthError('Configuration Clerk manquante.');
      return null;
    }
    void oauthRedirect(PUBLISHABLE_KEY, provider);
  };

  const logout = async () => {
    if (PUBLISHABLE_KEY) {
      await signOutClerk(PUBLISHABLE_KEY);
    }
    await logoutWithSession();
    setUser(null);
    setToken(null);
    setSessionState(null);
  };

  const ctx = useMemo<AuthContextType>(() => ({
    user,
    authError,
    authNotice,
    login,
    loginWithOAuth: async (provider) => {
      beginOAuthLogin(provider);
      return { success: true, error: null, destination: null };
    },
    beginOAuthLogin,
    register,
    verifyEmail: async () => ({ success: true, error: null, destination: 'account', infoMessage: 'Vérification gérée par Clerk.' }),
    resendVerification: async () => ({ success: true, error: null, destination: 'account', infoMessage: 'Vérification gérée par Clerk.' }),
    fetchAdminUsers: async () => {
      if (!token) return [];
      const result = await fetchAdminUsersApi(token);
      return result.users ?? [];
    },
    fetchAdminAuditEvents: async () => {
      if (!token) return [];
      const result = await fetchAuthAuditEvents(token);
      return result.events ?? [];
    },
    updateAdminUser: async (userId, patch) => {
      if (!token) return { success: false, error: 'Session expirée', destination: null };
      const result = await updateAdminUserWithApi(userId, patch, token);
      return { success: result.success, error: result.errorMessage, destination: null };
    },
    clearAuthNotice: () => setAuthNotice(null),
    logout,
    isAuthenticated,
    isAuthReady,
    cmsEnabled,
    registrationEnabled,
    canAccessCMS,
    oauthProviders: { google: true, facebook: FACEBOOK_ENABLED },
    postLoginRoute,
    sessionState,
  }), [authError, authNotice, canAccessCMS, cmsEnabled, isAuthReady, isAuthenticated, postLoginRoute, registrationEnabled, sessionState, token, user]);

  return <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return value;
}
