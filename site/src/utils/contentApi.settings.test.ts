import { describe, expect, it } from 'vitest';
import { normalizeCmsSettings, normalizePublicSettings } from './contentApi';

describe('settings normalization contract', () => {
  it('repairs legacy flat cms payloads into canonical nested shape', () => {
    const normalized = normalizeCmsSettings({
      siteTitle: ' SMOVE Next ',
      supportEmail: ' ops@smove.africa ',
      instantPublishing: false,
      taxonomy: {
        blog: {
          managedCategories: ['Branding', 'branding', ''],
          managedTags: ['React', ' react '],
          enforceManagedTags: true,
        },
      },
    });

    expect(normalized.siteSettings.siteTitle).toBe('SMOVE Next');
    expect(normalized.siteSettings.supportEmail).toBe('ops@smove.africa');
    expect(normalized.operationalSettings.instantPublishing).toBe(false);
    expect(normalized.taxonomySettings.blog.managedCategories).toEqual(['Branding']);
    expect(normalized.taxonomySettings.blog.managedTags).toEqual(['React']);
    expect(normalized.siteTitle).toBe('SMOVE Next');
  });

  it('normalizes public runtime settings with nested canonical authority and media defaults', () => {
    const normalized = normalizePublicSettings({
      siteSettings: {
        siteTitle: 'SMOVE',
        supportEmail: 'contact@smove.africa',
        brandMedia: {
          logo: ' media:brand-logo ',
          logoDark: '',
          favicon: ' https://cdn.example.com/favicon.ico ',
          defaultSocialImage: '',
        },
      },
    });

    expect(normalized.siteSettings.siteTitle).toBe('SMOVE');
    expect(normalized.siteSettings.supportEmail).toBe('contact@smove.africa');
    expect(normalized.siteSettings.brandMedia.logo).toBe('media:brand-logo');
    expect(normalized.siteSettings.brandMedia.favicon).toBe('https://cdn.example.com/favicon.ico');
  });
});
