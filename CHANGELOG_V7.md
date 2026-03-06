# CHANGELOG V7 — Stabilisation avancée

## Bugs corrigés
- CMS: validation de slug renforcée (`required` + pattern kebab-case).
- CMS: protection contre publication rapide sans cover + alt text.
- CMS: message explicite si génération de slug impossible.
- CMS Media: copie URL avec gestion d'erreur utilisateur.
- CMS Media: action "Use as cover" complète automatiquement `coverAltText` si manquant.

## Documentation / environnement
- `.env.example` entièrement restructuré avec sections explicites (actif vs réservé/futur).
- README mis à jour pour refléter l'état réel du code (Vite/React + Express/Mongo).
- Ajout d'un rapport dédié de stabilisation V7.

## Vérifications exécutées
- `npm run build` (échec environnement: dépendance `vite` indisponible localement).
- `npm run lint` non exécutable dans le même contexte (install npm bloquée par politique registry 403).
