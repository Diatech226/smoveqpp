# V5 Integrations & API ecosystem

## API versionnée / composable
- Branding V1 déjà disponible: `GET /api/v1/brand`.
- Endpoints V5 ajoutés:
  - personalisation: `/api/v5/personalization/resolve`
  - search CMS: `/api/cms/v5/search`
  - lead engine: `/api/public/forms/:type`
  - jobs orchestration: `/api/cms/v5/jobs`

## Connecteurs prêts à brancher
Les jobs `queued` peuvent piloter:
- CRM (routing lead chaud)
- emailing (welcome flows/campaign nurturing)
- analytics (enrichissement CTA/form)
- social (distribution post-publication)

## Eventing minimal
- `lead.received` émis dans la queue à la création d’un lead.
- Exécution via `POST /api/internal/jobs/run-next` (runner interne).

## Sécurité d’intégration
- Runner protégé via en-tête `X-Job-Token`.
- Endpoints CMS protégés par session+CSRF+RBAC.
