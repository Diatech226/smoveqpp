export interface PostForm {
  title: string;
  content: string;
  slug: string;
  status: 'draft' | 'review' | 'scheduled' | 'published' | 'archived' | 'removed';
}

export function validatePostForm(data: unknown): { success: boolean; errors: string[] } {
  const input = data as Partial<PostForm>;
  const errors: string[] = [];

  if (typeof input.title !== 'string' || input.title.trim().length < 3) errors.push('title');
  if (typeof input.content !== 'string' || input.content.trim().length < 10) errors.push('content');
  if (typeof input.slug !== 'string' || input.slug.trim().length < 3) errors.push('slug');

  const allowed = ['draft', 'review', 'scheduled', 'published', 'archived', 'removed'];
  if (typeof input.status !== 'string' || !allowed.includes(input.status)) errors.push('status');

  return { success: errors.length === 0, errors };
}
