import { getCMSContent, upsertCMSContent, type CMSContentItem } from '../../../data/cmsContent';

export async function fetchProjects(): Promise<CMSContentItem[]> {
  return getCMSContent().filter((item) => item.type === 'projects');
}

export async function createProject(item: CMSContentItem): Promise<void> {
  upsertCMSContent(item);
}

export async function updateProject(item: CMSContentItem): Promise<void> {
  upsertCMSContent(item);
}
