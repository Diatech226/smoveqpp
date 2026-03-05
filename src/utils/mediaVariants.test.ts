import { describe, expect, it } from 'vitest';
import { buildImageVariants } from './mediaVariants';

describe('buildImageVariants', () => {
  it('creates all image variants with expected widths', () => {
    const variants = buildImageVariants('data:image/png;base64,abc');
    expect(variants.thumb.width).toBe(320);
    expect(variants.sm.width).toBe(640);
    expect(variants.md.width).toBe(1024);
    expect(variants.lg.width).toBe(1600);
    expect(variants.og.height).toBe(630);
  });
});
