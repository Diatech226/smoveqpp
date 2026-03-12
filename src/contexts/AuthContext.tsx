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
      try {
        if (!cmsEnabled) {
          if (!isActive) {
            return;
          }
          setUser(null);
          setCsrfToken(null);
          setIsAuthReady(true);
          return;
        }

        const session = await fetchServerSession();
        if (!isActive) {
          return;
        }

        setCsrfToken(session.csrfToken);
        setUser(resolveTrustedSessionUser(session.user));
      } catch {
        if (isActive) {
          setUser(null);
          setCsrfToken(null);
        }
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
      return false;
    }

    const devAdminEmail = import.meta.env.VITE_DEV_ADMIN_EMAIL;
    const devAdminPassword = import.meta.env.VITE_DEV_ADMIN_PASSWORD;
    const devAdminName = import.meta.env.VITE_DEV_ADMIN_NAME || 'Dev Administrator';

    if (
      SECURITY_FLAGS.devAdminFallbackEnabled &&
      devAdminEmail &&
      devAdminPassword &&
      email === devAdminEmail &&
      password === devAdminPassword
    ) {
      setUser({ id: 'dev-admin', email: devAdminEmail, name: devAdminName, role: 'admin' });
      return true;
    }

    const result = await loginWithApi(email, password, csrfToken);
    setCsrfToken(result.csrfToken);
    setUser(resolveTrustedSessionUser(result.user));
    return !!result.user;
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    if (!registrationEnabled || !cmsEnabled) {
      return false;
    }

    const result = await registerWithApi(email, password, name, csrfToken);
    setCsrfToken(result.csrfToken);
    setUser(resolveTrustedSessionUser(result.user));
    return !!result.user;
  };

  const logout = async () => {
    await logoutWithApi(csrfToken);
    setUser(null);
    setCsrfToken(null);
  };

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      login,
      register,
      logout,
      isAuthenticated,
      isAuthReady,
      cmsEnabled,
      registrationEnabled,
      canAccessCMS,
    }),
    [user, isAuthenticated, isAuthReady, cmsEnabled, registrationEnabled, canAccessCMS],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
