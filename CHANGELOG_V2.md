# Changelog V2 — CMS Pro

## Added
- Médiathèque V2 (localStorage) avec métadonnées DAM: folder, status, variants, altText, tags, mime/size. 
- Media library admin: filtres type/folder/status, recherche, pagination, copy URL, upload, suppression.
- Composant réutilisable `MediaPicker` utilisé dans formulaires contenu + settings.
- Workflow statuts unifiés: `draft`, `review`, `scheduled`, `published`, `archived`, `removed`.
- Scheduling V2: champ `publishedAt` et promotion auto `scheduled -> published` quand la date est dépassée.
- Taxonomies V2 seedées côté front (`service_category`, `project_category`, `post_category`) + dropdowns fiables dans formulaires.
- Blog V2 block-based (`contentBlocks`) + renderer public simplifié.
- Sidebar blog V2 “Les plus commentés” + “Dans la même rubrique”.
- Brand Center settings: tokens JSON, logos/OG/fav via media ids, social links.
- Application tokens brand dans `:root` via variables CSS au bootstrap.
- Test utilitaire slug (`slugify` + collision handling + excludeId + lockSlug).

## Changed
- `ensureUniqueSlug` utilise désormais une stratégie stable `slug-2`, `slug-3`.
- Validation publication renforcée: cover + altText obligatoires pour `published`/`scheduled`.
- Dashboard CMS remanié sans changer la route (`#cms-dashboard`) ni le shell principal.

## Notes
- Cette V2 reste orientée front localStorage dans ce repo Vite (pas de Prisma/Mongo content API complet). 
- Le backend Express existant garde les routes auth; les routes DAM/Brand API publiques restent à industrialiser en V3.
