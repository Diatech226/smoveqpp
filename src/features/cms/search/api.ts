import { cmsApiClient } from '../../../lib/cmsApiClient';

export async function searchContent(query: string, isPublic = false) {
  const path = `${isPublic ? '/v1/search/public' : '/v1/search'}?q=${encodeURIComponent(query)}`;
  const res = await cmsApiClient.get<{ items: any[] }>(path);
  return res.data?.items ?? [];
}
