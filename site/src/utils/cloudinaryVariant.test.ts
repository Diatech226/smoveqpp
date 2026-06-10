import { describe, expect, it } from 'vitest';
import { getCloudinaryVariant } from './cloudinaryVariant';
describe('getCloudinaryVariant', () => {
  it('adds the requested optimization to Cloudinary upload URLs', () => expect(getCloudinaryVariant('https://res.cloudinary.com/demo/image/upload/v1/sample.jpg', 'thumbnail')).toBe('https://res.cloudinary.com/demo/image/upload/c_fill,w_360,h_240,f_auto,q_auto/v1/sample.jpg'));
  it('leaves non-Cloudinary URLs untouched', () => expect(getCloudinaryVariant('https://example.com/image.jpg', 'hero')).toBe('https://example.com/image.jpg'));
});
