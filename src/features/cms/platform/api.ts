import { cmsApiClient } from '../../../lib/cmsApiClient';

export async function fetchPublicExposure() {
  const endpoints = [
    '/v1/public/posts',
    '/v1/public/services',
    '/v1/public/projects',
    '/v1/public/events',
    '/v1/public/taxonomies',
    '/v1/public/brand',
  ];
  const results = await Promise.all(endpoints.map(async (path) => {
    const res = await cmsApiClient.get<any>(path);
    return { path: `/api${path}`, sampleSize: res.data?.items?.length ?? (res.data?.item ? 1 : 0) };
  }));
  return results;
}
