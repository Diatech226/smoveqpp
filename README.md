# SMOVE Communication — Plateforme web + CMS (V7 stabilisation)

SMOVE est actuellement une application **React + Vite + TypeScript** avec :
- un site public (services, portfolio, blog, pages vitrines),
- un CMS admin protégé côté front,
- une API d'authentification **Express + MongoDB + Passport**.

> ⚠️ Note importante : le dépôt actuel **n'est pas** un projet Next.js App Router + Prisma opérationnel. Il contient une architecture Vite/React + Express/Mongoose, avec plusieurs éléments roadmap (V3→V6) déjà posés.

---

## État actuel réel du projet

### Modules opérationnels
- **Front public** : navigation hash-based (`#home`, `#projects`, `#blog`, etc.).
- **Auth API** : session serveur (`express-session` + `connect-mongo`), login local + OAuth optionnel.
- **CMS Dashboard** : gestion contenus (services/projets/posts/events), médiathèque, taxonomies, brand settings.
- **Workflow éditorial local** : statuts (`draft`, `review`, `scheduled`, `published`, `archived`, `removed`) avec quick actions.
- **Media system local** : stockage orienté `localStorage`, upload multi-fichiers, filtres, preview, “use as cover”.

### Limites actuelles connues
- Les contenus CMS/média restent majoritairement **front-localStorage** (pas de persistance CMS serveur complète).
- Pas de schéma Prisma actif dans cette base.
- Les scripts `lint`/`build` dépendent des packages npm installés localement.

---

## Setup local

### Prérequis
- Node.js 18+
- npm 9+
- MongoDB accessible (local ou distant)

### Installation
```bash
npm install
```

## Environment Variables
1) Copier le template :
```bash
cp .env.example .env
```

2) Variables **obligatoires** pour démarrer correctement :
- `MONGO_URI`
- `SESSION_SECRET`
- `VITE_API_BASE_URL`
- `CLIENT_ORIGIN`

3) Variables **optionnelles** (selon vos besoins) :
- `VITE_ENABLE_*` + `VITE_DEV_ADMIN_*` pour les options CMS/front en développement,
- `GOOGLE_*`, `GITHUB_*`, `FACEBOOK_*` pour OAuth,
- `FEATURE_*`, `APP_VERSION`, `DEFAULT_TENANT_SLUG`, `JOB_RUNNER_TOKEN` pour les flags API,
- `BRAND_*` pour les fallbacks visuels si le branding n'est pas présent en base.

4) Local vs production :
- **Local** : conservez `NODE_ENV=development`, `CLIENT_ORIGIN=http://localhost:3000` et les callbacks OAuth localhost.
- **Production** : passez `NODE_ENV=production`, définissez un `SESSION_SECRET` fort, un `CLIENT_ORIGIN` exact, et les URLs OAuth de votre domaine.

### Démarrage
Terminal 1 (front) :
```bash
npm run dev
```
Le front Vite démarre sur `http://localhost:3000` (port défini dans `vite.config.ts`).

Terminal 2 (API auth) :
```bash
npm run dev:api
```

---


### CSP en développement (Vite)
- En dev (`npm run dev`), les en-têtes CSP stricts sont **désactivés** côté Vite pour autoriser le runtime HMR et les scripts injectés par Vite/React.
- En preview/prod (`vite preview` et déploiement), la CSP stricte reste active via les headers de sécurité.
- Si vous forcez manuellement `script-src 'self'` en local, Vite peut échouer avec des erreurs d'inline script/preamble.

## Bootstrap admin

Le serveur utilise :
- `ADMIN_EMAILS` (liste d'emails admin autorisés côté API),
- rôle utilisateur persisté en base Mongo via modèle `User`.

Exemple :
```env
ADMIN_EMAILS=admin@smove.com,owner@smove.com
```

Pour un bootstrap manuel, créer un utilisateur via endpoint register puis forcer son rôle `admin` en base Mongo si nécessaire.

---

## Media system (état V7)

- Upload multi-fichiers depuis le CMS (local/front mode).
- Filtres par type/dossier/date.
- Preview média et copie URL.
- Application d'un média en cover d'un contenu.
- En V7 : ajout d'un fallback alt text automatique lors de “Use as cover”.

Variables actuellement utilisées pour ce module :
- aucune variable d'environnement dédiée côté front (stockage `localStorage`),
- le front appelle l'API via `VITE_API_BASE_URL`.

---

## Workflow CMS (état V7)

- Création/édition de contenus : services, projets, posts, events.
- Validation de base avant sauvegarde : titre, résumé, contenu, catégorie, cover pour publication.
- Quick actions : review / publier / archiver.
- Preview avec token local.

Améliorations V7 appliquées :
- validation stricte du slug (format kebab-case),
- blocage explicite si slug invalide,
- protection quick-publish sans cover + alt text,
- feedback d'erreur/succès plus fiable pour copie URL.

---

## Commandes utiles

```bash
npm run dev
npm run dev:api
npm run lint
npm run test
npm run build
npm run db:migrate:v3
```


---

## Troubleshooting Mongo

### Connexion échoue
- Vérifier que MongoDB est lancé.
- Vérifier `MONGO_URI`.
- Vérifier que l'IP/port sont autorisés si Atlas.

### Session/login instables
- Vérifier `SESSION_SECRET`.
- Vérifier que `CLIENT_ORIGIN` correspond au front.
- Vérifier la persistance de la collection de sessions Mongo.

---

## Auth admin

- Auth basée session + Passport.
- Contrôle d'accès CMS : réservé aux profils autorisés (`admin` côté logique app).
- OAuth social activable via clés Google/GitHub/Facebook.

---

## Production notes

- Désactiver les secrets par défaut (`SESSION_SECRET`, `JOB_RUNNER_TOKEN`, etc.).
- Durcir CORS (`CLIENT_ORIGIN`) avec domaine exact.
- Externaliser stockage média vers S3-compatible.
- Ajouter monitoring endpoint `/api/health` + logs centralisés.
- Planifier migration CMS localStorage -> API persistante.

---

## Known issues actuelles

- Pas de persistance serveur CMS complète pour tous modules contenu.
- Dépendance forte au stockage local navigateur pour certaines features éditoriales.
- Tooling npm peut échouer en environnement restreint (registry/policy).

---

## V7 — Corrections apportées

- Stabilisation validation CMS sur slug/publish.
- Meilleure cohérence quick actions/status pour publication.
- Retours utilisateur plus robustes sur opérations média.
- `.env.example` professionnalisé et aligné code + roadmap.
- Documentation README remise à niveau avec état réel du dépôt.

Voir aussi : `CHANGELOG_V7.md` et `docs/v7-stabilisation-report.md`.

---

## Future iterations réalistes (V8+)

1. Basculer CRUD CMS/média vers API persistante Mongo complète.
2. Introduire tests E2E sur parcours admin critiques.
3. Établir un vrai lint TypeScript/ESLint unifié (au-delà des tests sécurité actuels).
4. Industrialiser la chaîne CI/CD (build, tests, smoke test API).
5. Préparer la convergence éventuelle vers Next.js/Prisma uniquement après stabilisation fonctionnelle complète.

## CMS Admin UX

### Architecture UI admin
- **Shell applicatif premium** : `AdminShell` orchestre un layout type SaaS avec sidebar fixe, topbar de contexte, et espace de contenu aéré.
- **Navigation CMS unifiée** : Dashboard, Articles, Services, Projects, Events, Media, Taxonomies, Users, Settings.
- **Design system admin réutilisable** : composants homogènes (cards, table, filtres, statuts, sections formulaire, empty states, confirmations).

### Composants clés
Composants principaux dans `src/components/cms/admin/AdminUI.tsx` :
- `AdminShell`, `AdminSidebar`, `AdminTopbar`, `AdminPageHeader`
- `AdminStatsCards`, `AdminDataTable`, `AdminStatusBadge`
- `AdminFiltersBar`, `AdminSearchInput`
- `AdminFormSection`, `AdminEmptyState`, `AdminLoadingSkeleton`
- `AdminConfirmDialog`, `MediaPicker`, `CoverPreviewCard`, `QuickStatusActions`, `PreviewButton`

### Modules CMS disponibles
- **Dashboard** : KPI, activité récente, quick actions.
- **Articles / Services / Projects / Events** : CRUD local V7 avec workflow de statuts harmonisé.
- **Media** : bibliothèque grille, upload image, preview, copie URL, suppression.
- **Taxonomies** : affichage labels actifs par type de contenu.
- **Users** : vue administrateur courante.
- **Settings** : branding + hero video.

### Logique dashboard
- Compteurs consolidés (total contenus, publiés, en review, médias).
- Sections d’action rapide pour limiter les clics sur les opérations fréquentes.
- Bloc activité pour prioriser les dernières modifications.

### Fonctionnement des CRUD
- Création rapide par module avec génération automatique de slug unique.
- Filtrage/recherche textuelle immédiate.
- Mise à jour de statut via `QuickStatusActions`.
- Suppression avec confirmation utilisateur.

### Workflow des statuts
- Statuts standardisés : `draft`, `review`, `scheduled`, `published`, `archived`.
- Changement de statut accessible directement depuis les tableaux.
- Badge visuel cohérent pour chaque état éditorial.

### Media workflow
- Upload local via `uploadMediaFile`.
- Gestion visuelle en carte + preview.
- Actions courantes : copy URL, use as cover (UX), suppression confirmée.

### API admin/auth — état réel du dépôt
> Le dépôt actuel expose principalement `/api/cms/*` et `/api/auth/*` côté serveur Express.

- `GET /api/auth/session`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/cms/summary`
- `GET /api/cms/posts`
- `POST /api/cms/posts`
- `PUT /api/cms/posts/:id`
- `DELETE /api/cms/posts/:id`

### Known issues
- Les modules CMS hors `posts` restent majoritairement en persistance locale front (localStorage).
- Les routes demandées de type `/api/admin/*` ne sont pas encore implémentées telles quelles dans ce dépôt.
- Le workflow “use as cover” côté média est actuellement une action UX (pas encore branchée sur chaque formulaire d’édition avancé).

### Prochaines itérations du CMS
1. Ajouter la couche API persistante pour services/projects/events/media/users/settings.
2. Introduire une API `/api/admin/*` consolidée avec validation stricte et contrat `json.data` homogène.
3. Ajouter pagination serveur + filtres serveur sur l’ensemble des listes admin.
4. Ajouter tests d’intégration API + E2E UI admin sur parcours critiques.
