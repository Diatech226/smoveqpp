# SMOVE CMS (Standalone App)

Le CMS est autonome sous `cms/src` et peut être déployé indépendamment du site public.

## Lancement local

```bash
npm --prefix cms run dev
```

URL CMS par défaut: `http://127.0.0.1:5174/#cms`

## Build

```bash
npm --prefix cms run build
npm --prefix cms run preview
```

## Configuration environnement

Copier le template:

```bash
cp cms/.env.example cms/.env.local
```

Variables principales:

- `VITE_API_ORIGIN`: origine backend.
- `VITE_API_BASE_URL`: base API (défaut `/api/v1`).
- `VITE_PUBLIC_SITE_URL`: URL canonique du site public utilisée par **“Retour au site public”**.
- `VITE_PUBLIC_APP_URL`: fallback legacy (conservé pour compatibilité).

Formats supportés pour ces variables:
- URL absolue (`https://site.com/#home`)
- hash local (`#home`)
- chemin absolu (`/`)
- domaine sans protocole (`www.site.com` ou `site.com`)

### Règle du lien “Retour au site public”

Le CMS résout l’URL de retour dans cet ordre:

1. `VITE_PUBLIC_SITE_URL` (prioritaire)
2. `VITE_PUBLIC_APP_URL` (compatibilité)
3. fallback même origine courante (`{origin}{pathname}#home`)
4. fallback dev final: `http://127.0.0.1:5173/#home`

Les liens d’accès au site public (header CMS, page compte, page accès refusé) ouvrent le site dans un nouvel onglet.

### Test manuel — bug “Retour au site public”

1. Configurer `VITE_PUBLIC_SITE_URL` dans `cms/.env.local`.
2. Lancer le CMS (`npm --prefix cms run dev`).
3. Ouvrir `http://127.0.0.1:5174/#cms`.
4. Cliquer sur **“Retour au site public”** (haut de page) puis **“Voir le site”**.
5. Vérifier que la navigation ouvre la bonne URL publique (local/staging/prod selon la variable).
6. Optionnel: retirer `VITE_PUBLIC_SITE_URL` et vérifier le fallback sur `VITE_PUBLIC_APP_URL`, puis sur l’URL locale par défaut.

## Organisation UX de l’admin

### Paramètres

La section est organisée en blocs stables:

- **Informations générales** (titre du site + email support).
- **Branding** (logo/logo dark/favicon/social image).
- **Taxonomie éditoriale** (catégories/tags gérés + enforcement).
- **Publication & opérations** (instant publishing + actions sensibles).

UX de fiabilité:

- statut **modifié / non sauvegardé**.
- confirmation implicite via warning de navigation si changements non enregistrés.
- actions explicites **Enregistrer** / **Annuler**.
- historique backend + rollback.

### Contenu des pages

La section “Contenus pages” est structurée pour la homepage:

- navigation latérale des sections.
- édition par blocs: **Hero**, **À propos & services**, **Projets/Blog/Contact**.
- état de synchronisation visible (non sauvegardé vs synchronisé).
- sauvegarde explicite vers le backend.

## Mapping CMS ↔ site public (source de vérité backend)

| Écran CMS | Champs | Endpoint API | Zone impactée site public |
|---|---|---|---|
| Paramètres > Informations générales | `siteSettings.siteTitle`, `siteSettings.supportEmail` | `GET/POST /api/v1/content/settings` | Header / contact global |
| Paramètres > Branding | `siteSettings.brandMedia.*` | `GET/POST /api/v1/content/settings` | Logo/favicons/social defaults |
| Paramètres > Taxonomie | `taxonomySettings.blog.*` | `GET/POST /api/v1/content/settings` | Formulaires éditoriaux blog CMS |
| Paramètres > Publication | `operationalSettings.instantPublishing` | `GET/POST /api/v1/content/settings` | Garde-fou publication CMS |
| Contenus pages > Homepage | `HomePageContentSettings` | `GET/POST /api/v1/content/page-content` | Sections homepage publique |
| Paramètres > Historique | rollback version | `GET /api/v1/content/settings/history`, `POST /api/v1/content/settings/:versionId/rollback` | Restauration configuration globale |

## Champs non branchés / vigilance

- Le scope “Contenus pages” couvre actuellement **la homepage** (pas encore les pages internes dédiées).
- Les champs sont strictement reliés au schéma backend existant; aucune duplication front d’une source backend n’est ajoutée.

## Roadmap recommandée

1. **Itération 1**: stabilisation CMS ↔ site public (contrats + observabilité).
2. **Itération 2**: preview mode temps réel avant publication.
3. **Itération 3**: media manager unifié (dossiers, variantes, alt governance).
4. **Itération 4**: historique/versioning des contenus de page.
5. **Itération 5**: SEO avancé par page (métas, OG, canonical, quality gates).
6. **Itération 6**: rôles & permissions éditoriales fines (workflow approbation).
