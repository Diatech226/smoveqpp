export type TaxonomyType = 'service_sector' | 'service_category' | 'project_sector' | 'project_category' | 'post_category';

export interface CmsTaxonomyItem {
  id: string;
  type: TaxonomyType;
  label: string;
  slug: string;
  active: boolean;
}
