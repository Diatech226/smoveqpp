export type BlogStatus = 'draft' | 'in_review' | 'published' | 'archived';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  authorRole: string;
  category: string;
  tags: string[];
  publishedDate: string;
  readTime: string;
  featuredImage: string;
  images: string[];
  status: BlogStatus;
  seo?: {
    title?: string;
    description?: string;
    canonicalSlug?: string;
    socialImage?: string;
  };
}

export type MediaType = 'image' | 'video' | 'document';

export interface MediaAsset {
  id: string;
  type: MediaType;
  url: string;
  alt?: string;
  title?: string;
  label?: string;
  width?: number;
  height?: number;
  metadata?: Record<string, string>;
  source?: string;
  createdAt?: string;
  updatedAt?: string;

  // Legacy compatibility fields
  name: string;
  thumbnailUrl?: string;
  size: number;
  uploadedDate: string;
  uploadedBy: string;
  caption?: string;
  tags: string[];
}

export type MediaFile = MediaAsset;

export interface Project {
  id: string;
  title: string;
  slug?: string;
  summary?: string;
  featuredImage?: string;
  imageAlt?: string;
  client: string;
  category: string;
  year: string;
  description: string;
  challenge: string;
  solution: string;
  results: string[];
  tags: string[];
  mainImage: string;
  images: string[];
  featured?: boolean;
  status?: 'draft' | 'published' | 'archived';
  link?: string;
  createdAt?: string;
  updatedAt?: string;
  links?: {
    live?: string;
    caseStudy?: string;
  };
  testimonial?: {
    text: string;
    author: string;
    position: string;
  };
}

export interface Service {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  icon: string;
  color: string;
  features: string[];
  status?: 'draft' | 'published' | 'archived';
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const isString = (value: unknown): value is string => typeof value === 'string' && value.length > 0;
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

export const isBlogPost = (value: unknown): value is BlogPost => {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  const seo = v.seo as Record<string, unknown> | undefined;

  return (
    isString(v.id) &&
    isString(v.title) &&
    isString(v.slug) &&
    isString(v.excerpt) &&
    isString(v.content) &&
    isString(v.author) &&
    isString(v.authorRole) &&
    isString(v.category) &&
    isStringArray(v.tags) &&
    isString(v.publishedDate) &&
    isString(v.readTime) &&
    isString(v.featuredImage) &&
    isStringArray(v.images) &&
    (v.status === 'published' || v.status === 'draft' || v.status === 'in_review' || v.status === 'archived') &&
    (seo === undefined ||
      (typeof seo === 'object' &&
        seo !== null &&
        (seo.title === undefined || typeof seo.title === 'string') &&
        (seo.description === undefined || typeof seo.description === 'string') &&
        (seo.canonicalSlug === undefined || typeof seo.canonicalSlug === 'string') &&
        (seo.socialImage === undefined || typeof seo.socialImage === 'string')))
  );
};

export const isMediaFile = (value: unknown): value is MediaFile => {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  return (
    isString(v.id) &&
    isString(v.name) &&
    (v.type === 'image' || v.type === 'video' || v.type === 'document') &&
    isString(v.url) &&
    (v.thumbnailUrl === undefined || isString(v.thumbnailUrl)) &&
    typeof v.size === 'number' &&
    v.size >= 0 &&
    isString(v.uploadedDate) &&
    isString(v.uploadedBy) &&
    (v.alt === undefined || isString(v.alt)) &&
    (v.title === undefined || isString(v.title)) &&
    (v.label === undefined || isString(v.label)) &&
    (v.width === undefined || (typeof v.width === 'number' && v.width >= 0)) &&
    (v.height === undefined || (typeof v.height === 'number' && v.height >= 0)) &&
    (v.metadata === undefined ||
      (typeof v.metadata === 'object' &&
        v.metadata !== null &&
        Object.values(v.metadata as Record<string, unknown>).every((item) => typeof item === 'string'))) &&
    (v.source === undefined || isString(v.source)) &&
    (v.createdAt === undefined || isString(v.createdAt)) &&
    (v.updatedAt === undefined || isString(v.updatedAt)) &&
    (v.caption === undefined || isString(v.caption)) &&
    isStringArray(v.tags)
  );
};

export const isProject = (value: unknown): value is Project => {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  const testimonial = v.testimonial as Record<string, unknown> | undefined;
  const links = v.links as Record<string, unknown> | undefined;

  return (
    isString(v.id) &&
    isString(v.title) &&
    isString(v.client) &&
    isString(v.category) &&
    isString(v.year) &&
    isString(v.description) &&
    isString(v.challenge) &&
    isString(v.solution) &&
    isStringArray(v.results) &&
    isStringArray(v.tags) &&
    isString(v.mainImage) &&
    isStringArray(v.images) &&
    (v.slug === undefined || isString(v.slug)) &&
    (v.summary === undefined || isString(v.summary)) &&
    (v.featuredImage === undefined || isString(v.featuredImage)) &&
    (v.imageAlt === undefined || isString(v.imageAlt)) &&
    (v.featured === undefined || typeof v.featured === 'boolean') &&
    (v.status === undefined || v.status === 'draft' || v.status === 'published' || v.status === 'archived') &&
    (v.link === undefined || isString(v.link)) &&
    (v.createdAt === undefined || isString(v.createdAt)) &&
    (v.updatedAt === undefined || isString(v.updatedAt)) &&
    (links === undefined ||
      (typeof links === 'object' &&
        links !== null &&
        (links.live === undefined || isString(links.live)) &&
        (links.caseStudy === undefined || isString(links.caseStudy)))) &&
    (testimonial === undefined ||
      (typeof testimonial === 'object' &&
        testimonial !== null &&
        isString(testimonial.text) &&
        isString(testimonial.author) &&
        isString(testimonial.position)))
  );
};

export const isBlogPostArray = (value: unknown): value is BlogPost[] =>
  Array.isArray(value) && value.every(isBlogPost);

export const isMediaFileArray = (value: unknown): value is MediaFile[] =>
  Array.isArray(value) && value.every(isMediaFile);

export const isProjectArray = (value: unknown): value is Project[] =>
  Array.isArray(value) && value.every(isProject);

export const isService = (value: unknown): value is Service => {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  return (
    isString(v.id) &&
    isString(v.title) &&
    isString(v.slug) &&
    isString(v.description) &&
    isString(v.icon) &&
    isString(v.color) &&
    isStringArray(v.features) &&
    (v.shortDescription === undefined || isString(v.shortDescription)) &&
    (v.status === undefined || v.status === 'draft' || v.status === 'published' || v.status === 'archived') &&
    (v.link === undefined || isString(v.link)) &&
    (v.featured === undefined || typeof v.featured === 'boolean') &&
    (v.createdAt === undefined || isString(v.createdAt)) &&
    (v.updatedAt === undefined || isString(v.updatedAt))
  );
};

export const isServiceArray = (value: unknown): value is Service[] =>
  Array.isArray(value) && value.every(isService);
