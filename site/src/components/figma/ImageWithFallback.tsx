import React, { useState } from 'react';
import { getCloudinaryVariant, type CloudinaryVariant } from '../../utils/cloudinaryVariant';

const ERROR_IMG_SRC = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400"%3E%3Cdefs%3E%3ClinearGradient id="g" x1="0" x2="1" y1="0" y2="1"%3E%3Cstop stop-color="%2300b3e8"/%3E%3Cstop offset="1" stop-color="%23273a41"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="640" height="400" fill="url(%23g)"/%3E%3C/svg%3E';

type ImageWithFallbackProps = React.ImgHTMLAttributes<HTMLImageElement> & { variant?: CloudinaryVariant };

export function ImageWithFallback({ src, alt = '', className, style, loading, decoding, variant, ...rest }: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);
  const inferredVariant = variant || (className?.includes('object-contain') ? 'contain' : className?.includes('object-cover') ? 'card' : undefined);
  const optimizedSrc = inferredVariant ? getCloudinaryVariant(`${src || ''}`, inferredVariant) : src;
  const handleError = () => setFailed(true);
  return <img src={failed ? ERROR_IMG_SRC : optimizedSrc} alt={failed ? `${alt} (image indisponible)` : alt} className={className} style={style} loading={loading ?? 'lazy'} decoding={decoding ?? 'async'} {...rest} data-original-url={failed ? src : undefined} onError={handleError} />;
}
