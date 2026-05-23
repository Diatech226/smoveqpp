import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchBackendMediaFiles, fetchBackendProjects, fetchBackendServices, uploadBackendMediaFile } from './contentApi';

describe('contentApi collection normalization', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads projects from data.items shape', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ success: true, data: { items: [{ id: 'p1', title: 'Project 1' }] } }) })));
    const items = await fetchBackendProjects();
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe('p1');
  });

  it('reads services from data.data shape', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ success: true, data: { data: [{ id: 's1', title: 'Service 1' }] } }) })));
    const items = await fetchBackendServices();
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe('s1');
  });

  it('reads media from data.media shape', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ success: true, data: { media: [{ id: 'm1', name: 'Media 1' }] } }) })));
    const items = await fetchBackendMediaFiles();
    expect(items).toHaveLength(1);
    expect(items[0]?.id).toBe('m1');
  });

  it('accepts media upload response with data.file shape', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ success: true, data: { file: { id: 'm2', name: 'Media 2', publicPath: '/uploads/media-2.png' } } }) })));
    const media = await uploadBackendMediaFile({ filename: 'asset.png', dataUrl: 'data:image/png;base64,AAAA' });
    expect(media.id).toBe('m2');
  });
});
