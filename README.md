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
