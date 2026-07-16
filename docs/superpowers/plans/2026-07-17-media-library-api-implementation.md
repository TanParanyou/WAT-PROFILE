# Media Library API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist uploaded images as Media records and expose them in the Website Media Library and `ImageUpload` picker.

**Architecture:** The backend owns the `media` table and provides list/update/delete endpoints under `/admin/media`; `/admin/upload` remains the only object-storage upload endpoint. Frontend API types and a focused media service replace the mock store, and both media-selection UIs consume the same Media list.

**Tech Stack:** Go 1.24, Fiber v2, GORM/PostgreSQL, Next.js 16, React 19, TypeScript, Axios, Zustand.

## Global Constraints

- Do not create a Gallery record when a generic Media file is uploaded.
- Keep `POST /api/v1/admin/upload` response field `data.url` unchanged for existing consumers.
- Store `alt`, `caption`, and `credit` in the existing `media.metadata` JSONB field; no migration is required.
- Require `gallery` resource permissions for Media API access, matching the existing upload endpoint.
- Delete only the Media database row; R2-object deletion is out of scope.

---

## File Structure

- `backend/internal/services/media_service.go` — ordered Media queries and DB mutations.
- `backend/internal/handlers/media_handler.go` — HTTP parsing, UUID validation, and API responses.
- `backend/internal/handlers/upload_handler.go` — returns the created Media object in addition to `data.url`.
- `backend/internal/routes/routes.go` — protected `/admin/media` route registration.
- `frontend/src/types/entities.ts` — API `Media` and metadata types.
- `frontend/src/services/mediaService.ts` — typed Media API and multipart upload client.
- `frontend/src/stores/media-store.ts` — UI state that calls the Media service, replacing mock behavior.
- `frontend/src/app/[locale]/admin/website/media/page.tsx` — real API media grid and upload flow.
- `frontend/src/components/admin/website/MediaDetailsSidebar.tsx` — real metadata update/delete actions.
- `frontend/src/components/admin/website/MediaPickerModal.tsx` — API-backed picker state.
- `frontend/src/components/admin/ImageUpload.tsx` — uses the Media service for its existing-image library.

### Task 1: Add backend Media read/update/delete API

**Files:**
- Create: `backend/internal/services/media_service.go`
- Create: `backend/internal/handlers/media_handler.go`
- Modify: `backend/internal/routes/routes.go`
- Test: `backend/internal/services/media_service_test.go`

**Interfaces:**
- Produces `MediaService.List() ([]models.Media, error)`, `UpdateMetadata(id uuid.UUID, metadata map[string]interface{}) (*models.Media, error)`, and `Delete(id uuid.UUID) error`.
- Produces `GET|PUT|DELETE /api/v1/admin/media[/:id]`, each protected with existing `gallery` permissions.

- [ ] **Step 1: Write failing service tests**

Create `backend/internal/services/media_service_test.go` with an isolated PostgreSQL test DB configured by `DATABASE_URL_TEST`; skip only when it is unset:

```go
func testDatabase(t *testing.T) *gorm.DB {
    t.Helper()
    dsn := os.Getenv("DATABASE_URL_TEST")
    if dsn == "" { t.Skip("DATABASE_URL_TEST is not configured") }
    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
    if err != nil { t.Fatalf("open test database: %v", err) }
    if err := db.AutoMigrate(&models.Media{}); err != nil { t.Fatalf("migrate media: %v", err) }
    if err := db.Exec("DELETE FROM media").Error; err != nil { t.Fatalf("clear media: %v", err) }
    return db
}

func TestMediaServiceListOrdersNewestFirst(t *testing.T) {
    db := testDatabase(t)
    older := models.Media{Filename: "older.png", URL: "https://example.test/older.png", CreatedAt: time.Now().Add(-time.Minute)}
    newer := models.Media{Filename: "newer.png", URL: "https://example.test/newer.png", CreatedAt: time.Now()}
    if err := db.Create(&older).Error; err != nil { t.Fatal(err) }
    if err := db.Create(&newer).Error; err != nil { t.Fatal(err) }

    items, err := NewMediaService(db).List()
    if err != nil { t.Fatal(err) }
    if len(items) != 2 || items[0].ID != newer.ID { t.Fatalf("unexpected list: %#v", items) }
}
```

- [ ] **Step 2: Run the test to verify the missing service fails**

Run: `cd backend && DATABASE_URL_TEST="$DATABASE_URL_TEST" go test ./internal/services -run TestMediaServiceListOrdersNewestFirst -v`

Expected: compile failure because `NewMediaService` is undefined (or SKIP if no dedicated test database is configured).

- [ ] **Step 3: Implement the focused service and handler**

Create `backend/internal/services/media_service.go`:

```go
type MediaService struct{ db *gorm.DB }
func NewMediaService(db *gorm.DB) *MediaService { return &MediaService{db: db} }
func (s *MediaService) List() ([]models.Media, error) {
    var media []models.Media
    return media, s.db.Order("created_at DESC").Find(&media).Error
}
func (s *MediaService) UpdateMetadata(id uuid.UUID, metadata map[string]interface{}) (*models.Media, error) {
    var media models.Media
    if err := s.db.First(&media, "id = ?", id).Error; err != nil { return nil, err }
    media.Metadata = metadata
    return &media, s.db.Save(&media).Error
}
func (s *MediaService) Delete(id uuid.UUID) error { return s.db.Delete(&models.Media{}, "id = ?", id).Error }
```

Create a `MediaHandler` that parses `id` with `uuid.Parse`, parses a body shaped as `{ "metadata": { "alt": {"th":"","en":"","de":""}, "caption":"", "credit":"" } }`, returns 400 for malformed UUID/body, 404 for missing Media, and uses `utils.SuccessResponse`/`utils.MessageResponse` on success. Register:

```go
admin.Get("/media", middleware.PermissionRequired("gallery", "read"), mediaHandler.GetMedia)
admin.Put("/media/:id", middleware.PermissionRequired("gallery", "update"), mediaHandler.UpdateMedia)
admin.Delete("/media/:id", middleware.PermissionRequired("gallery", "delete"), mediaHandler.DeleteMedia)
```

- [ ] **Step 4: Run backend tests and formatter**

Run: `cd backend && gofmt -w internal/services/media_service.go internal/handlers/media_handler.go internal/routes/routes.go && go test ./...`

Expected: all existing Go tests pass; test DB test either passes or is explicitly skipped when `DATABASE_URL_TEST` is absent.

- [ ] **Step 5: Commit the backend Media API**

```bash
git add backend/internal/services/media_service.go backend/internal/handlers/media_handler.go backend/internal/routes/routes.go backend/internal/services/media_service_test.go
git commit -m "feat: add admin media API"
```

### Task 2: Return uploaded Media and add typed frontend client

**Files:**
- Modify: `backend/internal/handlers/upload_handler.go`
- Modify: `frontend/src/types/entities.ts`
- Create: `frontend/src/services/mediaService.ts`

**Interfaces:**
- Consumes Task 1 routes.
- Produces `Media`, `MediaMetadata`, `mediaService.list()`, `mediaService.upload(file)`, `mediaService.updateMetadata(id, metadata)`, and `mediaService.delete(id)`.

- [ ] **Step 1: Establish the failing TypeScript boundary**

Create `mediaService.ts` with only its imports, then update the Website Media page to import `mediaService`.

Run: `cd frontend && npx tsc --noEmit`

Expected: FAIL because the typed Media methods have not been defined. This repository has no configured frontend test runner; do not add one for this scoped integration.

- [ ] **Step 2: Implement the upload response and client**

Return the Media object without removing `data.url`:

```go
return c.JSON(fiber.Map{"data": fiber.Map{"url": url, "media": media}})
```

Add frontend types:

```ts
export interface MediaMetadata { alt?: MultiLangText; caption?: string; credit?: string }
export interface Media { id: string; filename: string; original_filename: string; mime_type: string; size: number; url: string; metadata?: MediaMetadata; created_at: string; updated_at: string }
```

Implement the client using the shared `api` instance, with `upload()` returning `response.data.data.media` and throwing if it is absent. This ensures the Website Media page adds a record with the database UUID rather than a browser blob URL.

- [ ] **Step 3: Verify API types and Go build**

Run: `cd frontend && npx tsc --noEmit`

Expected: exit code `0`.

Run: `cd backend && go test ./...`

Expected: exit code `0`.

- [ ] **Step 4: Commit the shared Media contract**

```bash
git add backend/internal/handlers/upload_handler.go frontend/src/types/entities.ts frontend/src/services/mediaService.ts
git commit -m "feat: expose uploaded media records"
```

### Task 3: Replace Website Media mocks with API-backed state

**Files:**
- Create: `frontend/src/stores/media-store.ts`
- Modify: `frontend/src/app/[locale]/admin/website/media/page.tsx`
- Modify: `frontend/src/components/admin/website/MediaDetailsSidebar.tsx`
- Modify: `frontend/src/components/admin/website/MediaPickerModal.tsx`
- Delete: `frontend/src/stores/mock-media-store.ts`

**Interfaces:**
- Consumes `mediaService` from Task 2.
- Produces `useMediaStore` with `fetchMedia`, `uploadMedia`, `updateMedia`, and `deleteMedia` actions using `Media` records.

- [ ] **Step 1: Add a failing render/type check for the former mock dependency**

Replace the `MockMedia` import in the page with `Media` and run TypeScript:

Run: `cd frontend && npx tsc --noEmit`

Expected: FAIL until `useMediaStore` and the API-to-UI mapping are implemented.

- [ ] **Step 2: Implement the store with real requests**

The store must call the service, never create `URL.createObjectURL`, and prepend the upload response:

```ts
uploadMedia: async (file) => {
  set({ isUploading: true });
  try {
    const media = await mediaService.upload(file);
    set((state) => ({ mediaList: [media, ...state.mediaList] }));
    return media;
  } finally { set({ isUploading: false }); }
},
```

Map metadata with safe defaults: `alt` defaults to `{ th: "", en: "", de: "" }`; `caption` and `credit` default to `""`. The page calls `uploadMedia(file)` and reports API errors with the existing toast pattern. The sidebar submits `{ alt, caption, credit }` in `metadata`, keeps the selection after a save, and uses the existing project confirmation Modal rather than native `confirm()` before database deletion.

- [ ] **Step 3: Update picker consumers and remove mock state**

`MediaPickerModal` must read the API-backed `useMediaStore`, trigger `fetchMedia()` when opened if the list has not loaded, and keep its `onSelect(url)` interface. Delete `mock-media-store.ts` after every import has moved.

- [ ] **Step 4: Verify frontend compilation**

Run: `cd frontend && npx tsc --noEmit`

Expected: exit code `0` and no import of `mock-media-store` remains.

Run: `rg -n 'mock-media-store|URL\\.createObjectURL\\(file\\)' frontend/src`

Expected: no matches in Website Media code.

- [ ] **Step 5: Commit the real Website Media library**

```bash
git add frontend/src/stores/media-store.ts frontend/src/app/'[locale]'/admin/website/media/page.tsx frontend/src/components/admin/website/MediaDetailsSidebar.tsx frontend/src/components/admin/website/MediaPickerModal.tsx frontend/src/stores/mock-media-store.ts
git commit -m "feat: connect website media library"
```

### Task 4: Point ImageUpload at Media records

**Files:**
- Modify: `frontend/src/components/admin/ImageUpload.tsx`
- Test: manual browser verification

**Interfaces:**
- Consumes `mediaService.list()` from Task 2.
- Preserves `ImageUploadProps.value: string | File` and `onChange(value: string | File)`.

- [ ] **Step 1: Make the component fail type-check against the old Gallery contract**

Replace `galleryAdminService` import with `mediaService` and change the local list type to `Media[]`.

Run: `cd frontend && npx tsc --noEmit`

Expected: FAIL until render and list extraction use `media.url`.

- [ ] **Step 2: Implement the Media query**

Replace `galleryAdminService.getAll({ limit: 100 })` with `mediaService.list()`. Store records or URLs derived from `media.url`; keep existing loading, de-duplication, file validation, local preview, and selected URL behavior unchanged.

- [ ] **Step 3: Verify the frontend**

Run: `cd frontend && npx tsc --noEmit`

Expected: exit code `0`.

Run: `cd frontend && npm run lint`

Expected: report any pre-existing errors separately; no new lint errors in the changed Media files.

- [ ] **Step 4: Commit the ImageUpload integration**

```bash
git add frontend/src/components/admin/ImageUpload.tsx
git commit -m "fix: load image picker from media API"
```

### Task 5: End-to-end verification and API documentation

**Files:**
- Modify: `backend/docs/openapi.yaml`

- [ ] **Step 1: Document the three Media endpoints and richer upload response**

Add `/admin/media` GET and `/admin/media/{id}` PUT/DELETE operations with Bearer authentication, plus `data.media` to the upload response schema; retain the documented `data.url` field.

- [ ] **Step 2: Run static verification**

Run: `cd backend && go test ./...`

Expected: exit code `0`.

Run: `cd frontend && npx tsc --noEmit`

Expected: exit code `0`.

- [ ] **Step 3: Run authenticated browser verification**

1. Open `http://localhost:3000/th/admin/website/media` and upload a PNG.
2. Refresh; confirm the image is still displayed and the API list response contains its database UUID and R2 URL.
3. Update alt/caption/credit; refresh and confirm metadata remains.
4. Open an `ImageUpload` media library; confirm the same image is selectable.
5. Create one Gallery item; confirm it appears in `GET /api/v1/admin/gallery`.
6. Upload a non-Gallery image; confirm it appears in `/admin/media` but not `/admin/gallery`.

- [ ] **Step 4: Commit documentation**

```bash
git add backend/docs/openapi.yaml
git commit -m "docs: describe admin media API"
```

## Self-Review

- Spec coverage: Tasks 1–2 provide the Media API and backward-compatible upload response; Tasks 3–4 replace both mock-based consumers; Task 5 verifies persistence and documents every endpoint.
- Placeholder scan: no deferred behavior, schema migration, or unspecified UI state is required.
- Type consistency: backend uses UUID Media IDs; frontend `Media.id` is a string; all UI metadata is sent under `metadata` and read from `media.metadata`.
