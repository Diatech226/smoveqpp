import { PUBLIC_ROUTE_HASH } from './publicRoutes';

const normalize = (value: string | undefined): string => (value || '').trim().toLowerCase();

export const CONTACT_CTA_HREF = PUBLIC_ROUTE_HASH.contact;
export const TEAM_CTA_HREF = PUBLIC_ROUTE_HASH.portfolio;
export const START_PROJECT_CTA_HREF = PUBLIC_ROUTE_HASH.contact;

export const resolveServiceContactHref = (_href: string | undefined): string => CONTACT_CTA_HREF;

export const resolveProjectInquiryHref = (_href: string | undefined): string => START_PROJECT_CTA_HREF;

export const resolveAboutTeamHref = (href: string | undefined): string => {
  const normalized = normalize(href);
  if (!normalized) return TEAM_CTA_HREF;

  const aliases = new Set(['#/portfolio', '#portfolio', '/portfolio', '/portfolio/', '#team', '#/team', '/team', '/team/', '/#team']);
  return aliases.has(normalized) ? TEAM_CTA_HREF : TEAM_CTA_HREF;
};
