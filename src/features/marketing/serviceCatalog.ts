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

export const toRenderableService = (service: Service) => ({
  ...service,
  iconComponent: SERVICE_ICONS[service.icon] || Palette,
  color: SERVICE_COLOR_PATTERN.test(service.color || '') ? service.color : 'from-[#00b3e8] to-[#00c0e8]',
});

export const selectRenderablePublicServices = (services: Service[]) =>
  services.filter((service) => service.status !== 'draft' && service.status !== 'archived').map(toRenderableService);
