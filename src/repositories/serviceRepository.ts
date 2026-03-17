import { isServiceArray, type Service } from '../domain/contentSchemas';
import { services as staticServices } from '../data/services';
import { readFromStorage, writeToStorage } from './storage/localStorageStore';

const SERVICE_STORAGE_KEY = 'smove_services';

const asTrimmedString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const toSlug = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const toIsoOrNow = (value?: string): string => {
  if (!value) return new Date().toISOString();
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? new Date().toISOString() : new Date(parsed).toISOString();
};

const normalizeService = (service: Partial<Service> & { id: string }): Service => {
  const now = new Date().toISOString();
  const title = asTrimmedString(service.title);

  return {
    ...service,
    id: asTrimmedString(service.id),
    title,
    slug: toSlug(asTrimmedString(service.slug) || title || service.id),
    description: asTrimmedString(service.description),
    shortDescription: asTrimmedString(service.shortDescription) || undefined,
    icon: asTrimmedString(service.icon) || 'palette',
    iconLikeAsset: asTrimmedString(service.iconLikeAsset) || undefined,
    routeSlug: toSlug(asTrimmedString(service.routeSlug) || asTrimmedString(service.slug) || title || service.id),
    overviewTitle: asTrimmedString((service as Service).overviewTitle) || undefined,
    overviewDescription: asTrimmedString((service as Service).overviewDescription) || undefined,
    ctaTitle: asTrimmedString((service as Service).ctaTitle) || undefined,
    ctaDescription: asTrimmedString((service as Service).ctaDescription) || undefined,
    ctaPrimaryLabel: asTrimmedString((service as Service).ctaPrimaryLabel) || undefined,
    ctaPrimaryHref: asTrimmedString((service as Service).ctaPrimaryHref) || undefined,
    processTitle: asTrimmedString((service as Service).processTitle) || undefined,
    processSteps: Array.isArray((service as Service).processSteps)
      ? (service as Service).processSteps!.map((entry) => asTrimmedString(entry)).filter(Boolean)
      : [],
    color: asTrimmedString(service.color) || 'from-[#00b3e8] to-[#00c0e8]',
    features: Array.isArray(service.features) ? service.features.map((entry) => asTrimmedString(entry)).filter(Boolean) : [],
    status: service.status ?? 'published',
    featured: Boolean(service.featured),
    createdAt: toIsoOrNow(service.createdAt),
    updatedAt: now,
  };
};

const compareServices = (a: Service, b: Service): number => {
  const featuredCompare = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
  if (featuredCompare !== 0) return featuredCompare;
  const updatedCompare = Date.parse(b.updatedAt || '') - Date.parse(a.updatedAt || '');
  if (!Number.isNaN(updatedCompare) && updatedCompare !== 0) return updatedCompare;
  return a.title.localeCompare(b.title, 'fr');
};

interface ServiceRepository {
  getAll(): Service[];
  getPublished(): Service[];
  getById(id: string): Service | undefined;
  replaceAll(services: Service[]): Service[];
  save(service: Service): Service;
  delete(id: string): void;
}

class LocalServiceRepository implements ServiceRepository {
  private readonly defaults = this.validateServices(staticServices);

  private validateServices(input: unknown): Service[] {
    if (!isServiceArray(input)) {
      if (import.meta.env.DEV) {
        console.warn('[serviceRepository] invalid service seed data, using empty array');
      }
      return [];
    }

    return input.map((service) => normalizeService(service)).sort(compareServices);
  }

  private read(): Service[] {
    const services = readFromStorage(SERVICE_STORAGE_KEY, isServiceArray, this.defaults, { persistFallback: true });
    return services.map((service) => normalizeService(service)).sort(compareServices);
  }

  getAll(): Service[] {
    return this.read();
  }

  getPublished(): Service[] {
    return this.getAll().filter((service) => service.status !== 'draft' && service.status !== 'archived');
  }

  getById(id: string): Service | undefined {
    return this.getAll().find((service) => service.id === id);
  }

  replaceAll(services: Service[]): Service[] {
    const normalized = this.validateServices(services);
    writeToStorage(SERVICE_STORAGE_KEY, normalized);
    return normalized;
  }

  save(service: Service): Service {
    const trusted = normalizeService(service);
    const services = this.getAll();

    if (!trusted.id || !trusted.title || !trusted.slug || !trusted.routeSlug || !trusted.description) {
      throw new Error('Invalid service payload');
    }

    const slugConflict = services.find((candidate) => candidate.slug === trusted.slug && candidate.id !== trusted.id);
    if (slugConflict) {
      throw new Error('Service slug already exists');
    }

    const routeSlugConflict = services.find((candidate) => candidate.routeSlug === trusted.routeSlug && candidate.id !== trusted.id);
    if (routeSlugConflict) {
      throw new Error('Service route slug already exists');
    }

    const index = services.findIndex((candidate) => candidate.id === trusted.id);
    if (index >= 0) {
      trusted.createdAt = services[index].createdAt || trusted.createdAt;
      services[index] = trusted;
    } else {
      services.push(trusted);
    }

    const ordered = services.sort(compareServices);
    writeToStorage(SERVICE_STORAGE_KEY, ordered);
    return trusted;
  }

  delete(id: string): void {
    writeToStorage(
      SERVICE_STORAGE_KEY,
      this.getAll().filter((service) => service.id !== id),
    );
  }
}

export const serviceRepository: ServiceRepository = new LocalServiceRepository();
