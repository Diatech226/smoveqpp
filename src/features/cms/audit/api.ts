import { cmsApiClient } from '../../../lib/cmsApiClient';

export interface AuditItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

export async function fetchAuditLogs() {
  const result = await cmsApiClient.get<{ items: AuditItem[] }>('/v1/audit-logs?limit=10');
  return result.data?.items ?? [];
}
