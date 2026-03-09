import { describe, expect, it } from 'vitest';
import { hasPermission, Permissions } from './permissions';

describe('admin RBAC matrix', () => {
  it('grants user management permissions to admin', () => {
    expect(hasPermission('admin', Permissions.USER_INVITE)).toBe(true);
    expect(hasPermission('admin', Permissions.USER_ROLE_UPDATE)).toBe(true);
    expect(hasPermission('admin', Permissions.USER_STATUS_UPDATE)).toBe(true);
  });

  it('does not allow viewer to manage users', () => {
    expect(hasPermission('viewer', Permissions.USER_INVITE)).toBe(false);
  });
});
