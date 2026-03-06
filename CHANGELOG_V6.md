# CHANGELOG V6 — Consolidation avancée CMS

## Added
- Route de preview sécurisée via hash (`#preview-{type}-{id}?token=...`) avec token temporaire à usage unique.
- Composant public `PreviewPage` avec rendu cover, contenu, galerie, vidéo et badge `Draft preview`.
- Dashboard CMS enrichi avec KPI (articles/projets/services/events/médias/utilisateur) + blocs éditoriaux (draft/review/scheduled/récents).
- Médiathèque améliorée: drag & drop multi-upload, filtres type/folder/date, recherche par nom, aperçu agrandi, action copier URL, action "Use as cover".
- UX CMS: skeleton loaders, empty states, confirmations claires, toasts homogènes, sections visuelles de formulaires.

## Changed
- Workflow éditorial exploitable depuis les listes grâce aux quick actions `Review`, `Publier`, `Archiver`.
- Gestion de `scheduled` (champ date activé selon statut + mise en visibilité publique uniquement quand date atteinte).
- Filtrage public du contenu CMS mis à jour pour inclure `published` et `scheduled` éligible.
- README documenté avec procédure de test V6, limitations et prochaines itérations.

## Notes
- Implémentation V6 cohérente avec l’architecture actuelle du repo (SPA React/Vite + stockage local).
- La sécurisation preview est adaptée au mode local actuel et doit être migrée backend en phase API persistante.
