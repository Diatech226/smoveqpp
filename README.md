# Digital Communication Web App

Application React/Vite pour site vitrine + CMS interne.

## Lancement rapide

```bash
npm install
npm run dev
```

## Ajouts demandés (MongoDB + connexion via réseaux sociaux)

Cette base contient maintenant :

- Un backend d'authentification Express + MongoDB : `server/index.js`
- Auth locale (email/mot de passe) persistée en session MongoDB
- Auth sociale prête pour Google / GitHub / Facebook (si clés OAuth renseignées)
- Boutons de connexion sociale ajoutés aux pages Login et Register, sans refonte du design

## Configuration

1. Copier le fichier d'exemple :

```bash
cp .env.example .env
```

2. Remplir au minimum :

- `MONGO_URI`
- `SESSION_SECRET`
- `VITE_API_BASE_URL`

3. (Optionnel) Pour activer Google/GitHub/Facebook, remplir les variables `*_CLIENT_ID` et `*_CLIENT_SECRET`.

## Démarrer frontend + API

Terminal 1 (frontend):

```bash
npm run dev
```

Terminal 2 (API):

```bash
npm run dev:api
```

## Notes

- Le frontend consomme déjà `/api/auth/*` via `src/utils/authApi.ts`.
- Les callbacks OAuth redirigent vers `#cms-dashboard` en cas de succès.
- Aucun composant visuel existant n'a été supprimé : seuls des ajouts ciblés ont été faits.
