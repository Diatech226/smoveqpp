import { blogRepository } from './blogRepository';
import { mediaRepository } from './mediaRepository';
import { projectRepository } from './projectRepository';

export interface CmsStats {
  projectCount: number;
  blogPostCount: number;
  mediaCount: number;
}

export interface CmsRepository {
  getStats(): CmsStats;
}

class DefaultCmsRepository implements CmsRepository {
  getStats(): CmsStats {
    return {
      projectCount: projectRepository.getAll().length,
      blogPostCount: blogRepository.getAll().length,
      mediaCount: mediaRepository.getAll().length,
    };
  }
}

export const cmsRepository: CmsRepository = new DefaultCmsRepository();
