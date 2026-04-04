import { normalizeSlug } from './blogEntryAdapter';

export interface BlogEditorialDraft {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  publishedDate: string;
  seoTitle: string;
  seoDescription: string;
  canonicalSlug: string;
  tags: string;
}

export interface BlogEditorialReadiness {
  blockers: string[];
  warnings: string[];
}

const BLOG_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const parseTags = (tags: string): string[] =>
  tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

export function evaluateBlogEditorialReadiness(
  form: BlogEditorialDraft,
  options: {
    isValidMediaField: (value: string) => boolean;
    managedTags: string[];
    enforceManagedTags: boolean;
  },
): BlogEditorialReadiness {
  const blockers: string[] = [];
  const warnings: string[] = [];

  const normalizedSlug = normalizeSlug(form.slug, form.title);

  if (!form.title.trim()) blockers.push('Titre manquant.');
  if (!normalizedSlug || !BLOG_SLUG_PATTERN.test(normalizedSlug)) {
    blockers.push('Slug invalide (mots-separes-par-tirets).');
  }

  if (!form.featuredImage.trim()) {
    blockers.push('Image vedette manquante.');
  } else if (!options.isValidMediaField(form.featuredImage)) {
    blockers.push('Image vedette invalide (URL ou media:asset-id).');
  }

  if (Number.isNaN(Date.parse(form.publishedDate))) {
    blockers.push('Date de publication invalide.');
  }

  if (!form.excerpt.trim()) {
    warnings.push('Résumé absent: les cartes publiques perdront du contexte.');
  }
  if (!form.content.trim()) {
    warnings.push('Contenu détaillé absent: la page détail sera vide.');
  }

  if (!form.seoTitle.trim() || !form.seoDescription.trim() || !normalizeSlug(form.canonicalSlug, form.title)) {
    warnings.push('SEO incomplet (title/description/canonicalSlug).');
  }

  if (options.enforceManagedTags) {
    const managedByKey = new Set(options.managedTags.map((tag) => tag.toLocaleLowerCase('fr')));
    const unknownTags = parseTags(form.tags).filter((tag) => !managedByKey.has(tag.toLocaleLowerCase('fr')));
    if (unknownTags.length > 0) {
      warnings.push(`Tags hors taxonomie gérée: ${unknownTags.join(', ')}.`);
    }
  }

  return { blockers, warnings };
}
