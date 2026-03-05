export interface SlugEntry {
  id: string;
  slug: string;
}

export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateUniqueSlug(items: SlugEntry[], value: string, options: { excludeId?: string; lockSlug?: boolean } = {}) {
  const base = slugify(value);
  if (!base) return '';
  if (options.lockSlug) return base;

  const taken = new Set(
    items
      .filter((item) => item.id !== options.excludeId)
      .map((item) => item.slug),
  );

  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}
