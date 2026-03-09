import { cmsApiClient } from '../../../lib/cmsApiClient';
import type { CmsUser, UserRole, UserStatus } from './types';

export async function fetchUsers(params: { q?: string; role?: string; status?: string; page?: number; limit?: number } = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  const result = await cmsApiClient.get<{ items: CmsUser[]; pagination: Record<string, unknown> }>(`/v1/users?${query.toString()}`);
  return result.data ?? { items: [], pagination: {} };
}

export async function inviteUser(payload: { email: string; name: string; role: UserRole }) {
  const result = await cmsApiClient.post<CmsUser>('/v1/users/invite', payload);
  return result.data;
}

export async function updateUserRole(userId: string, role: UserRole) {
  const result = await cmsApiClient.patch<{ id: string; role: UserRole }>(`/v1/users/${userId}/role`, { role });
  return result.data;
}

export async function updateUserStatus(userId: string, status: UserStatus) {
  const result = await cmsApiClient.patch<{ id: string; status: UserStatus }>(`/v1/users/${userId}/status`, { status });
  return result.data;
}
