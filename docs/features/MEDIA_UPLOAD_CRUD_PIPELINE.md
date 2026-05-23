# MEDIA_UPLOAD_CRUD_PIPELINE

## Canonical flow

1. Any CMS file upload calls `uploadMedia(file, metadata)` from `cms/apps/cms/src/api/mediaApi.ts`.
2. That function posts `multipart/form-data` to `POST /api/v1/content/media/upload`.
3. API persists the file to `/uploads/*`, saves a media record, and responds with one canonical media object.
4. CMS stores references in content as `media:<id>`.
5. Renderers resolve `media:<id>` against media list APIs before displaying.

## Canonical media object

```json
{
  "id": "string",
  "type": "image|video|document|audio|file",
  "name": "string",
  "label": "string",
  "filename": "string",
  "mimeType": "string",
  "size": 0,
  "url": "https://smoveapi-1.onrender.com/uploads/<filename>",
  "publicPath": "/uploads/<filename>",
  "alt": "string",
  "caption": "string",
  "createdAt": "iso-datetime",
  "updatedAt": "iso-datetime"
}
```

## Endpoints

- Public:
  - `GET /api/v1/content/public/media` (active/non-archived media)
- Protected:
  - `GET /api/v1/content/media`
  - `POST /api/v1/content/media/upload`
  - `POST /api/v1/content/media`
  - `PATCH /api/v1/content/media/:id`
  - `DELETE /api/v1/content/media/:id`

## Validation checklist

- No `blob:` values persisted.
- No raw unresolved upload strings persisted in content.
- All new uploads produce media records with IDs.
- Content save should only keep empty value, valid URL, or `media:<id>`.
