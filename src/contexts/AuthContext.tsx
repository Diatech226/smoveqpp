import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  fetchAdminUsers,
  fetchAuthAuditEvents,
  fetchOAuthProviders,
  fetchServerSession,
  loginWithApi,
  logoutWithApi,
  oauthLoginWithApi,
  registerWithApi,
  resendVerificationWithApi,
  updateAdminUserWithApi,
  verifyEmailWithApi,
  type AuthResult,
} from '../utils/authApi';
import {
  evaluateCmsAccess,
  resolvePostLoginRoute,
  resolveTrustedSessionUser,
  SECURITY_FLAGS,
  type AppUser,
  type PostLoginRoute,
} from '../utils/securityPolicy';
import { clearLegacyAuthArtifacts } from '../repositories/authArtifactsRepository';
import { logError, logInfo, logWarn } from '../utils/observability';

interface OAuthProviderState {
  google: boolean;
  facebook: boolean;
}

export interface AuthActionResult {
  success: boolean;
  error: string | null;
  destination: PostLoginRoute | null;
  infoMessage?: string | null;
}

interface AuthSessionState {
  sessionId: string | null;
  authenticatedAt: string | null;
  lastActivityAt: string | null;
  authProvider: string | null;
  role: string | null;
}

export interface AuthAuditEvent {
  at?: string;
  event?: string;
  outcome?: string;
  userId?: string | null;
  [key: string]: unknown;
}

interface AuthContextType {
  user: AppUser | null;
  authError: string | null;
  authNotice: string | null;
  login: (email: string, password: string) => Promise<AuthActionResult>;
  loginWithOAuth: (provider: 'google' | 'facebook', payload: { email: string; name: string; providerId: string }) => Promise<AuthActionResult>;
  register: (email: string, password: string, name: string) => Promise<AuthActionResult>;
  verifyEmail: (token: string) => Promise<AuthActionResult>;
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

const SAFE_FALLBACK_CONTEXT: AuthContextType = {
  user: null,
  authError: null,
  authNotice: null,
  login: async () => ({ success: false, error: 'Authentification indisponible. Réessayez.', destination: null }),
  loginWithOAuth: async () => ({ success: false, error: 'Authentification indisponible. Réessayez.', destination: null }),
  register: async () => ({ success: false, error: 'Authentification indisponible. Réessayez.', destination: null }),
  verifyEmail: async () => ({ success: false, error: 'Vérification indisponible. Réessayez.', destination: null }),
  resendVerification: async () => ({ success: false, error: 'Vérification indisponible. Réessayez.', destination: null }),
  fetchAdminUsers: async () => [],
  fetchAdminAuditEvents: async () => [],
  updateAdminUser: async () => ({ success: false, error: 'Mise à jour indisponible. Réessayez.', destination: null }),
  clearAuthNotice: () => undefined,
  logout: async () => undefined,
  isAuthenticated: false,
  isAuthReady: true,
  cmsEnabled: false,
  registrationEnabled: false,
  canAccessCMS: false,
  oauthProviders: { google: false, facebook: false },
  postLoginRoute: 'home',
  sessionState: null,
};

const AuthContext = createContext<AuthContextType>(SAFE_FALLBACK_CONTEXT);
const POST_AUTH_ROUTE_KEY = 'smove.postAuthRoute';

function resolveAuthActionError(result: AuthResult): string | null {
  if (result.success) return null;
  if (result.errorMessage) return result.errorMessage;
  return 'Authentification indisponible. Réessayez.';
}

function shouldResetSession(result: AuthResult): boolean {
  return result.errorCode === 'SESSION_UNAUTHORIZED' || result.errorCode === 'INVALID_CSRF';
}

function getPostAuthIntentRoute(): string | null {
  const intent = window.sessionStorage.getItem(POST_AUTH_ROUTE_KEY);
  if (!intent) {
    return null;
  }

  window.sessionStorage.removeItem(POST_AUTH_ROUTE_KEY);
  return intent;
}

function resolveSessionState(result: AuthResult): AuthSessionState | null {
  if (!result.session) return null;
  return {
    sessionId: result.session.sessionId ?? null,
    authenticatedAt: result.session.authenticatedAt ?? null,
    lastActivityAt: result.session.lastActivityAt ?? null,
    authProvider: result.session.authProvider ?? null,
    role: result.session.role ?? null,
  };
}

function resolveVerificationNotice(result: AuthResult): string | null {
  if (!result.verification) return null;
  if (result.verification.emailDeliveryReady === false && result.verification.devToken) {
    return `Dev: lien de vérification disponible avec le token ${result.verification.devToken}`;
  }
  return 'Un email de vérification a été envoyé.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [oauthProviders, setOauthProviders] = useState<OAuthProviderState>({ google: false, facebook: false });
  const [sessionState, setSessionState] = useState<AuthSessionState | null>(null);
  const authMutationVersionRef = useRef(0);

  const cmsEnabled = SECURITY_FLAGS.cmsEnabled;
  const registrationEnabled = SECURITY_FLAGS.registrationEnabled;
  const isAuthenticated = !!user;

  const canAccessCMS =
    evaluateCmsAccess({
      cmsEnabled,
      isAuthenticated,
      user,
    }) === 'allow';

  const postLoginRoute = resolvePostLoginRoute(cmsEnabled, user);

  useEffect(() => {
    let isActive = true;
    clearLegacyAuthArtifacts();

    const bootstrapAuth = async () => {
      const bootstrapVersion = authMutationVersionRef.current;
      try {
        if (!cmsEnabled) {
          if (!isActive) return;
          setUser(null);
          setCsrfToken(null);
          setAuthError(null);
          setSessionState(null);
          setIsAuthReady(true);
          return;
        }

        const session = await fetchServerSession();
        if (!isActive || bootstrapVersion !== authMutationVersionRef.current) return;

        setCsrfToken(session.csrfToken);
        setUser(resolveTrustedSessionUser(session.user));
        setSessionState(resolveSessionState(session));
        setAuthError(resolveAuthActionError(session));

        const providers = await fetchOAuthProviders(session.csrfToken);
        if (isActive && bootstrapVersion === authMutationVersionRef.current && providers.providers) {
          setOauthProviders({
            google: Boolean(providers.providers.google?.enabled),
            facebook: Boolean(providers.providers.facebook?.enabled),
          });
        }

        if (!session.success) {
          logWarn({
            scope: 'auth_context',
            event: 'session_bootstrap_failed',
            details: { errorCode: session.errorCode, status: session.status },
          });
        }
      } catch (error) {
        if (!isActive) return;
        setUser(null);
        setAuthError('Session indisponible. Le site reste accessible.');
        setSessionState(null);
        logError({ scope: 'auth_context', event: 'session_bootstrap_exception', error });
      } finally {
        if (isActive) {
          setIsAuthReady(true);
        }
      }
    };

    void bootstrapAuth();

    return () => {
      isActive = false;
    };
  }, [cmsEnabled]);

  const refreshSession = async (token?: string | null): Promise<AuthResult> => {
    const session = await fetchServerSession(token);
    setCsrfToken(session.csrfToken);
    setUser(resolveTrustedSessionUser(session.user));
    setSessionState(resolveSessionState(session));
    setAuthError(resolveAuthActionError(session));
    return session;
  };

  const login = async (email: string, password: string): Promise<AuthActionResult> => {
    if (!cmsEnabled) {
      setAuthError('Le CMS est désactivé.');
      return { success: false, error: 'Le CMS est désactivé.', destination: null };
    }

    authMutationVersionRef.current += 1;
    const session = await refreshSession(csrfToken);
    let resolvedCsrfToken = session.csrfToken;
    if (!resolvedCsrfToken) {
      resolvedCsrfToken = csrfToken;
    }

    let result = await loginWithApi(email, password, resolvedCsrfToken);
    if (result.errorCode === 'INVALID_CSRF') {
      const session = await refreshSession();
      result = await loginWithApi(email, password, session.csrfToken);
    }

    setCsrfToken(result.csrfToken);
    setSessionState(resolveSessionState(result));
    const trustedUser = resolveTrustedSessionUser(result.user);
    setUser(trustedUser);
    setAuthError(resolveAuthActionError(result));
    setAuthNotice(result.success ? 'Connexion réussie.' : null);

    if (!result.success) {
      logWarn({ scope: 'auth_context', event: 'login_failed', details: { errorCode: result.errorCode, status: result.status } });
      if (shouldResetSession(result)) {
        setUser(null);
      }
    } else {
      logInfo({ scope: 'auth_context', event: 'login_succeeded' });
    }

    const intendedRoute = result.success ? getPostAuthIntentRoute() : null;

    return {
      success: !!trustedUser,
      error: resolveAuthActionError(result),
      infoMessage: result.success ? 'Connexion réussie.' : null,
      destination: trustedUser ? resolvePostLoginRoute(cmsEnabled, trustedUser, intendedRoute) : null,
    };
  };

  const loginWithOAuth = async (
    provider: 'google' | 'facebook',
    payload: { email: string; name: string; providerId: string },
  ): Promise<AuthActionResult> => {
    authMutationVersionRef.current += 1;
    const result = await oauthLoginWithApi(provider, payload, csrfToken);
    setCsrfToken(result.csrfToken);
    setSessionState(resolveSessionState(result));
    const trustedUser = resolveTrustedSessionUser(result.user);
    setUser(trustedUser);
    setAuthError(resolveAuthActionError(result));
    setAuthNotice(result.success ? `Connexion ${provider} réussie.` : null);
    const intendedRoute = result.success ? getPostAuthIntentRoute() : null;
    return {
      success: !!trustedUser,
      error: resolveAuthActionError(result),
      infoMessage: result.success ? `Connexion ${provider} réussie.` : null,
      destination: trustedUser ? resolvePostLoginRoute(cmsEnabled, trustedUser, intendedRoute) : null,
    };
  };

  const register = async (email: string, password: string, name: string): Promise<AuthActionResult> => {
    if (!cmsEnabled) {
      setAuthError('Le CMS est désactivé.');
      return { success: false, error: 'Le CMS est désactivé.', destination: null };
    }

    authMutationVersionRef.current += 1;
    const result = await registerWithApi(email, password, name, csrfToken);
    setCsrfToken(result.csrfToken);
    setSessionState(resolveSessionState(result));
    const trustedUser = resolveTrustedSessionUser(result.user);
    setUser(trustedUser);
    setAuthError(resolveAuthActionError(result));

    const verificationNotice = result.success ? (resolveVerificationNotice(result) ?? 'Compte créé. Vérifiez votre email.') : null;
    setAuthNotice(verificationNotice);

    if (!result.success) {
      logWarn({ scope: 'auth_context', event: 'register_failed', details: { errorCode: result.errorCode, status: result.status } });
      if (shouldResetSession(result)) {
        setUser(null);
      }
    } else {
      logInfo({ scope: 'auth_context', event: 'register_succeeded' });
    }

    const intendedRoute = result.success ? getPostAuthIntentRoute() : null;

    return {
      success: !!trustedUser,
      error: resolveAuthActionError(result),
      infoMessage: verificationNotice,
      destination: trustedUser ? resolvePostLoginRoute(cmsEnabled, trustedUser, intendedRoute) : null,
    };
  };

  const verifyEmail = async (token: string): Promise<AuthActionResult> => {
    authMutationVersionRef.current += 1;
    const result = await verifyEmailWithApi(token, csrfToken);
    setCsrfToken(result.csrfToken);
    setSessionState(resolveSessionState(result));
    const trustedUser = resolveTrustedSessionUser(result.user ?? user);
    setUser(trustedUser);
    setAuthError(resolveAuthActionError(result));
    const infoMessage = result.success ? 'Adresse email vérifiée avec succès.' : null;
    setAuthNotice(infoMessage);

    return {
      success: result.success,
      error: resolveAuthActionError(result),
      infoMessage,
      destination: result.success ? resolvePostLoginRoute(cmsEnabled, trustedUser) : null,
    };
  };

  const resendVerification = async (): Promise<AuthActionResult> => {
    authMutationVersionRef.current += 1;
    const result = await resendVerificationWithApi(csrfToken);
    setCsrfToken(result.csrfToken);
    setSessionState(resolveSessionState(result));
    const trustedUser = resolveTrustedSessionUser(result.user ?? user);
    setUser(trustedUser);
    setAuthError(resolveAuthActionError(result));
    const infoMessage = result.success ? (resolveVerificationNotice(result) ?? 'Nouveau lien de vérification envoyé.') : null;
    setAuthNotice(infoMessage);

    return {
      success: result.success,
      error: resolveAuthActionError(result),
      infoMessage,
      destination: null,
    };
  };

  const fetchAdminUsersSafe = async () => {
    const result = await fetchAdminUsers(csrfToken);
    if (!result.success || !result.users) {
      throw new Error(result.errorMessage ?? 'Impossible de charger les utilisateurs.');
    }
    return result.users.map((entry) => resolveTrustedSessionUser(entry)).filter(Boolean) as AppUser[];
  };


  const fetchAdminAuditEventsSafe = async () => {
    const result = await fetchAuthAuditEvents(csrfToken);
    if (!result.success || !result.events) {
      throw new Error(result.errorMessage ?? 'Impossible de charger le journal d’audit.');
    }
    return result.events as AuthAuditEvent[];
  };

  const updateAdminUser = async (
    userId: string,
    patch: Partial<Pick<AppUser, 'role' | 'accountStatus' | 'emailVerified'>>,
  ): Promise<AuthActionResult> => {
    authMutationVersionRef.current += 1;
    const result = await updateAdminUserWithApi(userId, patch, csrfToken);
    setCsrfToken(result.csrfToken ?? csrfToken);
    if (result.user && user?.id === result.user.id) {
      setUser(resolveTrustedSessionUser(result.user));
    }
    setAuthError(resolveAuthActionError(result));
    const infoMessage = result.success ? 'Compte utilisateur mis à jour.' : null;
    setAuthNotice(infoMessage);
    return {
      success: result.success,
      error: resolveAuthActionError(result),
      infoMessage,
      destination: null,
    };
  };

  const logout = async () => {
    authMutationVersionRef.current += 1;
    const result = await logoutWithApi(csrfToken);
    setUser(null);
    setCsrfToken(result.csrfToken);
    setSessionState(null);
    setAuthError(resolveAuthActionError(result));
    setAuthNotice(result.success ? 'Vous êtes déconnecté.' : null);

    if (!result.success) {
      logWarn({ scope: 'auth_context', event: 'logout_failed', details: { errorCode: result.errorCode, status: result.status } });
    }
  };

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      authError,
      authNotice,
      login,
      loginWithOAuth,
      register,
      verifyEmail,
      resendVerification,
      fetchAdminUsers: fetchAdminUsersSafe,
      fetchAdminAuditEvents: fetchAdminAuditEventsSafe,
      updateAdminUser,
      clearAuthNotice: () => setAuthNotice(null),
      logout,
      isAuthenticated,
      isAuthReady,
      cmsEnabled,
      registrationEnabled,
      canAccessCMS,
      oauthProviders,
      postLoginRoute,
      sessionState,
    }),
    [
      user,
      authError,
      authNotice,
      isAuthenticated,
      isAuthReady,
      cmsEnabled,
      registrationEnabled,
      canAccessCMS,
      oauthProviders,
      postLoginRoute,
      sessionState,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
