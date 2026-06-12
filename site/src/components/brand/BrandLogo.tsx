import { useEffect, useSyncExternalStore, type CSSProperties } from 'react';
import { getCloudinaryVariant } from '../../utils/cloudinaryVariant';
import { logDebug } from '../../utils/observability';
import {
  DEFAULT_BRAND_LOGO,
  getPublicBrandingSnapshot,
  refreshPublicBranding,
  subscribeToPublicBranding,
} from '../../utils/publicBranding';

const handleLogoError = (event: React.SyntheticEvent<HTMLImageElement>) => {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied === 'true') return;
  logDebug({ scope: 'branding', event: 'logo_render_failed', details: { src: image.currentSrc || image.src } });
  image.dataset.fallbackApplied = 'true';
  image.src = DEFAULT_BRAND_LOGO;
};

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
    void refreshPublicBranding().catch((error) => {
      logDebug({ scope: 'branding', event: 'component_refresh_failed', error });
    });
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
        onError={handleLogoError}
      />
    </span>
  );
}
