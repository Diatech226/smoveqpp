import { Box, Code, Megaphone, Palette, Video, type LucideIcon } from 'lucide-react';
import type { Service } from '../../domain/contentSchemas';

export const SERVICE_ICONS: Record<string, LucideIcon> = {
  palette: Palette,
  code: Code,
  megaphone: Megaphone,
  video: Video,
  box: Box,
};

export const toRenderableService = (service: Service) => ({
  ...service,
  iconComponent: SERVICE_ICONS[service.icon] || Palette,
  color: service.color || 'from-[#00b3e8] to-[#00c0e8]',
});
