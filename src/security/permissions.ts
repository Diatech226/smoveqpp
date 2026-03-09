export const Roles = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  AUTHOR: 'author',
  VIEWER: 'viewer',
} as const;

export type UserRole = (typeof Roles)[keyof typeof Roles];

export const Permissions = {
  POST_READ: 'post:read',
  POST_CREATE: 'post:create',
  POST_UPDATE: 'post:update',
  POST_PUBLISH: 'post:publish',
  POST_DELETE: 'post:delete',
  SETTINGS_UPDATE: 'settings:update',
  MEDIA_DELETE: 'media:delete',
  SERVICE_READ: 'service:read',
  SERVICE_CREATE: 'service:create',
  SERVICE_UPDATE: 'service:update',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

export const rolePermissions: Record<UserRole, Permission[]> = {
  [Roles.ADMIN]: Object.values(Permissions),
  [Roles.EDITOR]: [
    Permissions.POST_READ,
    Permissions.POST_CREATE,
    Permissions.POST_UPDATE,
    Permissions.POST_DELETE,
    Permissions.MEDIA_DELETE,
    Permissions.SERVICE_READ,
    Permissions.SERVICE_CREATE,
    Permissions.SERVICE_UPDATE,
  ],
  [Roles.AUTHOR]: [
    Permissions.POST_READ,
    Permissions.POST_CREATE,
    Permissions.POST_UPDATE,
    Permissions.SERVICE_READ,
    Permissions.SERVICE_CREATE,
    Permissions.SERVICE_UPDATE,
  ],
  [Roles.VIEWER]: [Permissions.POST_READ, Permissions.SERVICE_READ],
};

export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (rolePermissions[role] ?? []).includes(permission);
}
