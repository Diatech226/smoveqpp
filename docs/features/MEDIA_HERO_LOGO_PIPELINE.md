# MEDIA / HERO / LOGO PIPELINE

## Media upload flow
1. CMS uploads base64 payload to `POST /api/v1/content/media/upload`.
2. API persists binary in uploads storage and stores media metadata in content state.
3. Stored media includes: `id`, `name`, `label`, `url` (`/uploads/...`), `mimeType`, `type`, `createdAt`.
4. Public and CMS media listings (`/api/v1/content/public/media` and `/api/v1/content/media`) expose persisted media.

## Media reference format
Supported forms:
- Full URL (`https://...`)
- API relative uploads path (`/uploads/...`)
- Media reference (`media:<id>`)

Public settings/page-content responses are now resolved so `media:<id>` is converted to the corresponding media URL.

## Hero slide flow
1. CMS hero editor stores hero fields in page-content.
2. Hero slide media refs can be `media:<id>`.
3. API public page-content now resolves hero media refs to URL fields before response.
4. Site hero reads resolved fields and displays first available slide immediately, then rotates via existing autoplay logic.

## Logo settings flow
1. CMS settings stores `siteSettings.brandMedia.logo` (often `media:<id>`).
2. API public settings resolves logo/media refs to URL before response.
3. Site navigation/footer render resolved logo URL with default fallback only when empty.

## API endpoints
- `GET /api/v1/content/public/media`
- `GET /api/v1/content/public/page-content`
- `GET /api/v1/content/public/settings`
- `POST /api/v1/content/media/upload`

## Validation checklist
- Upload media in CMS and confirm it appears in media library.
- Set hero slide to uploaded media and save page content.
- Refresh site and verify hero slide displays immediately.
- Configure multiple slides and verify rotation.
- Update logo in settings and verify site logo updates.
- Confirm no raw `media:<id>` string is used as `<img src>` or CSS background URL.
