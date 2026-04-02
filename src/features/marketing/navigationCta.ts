const CONTACT_HASH = '#contact';
const TEAM_HASH = '#portfolio';

const normalize = (value: string | undefined): string => (value || '').trim().toLowerCase();

export const resolveServiceContactHref = (_href: string | undefined): string => CONTACT_HASH;

export const resolveAboutTeamHref = (href: string | undefined): string => {
  const normalized = normalize(href);

  if (!normalized) return TEAM_HASH;

  if (
    normalized === TEAM_HASH ||
    normalized === '/portfolio' ||
    normalized === '/portfolio/' ||
    normalized === '#team' ||
    normalized === '#/team' ||
    normalized === '/team' ||
    normalized === '/team/' ||
    normalized === '/#team'
  ) {
    return TEAM_HASH;
  }

  return TEAM_HASH;
};

export const CONTACT_CTA_HREF = CONTACT_HASH;
export const TEAM_CTA_HREF = TEAM_HASH;
