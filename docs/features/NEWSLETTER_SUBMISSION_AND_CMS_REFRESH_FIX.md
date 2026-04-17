# Newsletter submission & CMS refresh reliability fix

## Canonical storage path

- Public form writes through `POST /api/v1/newsletter` (also `/api/newsletter`) into MongoDB collection `newsletter_subscribers` via `MongoNewsletterSubscriberRepository.upsertSubscription`.
- CMS reads from the same source through `GET /api/v1/newsletter/admin/subscribers`.

## Submission outcomes

- `created`: new DB row persisted.
- `reactivated`: existing unsubscribed row switched back to `active`.
- `already_active`: duplicate active subscriber (no write needed, existing persisted row is returned).
- Frontend now rejects malformed success payloads and shows an error (`NEWSLETTER_PERSISTENCE_UNCONFIRMED`) instead of fake success.

## CMS source of truth for listing/counters

- List, pagination, and summary counters (`total`, `active`, `unsubscribed`) come from backend newsletter API response.
- Counters are no longer inferred from stale/local data.

## Refresh behavior

- Newsletter admin GET responses are now `Cache-Control: no-store`.
- CMS and site newsletter fetch calls use `cache: 'no-store'` to force fresh network reads.
- Manual refresh and section load rehydrate both list and counters, and track last refresh timestamp.

## Observability safeguards

Server logs now include:

- `newsletter_subscription_received`
- `newsletter_subscription_created`
- `newsletter_subscription_reactivated`
- `newsletter_subscription_duplicate`
- `newsletter_admin_list_loaded`
- `newsletter_subscription_status_updated`

Email fields are redacted by the shared logger sanitizer.
