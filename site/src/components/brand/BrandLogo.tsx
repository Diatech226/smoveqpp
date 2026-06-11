import { useEffect, useSyncExternalStore, type CSSProperties } from 'react';
import { getCloudinaryVariant } from '../../utils/cloudinaryVariant';
import {
  getPublicBrandingSnapshot,
  refreshPublicBranding,
  subscribeToPublicBranding,
} from '../../utils/publicBranding';

interface BrandLogoProps {
  alt: string;
  context: 'header' | 'footer';
  className?: string;
}

export default function BrandLogo({ alt, context, className = '' }: BrandLogoProps) {
  const branding = useSyncExternalStore(
    subscribeToPublicBranding,
    getPublicBrandingSnapshot,
    getPublicBrandingSnapshot,
  );

  useEffect(() => {
    void refreshPublicBranding().catch(() => undefined);
  }, []);

  const logoVariables = {
    '--logo-desktop': `${branding.logoSize.desktop}px`,
    '--logo-tablet': `${branding.logoSize.tablet}px`,
    '--logo-mobile': `${branding.logoSize.mobile}px`,
  } as CSSProperties;

  return (
    <span className={`cms-brand-logo-frame cms-brand-logo-frame--${context} ${className}`.trim()} style={logoVariables}>
      <img
        src={getCloudinaryVariant(branding.logoSrc, 'contain')}
        alt={alt}
        className="cms-brand-logo"
        width="320"
        height="80"
        decoding="async"
        fetchPriority={context === 'header' ? 'high' : 'auto'}
        loading={context === 'header' ? 'eager' : 'lazy'}
      />
    </span>
  );
}
