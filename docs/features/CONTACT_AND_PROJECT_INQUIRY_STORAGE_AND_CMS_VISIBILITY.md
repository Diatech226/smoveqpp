# Contact and project inquiry storage + CMS visibility

## Canonical storage model
- All public inquiry submissions are stored in MongoDB `ContactSubmission` documents.
- Core fields: `name`, `email`, `phone`, `subject`, `message`, `source`, `contextSlug`, `contextLabel`, `createdAt`.
- Delivery tracking fields are also persisted for reliability: `delivered`, `deliveryMode`, `deliveryStatus`, `deliveryError`, `requestId`.

## Forms feeding this model
- Public contact page (`/contact`) always submits to API `/contact`.
- CTA-driven flows (project/service/blog) pass source/context through URL params, then into payload.
- All variants use one endpoint and one repository path (`ContactService.submit -> MongoContactSubmissionRepository.create`).

## CMS read/display path
- CMS reads authoritative lead data from `/contact/admin/submissions`.
- Endpoint is admin-protected (`requireAuthenticated + USER_MANAGE`).
- CMS section `Contacts / Leads` displays:
  - identity (name/email)
  - subject
  - source + context label
  - delivery status
  - created date
  - message preview
- Filtering supported by query text, source, and delivery status.

## Success/error behavior
- Public success is shown only when API returns success **and** `submissionId` exists.
- If persistence fails: API returns `CONTACT_PERSISTENCE_FAILED` (500), UI shows an error.
- If email delivery fails after persistence: API returns `CONTACT_EMAIL_FAILED` (502), UI shows an error and no fake success state.

## Refresh/count source of truth
- CMS fetches leads with `cache: no-store` and server `Cache-Control: no-store`.
- Summary counts (`total`, `received`, `sent`, `failed`, `disabled`) come from backend aggregation over stored records.
- Contacts section refresh action re-fetches authoritative backend data and updates list + counts atomically.
