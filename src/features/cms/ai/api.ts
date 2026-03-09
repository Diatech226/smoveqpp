import { cmsApiClient } from '../../../lib/cmsApiClient';

export const summarizeContent = async (text: string) => (await cmsApiClient.post<{ result: any }>('/v1/ai/summarize', { text })).data?.result;
export const rewriteContent = async (text: string) => (await cmsApiClient.post<{ result: any }>('/v1/ai/rewrite', { text })).data?.result;
export const seoSuggestions = async (title: string, text: string) => (await cmsApiClient.post<{ result: any }>('/v1/ai/seo-suggestions', { title, text })).data?.result;
