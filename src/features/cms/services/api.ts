import { cmsApiClient } from '../../../lib/cmsApiClient';

export type ServiceStatus = 'draft' | 'published';

export interface CmsServiceItem {
  id: string;
  tenantId: string | null;
  title: string;
  slug: string;
  description: string;
  status: ServiceStatus;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

interface ServiceListData {
  items: CmsServiceItem[];
}

interface ServiceItemData {
  item: CmsServiceItem;
}

export async function fetchServices(params?: { page?: number; limit?: number; status?: ServiceStatus }) {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.status) query.set('status', params.status);
  const qs = query.toString();

  const response = await cmsApiClient.get<ServiceListData>(`/v1/services${qs ? `?${qs}` : ''}`);
  return {
    items: response.data?.items ?? [],
    meta: response.meta ?? {},
  };
}

export async function createService(payload: Pick<CmsServiceItem, 'title' | 'description' | 'status'> & { slug?: string }) {
  const response = await cmsApiClient.post<ServiceItemData>('/v1/services', payload);
  return response.data?.item;
}

export async function updateService(id: string, payload: Partial<Pick<CmsServiceItem, 'title' | 'description' | 'status' | 'slug'>>) {
  const response = await cmsApiClient.patch<ServiceItemData>(`/v1/services/${id}`, payload);
  return response.data?.item;
}
