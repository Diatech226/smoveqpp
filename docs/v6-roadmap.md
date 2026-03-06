# V6 Roadmap — Consolidation CMS SMOVE

## Améliorations restantes après V6
- Persistance serveur complète des entités CMS (contenus + média + users) pour sortir du `localStorage`.
- Gestion des previews côté API avec jetons signés, révocation centralisée et historique des accès.
- Planificateur serveur (job) pour publication automatique robuste sans dépendre du client.
- Gestion avancée des médias vidéo (transcodage, poster automatique, contrôle taille/format).
- Normalisation des toasts/feedback UX via un provider global pour tout le back-office.

## V7 possible (ciblé et réaliste)
1. **API CMS versionnée** (`/api/cms/v1`) avec CRUD contenu/média.
2. **RBAC étendu** (`admin`, `editor`, `author`, `reviewer`) et permissions par action.
3. **Historique éditorial** : versions d’articles + comparaison + rollback.
4. **Calendrier éditorial** avec vue planning et collisions de publications.
5. **Observabilité** : logs structurés, métriques de latence API, alertes d’erreurs CMS.

## Zones techniques à surveiller
- **Routage hash SPA** : conserver la compatibilité des URLs publiques historiques.
- **Taille localStorage** : risque de saturation avec médias base64.
- **Synchronisation multi-onglet** : conflit potentiel d’édition sans verrouillage.
- **Qualité upload** : validation MIME/capacité pour éviter corruption et ralentissements UI.
- **Sécurité preview** : durcir la logique en backend dès migration API.
