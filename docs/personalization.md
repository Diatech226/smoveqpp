# V5 Personalization — Règles et variantes

## Feature flag
- `FEATURE_V5_PERSONALIZATION=true|false`

## Modèles
- `AudienceSegment`: segment éditorial/business.
- `ContentVariant`: variante d’un bloc (`hero`, `cta`, `page_block`).
- `PersonalizationRule`: règle priorisée qui associe un contexte à une variante.

## API
- `GET /api/v5/personalization/resolve`
  - Query: `entityType`, `entityKey`, `source`, `campaign`, `locale`, `country`, `device`, `userType`.
  - Retourne la variante retenue + la règle matchée.
- `POST /api/cms/v5/audience-segments`
- `POST /api/cms/v5/content-variants`
- `POST /api/cms/v5/personalization-rules`

## Exemples de règles
- `source=campaign-x` -> hero variant B.
- `tenant=brand-a` + `device=mobile` -> CTA compact.
- `locale=fr-FR` -> bloc localisé FR.

## Prévisualisation CMS
La prévisualisation est supportée via l’endpoint `resolve` en injectant les critères de segment en query params.
