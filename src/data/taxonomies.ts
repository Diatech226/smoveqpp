export type TaxonomyType =
  | 'service_sector'
  | 'service_category'
  | 'project_sector'
  | 'project_category'
  | 'post_category';

export interface TaxonomyItem {
  id: string;
  type: TaxonomyType;
  label: string;
  slug: string;
  active: boolean;
}

const TAXONOMY_STORAGE_KEY = 'smove_taxonomies_v2';

const seedTaxonomies: TaxonomyItem[] = [
  { id: 'svc-sec-retail', type: 'service_sector', label: 'Retail', slug: 'retail', active: true },
  { id: 'svc-sec-corporate', type: 'service_sector', label: 'Corporate', slug: 'corporate', active: true },
  { id: 'svc-cat-branding', type: 'service_category', label: 'Branding', slug: 'branding', active: true },
  { id: 'svc-cat-dev', type: 'service_category', label: 'Développement Web', slug: 'developpement-web', active: true },
  { id: 'proj-sec-industrie', type: 'project_sector', label: 'Industrie', slug: 'industrie', active: true },
  { id: 'proj-sec-tech', type: 'project_sector', label: 'Tech', slug: 'tech', active: true },
  { id: 'proj-cat-site', type: 'project_category', label: 'Site Web', slug: 'site-web', active: true },
  { id: 'proj-cat-campagne', type: 'project_category', label: 'Campagne', slug: 'campagne', active: true },
  { id: 'post-cat-seo', type: 'post_category', label: 'SEO', slug: 'seo', active: true },
  { id: 'post-cat-brand', type: 'post_category', label: 'Branding', slug: 'branding', active: true },
  { id: 'post-cat-productivite', type: 'post_category', label: 'Productivité', slug: 'productivite', active: true },
];

export function getTaxonomies(): TaxonomyItem[] {
  const stored = localStorage.getItem(TAXONOMY_STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(TAXONOMY_STORAGE_KEY, JSON.stringify(seedTaxonomies));
  return seedTaxonomies;
}

export function getActiveTaxonomyLabels(type: TaxonomyType) {
  return getTaxonomies()
    .filter((item) => item.type === type && item.active)
    .map((item) => item.label)
    .sort((a, b) => a.localeCompare(b));
}
