import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  fetchServerSession,
  loginWithApi,
  logoutWithApi,
  registerWithApi,
  type AuthResult,
} from '../utils/authApi';
import {
  evaluateCmsAccess,
  resolveTrustedSessionUser,
  SECURITY_FLAGS,
  type AppUser,
} from '../utils/securityPolicy';
import { clearLegacyAuthArtifacts } from '../repositories/authArtifactsRepository';
import { logError, logInfo, logWarn } from '../utils/observability';

interface AuthContextType {
  user: AppUser | null;
  authError: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  cmsEnabled: boolean;
  registrationEnabled: boolean;
  canAccessCMS: boolean;
}

const SAFE_FALLBACK_CONTEXT: AuthContextType = {
  user: null,
  authError: null,
  login: async () => false,
  register: async () => false,
  logout: async () => undefined,
  isAuthenticated: false,
  isAuthReady: true,
  cmsEnabled: false,
  registrationEnabled: false,
  canAccessCMS: false,
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

  const login = async (email: string, password: string): Promise<boolean> => {
    if (!cmsEnabled) {
      setAuthError('Le CMS est désactivé.');
      return false;
    }

    const result = await loginWithApi(email, password, csrfToken);
    setCsrfToken(result.csrfToken);
    const trustedUser = resolveTrustedSessionUser(result.user);
    setUser(trustedUser);
    setAuthError(resolveAuthActionError(result));

    if (!result.success) {
      logWarn({
        scope: 'auth_context',
        event: 'login_failed',
        details: { errorCode: result.errorCode, status: result.status },
      });
      if (shouldResetSession(result)) {
        setUser(null);
      }
    } else {
      logInfo({ scope: 'auth_context', event: 'login_succeeded' });
    }

    return !!trustedUser;
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    if (!registrationEnabled || !cmsEnabled) {
      setAuthError('L’inscription est désactivée.');
      return false;
    }

    const result = await registerWithApi(email, password, name, csrfToken);
    setCsrfToken(result.csrfToken);
    const trustedUser = resolveTrustedSessionUser(result.user);
    setUser(trustedUser);
    setAuthError(resolveAuthActionError(result));

    if (!result.success) {
      logWarn({
        scope: 'auth_context',
        event: 'registration_failed',
        details: { errorCode: result.errorCode, status: result.status },
      });
      if (shouldResetSession(result)) {
        setUser(null);
      }
    }

    return !!trustedUser;
  };

  const logout = async () => {
    const result = await logoutWithApi(csrfToken);
    setUser(null);
    setCsrfToken(result.csrfToken);
    setAuthError(resolveAuthActionError(result));

    if (!result.success) {
      logWarn({
        scope: 'auth_context',
        event: 'logout_failed',
        details: { errorCode: result.errorCode, status: result.status },
      });
    }
  };

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      authError,
      login,
      register,
      logout,
      isAuthenticated,
      isAuthReady,
      cmsEnabled,
      registrationEnabled,
      canAccessCMS,
    }),
    [user, authError, isAuthenticated, isAuthReady, cmsEnabled, registrationEnabled, canAccessCMS],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
