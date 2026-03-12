export type BlogStatus = 'published' | 'draft';

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
}

export type MediaType = 'image' | 'video' | 'document';

export interface MediaFile {
  id: string;
  name: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  size: number;
  uploadedDate: string;
  uploadedBy: string;
  alt?: string;
  tags: string[];
}

export interface Project {
  id: string;
  title: string;
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
  testimonial?: {
    text: string;
    author: string;
    position: string;
  };
}

const isString = (value: unknown): value is string => typeof value === 'string' && value.length > 0;
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

export const isBlogPost = (value: unknown): value is BlogPost => {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

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
    (v.status === 'published' || v.status === 'draft')
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
    isStringArray(v.tags)
  );
};

export const isProject = (value: unknown): value is Project => {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  const testimonial = v.testimonial as Record<string, unknown> | undefined;

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
