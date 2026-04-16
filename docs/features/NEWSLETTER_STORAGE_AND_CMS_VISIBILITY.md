# Newsletter Storage and CMS Visibility

## Objective

Implement a database-backed newsletter subscriber system with CMS visibility and admin-safe management.

## Data model

Collection: `newsletter_subscribers`

Fields:
- `email` (lowercased, unique, indexed)
- `status` (`active` | `unsubscribed`)
- `subscribedAt`
- `unsubscribedAt`
- `source` (footer/home/contact/etc.)
- `linkedUserId` (optional linkage with auth user records)
- `meta` (extensible envelope for source/history context)
- `createdAt`, `updatedAt`

## Storage rules

- Public newsletter submit endpoint: `POST /api/v1/newsletter`
- Payload: `{ email, source }`
- Email is normalized to lowercase and validated.
- Duplicate handling:
  - If subscriber already exists and is active → return successful duplicate-safe response (`action=already_active`), no duplicate row created.
  - If subscriber exists but unsubscribed → reactivate same record (`action=reactivated`).
  - If not found → create new row (`action=created`).

## CMS visibility

Admin endpoints:
- `GET /api/v1/newsletter/admin/subscribers` (admin/user-manage protected)
- `PATCH /api/v1/newsletter/admin/subscribers/:id` (`status` update, admin/user-manage protected)

Supported list filters:
- `q` (email search)
- `status` (`all|active|unsubscribed`)
- `source` (`all|footer|...`)

CMS section:
- Sidebar section: **Newsletter**
- Displays: email, status, source, subscribed date, linked account
- Includes loading/empty/error states
- Admin action: unsubscribe/reactivate

## Admin access rules

Newsletter admin endpoints are behind:
- authenticated session
- `user:manage` permission

No public list endpoint exists.

## User-account coherence

- Subscriptions attempt to resolve linked user by email.
- Newsletter rows expose linked user in CMS when available.
- This keeps newsletter and account identity coherent without duplicating user objects.

## Future extension path

- Add unsubscribe token workflow for public one-click opt-out.
- Add export endpoint for newsletter subscribers.
- Track consent version, locale, and campaign attribution in `meta`.
