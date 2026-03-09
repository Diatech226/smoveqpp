import { cmsApiClient } from '../../../lib/cmsApiClient';

export const fetchExperiments = async () => (await cmsApiClient.get<{ items: any[] }>('/v1/experiments')).data?.items ?? [];
export const createExperiment = async (payload: any) => (await cmsApiClient.post<{ item: any }>('/v1/experiments', payload)).data?.item;
export const startExperiment = async (id: string) => (await cmsApiClient.post<{ item: any }>(`/v1/experiments/${id}/start`)).data?.item;
export const stopExperiment = async (id: string) => (await cmsApiClient.post<{ item: any }>(`/v1/experiments/${id}/stop`)).data?.item;
