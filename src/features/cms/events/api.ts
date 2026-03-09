import { cmsApiClient } from '../../../lib/cmsApiClient';
import type { CmsEventItem, EventStatus } from './types';

interface ListData { items: CmsEventItem[] }
interface ItemData { item: CmsEventItem }

export function fetchEvents() { return cmsApiClient.get<ListData>('/v1/events'); }
export function createEvent(payload: { title: string; startsAt: string; location?: string; description?: string; status?: EventStatus; slug?: string }) {
  return cmsApiClient.post<ItemData>('/v1/events', payload);
}
export function updateEvent(id: string, payload: Partial<{ title: string; startsAt: string; endsAt: string | null; location: string; description: string; status: EventStatus; slug: string }>) {
  return cmsApiClient.patch<ItemData>(`/v1/events/${id}`, payload);
}
export function deleteEvent(id: string) { return cmsApiClient.delete<{}>(`/v1/events/${id}`); }
