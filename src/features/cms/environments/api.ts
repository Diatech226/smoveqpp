import { cmsApiClient } from '../../../lib/cmsApiClient';

export async function fetchEnvironmentStatus(type: string, id: string) {
  const res = await cmsApiClient.get<{ item: any }>(`/v1/content/${type}/${id}/environment-status`);
  return res.data?.item;
}

export async function promoteContent(type: string, id: string, from: 'draft'|'staging'|'production', to: 'draft'|'staging'|'production') {
  const res = await cmsApiClient.post<{ item: any }>(`/v1/content/${type}/${id}/promote`, { from, to });
  return res.data?.item;
}
