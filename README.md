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
- MongoDB accessible (local ou distant)

### Installation
```bash
npm install
```

### Variables d'environnement
1) Copier le template :
```bash
cp .env.example .env
```
2) Renseigner au minimum :
- `MONGO_URI`
- `SESSION_SECRET`
- `VITE_API_BASE_URL`
- `CLIENT_ORIGIN`

### Démarrage
Terminal 1 (front) :
```bash
npm run dev
```

Terminal 2 (API auth) :
```bash
npm run dev:api
```

---

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

Variables prévues pour production/futur backend :
- `MEDIA_STORAGE`, `MEDIA_PUBLIC_BASE_URL`, `MEDIA_MAX_BYTES`, `MEDIA_MAX_FILES`
- `S3_*` pour stockage objet compatible.

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

### Prisma (notes)
Le repo ne contient pas de schéma Prisma actif. Si un pivot Prisma est engagé plus tard, variables déjà réservées dans `.env.example` :
- `DATABASE_URL`
- `DIRECT_DATABASE_URL`

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
