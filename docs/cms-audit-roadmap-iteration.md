# Audit complet du CMS existant et roadmap d’itération

## 1) Diagnostic global (vue Lead Engineer + Product Designer)

Le dépôt contient un **CMS hybride** :
- une base backend Express/MongoDB déjà riche (auth, rôles, posts, multi-tenant, personnalisation V5, leads/jobs),
- un back-office frontend React/Tailwind visuellement avancé,
- mais une grande partie des opérations CMS côté front repose encore sur `localStorage`.

Conséquence : le produit est solide en démonstration et en vélocité UI, mais encore fragile pour une exploitation éditoriale multi-utilisateurs en production.

---

## 2) Architecture actuelle

### Backend (Express + Mongoose + Passport)

**Forces existantes**
- Serveur structuré avec middlewares sécurité de base : sessions Mongo, CSRF, rate limiting simple, CORS, OAuth social, audit logs.
- Modèles métier déjà en place : `User`, `Post`, `Tenant`, `AuditLog`, `AudienceSegment`, `ContentVariant`, `PersonalizationRule`, `Lead`, `Job`.
- API `posts` opérationnelle avec workflow de statuts, validation, pagination, soft-delete.
- Feature flags V5 (personnalisation, recherche globale, leads, jobs) permettant un rollout progressif.

**Points faibles structurels**
- Tout est concentré dans `server/index.js` (fichier monolithique), sans séparation route/controller/service/repository.
- Validation principalement manuelle (pas de couche de schéma dédiée type Zod/Joi).
- Peu de versioning contractuel explicite hors conventions d’URL.
- Peu de tests backend visibles, ce qui augmente le risque de régression lors de refactor.

### Frontend (React + Vite + hash routing)

**Forces existantes**
- UI riche et cohérente visuellement, avec un shell admin bien pensé (`AdminShell`, sidebar, topbar, tableaux, badges, quick actions).
- Barrière d’accès CMS présente côté UX (`cmsEnabled`, `isAuthReady`, `canAccessCMS`).
- Bibliothèque de composants UI large (Radix/shadcn-like), bonne base pour un design system.

**Points faibles structurels**
- Routage hash-based dans `App.tsx` devenu très dense (couplage fort navigation/logique sécurité/rendu).
- Dashboard CMS dépend d’un stockage local (`src/data/cmsContent.ts`, `src/data/media.ts`) au lieu d’un backend source of truth.
- Mismatch probable de contrat API auth (`{ data: { user, csrfToken } }` côté serveur vs parsing direct `{ user, csrfToken }` côté client), pouvant casser la session front.
- Gestion des rôles côté front trop restrictive (accès CMS réservé à `admin` uniquement dans `securityPolicy`, alors que le backend définit `admin/editor/author/viewer`).

### Base de données

- MongoDB utilisée avec schémas Mongoose complets et index utiles.
- Multi-tenant prévu via `tenantId` + résolution tenant (query/header/host).
- Données CMS réellement persistées : surtout `posts` (+ modules V5).
- Données CMS front (services/projects/events/media/settings) : non persistées serveur actuellement.

---

## 3) Modules existants

### Modules backend existants
1. Authentification locale + OAuth (Google/GitHub/Facebook).
2. Session server-side + CSRF.
3. RBAC backend sur actions (`postRead`, `postCreate`, etc.).
4. Gestion des posts CMS (CRUD + statuts + pagination).
5. Branding public (`/api/public/brand`, `/api/v1/brand`).
6. Personnalisation V5 (segments, variants, rules, resolver).
7. Recherche globale V5.
8. Capture de leads V5 + scoring.
9. Job queue simple V5 + runner endpoint.
10. Audit logs.

### Modules frontend existants
1. Site public marketing (home/services/projects/blog/contact).
2. Auth pages (login/register) + redirections de sécurité.
3. CMS Dashboard multi-sections (overview, posts, services, projects, events, media, taxonomies, users, settings).
4. CRUD local rapide pour contenus non-post.
5. Media library locale (upload base64, preview, suppression).
6. UI admin structurée et réutilisable.

---

## 4) Modules manquants / incomplets

1. **API CMS complète** pour `services/projects/events/media/taxonomies/settings/users` (aujourd’hui partiel et surtout local côté front).
2. **Synchronisation front-back réelle** pour le dashboard (lecture/écriture API, gestion erreurs, retries).
3. **RBAC aligné de bout en bout** (front et back) avec permissions fines par rôle.
4. **Workflow éditorial complet** (review assignée, scheduling robuste, historique versionné, rollback).
5. **Media storage production-ready** (S3/Cloudinary/GCS + métadonnées + optimisation serveur).
6. **Observabilité & QA** (tests API, e2e admin, monitoring applicatif, traces).
7. **Architecture backend modulaire** (découpage domaine, services, validation partagée).
8. **Design system gouverné** (tokens unifiés, état des composants, guidelines accessibilité formelles).

---

## 5) Ce qui est stable vs instable

### Stable / prêt à capitaliser
- API auth/sessions/OAuth et sécurisation de base.
- Modélisation Mongoose pour plusieurs domaines stratégiques.
- CRUD posts backend.
- Shell UI admin et langage visuel premium.
- Fondations multi-tenant et feature flags.

### Incomplet / risqué
- Couverture CMS serveur incomplète (forte dépendance `localStorage`).
- Contrats API potentiellement incohérents front/back.
- Accès CMS front non aligné avec RBAC backend.
- Pas de stratégie explicite de migration des données locales vers Mongo.
- Monolithe backend difficile à maintenir à mesure que les modules augmentent.

### À refactoriser en priorité
1. Contrats API auth/CMS (normalisation du format de réponse).
2. Couche data frontend CMS (remplacer `localStorage` par client API + cache).
3. `server/index.js` vers architecture modulaire.
4. Routage de `App.tsx` (router explicite + guards dédiés).
5. RBAC partagé (matrice centralisée, typée, testée).

---

## 6) Priorisation par impact business

### Impact élevé / effort modéré (quick wins)
1. **Aligner contrat auth front-back** (fiabilise login/session immédiatement).
2. **Exposer API read-only pour services/projects/events/media** (passage progressif vers données serveur).
3. **RBAC front aligné backend** (`admin/editor/author/viewer` visible dans UX).
4. **Centraliser erreurs/toasts API dans CMS** (améliore perception qualité).

### Impact élevé / effort élevé
1. Migration complète CRUD CMS non-post vers backend.
2. Stockage média externalisé + pipeline variants.
3. Refactor backend modulaire + tests.

### Impact moyen
1. Améliorations UX navigation admin et éditeur contenu.
2. Design system minimal gouverné.
3. Dashboard analytics avancé.

---

## 7) Roadmap Fonctionnelle (MVP → V2 → V3)

## 8) Roadmap Design / UX (cohérence, navigation, édition)

> Format imposé ci-dessous.

### Sprint 1:

**Objectifs**
- Sécuriser le socle auth + contrats API.
- Démarrer la bascule CMS local → backend sur un périmètre pilotable.
- Réduire les risques de régression par tests ciblés.

**Tâches backend**
- Standardiser la réponse API auth/CMS (enveloppe unique documentée).
- Ajouter endpoints CMS read/write minimum pour `services` et `projects`.
- Ajouter tests d’intégration sur auth + posts + nouveaux endpoints.
- Introduire structure modulaire légère (`routes/`, `controllers/`, `services/`) sans big-bang.

**Tâches frontend**
- Corriger parsing API auth et gestion CSRF.
- Introduire une couche `cmsApiClient` (fetch + typage + erreurs normalisées).
- Remplacer `localStorage` par API pour `posts` (si pas déjà branché) + `services/projects` en lecture.
- Afficher permissions UI selon rôle (`admin/editor/author/viewer`).

**Tâches design**
- Audit d’ergonomie dashboard (navigation latérale, densité info, hiérarchie CTA).
- Standardiser composants d’état : loading/empty/error/success.
- Uniformiser feedback action (toasts, confirmations, actions destructives).

### Sprint 2:

**Objectifs**
- Finaliser CMS persistant pour principaux modules contenus.
- Professionnaliser médiathèque et workflow éditorial.

**Tâches backend**
- CRUD complet `events`, `taxonomies`, `brand settings`.
- API média (métadonnées + upload vers provider objet, URLs signées si besoin).
- Historique d’édition minimal (audit + snapshots simples).
- Harden sécurité : validation schéma centralisée, limites payload, logs structurés.

**Tâches frontend**
- Brancher `events/taxonomies/settings` sur API.
- Implémenter éditeur de contenu amélioré (blocs, preview fiable, autosave).
- Connecter médiathèque réelle (upload async, progression, erreurs, réessai).
- Ajouter filtres avancés + recherche globale connectée API.

**Tâches design**
- Refonte UX de l’édition (focus mode, structure en panneaux, raccourcis).
- Révision navigation CMS (groupes fonctionnels, breadcrumbs, titres de contexte).
- Amélioration accessibilité (contrastes, focus states, tailles click targets).

### Sprint 3:

**Objectifs**
- Passer en mode scale: robustesse, observabilité, multi-tenant avancé.
- Préparer V3 orienté productivité et gouvernance.

**Tâches backend**
- Finaliser découpage modulaire complet + conventions d’architecture.
- Ajouter tests e2e API critiques + contrats OpenAPI.
- Renforcer multi-tenant (isolation, quotas, policies, admin tenant).
- Industrialiser jobs (retry strategy, DLQ simplifiée, métriques d’exécution).

**Tâches frontend**
- Introduire routing structuré (React Router) et guards dédiés.
- Ajouter pages Users/Roles réelles (invitation, assignation rôles, audit trail).
- Dashboard analytics (funnel contenu, conversion leads, performance éditoriale).
- Optimisations performance (code splitting CMS, cache invalidation, pagination serveur).

**Tâches design**
- Mettre en place un **design system minimal** :
  - tokens (couleurs, typo, spacing, radius, elevation),
  - bibliothèque de composants admin validés,
  - règles d’usage (états, erreurs, densité, responsive).
- Créer un kit de patterns CMS (tableaux, formulaires longs, éditeur, modales).
- Harmoniser UI public + admin sur une même grammaire visuelle.

---

## 9) Dépendances techniques clés

- Migration données `localStorage` vers Mongo (script import / plan de cutover).
- Contrats API stables + versionnement.
- Choix provider média (coûts, CDN, transformation d’images).
- Stratégie tests (unitaires + intégration + e2e).
- Monitoring (logs structurés, alerting health/job failures).

---

## 10) Quick wins recommandés (2–5 jours)

1. Corriger contrat auth et robustesse session côté front.
2. Unifier la matrice permissions front/back dans un seul module partagé.
3. Ajouter table “errors + retries” pour uploads média UX.
4. Écrire runbook opérationnel CMS (incidents auth, DB down, jobs bloqués).
5. Mettre en place checklist de release CMS (smoke tests obligatoires).

---

## 11) Risques techniques

1. **Risque de perte de données** lors de la migration localStorage → DB.
2. **Risque de régression auth** si contrat API modifié sans compatibilité transitoire.
3. **Risque de dette structurelle** si on continue à enrichir `server/index.js` sans modularisation.
4. **Risque UX** : incohérences d’état (données locales vs serveur) pendant phase hybride.
5. **Risque sécurité** : RBAC partiellement divergent front/back (affichage vs autorisation réelle).

---

## 12) Dette technique actuelle

- Monolithe backend.
- Routage hash custom volumineux dans `App.tsx`.
- Couche data CMS frontend non industrialisée.
- Faible couverture de tests end-to-end des parcours admin.
- Gouvernance design system non formalisée.

---

## 13) Recommandations architecture (cible réaliste)

1. **Backend hexagonal léger**
   - `routes -> controllers -> services -> repositories`.
   - validation schéma entrée/sortie.
   - policies RBAC centralisées.

2. **Frontend orienté domain modules**
   - `features/cms/{posts,media,settings,...}`.
   - `api-client` commun + cache (TanStack Query recommandé).
   - route guards découplés de la vue.

3. **Contrat API gouverné**
   - OpenAPI source de vérité.
   - tests de contrat.
   - stratégie de dépréciation d’endpoint.

4. **Design system minimal opérationnel**
   - tokens + composants validés + documentation usage.
   - revue UX trimestrielle basée sur métriques (temps de publication, taux erreur formulaire, adoption modules).

5. **Plan de migration progressif**
   - mode hybride temporaire maîtrisé,
   - scripts de migration idempotents,
   - feature flags par module pour rollback sécurisé.
