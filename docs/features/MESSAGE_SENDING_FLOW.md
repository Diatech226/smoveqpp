# Message Sending Flow

## Public submission

The public site submits contact forms to `POST /api/v1/contact`. The API trims and validates the payload before persistence:

- `name` is required.
- At least one of `email` or `phone` is required; a supplied email must be valid.
- `message` is required and must contain at least 10 characters.
- `subject` is optional.
- New records use `status: "new"` and `source: "site"` unless a more specific site context is supplied.

The API saves the message before attempting email delivery. A persistence failure returns an error and the site must not show success. If email is not configured or delivery fails after persistence, the API still returns success with a `warning` (`EMAIL_NOT_CONFIGURED` or `EMAIL_DELIVERY_FAILED`) and a message explaining that the submission was saved.

## CMS message management

Authenticated CMS users can use:

- `GET /api/v1/content/messages` to list and filter messages.
- `PATCH /api/v1/content/messages/:id` with `{ "status": "new" | "read" | "archived" }`.
- `DELETE /api/v1/content/messages/:id` (administrator permission required).

The legacy authenticated list route, `GET /api/v1/contact/admin/submissions`, remains available for compatibility.

## Email configuration

Configure either Resend or SMTP, plus the sender and destination:

```dotenv
CONTACT_TO_EMAIL=
EMAIL_FROM=
RESEND_API_KEY=
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
```

Resend is preferred when `RESEND_API_KEY`, `EMAIL_FROM`, and `CONTACT_TO_EMAIL` are present. SMTP is used otherwise when its host/user/password, `EMAIL_FROM`, and `CONTACT_TO_EMAIL` are present. With neither complete configuration, messages remain available in the CMS and delivery is marked `disabled`.

## Message contract

```json
{
  "id": "...",
  "name": "...",
  "email": "...",
  "phone": "...",
  "subject": "...",
  "message": "...",
  "status": "new",
  "source": "site",
  "createdAt": "...",
  "updatedAt": "..."
}
```

## Operational validation

1. Submit email-only and phone-only forms and confirm each record appears in the CMS.
2. Remove email provider configuration and confirm the API returns success with `EMAIL_NOT_CONFIGURED` after saving.
3. Configure Resend or SMTP and confirm `deliveryStatus` changes to `sent`.
4. Simulate provider failure and confirm the saved message remains listed with `deliveryStatus: "failed"`.
5. Confirm invalid/empty payloads return HTTP 400 and database failures do not produce a public success state.
