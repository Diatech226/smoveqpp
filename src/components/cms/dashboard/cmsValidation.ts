import { isValidMediaFieldValue } from '../../../features/media/assetReference';

export const isValidHttpUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isValidCmsHref = (value: string): boolean => {
  const href = value.trim();
  if (!href) return false;
  if (href.startsWith('#')) return href.length > 1;
  if (href.startsWith('/')) return true;
  return isValidHttpUrl(href);
};

export const isValidMediaField = (value: string): boolean => isValidMediaFieldValue(value);

export const parseManagedTaxonomyInput = (value: string): string[] => {
  const normalizedByKey = new Map<string, string>();

  value
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .forEach((entry) => {
      const normalized = entry.replace(/\s+/g, ' ');
      if (!normalized) return;
      const key = normalized.toLocaleLowerCase('fr');
      if (!normalizedByKey.has(key)) {
        normalizedByKey.set(key, normalized);
      }
    });

  return Array.from(normalizedByKey.values());
};

export const toDateTimeLocalValue = (value: string): string => {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return '';
  return new Date(parsed).toISOString().slice(0, 16);
};

export const toIsoDateTime = (value: string): string | null => {
  const normalized = value.trim();
  if (!normalized) return null;
  const parsed = Date.parse(normalized);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toISOString();
};
