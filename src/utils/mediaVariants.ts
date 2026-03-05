export type MediaSize = 'thumb' | 'sm' | 'md' | 'lg' | 'og';

const WIDTH_MAP: Record<MediaSize, number> = {
  thumb: 320,
  sm: 640,
  md: 1024,
  lg: 1600,
  og: 1200,
};

export function buildImageVariants(base64Url: string) {
  return {
    thumb: { url: base64Url, width: WIDTH_MAP.thumb },
    sm: { url: base64Url, width: WIDTH_MAP.sm },
    md: { url: base64Url, width: WIDTH_MAP.md },
    lg: { url: base64Url, width: WIDTH_MAP.lg },
    og: { url: base64Url, width: WIDTH_MAP.og, height: 630 },
  };
}
