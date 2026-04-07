export type UserRole = 'admin' | 'editor' | 'author' | 'viewer' | 'client';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status?: 'client' | 'staff';
  accountStatus?: 'active' | 'invited' | 'suspended';
  authProvider?: 'local' | 'google' | 'facebook' | 'clerk';
  emailVerified?: boolean;
  verificationPending?: boolean;
  verificationMethod?: 'email_token' | 'provider_trust';
}

const USER_ROLES: UserRole[] = ['admin', 'editor', 'author', 'viewer', 'client'];
const USER_STATUSES: NonNullable<AppUser['status']>[] = ['client', 'staff'];
const ACCOUNT_STATUSES: NonNullable<AppUser['accountStatus']>[] = ['active', 'invited', 'suspended'];
const AUTH_PROVIDERS: NonNullable<AppUser['authProvider']>[] = ['local', 'google', 'facebook', 'clerk'];
const VERIFICATION_METHODS: NonNullable<AppUser['verificationMethod']>[] = ['email_token', 'provider_trust'];

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
  cmsEnabled: parseBooleanFlag(import.meta.env.VITE_ENABLE_CMS, true),
  registrationEnabled: parseBooleanFlag(import.meta.env.VITE_ENABLE_REGISTRATION, import.meta.env.DEV),
  devAdminFallbackEnabled: false,
} as const;

const cmsRoles = new Set<UserRole>(['admin', 'editor', 'author']);

function isCmsIntentRoute(route?: string | null): boolean {
  if (!route) {
    return false;
  }

  return route === 'cms' || route === 'cms-dashboard' || route.startsWith('cms-') || route.startsWith('cms/');
}

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
  if (!serverUser || typeof serverUser !== 'object') {
    return null;
  }

  const role = USER_ROLES.includes(serverUser.role) ? serverUser.role : 'client';

  return {
    id: String(serverUser.id ?? ''),
    email: String(serverUser.email ?? ''),
    name: String(serverUser.name ?? ''),
    role,
    status: USER_STATUSES.includes(serverUser.status ?? 'client') ? serverUser.status : 'client',
    accountStatus: ACCOUNT_STATUSES.includes(serverUser.accountStatus ?? 'active') ? serverUser.accountStatus : 'active',
    authProvider: AUTH_PROVIDERS.includes(serverUser.authProvider ?? 'local') ? serverUser.authProvider : 'local',
    emailVerified: Boolean(serverUser.emailVerified),
    verificationPending: Boolean(serverUser.verificationPending),
    verificationMethod: VERIFICATION_METHODS.includes(serverUser.verificationMethod ?? 'email_token') ? serverUser.verificationMethod : 'email_token',
  };
}


export type PostLoginRoute = 'cms-dashboard' | 'home' | 'account' | 'cms-forbidden';

export function resolvePostLoginRoute(cmsEnabled: boolean, user: AppUser | null, intendedRoute?: string | null): PostLoginRoute {
  const decision = evaluateCmsAccess({
    cmsEnabled,
    isAuthenticated: Boolean(user),
    user,
  });

  if (decision === 'allow') {
    if (isCmsIntentRoute(intendedRoute)) {
      return 'cms-dashboard';
    }
    return 'cms-dashboard';
  }

  if (isCmsIntentRoute(intendedRoute)) {
    return 'cms-forbidden';
  }

  if (user) {
    return 'account';
  }

  return 'home';
}
