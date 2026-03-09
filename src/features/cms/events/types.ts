export type EventStatus = 'draft' | 'published' | 'archived';

export interface CmsEventItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  startsAt: string;
  endsAt: string | null;
  location: string;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
}
