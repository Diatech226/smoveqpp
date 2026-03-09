import { cmsApiClient } from '../../../lib/cmsApiClient';
import type { CmsTaxonomyItem, TaxonomyType } from './types';

interface ListData { items: CmsTaxonomyItem[] }
interface ItemData { item: CmsTaxonomyItem }

export function fetchTaxonomies() { return cmsApiClient.get<ListData>('/v1/taxonomies'); }
export function createTaxonomy(payload: { type: TaxonomyType; label: string; slug?: string; active?: boolean }) { return cmsApiClient.post<ItemData>('/v1/taxonomies', payload); }
export function updateTaxonomy(id: string, payload: Partial<{ label: string; slug: string; active: boolean }>) { return cmsApiClient.patch<ItemData>(`/v1/taxonomies/${id}`, payload); }
export function deleteTaxonomy(id: string) { return cmsApiClient.delete<{}>(`/v1/taxonomies/${id}`); }
