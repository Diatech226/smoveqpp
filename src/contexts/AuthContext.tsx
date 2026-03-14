import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  fetchOAuthProviders,
  fetchServerSession,
  forgotPasswordWithApi,
  loginWithApi,
  logoutWithApi,
  oauthLoginWithApi,
  registerWithApi,
  resetPasswordWithApi,
  updateProfileWithApi,
  type AuthResult,
} from '../utils/authApi';
import {
  evaluateCmsAccess,
  resolvePostLoginRoute,
  resolveTrustedSessionUser,
  SECURITY_FLAGS,
  type AppUser,
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
  destination: 'cms-dashboard' | 'home' | null;
}

interface AuthContextType {
  user: AppUser | null;
  authError: string | null;
  login: (email: string, password: string) => Promise<AuthActionResult>;
  loginWithOAuth: (provider: 'google' | 'facebook', payload: { email: string; name: string; providerId: string }) => Promise<AuthActionResult>;
  register: (email: string, password: string, name: string) => Promise<AuthActionResult>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateProfile: (payload: { name: string; email?: string }) => Promise<AuthActionResult>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error: string | null; resetToken?: string | null }>;
  resetPassword: (token: string, password: string) => Promise<AuthActionResult>;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  cmsEnabled: boolean;
  registrationEnabled: boolean;
  canAccessCMS: boolean;
  oauthProviders: OAuthProviderState;
}

const SAFE_FALLBACK_CONTEXT: AuthContextType = {
  user: null,
  authError: null,
  login: async () => ({ success: false, error: 'Authentification indisponible. Réessayez.', destination: null }),
  loginWithOAuth: async () => ({ success: false, error: 'Authentification indisponible. Réessayez.', destination: null }),
  register: async () => ({ success: false, error: 'Authentification indisponible. Réessayez.', destination: null }),
  logout: async () => undefined,
  refreshSession: async () => undefined,
  updateProfile: async () => ({ success: false, error: 'Authentification indisponible. Réessayez.', destination: null }),
  forgotPassword: async () => ({ success: false, error: 'Authentification indisponible. Réessayez.' }),
  resetPassword: async () => ({ success: false, error: 'Authentification indisponible. Réessayez.', destination: null }),
  isAuthenticated: false,
  isAuthReady: true,
  cmsEnabled: false,
  registrationEnabled: false,
  canAccessCMS: false,
  oauthProviders: { google: false, facebook: false },
};

const AuthContext = createContext<AuthContextType>(SAFE_FALLBACK_CONTEXT);

function resolveAuthActionError(result: AuthResult): string | null {
  if (result.success) return null;
  if (result.errorMessage) return result.errorMessage;
  return 'Authentification indisponible. Réessayez.';
}

function shouldResetSession(result: AuthResult): boolean {
  return result.errorCode === 'SESSION_UNAUTHORIZED' || result.errorCode === 'INVALID_CSRF';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [oauthProviders, setOauthProviders] = useState<OAuthProviderState>({ google: false, facebook: false });

  const cmsEnabled = SECURITY_FLAGS.cmsEnabled;
  const registrationEnabled = SECURITY_FLAGS.registrationEnabled;
  const isAuthenticated = !!user;

  const canAccessCMS =
    evaluateCmsAccess({
      cmsEnabled,
      isAuthenticated,
      user,
    }) === 'allow';

  useEffect(() => {
    let isActive = true;
    clearLegacyAuthArtifacts();

    const bootstrapAuth = async () => {
      try {
        if (!cmsEnabled) {
          if (!isActive) return;
          setUser(null);
          setCsrfToken(null);
          setAuthError(null);
          setIsAuthReady(true);
          return;
        }

        const session = await fetchServerSession();
        if (!isActive) return;

        setCsrfToken(session.csrfToken);
        setUser(resolveTrustedSessionUser(session.user));
        setAuthError(resolveAuthActionError(session));

        const providers = await fetchOAuthProviders(session.csrfToken);
        if (isActive && providers.providers) {
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


  const refreshSession = async () => {
    const session = await fetchServerSession(csrfToken);
    setCsrfToken(session.csrfToken);
    setUser(resolveTrustedSessionUser(session.user));
    setAuthError(resolveAuthActionError(session));
  };

  const login = async (email: string, password: string): Promise<AuthActionResult> => {
    if (!cmsEnabled) {
      setAuthError('Le CMS est désactivé.');
      return { success: false, error: 'Le CMS est désactivé.', destination: null };
    }

    const result = await loginWithApi(email, password, csrfToken);
    setCsrfToken(result.csrfToken);
    const trustedUser = resolveTrustedSessionUser(result.user);
    setUser(trustedUser);
    setAuthError(resolveAuthActionError(result));

    if (!result.success) {
      logWarn({ scope: 'auth_context', event: 'login_failed', details: { errorCode: result.errorCode, status: result.status } });
      if (shouldResetSession(result)) {
        setUser(null);
      }
    } else {
      logInfo({ scope: 'auth_context', event: 'login_succeeded' });
    }

    return {
      success: !!trustedUser,
      error: resolveAuthActionError(result),
      destination: trustedUser ? resolvePostLoginRoute(cmsEnabled, trustedUser) : null,
    };
  };

  const loginWithOAuth = async (
    provider: 'google' | 'facebook',
    payload: { email: string; name: string; providerId: string },
  ): Promise<AuthActionResult> => {
    const result = await oauthLoginWithApi(provider, payload, csrfToken);
    setCsrfToken(result.csrfToken);
    const trustedUser = resolveTrustedSessionUser(result.user);
    setUser(trustedUser);
    setAuthError(resolveAuthActionError(result));
    return {
      success: !!trustedUser,
      error: resolveAuthActionError(result),
      destination: trustedUser ? resolvePostLoginRoute(cmsEnabled, trustedUser) : null,
    };
  };

  const register = async (email: string, password: string, name: string): Promise<AuthActionResult> => {
    if (!cmsEnabled) {
      setAuthError('Le CMS est désactivé.');
      return { success: false, error: 'Le CMS est désactivé.', destination: null };
    }

    const result = await registerWithApi(email, password, name, csrfToken);
    setCsrfToken(result.csrfToken);
    const trustedUser = resolveTrustedSessionUser(result.user);
    setUser(trustedUser);
    setAuthError(resolveAuthActionError(result));

    if (!result.success) {
      logWarn({ scope: 'auth_context', event: 'register_failed', details: { errorCode: result.errorCode, status: result.status } });
      if (shouldResetSession(result)) {
        setUser(null);
      }
    } else {
      logInfo({ scope: 'auth_context', event: 'register_succeeded' });
    }

    return {
      success: !!trustedUser,
      error: resolveAuthActionError(result),
      destination: trustedUser ? resolvePostLoginRoute(cmsEnabled, trustedUser) : null,
    };
  };


  const updateProfile = async (payload: { name: string; email?: string }): Promise<AuthActionResult> => {
    const result = await updateProfileWithApi(payload, csrfToken);
    setCsrfToken(result.csrfToken);
    const trustedUser = resolveTrustedSessionUser(result.user);
    setUser(trustedUser);
    setAuthError(resolveAuthActionError(result));

    return {
      success: !!trustedUser && result.success,
      error: resolveAuthActionError(result),
      destination: trustedUser ? resolvePostLoginRoute(cmsEnabled, trustedUser) : null,
    };
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; error: string | null; resetToken?: string | null }> => {
    const result = await forgotPasswordWithApi(email, csrfToken);
    if (result.csrfToken) setCsrfToken(result.csrfToken);
    return {
      success: result.success,
      error: resolveAuthActionError(result),
      resetToken: result.resetToken ?? null,
    };
  };

  const resetPassword = async (token: string, password: string): Promise<AuthActionResult> => {
    const result = await resetPasswordWithApi(token, password, csrfToken);
    setCsrfToken(result.csrfToken);
    const trustedUser = resolveTrustedSessionUser(result.user);
    setUser(trustedUser);
    setAuthError(resolveAuthActionError(result));

    return {
      success: !!trustedUser && result.success,
      error: resolveAuthActionError(result),
      destination: trustedUser ? resolvePostLoginRoute(cmsEnabled, trustedUser) : null,
    };
  };

  const logout = async () => {
    const result = await logoutWithApi(csrfToken);
    setUser(null);
    setCsrfToken(result.csrfToken);
    setAuthError(resolveAuthActionError(result));

    if (!result.success) {
      logWarn({ scope: 'auth_context', event: 'logout_failed', details: { errorCode: result.errorCode, status: result.status } });
    }
  };

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      authError,
      login,
      loginWithOAuth,
      register,
      logout,
      refreshSession,
      updateProfile,
      forgotPassword,
      resetPassword,
      isAuthenticated,
      isAuthReady,
      cmsEnabled,
      registrationEnabled,
      canAccessCMS,
      oauthProviders,
    }),
    [user, authError, isAuthenticated, isAuthReady, cmsEnabled, registrationEnabled, canAccessCMS, oauthProviders],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
