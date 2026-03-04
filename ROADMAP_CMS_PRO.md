# Roadmap CMS professionnel — Agence de communication

Ce document complète le `README.md` en transformant l’état actuel du projet en feuille de route opérationnelle pour un CMS de niveau production, avec une gouvernance stricte des contenus, des images et des assets de marque.

## 1) Cibles produit

- Piloter **site vitrine + blog** depuis un seul back-office.
- Industrialiser la production de contenus (workflow éditorial, rôles, validation).
- Mettre en place une **médiathèque professionnelle (DAM léger)** avec variantes d’images et règles de qualité.
- Centraliser les **assets de marque** : couleurs, typographies, logos, icônes, gabarits.
- Garantir sécurité, performance et observabilité.

## 2) Architecture fonctionnelle cible

### 2.1 Modules CMS à implémenter
1. **Dashboard** : KPI, tâches éditoriales, contenus à valider, alertes.
2. **Contenus** : pages du site, projets, articles, catégories, auteurs.
3. **Médiathèque** : bibliothèque d’images/vidéos/docs avec métadonnées.
4. **Brand Center** : gestion des assets (logo, palette, tokens, documents de charte).
5. **Workflow** : brouillon, revue, planification, publication.
6. **SEO & Distribution** : méta, OG, sitemap, partage social.
7. **Administration** : rôles, permissions, journaux d’audit, paramètres.

### 2.2 Modèle de données (version cible)
- `posts` : titre, slug, statut, contenu, excerpt, auteur, taxonomie, SEO, OG, date publication.
- `projects` : nom, secteur, description, galerie, résultats, tags, statut.
- `pages` : blocs de contenu pour sections vitrines.
- `media` : fichier source, formats dérivés, alt, crédits, droits, tags, dimensions, hash.
- `brand_assets` : logos, icônes, palettes, variables design, templates.
- `categories` / `tags` / `authors`.
- `workflows` / `revisions` / `audit_logs`.

## 3) Partie stock d’images (médiathèque pro)

## 3.1 Objectif
Créer une médiathèque structurée pour éviter les pertes de qualité, accélérer la production web/blog et maîtriser les droits d’usage.

### 3.2 Arborescence recommandée
- **Médiathèque**
  - `Brand/` (logos, pictos, fonds officiels)
  - `Blog/` (hero, inline, thumbnails)
  - `Projects/` (avant/après, mockups, captures)
  - `Social/` (formats réseaux)
  - `Archive/` (anciens visuels, non publiés)

### 3.3 Métadonnées obligatoires
- Nom lisible + slug.
- `alt_text` (obligatoire pour accessibilité).
- Crédit/source/licence.
- Date de création et propriétaire interne.
- Tags métier (`seo`, `webdesign`, `branding`, etc.).
- Statut (`approved`, `draft`, `expired-rights`).

### 3.4 Pipeline image
1. Upload master (source haute qualité).
2. Génération automatique des variantes.
3. Compression + optimisation web.
4. Validation humaine (qualité visuelle + conformité brand).
5. Publication et distribution CDN.

## 4) Formats d’images à supporter

### 4.1 Formats fichiers
- **WebP** : format par défaut web (bon ratio qualité/poids).
- **AVIF** : variante moderne pour navigateurs compatibles.
- **JPEG** : fallback photo.
- **PNG** : transparence/visuels UI.
- **SVG** : logos/icônes vectoriels.

### 4.2 Variantes automatiques par usage
- **Hero site/blog** : 1920, 1600, 1280 px (ratio 16:9).
- **Cover article** : 1200x630 (Open Graph) + 800x450.
- **Carte blog/projet** : 640x360 + 480x270.
- **Miniature** : 320x180.
- **Social** : 1080x1080, 1080x1350, 1200x630.

### 4.3 Règles qualité/performance
- Poids cible :
  - hero < 300 KB,
  - carte < 120 KB,
  - miniature < 60 KB.
- `srcset` + `sizes` pour responsive.
- Lazy-load hors viewport.
- `alt` obligatoire + légende optionnelle.
- Interdiction de publier un média sans droits renseignés.

## 5) Espace de gestion des assets (couleurs et brand system)

## 5.1 Brand Center dans le CMS
Créer une section dédiée `Brand Center` avec :
- **Palette couleurs** (primaire, secondaires, neutres, états).
- **Typographies** (titres, texte, fallback).
- **Tokens UI** (rayons, ombres, espacements, animations).
- **Logos** (clair/sombre, monochrome, interdits d’usage).
- **Icônes et illustrations** validées.

### 5.2 Données à gérer
- `brand_tokens` (JSON versionné).
- `brand_guidelines` (règles d’usage).
- `asset_collections` (packs téléchargeables).
- Historique des modifications + date d’entrée en vigueur.

### 5.3 Synchronisation front
- Exposer tokens via endpoint (`/api/cms/brand/tokens`).
- Générer automatiquement variables CSS (`:root`) pour site + blog.
- Contrôle de régression visuelle lors des changements de palette.

## 6) Roadmap d’implémentation (16 semaines)

### Phase 1 (S1-S4) — Fondations persistance
- API CMS (`posts`, `projects`, `media`, `pages`).
- CRUD complet + validation schéma.
- Upload média + stockage + métadonnées minimales.
- Migration des données `localStorage` vers MongoDB.

### Phase 2 (S5-S8) — Médiathèque et formats avancés
- Génération automatique WebP/AVIF/JPEG + tailles standards.
- Dossiers, tags, recherche, filtres.
- Alt text et droits obligatoires avant publication.
- Intégration CDN + cache.

### Phase 3 (S9-S11) — Workflow éditorial pro
- Rôles `admin/editor/author/viewer`.
- États `draft/review/scheduled/published/archived`.
- Relectures, commentaires internes, versions.
- Journal d’audit complet.

### Phase 4 (S12-S14) — Brand Center et cohérence site/blog
- Gestion centralisée couleurs/tokens/assets.
- Publication des tokens vers frontend.
- Uniformisation composants site + blog via design tokens.
- Contrôles accessibilité (contraste, tailles typo).

### Phase 5 (S15-S16) — Qualité production & gouvernance
- Tests E2E (auth, création article, publication, média).
- Supervision (logs, erreurs, performance).
- Process backup/restauration + politiques de conservation.
- Documentation runbook + formation équipe éditoriale.

## 7) Backlog prioritaire détaillé

### Must-have
- CRUD persistant site/blog/projets.
- Médiathèque avec variantes automatiques.
- Workflow de publication et permissions fines.
- Brand Center + design tokens synchronisés.

### Should-have
- Calendrier éditorial.
- Prévisualisation multi-supports (desktop/mobile/social).
- Templates d’articles et de pages projets.

### Could-have
- IA d’assistance (suggestions titres/meta/alt).
- Connecteurs réseaux sociaux/newsletter.
- Multi-langue multi-site.

## 8) KPI de réussite

- 100% des contenus pilotés via CMS (plus de dépendance aux fichiers statiques).
- 100% des images publiées avec `alt` + droits renseignés.
- Diminution du poids moyen image > 40% (optimisation formats modernes).
- Temps moyen de publication d’un article réduit de 30%.
- Aucune publication hors workflow validé.

## 9) Décisions techniques recommandées

- Conserver React/Vite côté front, Express/Mongo côté API (aligné avec l’existant).
- Ajouter un service dédié image processing (Sharp) pour les dérivés.
- Stockage média objet (S3/R2/MinIO) + CDN.
- Versionner tokens de marque et imposer revue avant diffusion.
- Prévoir API headless propre pour futures intégrations omnicanales.
