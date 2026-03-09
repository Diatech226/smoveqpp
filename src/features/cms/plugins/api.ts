import { cmsApiClient } from '../../../lib/cmsApiClient';

export const fetchPlugins = async () => (await cmsApiClient.get<{ items: any[] }>('/v1/plugins')).data?.items ?? [];
export const activatePlugin = async (key: string) => (await cmsApiClient.post<{ item: any }>(`/v1/plugins/${key}/activate`)).data?.item;
export const deactivatePlugin = async (key: string) => (await cmsApiClient.post<{ item: any }>(`/v1/plugins/${key}/deactivate`)).data?.item;
