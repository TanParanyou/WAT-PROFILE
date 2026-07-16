# Admin Gallery Upload Design

## Goal

Save newly uploaded Admin Gallery images to object storage and the `galleries` database table so they become available through `GET /api/v1/admin/gallery` and the ImageUpload media library.

## Scope

- Keep `frontend/src/data/gallery.json` unchanged.
- Keep the public Gallery page unchanged; it continues to use its current static source.
- Do not backfill or migrate existing static Gallery images.
- Change only the Admin Gallery upload flow for newly selected files.

## Design

`ImageUpload` continues to expose either an existing image URL or a browser `File` to its parent form. The Gallery upload page becomes responsible for resolving a `File` before it creates a Gallery record:

1. When `image_url` is already a string URL, use it unchanged.
2. When `image_url` is a `File`, send it to `POST /api/v1/admin/upload` as `multipart/form-data` under the `file` field.
3. Read `data.url` from that response and use it as the Gallery record's `image_url`.
4. Send the normalized Gallery payload to `POST /api/v1/admin/gallery`.

The existing upload endpoint already validates image type and 5 MB size, stores the file with R2, and records an associated `Media` row. The existing Gallery create endpoint stores the image URL in `galleries`; no backend route or schema change is required.

## Data Flow

```
ImageUpload (File)
  -> POST /admin/upload (multipart/form-data)
  -> R2 + media row
  -> returned URL
  -> POST /admin/gallery (JSON with image_url)
  -> galleries row
  -> GET /admin/gallery
  -> ImageUpload media-library list
```

## Error Handling

- If `/admin/upload` fails, do not call `/admin/gallery`; surface the existing API error in the Gallery form.
- If Gallery creation fails after upload succeeds, retain the storage object and Media record. This matches the existing Event and Monk upload behavior and avoids introducing destructive cleanup without a reliable transaction across R2 and PostgreSQL.

## Verification

- Select a local image in Admin Gallery upload.
- Submit the form and confirm an upload request precedes Gallery creation.
- Confirm the Gallery creation request contains a string `image_url` returned by the upload endpoint.
- Confirm `GET /api/v1/admin/gallery` returns the new active Gallery record.
- Reopen ImageUpload's media library and confirm the URL is selectable.
