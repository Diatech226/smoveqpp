import { cmsApiClient } from '../../../lib/cmsApiClient';

export interface AnalyticsOverview {
  published: number;
  drafts: number;
  scheduled: number;
  uploads: number;
  failedJobs: number;
}

export async function fetchAnalyticsOverview(): Promise<AnalyticsOverview> {
  const result = await cmsApiClient.get<AnalyticsOverview>('/v1/analytics/overview');
  return result.data ?? { published: 0, drafts: 0, scheduled: 0, uploads: 0, failedJobs: 0 };
}
