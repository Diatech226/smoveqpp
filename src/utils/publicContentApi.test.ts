import { describe, expect, it, vi } from 'vitest';
import { ContentApiError } from './contentApi';
import { fetchPublicMediaFiles, fetchPublicProjects, fetchPublicServices } from './publicContentApi';

describe('publicContentApi', () => {
  it('returns public projects from backend envelope', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { projects: [{ id: 'p-1', title: 'P1' }] } }),
      } as Response),
    );

    const projects = await fetchPublicProjects();
    expect(projects).toHaveLength(1);
  });


  it('returns public media files from backend envelope', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { mediaFiles: [{ id: 'm-1', name: 'm1', type: 'image', url: 'u', size: 1, uploadedDate: '2026-01-01', uploadedBy: 'cms', tags: [] }] } }),
      } as Response),
    );

    const media = await fetchPublicMediaFiles();
    expect(media).toHaveLength(1);
  });

  it('throws when public services endpoint is unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ success: false, error: { code: 'CONTENT_UNAVAILABLE', message: 'down' } }),
      } as Response),
    );

    await expect(fetchPublicServices()).rejects.toBeInstanceOf(ContentApiError);
  });
});
