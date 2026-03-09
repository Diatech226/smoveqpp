export interface CmsSettings {
  id: string;
  textLogo: string;
  heroVideoUrl: string;
  socialLinks: Array<{ label: string; url: string }>;
  brandTokens: Record<string, unknown>;
}
