import { describe, expect, it } from 'vitest';
import { validatePostForm } from './validation';

describe('validatePostForm', () => {
  it('accepts valid payload', () => {
    const result = validatePostForm({
      title: 'Valid title',
      content: 'This is a long enough content block.',
      slug: 'valid-title',
      status: 'draft',
    });
    expect(result.success).toBe(true);
  });

  it('rejects short title', () => {
    const result = validatePostForm({ title: 'a', content: 'long enough content', slug: 'x', status: 'draft' });
    expect(result.success).toBe(false);
  });
});
