import { cmsApiClient } from '../../../lib/cmsApiClient';

export const fetchSegments = async () => (await cmsApiClient.get<{ items: any[] }>('/v1/personalization/segments')).data?.items ?? [];
export const createSegment = async (payload: any) => (await cmsApiClient.post<{ item: any }>('/v1/personalization/segments', payload)).data?.item;
export const fetchVariants = async () => (await cmsApiClient.get<{ items: any[] }>('/v1/personalization/variants')).data?.items ?? [];
export const createVariant = async (payload: any) => (await cmsApiClient.post<{ item: any }>('/v1/personalization/variants', payload)).data?.item;
export const createRule = async (payload: any) => (await cmsApiClient.post<{ item: any }>('/v1/personalization/rules', payload)).data?.item;
