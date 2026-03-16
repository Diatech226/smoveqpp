import { Box, Code, Megaphone, Palette, Video, type LucideIcon } from 'lucide-react';
import type { Service } from '../../domain/contentSchemas';

export const SERVICE_ICONS: Record<string, LucideIcon> = {
  palette: Palette,
  code: Code,
  megaphone: Megaphone,
  video: Video,
  box: Box,
};

const SERVICE_COLOR_PATTERN = /^from-\[#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\]\s+to-\[#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\]$/;

const KNOWN_SERVICE_ROUTE_MAP: Record<string, string> = {
  'design-branding': '#service-design',
  'web-development': '#service-web',
};

export const resolveServiceRouteHref = (service: Pick<Service, 'id' | 'slug' | 'routeSlug'>): string => {
  const routeSlug = (service.routeSlug || service.slug || '').trim();
  if (routeSlug && KNOWN_SERVICE_ROUTE_MAP[routeSlug]) {
    return KNOWN_SERVICE_ROUTE_MAP[routeSlug];
  }

  return `#service-${service.id}`;
};

export const toRenderableService = (service: Service) => ({
  ...service,
  iconComponent: SERVICE_ICONS[service.icon] || Palette,
  color: SERVICE_COLOR_PATTERN.test(service.color || '') ? service.color : 'from-[#00b3e8] to-[#00c0e8]',
  routeHref: resolveServiceRouteHref(service),
});

export const selectRenderablePublicServices = (services: Service[]) =>
  services.filter((service) => service.status !== 'draft' && service.status !== 'archived').map(toRenderableService);
