# SMOVE Communication — Site vitrine + CMS (React/Vite + API Auth Express)

Application web pour une agence digitale, avec :
- un **front-end vitrine** (home, services, portfolio, blog, contact),
- un **CMS admin protégé** par authentification,
- une **API d’authentification** Express/MongoDB (session cookie + CSRF + OAuth).

---

## 1) Vision globale de l’application

Le projet est organisé en deux blocs :

1. **Frontend (Vite + React + TypeScript)**
   - Navigation par hash (`#home`, `#projects`, `#cms-dashboard`, etc.)
   - Pages publiques + pages d’auth + dashboard CMS
   - Données de contenu actuellement hybrides :
     - projets depuis fichiers TS,
     - blog et médias via `localStorage`.

2. **Backend Auth (Express + Passport + MongoDB)**
   - Session côté serveur (cookie httpOnly)
   - Protection CSRF pour les routes sensibles
   - Login local (email/password) + OAuth social (Google/GitHub/Facebook si configuré)
   - Attribution de rôle (`admin`/`editor`/`viewer`) et contrôle d’accès CMS.

---

## 2) Fonctionnement actuel (parcours de l’application)

### Front public
- Le point d’entrée de routing est dans `src/App.tsx`.
- Les pages publiques disponibles :
  - `#home`
  - `#projects`
  - `#project-{id}`
  - `#services-all`, `#service-design`, `#service-web`
  - `#portfolio`
  - `#blog`
  - `#apropos`
- Les ancres de sections homepage (`#services`, `#about`, `#portfolio`, `#contact`) déclenchent un scroll vers la section cible.

### Authentification & autorisation
- Le contexte `AuthProvider` (`src/contexts/AuthContext.tsx`) pilote :
  - bootstrap de session via `/api/auth/session`,
  - login/register/logout,
  - état `isAuthReady`,
  - drapeaux de sécurité (`cmsEnabled`, `registrationEnabled`, fallback dev admin),
  - décision d’accès CMS (`canAccessCMS`).
- Politique de sécurité :
  - rejet des identités stockées côté client,
  - CMS réservé au rôle `admin`.

### CMS
- Route principale : `#cms-dashboard`.
- Le composant `src/components/cms/CMSDashboard.tsx` propose :
  - sidebar + sections (`overview`, `projects`, `blog`, `media`, `settings`),
  - cartes de statistiques,
  - actions rapides,
  - activité récente.
- Le dashboard est actuellement surtout un **shell UI** avec données locales pour plusieurs blocs.

### API Auth
- Serveur : `server/index.js`.
- Endpoints utilisés :
  - `GET /api/auth/session`
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/:provider` + callback OAuth
- Session stockée en MongoDB (`connect-mongo`) + Passport.

---

## 3) Stack technique

- **Frontend** : React 18, Vite, TypeScript, Tailwind classes utilitaires, Motion, Radix UI.
- **Backend** : Express, Passport, Mongoose, bcryptjs, express-session, connect-mongo.
- **Tests** : Vitest (tests sécurité ciblés).

---

## 4) Démarrage local

### Prérequis
- Node.js 18+
- MongoDB accessible (local ou cloud)

### Installation

```bash
npm install
```

### Variables d’environnement
Créer un `.env` (ou équivalent) et renseigner au minimum :

```env
MONGO_URI=mongodb://localhost:27017/smove
SESSION_SECRET=change-me
VITE_API_BASE_URL=http://localhost:4000/api
```

Optionnel pour OAuth social :

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
```

### Lancement

Terminal 1 (frontend)
```bash
npm run dev
```

Terminal 2 (API auth)
```bash
npm run dev:api
```

### Vérification rapide
```bash
npm run test:security
```

---

## 5) État CMS actuel (diagnostic)

### Déjà en place
- Contrôle d’accès CMS robuste (session serveur + rôle admin).
- UI dashboard avancée et cohérente avec le design system.
- Base fonctionnelle d’auth locale + sociale.
- Fonctions utilitaires CRUD côté client pour blog/média.

### Limites actuelles
- Les contenus CMS (blog/média, partiellement projets) reposent majoritairement sur `localStorage` / fichiers statiques.
- Pas encore de vrai back-office CRUD persistant côté API pour projets/blog/media.
- Pas de workflow éditorial complet (brouillon, review, publication planifiée, audit).
- Pas de RBAC fin (au-delà du filtre admin pour l’accès global).

---

## 6) Itérations proposées pour développer le CMS

> Objectif : passer d’un dashboard UI + données locales à un **CMS de production**, sécurisé, collaboratif, observable et scalable.

### Itération 1 — Fondations de contenu (MVP persistant)
**But :** sortir du `localStorage` pour les entités clés.

- Créer les collections MongoDB : `projects`, `posts`, `media`.
- Ajouter API REST versionnée (`/api/cms/*`) avec schémas Mongoose.
- Brancher le front CMS sur ces endpoints.
- Gérer upload médias simple (stockage local serveur ou S3 compatible).
- Ajouter validation serveur (zod/joi ou validation Mongoose stricte).

**Livrable attendu :** CRUD réel des projets/blog/média depuis CMS, persisté en base.

### Itération 2 — Workflow éditorial & rôles
**But :** rendre l’édition collaborative.

- Introduire rôles fins : `admin`, `editor`, `author`, `viewer`.
- Permissions par action (create/edit/publish/delete).
- États de contenu : `draft`, `in_review`, `scheduled`, `published`, `archived`.
- Historique de version simple sur les articles.
- Journal d’audit (qui a fait quoi, quand).

**Livrable attendu :** publication contrôlée et traçable.

### Itération 3 — Expérience éditeur (DX CMS)
**But :** accélérer la production de contenu.

- Éditeur riche (Markdown/Bloc WYSIWYG).
- SEO fields (meta title/description, slug, OG image).
- Prévisualisation avant publication.
- Gestion médiathèque avancée : dossiers, tags, compression, alt text obligatoire.
- Recherche et filtres multi-critères dans le dashboard.

**Livrable attendu :** CMS confortable pour une équipe contenu non-tech.

### Itération 4 — Fiabilité, sécurité, performance
**But :** readiness production.

- Rate limiting + durcissement CORS/CSRF/session.
- Logs structurés + monitoring erreurs/perf (API + front).
- Tests E2E des parcours critiques (login, création article, publication).
- Sauvegarde/restauration base + stratégie de migration.
- Optimisations images/CDN + cache API.

**Livrable attendu :** plateforme stable et exploitable en continu.

### Itération 5 — Omnicanal & croissance
**But :** faire du CMS un hub de diffusion.

- Exposition API de lecture publique propre (headless-ready).
- Webhooks (newsletter, réseaux sociaux, automation).
- Multi-sites / multi-langues.
- Planification éditoriale + calendrier.
- Analytics de contenu (vues, CTR, conversion assistée).

**Livrable attendu :** CMS orienté business, extensible et mesurable.

---

## 7) Recommandation de priorisation (90 jours)

- **Semaine 1-3** : Itération 1 (modèle de données + CRUD persistant).
- **Semaine 4-6** : Itération 2 (rôles/permissions + workflow).
- **Semaine 7-9** : Itération 3 (éditeur, SEO, preview).
- **Semaine 10-12** : Itération 4 (qualité, sécurité, observabilité).
- **Backlog stratégique** : Itération 5 selon objectifs business.

---

## 8) Structure utile du repo

- `src/App.tsx` : routing hash + gardes d’accès (public/auth/CMS).
- `src/contexts/AuthContext.tsx` : état de session et fonctions auth.
- `src/utils/authApi.ts` : client API auth.
- `src/utils/securityPolicy.ts` : règles de sécurité d’accès CMS.
- `src/components/cms/CMSDashboard.tsx` : interface d’admin.
- `src/data/*.ts` : données et CRUD locaux actuels.
- `server/index.js` : API Express auth + session + OAuth.

---

## 9) Commandes utiles

```bash
npm run dev         # Frontend
npm run dev:api     # API auth
npm run build       # Build production front
npm run test:security
```


## 10) Roadmap CMS professionnel (site + blog + assets de marque)

Une feuille de route détaillée est disponible ici : **`ROADMAP_CMS_PRO.md`**.

Elle couvre notamment :
- la médiathèque (stock d’images),
- les formats d’images et variantes automatiques,
- un espace de gestion des assets de marque (couleurs, tokens, logos),
- le plan d’exécution complet vers un CMS professionnel d’agence.

---

## V1 livré

- Dashboard CMS consolidé avec compteurs fiables pour services, projets, articles, médias et utilisateurs connectés.
- Uniformisation du CRUD V1 pour **services / projets / articles / évènements** avec:
  - création, édition, suppression,
  - mise à jour rapide de statut,
  - gestion du slug,
  - sélection de cover via médiathèque,
  - feedback de sauvegarde et reset/annulation.
- Règle de publication renforcée: statut `published` interdit sans cover.
- Bloc taxonomies (catégories détectées automatiquement).
- Vue dashboard enrichie: derniers contenus, brouillons, publiés récents.
- Stabilisation UI admin (cards, tableaux, actions alignées, spacing homogène).

Modules opérationnels en V1:
- Auth + contrôle d’accès admin CMS.
- Dashboard d’administration consolidé.
- CRUD localStorage V1 pour services/projets/posts/events.
- Médiathèque locale et sélection de cover.

Limites actuelles:
- Persistance CMS côté front (`localStorage`) et non base centralisée.
- Gestion utilisateurs limitée au contexte de session courant.
- Galerie simple stockée, mais sans UX dédiée d’upload multi-image avancé.

## Futures itérations V2 / V3

### V2
- Migration des contenus CMS vers API persistante (MongoDB), suppression de la logique locale.
- Upload média serveur + variantes d’images servies de manière centralisée.
- Gestion utilisateurs admin complète (listing, rôles, activation/désactivation).
- Filtres avancés, pagination et recherche serveur.

### V3
- Workflow éditorial complet (review, planification, audit trail).
- SEO avancé, preview, autosave et révisions.
- Monitoring, observabilité et tests E2E des parcours CMS critiques.

## Known current technical constraints

- Le projet frontend actuel est un SPA **React + Vite** (pas Next.js App Router).
- Les schémas Prisma ne sont pas présents dans ce repository; la couche de données CMS V1 reste côté client.
- Les compteurs utilisateurs reflètent l’état de session disponible côté client, pas un annuaire complet.
- La médiathèque est locale et dépend du navigateur courant (stockage local non partagé entre machines).

## 8) V2 CMS Pro livré dans ce repo

### Fonctionnalités V2 implémentées
- **Médiathèque Pro (front)** : modèle média enrichi (type/folder/status/variants/alt/tags/metadata), upload local, filtres/recherche/pagination/copy URL, sélection réutilisable via `MediaPicker`.
- **Workflow éditorial** : statuts unifiés `draft|review|scheduled|published|archived|removed`, actions rapides dans les listes, publication planifiée via `publishedAt`.
- **Blog bloc par bloc** : `contentBlocks` (heading/paragraph/image/quote…), rendu côté page blog, sidebar “plus commentés” + “même rubrique”.
- **Taxonomies V2** : seeds front pour catégories service/projet/post + dropdown obligatoire dans les formulaires CMS.
- **Brand Center** : tokens de marque JSON, liens sociaux, logo/OG/fav via IDs média, application des CSS variables à `:root` au boot.

### Variables d’env (média) — V2
Dans ce repo, la médiathèque V2 est front-first (localStorage). Pour préparer V3 back-end/S3, prévoyez :

```env
# futur provider media
MEDIA_PROVIDER=local # local|s3
MEDIA_LOCAL_DIR=public/uploads
MEDIA_PUBLIC_BASE_URL=http://localhost:5173/uploads

# futur provider objet (V3)
S3_ENDPOINT=
S3_REGION=
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_PUBLIC_URL=
```

### Migration notes (V2)
- Clé storage contenu: `smove_cms_content_v2`.
- Nouvelles propriétés contenu: `publishedAt`, `coverAltText`, `viewsCount`, `commentsCount`, `contentBlocks`.
- Statuts enrichis avec `scheduled` et `removed`.
- Clé storage média: `smove_media_files_v2` avec schéma DAM simplifié.

### Seed V2 taxonomies
Les taxonomies de base sont seedées automatiquement au premier accès via la clé `smove_taxonomies_v2`.

### Roadmap V3 (prochaine étape)
- Passage storage CMS/média du front localStorage vers API persistante (Mongo).
- Endpoint public brand (`/api/public/brand`) avec cache HTTP et invalidation.
- Upload multipart serveur + génération variantes réelles (sharp/webp/avif/og).
- RBAC fin + audit trail + review workflow multi-utilisateurs.
## 8) V3 production-grade (ajouts)

### Sécurité
- RBAC action-based (`admin` / `editor` / `author` / `viewer`) côté API.
- Rate limit sur auth et endpoints sensibles.
- CSRF appliqué sur routes mutables CMS.
- Soft-delete posts (`status=removed`) à la place des suppressions physiques.
- Audit log Mongo (`AuditLog`) pour login/logout et mutations CMS.

### Observabilité
- Logging structuré avec `pino`.
- Endpoint de santé : `GET /api/health` (db, version, uptime).

### Performance CMS
- Pagination native de `GET /api/cms/posts?page=&limit=`.
- Endpoint `GET /api/cms/summary` pour agrégats dashboard.

### Qualité / CI
- Unit tests supplémentaires : validation Zod + mapping variantes media.
- Pipeline CI GitHub Actions : lint, typecheck, tests, build.

### Commandes utiles
```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run db:migrate:v3
```

### Documentation de prod
- `docs/v3-audit.md`
- `docs/migration-v3.md`
- `docs/release-checklist-v3.md`
- `docs/runbook.md`
- `docs/deployment.md`

## 9) V4 enterprise baseline

Une première base V4 multi-tenant est en place côté API:
- modèle `Tenant` et tenant par défaut,
- scoping tenant sur posts + logs d’audit,
- endpoint `GET /api/v1/brand` (feature flaggable),
- compatibilité maintenue sur `GET /api/public/brand`.

Documentation V4 détaillée:
- `docs/v4-enterprise-plan.md`


## 8) V5 (intelligente / composable / revenue-driven)

Un socle V5 modulaire est disponible derrière feature flags :
- personnalisation dynamique (`/api/v5/personalization/resolve`),
- recherche CMS transverse (`/api/cms/v5/search`),
- lead engine (`/api/public/forms/:type`),
- jobs/orchestration (`/api/cms/v5/jobs`, `/api/internal/jobs/run-next`).

Documentation associée:
- `README_V5.md`
- `docs/architecture-v5.md`
- `docs/personalization.md`
- `docs/integrations.md`
- `docs/security-enterprise.md`

---

## 8) V6 — Consolidation avancée CMS (implémenté)

### Ce que V6 apporte
- **Prévisualisation avant publication** pour posts/projets/services/events via route hash `#preview-{type}-{id}?token=...` avec token temporaire et à usage unique.
- **Workflow éditorial renforcé** : statuts `draft`, `review`, `scheduled`, `published`, `archived` (et `removed` interne), quick actions directement en liste.
- **Publication planifiée** : champ date/heure activé pour `scheduled`, et visibilité publique alignée sur `published` ou `scheduled` avec date atteinte.
- **UX CMS professionnalisée** : skeleton loading, sections de formulaire (contenu / média / publication / SEO blocks), états vides, confirmations de suppression, notifications uniformisées.
- **Médiathèque enrichie** : drag & drop multi-upload, recherche par nom, filtres type/folder/date, aperçu agrandi, affichage variantes (`thumb/sm/md/lg/og`), copie URL, action “Use as cover”.
- **Dashboard éditorial enrichi** : KPI par type de contenu + médias + utilisateur courant, blocs d’état (draft/review/scheduled/récents).

### Comment tester V6
1. Lancer le front (`npm run dev`) et ouvrir `#cms-dashboard` avec un compte admin.
2. Créer/éditer un contenu dans `posts`, `projects`, `services` ou `events`.
3. Cliquer **Preview** (liste ou formulaire édité), vérifier l’ouverture de la page avec badge **Draft preview** et la consommation unique du token.
4. Tester les quick actions (**Review**, **Publier**, **Archiver**) depuis les listes CMS.
5. Mettre un contenu en `scheduled` avec une date future et vérifier qu’il n’apparaît pas publiquement avant la date.
6. Dans la médiathèque :
   - déposer plusieurs fichiers,
   - filtrer par type/folder/date,
   - ouvrir un aperçu,
   - copier URL,
   - appliquer un média en cover d’un contenu.

### Limitations actuelles (V6)
- Le contenu CMS reste stocké côté client (`localStorage`) dans cette base de code.
- Les tokens preview sont sécurisés pour un mode SPA local (TTL + single-use), mais nécessitent un backend dédié pour un niveau production strict multi-utilisateur.
- Les pages publiques consomment partiellement le contenu CMS selon les sections existantes du front actuel.

### Future iterations
- Basculer le stockage contenu/media vers API persistance serveur.
- Centraliser previews et publication planifiée côté backend (jetons signés, invalidation serveur).
- Ajouter audit log éditeurs, versions d’articles et permissions fines par rôle.
- Introduire tests E2E CMS et monitoring orienté fiabilité opérationnelle.
