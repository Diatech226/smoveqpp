export type UserRole = 'admin' | 'editor' | 'author' | 'viewer';
export type UserStatus = 'active' | 'inactive' | 'invited';

export interface CmsUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
  updatedAt?: string;
}
