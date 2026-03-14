export type UserRole = 'admin' | 'editor' | 'author' | 'viewer';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status?: 'client' | 'staff';
  accountStatus?: 'active' | 'invited' | 'suspended';
  authProvider?: 'local' | 'google' | 'facebook';
}

export type CmsAccessDecision = 'allow' | 'disabled' | 'unauthenticated' | 'forbidden';

export interface CmsAccessInput {
  cmsEnabled: boolean;
  isAuthenticated: boolean;
  user: Pick<AppUser, 'role'> | null;
}

function parseBooleanFlag(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) {
    return defaultValue;
  }
  return value === 'true';
}

export const SECURITY_FLAGS = {
  cmsEnabled: parseBooleanFlag(import.meta.env.VITE_ENABLE_CMS, import.meta.env.DEV),
  registrationEnabled: parseBooleanFlag(import.meta.env.VITE_ENABLE_REGISTRATION, import.meta.env.DEV),
  devAdminFallbackEnabled: false,
} as const;

const cmsRoles = new Set<UserRole>(['admin', 'editor', 'author']);

export function evaluateCmsAccess(input: CmsAccessInput): CmsAccessDecision {
  if (!input.cmsEnabled) {
    return 'disabled';
  }
  if (!input.isAuthenticated || !input.user) {
    return 'unauthenticated';
  }
  if (!cmsRoles.has(input.user.role)) {
    return 'forbidden';
  }
  return 'allow';
}

export function resolveTrustedSessionUser(serverUser: AppUser | null, _clientStoredUser?: unknown): AppUser | null {
  return serverUser;
}
