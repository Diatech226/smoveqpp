import { describe, expect, it } from 'vitest';
import { motion } from './motion-react';

describe('motion shim component stability', () => {
  it('returns the same element component between renders so controlled inputs are not remounted', () => {
    expect(motion.div).toBe(motion.div);
    expect(motion.form).toBe(motion.form);
  });
});
