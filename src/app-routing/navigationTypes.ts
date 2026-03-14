export type AppRoute =
  | 'home'
  | 'services'
  | 'about'
  | 'portfolio'
  | 'contact'
  | 'projects'
  | 'services-all'
  | 'service-design'
  | 'service-web'
  | 'blog'
  | 'apropos'
  | 'login'
  | 'register'
  | 'account'
  | 'forgot-password'
  | 'reset-password'
  | 'cms-dashboard'
  | 'cms-unavailable'
  | 'cms-forbidden'
  | 'auth-loading'
  | `cms-${string}`
  | `project-${string}`
  | string;

export type ResolvedPage =
  | 'home'
  | 'projects'
  | 'services-all'
  | 'service-design'
  | 'service-web'
  | 'portfolio'
  | 'blog'
  | 'apropos'
  | 'login'
  | 'register'
  | 'account'
  | 'forgot-password'
  | 'reset-password'
  | 'cms-dashboard'
  | 'cms-unavailable'
  | 'cms-forbidden'
  | 'auth-loading'
  | `project-${string}`;

export interface AuthRoutingState {
  isAuthenticated: boolean;
  isAuthReady: boolean;
  canAccessCMS: boolean;
  cmsEnabled: boolean;
  registrationEnabled: boolean;
}

export interface RouteResolution {
  page: ResolvedPage;
  sectionToScroll: string | null;
  normalizedHash?: string;
}
