# Admin Gallery Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Save each newly selected Admin Gallery image to object storage and create its associated `galleries` database record.

**Architecture:** Keep `ImageUpload` unchanged: it provides either an existing URL or a browser `File`. The Gallery upload page converts a `File` to a stored URL through the existing authenticated multipart upload endpoint, then submits a JSON Gallery payload through the existing Gallery service. No public-gallery data, backend route, database schema, or migration changes are needed.

**Tech Stack:** Next.js 16, React 19, TypeScript, React Hook Form, Zod 4, Axios, existing Go/Fiber upload and Gallery APIs.

## Global Constraints

- Keep `frontend/src/data/gallery.json` and the public Gallery page unchanged.
- Do not backfill or migrate static Gallery images.
- Change only the Admin Gallery upload flow for newly selected files.
- A pre-existing string image URL must bypass `/api/v1/admin/upload` and be saved unchanged.
- Upload files as multipart form data under the exact field name `file`.
- If upload fails, do not call `POST /api/v1/admin/gallery`; use the existing form error handler.
- If Gallery creation fails after a successful upload, retain the storage object and `Media` record, consistent with current Event and Monk behavior.

---

## File Structure

- `frontend/src/schemas/gallery.schema.ts` — defines Gallery form values; must accept the `File` emitted by `ImageUpload` as well as a URL string.
- `frontend/src/app/[locale]/admin/gallery/upload/page.tsx` — resolves a selected file to a stored URL and persists the normalized Gallery payload.
- `frontend/src/components/admin/ImageUpload.tsx` — unchanged reusable selector; it continues to return `File | string` to its parent.
- `backend/internal/handlers/upload_handler.go` and `backend/internal/handlers/gallery_handler.go` — unchanged existing endpoints used by the frontend flow.

### Task 1: Allow a selected local file in Gallery form validation

**Files:**
- Modify: `frontend/src/schemas/gallery.schema.ts`

**Interfaces:**
- Consumes: `File | string` value from `ImageUpload` through React Hook Form.
- Produces: `GalleryFormData["image_url"]` typed as `string | File`, requiring a non-empty URL or selected file.

- [ ] **Step 1: Update the Gallery schema so it matches the ImageUpload contract**

Replace the `image_url` validator with the same URL-or-file shape already used in `event.schema.ts` and `monk.schema.ts`:

```ts
export const gallerySchema = z.object({
  image_url: z
    .union([z.string().min(1, "Please select an image"), z.instanceof(File)])
    .refine((value) => value instanceof File || value.length > 0, {
      message: "Please select an image",
    }),
  caption: multiLangSchema("Caption").optional(),
  category_id: z.number().nullable().optional(),
  display_order: z.number(),
  is_active: z.boolean(),
});
```

Do not change the category schema or any public Gallery data.

- [ ] **Step 2: Type-check the schema consumer before changing submission behavior**

Run: `cd frontend && npx tsc --noEmit`

Expected: exit code `0`; the current page cast allows this contract update to type-check before Task 2 replaces that cast with a normalized payload.

- [ ] **Step 3: Commit the validation contract**

```bash
git add frontend/src/schemas/gallery.schema.ts
git commit -m "fix: accept gallery upload files"
```

### Task 2: Upload the selected file before creating the Gallery record

**Files:**
- Modify: `frontend/src/app/[locale]/admin/gallery/upload/page.tsx`

**Interfaces:**
- Consumes: `GalleryFormData` where `image_url: string | File` from Task 1.
- Consumes: `api.post<ApiResponse<{ url: string }>>("/admin/upload", formData)`; the backend expects `FormData` field `file` and returns `{ data: { url: string } }`.
- Produces: `galleryAdminService.create()` input where `image_url: string`, creating a `galleries` row through `POST /api/v1/admin/gallery`.

- [ ] **Step 1: Import the shared API client and response type**

Add these imports alongside the existing service and type imports:

```ts
import api from "@/services/api";
import type { ApiResponse, MultiLangText } from "@/types/api";
```

Replace the existing `MultiLangText`-only import so the page has both types from the same module.

- [ ] **Step 2: Add a page-local helper that uploads exactly one Gallery file**

Place this helper above `GalleryUploadPage`:

```ts
async function uploadGalleryImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<ApiResponse<{ url: string }>>(
    "/admin/upload",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  const imageUrl = response.data.data?.url;
  if (!imageUrl) {
    throw new Error("Upload response did not include an image URL");
  }

  return imageUrl;
}
```

This call uses the existing Axios instance, preserving the admin authorization token and refresh behavior.

- [ ] **Step 3: Normalize `image_url` before invoking the Gallery create service**

Replace the current unsafe cast and direct create call in `onSubmit` with:

```ts
const imageUrl =
  data.image_url instanceof File
    ? await uploadGalleryImage(data.image_url)
    : data.image_url;

await galleryAdminService.create({
  image_url: imageUrl,
  caption: data.caption,
  category_id: data.category_id,
  display_order: data.display_order,
  is_active: data.is_active,
});
```

Keep the existing `try`/`catch`/`finally`, `handleApiError(err, setError)`, success toast, and redirect. This guarantees that an upload failure enters the catch block before any Gallery create request is issued.

- [ ] **Step 4: Type-check the normalized flow**

Run: `cd frontend && npx tsc --noEmit`

Expected: exit code `0`, with no `File` value passed to `galleryAdminService.create`.

- [ ] **Step 5: Commit the upload-to-record flow**

```bash
git add 'frontend/src/app/[locale]/admin/gallery/upload/page.tsx'
git commit -m "fix: persist uploaded gallery images"
```

### Task 3: Verify the admin flow against the running API

**Files:**
- Verify: `frontend/src/app/[locale]/admin/gallery/upload/page.tsx`
- Verify: `frontend/src/components/admin/ImageUpload.tsx`
- Verify: `backend/internal/handlers/upload_handler.go`

**Interfaces:**
- Consumes: an authenticated Admin Gallery session and a local image no larger than 5 MB.
- Produces: a stored image URL, its `Media` record, and one active Gallery record returned by `GET /api/v1/admin/gallery`.

- [ ] **Step 1: Run static checks**

Run: `cd frontend && npx tsc --noEmit && npm run lint`

Expected: both commands exit `0`.

- [ ] **Step 2: Exercise file upload in the admin UI**

Open `http://localhost:3001/th/admin/gallery/upload` while authenticated. Select a local PNG or JPEG under 5 MB, leave **เปิดใช้งาน** enabled, then submit.

Expected network sequence:

```text
POST /api/v1/admin/upload        multipart/form-data; field "file"
200 { "data": { "url": "<stored URL>" } }
POST /api/v1/admin/gallery       application/json; image_url is that stored URL
```

Expected UI result: success toast followed by navigation to `/th/admin/gallery`.

- [ ] **Step 3: Confirm the database-backed Gallery API includes the new item**

While authenticated, request:

```text
GET http://localhost:3001/api/v1/admin/gallery?limit=100
```

Expected: response `data` contains the new active Gallery record and its `image_url` is the URL returned by the upload request. The list count can be less than `100`; the current backend does not apply the `limit` parameter.

- [ ] **Step 4: Confirm the media library can reuse the stored URL**

Reopen the Gallery upload page, open `ImageUpload`'s media-library selector, and verify the new image is visible and selectable. Select it and save another Gallery record.

Expected: the second save sends only `POST /api/v1/admin/gallery`; it does not send `POST /api/v1/admin/upload` because the form receives an existing string URL.

## Plan Self-Review

- Spec coverage: Tasks 1 and 2 implement the selected-file-to-storage-to-Gallery-record flow; Task 3 verifies API ordering, database visibility, and reusable media selection. The static public Gallery source and migration exclusions are explicit global constraints.
- Type consistency: `GalleryFormData.image_url` is `string | File`; `uploadGalleryImage` always returns `Promise<string>`; the Gallery create payload always receives `image_url: string`.
- No backend change is planned because `/admin/upload` already validates, stores, and returns an image URL, while `/admin/gallery` already creates the database record.
