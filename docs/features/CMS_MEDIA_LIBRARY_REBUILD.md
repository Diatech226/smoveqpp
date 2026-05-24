# CMS Media Library Rebuild

## Media architecture
- Canonical media contract is normalized on both API route and CMS client.
- CMS reads media from authenticated endpoint, renders with resolver, and uses `media:<id>` references for cross-module reuse (blog, projects, services, page content, settings).
- Degraded mode: read-only cache is acceptable for display, but writes must remain disabled when backend is unavailable.

## API endpoints
- `GET /api/v1/content/media`
- `POST /api/v1/content/media/upload` (multipart/form-data, `file` field)
- `PATCH /api/v1/content/media/:id`
- `DELETE /api/v1/content/media/:id` (archive-safe)
- `GET /api/v1/content/public/media`
- `GET /uploads/:filename`

## Upload flow
1. Select or drop file.
2. Validate MIME and size in CMS before upload.
3. Send FormData payload to upload endpoint (never force `Content-Type`).
4. Receive canonical media response.
5. Refetch media list.
6. Only display upload success if uploaded media exists in refreshed list.

## Canonical media object contract
```json
{
  "id": "string",
  "name": "string",
  "label": "string",
  "filename": "string",
  "type": "image",
  "mimeType": "image/jpeg",
  "size": 12345,
  "url": "https://smoveapi-1.onrender.com/uploads/file.jpg",
  "publicPath": "/uploads/file.jpg",
  "alt": "",
  "caption": "",
  "createdAt": "",
  "updatedAt": ""
}
```

## Thumbnail resolver
- Supports absolute URL, `media.url`, `media.publicPath`, `/uploads/...`, `uploads/...`, `media.filename`, and `media:<id>` references.
- Converts API-hosted files to absolute URL with API origin.
- Rejects unresolved `media:<id>` without match, raw blob URLs, and empty paths.

## Degraded mode rules
- Never overwrite backend media set with empty local arrays.
- Never sync degraded cache as source of truth.
- If API is unavailable, reads can use local snapshot, but upload/update/delete controls must be disabled.

## Validation checklist
- Upload image succeeds and appears after immediate list refresh.
- Thumbnail renders from resolver URL.
- Refresh keeps item visible.
- Search/filter/sort operate over normalized media list.
- Copy URL and `media:<id>` work.
- Archive/delete obeys usage safeguards.
- Broken images expose debug URL in CMS logs/UI.
