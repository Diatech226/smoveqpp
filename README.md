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

