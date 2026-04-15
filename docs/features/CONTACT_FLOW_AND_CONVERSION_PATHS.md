# Contact Flow & Conversion Paths

## Canonical conversion destination

The canonical destination for inquiry and conversion actions is now:

- `#/contact` (hash-router canonical public route)

The route resolver now maps `#/contact` (including query params) to the dedicated `ContactPage` instead of the home-section scroll behavior.

## CTA routing rules

### Routes that stay on detail/list pages

- "En savoir plus" on service cards keeps routing to service detail pages.
- Blog/article titles and cards keep routing to blog detail pages.
- Project cards keep routing to project detail pages.

### Contact/inquiry CTAs routed to Contact page

All inquiry-oriented CTAs now route to `#/contact` with optional context query params:

- Project detail CTA: "Démarrer un projet similaire"
- Project hub CTA: "Démarrer un projet"
- Service detail CTA (contract-driven primary CTA)
- Premium service page CTA blocks (Design/Branding + Web Development)
- Blog detail conversion CTA: "Nous contacter"
- Navigation contact buttons (desktop + mobile)
- Portfolio page CTA
- Hero contact CTA paths (route-safe handling)

## Contact context propagation

A lightweight context prefill system is implemented with query params:

- `source`: `project | blog | service | home | general`
- `slug`: canonical slug where available
- `label`: human-readable title

Example:

- `#/contact?source=project&slug=alpha-site&label=Alpha%20Site`

The Contact page reads those params and:

- shows a "Contexte" badge,
- prefills a relevant subject/message when fields are empty,
- includes source/context fields in the API payload.

## Contact form submission flow

1. User reaches `#/contact`.
2. Client-side validation runs (name/email/subject/message).
3. Submit button is disabled while request is in-flight (double-submit prevention).
4. Frontend posts to `${apiBaseUrl}/contact`.
5. Backend validates and sanitizes payload.
6. Submission is persisted in MongoDB.
7. Email sending is attempted.
8. Delivery status is updated on the persisted record (`sent` / `failed` / `disabled`).
9. API returns structured success/error for user feedback.

## Backend email + persistence reliability

### Validation/sanitization

Server-side validation enforces:

- name minimum length,
- valid email format,
- subject minimum length,
- message minimum length,
- normalization and max-length truncation.

Additional optional fields:

- `source`, `contextSlug`, `contextLabel`.

### Persistence model

`ContactSubmission` now includes:

- context fields (`contextSlug`, `contextLabel`),
- `deliveryStatus`,
- `deliveryError`,
- existing delivery metadata (`delivered`, `deliveryMode`, `requestId`).

### No-silent-loss behavior

Submissions are persisted first, then email is sent.

- On delivery success: submission is updated as `sent`.
- On delivery failure: submission is updated as `failed` with `deliveryError`, and API returns a clear error.

This ensures leads remain traceable even when the email provider is unavailable.
