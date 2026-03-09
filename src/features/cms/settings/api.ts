import { cmsApiClient } from '../../../lib/cmsApiClient';
import type { CmsSettings } from './types';

interface ItemData { item: CmsSettings }

export function fetchSettings() { return cmsApiClient.get<ItemData>('/v1/settings'); }
export function updateSettings(payload: Partial<Pick<CmsSettings, 'textLogo' | 'heroVideoUrl' | 'socialLinks' | 'brandTokens'>>) {
  return cmsApiClient.patch<ItemData>('/v1/settings', payload);
}
