import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  fetchServerSession,
  loginWithApi,
  logoutWithApi,
  registerWithApi,
} from '../utils/authApi';
import {
  evaluateCmsAccess,
  resolveTrustedSessionUser,
  SECURITY_FLAGS,
  type AppUser,
} from '../utils/securityPolicy';

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

function clearLegacyClientAuthArtifacts() {
  localStorage.removeItem('smove_user');
  localStorage.removeItem('smove_users');
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
    clearLegacyClientAuthArtifacts();

    const bootstrapAuth = async () => {
      if (!cmsEnabled) {
        if (!isActive) return;
        setUser(null);
        setCsrfToken(null);
        setIsAuthReady(true);
        setAuthError(null);
        return;
      }

      const session = await fetchServerSession();
      if (!isActive) return;

      setCsrfToken(session.csrfToken);
      setUser(resolveTrustedSessionUser(session.user));
      setAuthError(session.success ? null : session.errorMessage);
      setIsAuthReady(true);
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
    setUser(resolveTrustedSessionUser(result.user));
    setAuthError(result.success ? null : result.errorMessage);
    return !!result.user;
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    if (!registrationEnabled || !cmsEnabled) {
      setAuthError('L’inscription est désactivée.');
      return false;
    }

    const result = await registerWithApi(email, password, name, csrfToken);
    setCsrfToken(result.csrfToken);
    setUser(resolveTrustedSessionUser(result.user));
    setAuthError(result.success ? null : result.errorMessage);
    return !!result.user;
  };

  const logout = async () => {
    const result = await logoutWithApi(csrfToken);
    setUser(null);
    setCsrfToken(result.csrfToken);
    setAuthError(result.success ? null : result.errorMessage);
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
