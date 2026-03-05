export interface BrandSettings {
  logoLightMediaId?: string;
  logoDarkMediaId?: string;
  faviconMediaId?: string;
  defaultOgMediaId?: string;
  socialLinks: { label: string; url: string }[];
  brandTokens: {
    colors: { primary: string; secondary: string; text: string; background: string };
    radius: { card: string; button: string };
    shadows: { card: string };
    typography: { heading: string; body: string };
  };
}

const KEY = 'smove_brand_settings_v2';

const defaults: BrandSettings = {
  socialLinks: [
    { label: 'LinkedIn', url: 'https://www.linkedin.com/company/smove' },
    { label: 'Instagram', url: 'https://www.instagram.com/smove' },
  ],
  brandTokens: {
    colors: { primary: '#00b3e8', secondary: '#34c759', text: '#273a41', background: '#f5f9fa' },
    radius: { card: '24px', button: '14px' },
    shadows: { card: '0 10px 25px rgba(0, 0, 0, 0.08)' },
    typography: { heading: 'ABeeZee', body: 'Abhaya Libre' },
  },
};

export function getBrandSettings(): BrandSettings {
  const stored = localStorage.getItem(KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(KEY, JSON.stringify(defaults));
  return defaults;
}

export function saveBrandSettings(next: BrandSettings) {
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function applyBrandTokensToRoot() {
  const tokens = getBrandSettings().brandTokens;
  const root = document.documentElement;
  root.style.setProperty('--smove-color-primary', tokens.colors.primary);
  root.style.setProperty('--smove-color-secondary', tokens.colors.secondary);
  root.style.setProperty('--smove-color-text', tokens.colors.text);
  root.style.setProperty('--smove-color-bg', tokens.colors.background);
  root.style.setProperty('--smove-radius-card', tokens.radius.card);
  root.style.setProperty('--smove-radius-button', tokens.radius.button);
  root.style.setProperty('--smove-shadow-card', tokens.shadows.card);
}
