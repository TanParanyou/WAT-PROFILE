# Media Library API Design

## Goal

Make uploaded files visible and manageable from the Admin Website Media Library, while keeping Gallery records separate from general Media records.

## Root Cause

`POST /api/v1/admin/upload` uploads the file to R2 and creates a `media` row. It does not create a `galleries` row. Conversely, `GET /api/v1/admin/gallery` queries only `galleries`, so it correctly returns no items for a file that was uploaded without creating a Gallery record.

The Website Media page is currently mock-only: `mock-media-store.ts` supplies static images, creates browser blob URLs, and does not call the API.

## Decision

Use Media as the shared image library. Do not create a Gallery record for every uploaded file: event, monk, and CMS images must not automatically become public Gallery entries.

1. Add protected admin Media endpoints:
   - `GET /api/v1/admin/media` lists Media rows, newest first.
   - `PUT /api/v1/admin/media/:id` updates Media metadata.
   - `DELETE /api/v1/admin/media/:id` removes the Media row.
2. Keep `POST /api/v1/admin/upload` as the single upload operation. It stores the object and Media row, then returns the full Media record as well as the existing `data.url` field for backward compatibility.
3. Replace the mock Zustand data flow on `/admin/website/media` with these endpoints. Uploading sends the selected file to `/admin/upload`, and the returned Media record is immediately prepended to the grid.
4. Change `ImageUpload` to load selectable images from `GET /admin/media`, rather than `GET /admin/gallery`.
5. Keep `GET /admin/gallery` exclusively for actual Gallery content. The Gallery creation form still posts a separate Gallery record after it uploads a selected file.

## Metadata

The existing `media.metadata` JSONB column stores the UI metadata (`alt` translations, `caption`, and `credit`); this requires no schema migration. The existing scalar `alt_text` remains untouched for compatibility. The Media UI shows filename, size, MIME type, and uploaded time from the actual response. It does not invent image dimensions when the backend has not measured them.

## Error Handling

- A failed upload leaves the existing grid unchanged and displays the standard API error.
- A failed metadata update preserves the open sidebar and its entered values.
- Deletion requires the project confirmation modal, then removes the item from the grid only after the API succeeds. Object-storage deletion is out of scope because the existing upload service exposes no safe delete operation; this change deletes the database record only.

## Verification

1. Upload a PNG from `/th/admin/website/media`; refresh and confirm it remains in the grid.
2. Confirm `GET /api/v1/admin/media` includes the uploaded Media record.
3. Open `ImageUpload` and confirm that same record is selectable.
4. Create a Gallery item through `/th/admin/gallery/upload`; confirm `GET /api/v1/admin/gallery` contains it.
5. Confirm uploading an Event, Monk, or CMS image does not create an unwanted Gallery entry.
