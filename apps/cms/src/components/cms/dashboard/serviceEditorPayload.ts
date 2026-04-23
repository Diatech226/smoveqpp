import type { Service } from '../../../domain/contentSchemas';
import { ContentApiError } from '../../../utils/contentApi';
import { isValidMediaField, isValidCmsHref } from './cmsValidation';

export interface ServiceFormState {
  id?: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  icon: string;
  iconLikeAsset: string;
  color: string;
  features: string;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  routeSlug: string;
  overviewDescription: string;
  ctaTitle: string;
  ctaDescription: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  processTitle: string;
  processSteps: string;
}

const SERVICE_ICONS = new Set(['palette', 'code', 'megaphone', 'video', 'box']);
const SERVICE_COLOR_PATTERN = /^from-\[#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\]\s+to-\[#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\]$/;
const toSlug = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const toLines = (value: string): string[] => value.split('\n').map((entry) => entry.trim()).filter(Boolean);

export const validateServiceForm = (form: ServiceFormState, mode: 'create' | 'edit') => {
  const errors: Partial<Record<keyof ServiceFormState, string>> = {};
  const isCreate = mode === 'create';
  if (!form.title.trim()) errors.title = 'Le titre est requis.';

  if (isCreate && !form.description.trim()) errors.description = 'La description est requise.';
  if (isCreate && !form.icon.trim()) errors.icon = 'L’icône est requise.';
  if (isCreate && !form.color.trim()) errors.color = 'La couleur est requise.';
  if (isCreate && !form.features.trim()) errors.features = 'Ajoutez au moins une fonctionnalité.';

  if (form.icon.trim() && !SERVICE_ICONS.has(form.icon.trim()) && isCreate) {
    errors.icon = 'Icône invalide. Valeurs supportées: palette, code, megaphone, video, box.';
  }
  if (form.color.trim() && !SERVICE_COLOR_PATTERN.test(form.color.trim()) && isCreate) {
    errors.color = 'Couleur invalide. Format attendu: from-[#hex] to-[#hex].';
  }
  if (form.slug.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) {
    errors.slug = 'Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets.';
  }
  if (form.routeSlug.trim() && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.routeSlug.trim())) {
    errors.routeSlug = 'Le routeSlug doit contenir uniquement des lettres minuscules, chiffres et tirets.';
  }
  if (form.iconLikeAsset.trim() && !isValidMediaField(form.iconLikeAsset)) {
    errors.iconLikeAsset = 'Icon asset invalide. Utilisez une URL valide ou media:asset-id existant.';
  }
  if (form.ctaPrimaryHref.trim() && !isValidCmsHref(form.ctaPrimaryHref)) {
    errors.ctaPrimaryHref = 'Le CTA doit être une ancre (#contact), une route (/contact) ou une URL https://.';
  }
  if (form.status === 'published') {
    const resolvedRouteSlug = form.routeSlug.trim() || form.slug.trim() || toSlug(form.title);
    if (!resolvedRouteSlug) {
      errors.routeSlug = 'Un slug de route est requis pour publier.';
    }
    if (isCreate && !form.description.trim()) {
      errors.description = 'Une description détaillée est requise pour publier.';
    }
    if (isCreate && !toLines(form.features).length) {
      errors.features = 'Ajoutez au moins une fonctionnalité pour publier.';
    }
  }
  return errors;
};

export const buildServicePayload = (form: ServiceFormState, mode: 'create' | 'edit'): Partial<Service> & { id: string } => {
  const title = form.title.trim();
  const fallbackSlug = toSlug(title);
  const slug = form.slug.trim() || fallbackSlug;
  const routeSlug = form.routeSlug.trim() || slug || fallbackSlug;
  const features = toLines(form.features);
  const processSteps = toLines(form.processSteps);

  const payload: Partial<Service> & { id: string } = {
    id: form.id || `service-${Date.now()}`,
    title,
    slug,
    routeSlug,
    status: form.status,
    featured: form.featured,
  };

  if (mode === 'create' || form.description.trim()) payload.description = form.description.trim();
  if (form.shortDescription.trim()) payload.shortDescription = form.shortDescription.trim();
  if (mode === 'create' || form.icon.trim()) payload.icon = form.icon.trim();
  if (form.iconLikeAsset.trim()) payload.iconLikeAsset = form.iconLikeAsset.trim();
  if (mode === 'create' || form.color.trim()) payload.color = form.color.trim();
  if (mode === 'create' || features.length > 0) payload.features = features;
  if (form.overviewDescription.trim()) payload.overviewDescription = form.overviewDescription.trim();
  if (form.ctaTitle.trim()) payload.ctaTitle = form.ctaTitle.trim();
  if (form.ctaDescription.trim()) payload.ctaDescription = form.ctaDescription.trim();
  if (form.ctaPrimaryLabel.trim()) payload.ctaPrimaryLabel = form.ctaPrimaryLabel.trim();
  if (form.ctaPrimaryHref.trim()) payload.ctaPrimaryHref = form.ctaPrimaryHref.trim();
  if (form.processTitle.trim()) payload.processTitle = form.processTitle.trim();
  if (mode === 'create' || processSteps.length > 0) payload.processSteps = processSteps;

  return payload;
};

export const mapServiceSaveError = (error: unknown): string => {
  if (error instanceof ContentApiError) {
    if (error.status === 403) return 'Création/mise à jour non autorisée pour votre rôle.';
    if (error.code === 'SERVICE_SLUG_CONFLICT') return 'Ce slug service existe déjà. Choisissez un slug unique.';
    if (error.code === 'SERVICE_ROUTE_SLUG_CONFLICT') return 'Ce slug de route publique est déjà utilisé par un autre service.';
    if (error.code === 'SERVICE_NOT_PUBLISHABLE') return 'Ce service ne peut pas être publié: complétez les champs requis.';
    if (error.code === 'SERVICE_INVALID_MEDIA_REFERENCE') return 'Le visuel service sélectionné est introuvable.';
    if (error.code === 'SERVICE_VALIDATION_ERROR') return `Validation backend service: ${error.message}`;
    return `Sauvegarde impossible (${error.message}).`;
  }
  return 'Sauvegarde impossible. Vérifiez votre connexion puis réessayez.';
};
