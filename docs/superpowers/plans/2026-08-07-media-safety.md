# Media Safety Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add reference-aware, recoverable Media deletion and multilingual alt-text quality checks.

**Architecture:** `Media` gains soft-delete fields. A reference service resolves allowlisted URL usages; a retention command only hard-deletes expired assets with zero references. Admin UI exposes Trash and permanent delete separately.

**Tech Stack:** Go 1.24, Fiber, GORM/PostgreSQL, R2, Next.js 16, React 19.

## Global Constraints

- Add reversible migration `000029`; preserve existing `alt_text` as Thai in `alt_texts` JSONB.
- Route permissions use resource `gallery`; mutations are audited.
- R2 cleanup is retryable; automatic purge never deletes referenced Media.

---

### Task 1: Persist and test Media lifecycle

**Files:** Create `backend/migrations/000029_add_media_lifecycle.{up,down}.sql`; modify `backend/internal/models/media.go`, `backend/internal/config/config.go`, `backend/internal/services/media_service.go`; test `backend/internal/services/media_service_test.go`.

- [ ] Write `TestSoftDeleteSetsPurgeAt` and `TestRestoreClearsLifecycleFields` using a fixed clock.
- [ ] Run `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services -run 'Test(SoftDelete|Restore)' -count=1`; expect failure.
- [ ] Add `deleted_at`, `deleted_by_id`, `purge_at`, `alt_texts` and index `idx_media_purge_at`; implement `SoftDelete(id, actorID)`, `Restore(id)`, `GetByIDIncludingDeleted(id)`, and default list filtering with `deleted_at IS NULL`.
- [ ] Run the same test command; expect pass.
- [ ] Commit: `git add backend/migrations/000029_add_media_lifecycle.* backend/internal/models/media.go backend/internal/config/config.go backend/internal/services/media_service* && git commit -m "feat(media): add recoverable lifecycle"`.

### Task 2: Add reference and purge services

**Files:** Create `backend/internal/services/media_reference_service.go`, `backend/internal/services/media_retention_service.go`, `backend/cmd/media-retention/main.go`; modify `backend/internal/handlers/media_handler.go`, `backend/internal/routes/routes.go`; test `backend/internal/services/media_reference_service_test.go`, `backend/internal/services/media_retention_service_test.go`.

- [ ] Write a test that seeds Event, Gallery, Monk, Member avatar, ContentPage and ContentSection references to one URL; assert `FindReferences` returns every source.
- [ ] Write `TestPurgeDueSkipsReferencedMedia`; run `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services -run 'Test(FindReferences|PurgeDue)' -count=1`; expect failure.
- [ ] Implement `MediaReference{Kind, ID, Label, Href}` and `FindReferences(ctx, url)`. `PurgeDue` must call it, skip references, delete R2 `Path`, then hard-delete the row; treat an already-missing R2 object as cleaned up.
- [ ] Register `GET /admin/media/trash`, `GET /admin/media/:id/references`, `POST /admin/media/:id/restore`, and `POST /admin/media/:id/purge`. The purge handler requires JSON `{ "confirm": true }`.
- [ ] Run `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./... && go vet ./...`; expect pass; commit `feat(media): add reference-aware purge`.

### Task 3: Build Trash and quality UX

**Files:** Modify `frontend/src/services/mediaService.ts`, `frontend/src/stores/media-store.ts`, `frontend/src/types/entities.ts`, `frontend/src/components/admin/website/MediaDetailsSidebar.tsx`, `frontend/src/app/[locale]/admin/media/page.tsx`, and all `frontend/src/messages/admin/{th,en,de}.json`.

- [ ] Add a client test for `getReferences(id)` returning API references; run it and confirm failure.
- [ ] Add client contracts for `getReferences`, `getTrash`, `restore`, and `purge`; add `deleted_at`, `purge_at`, `alt_texts` to `Media`.
- [ ] Before Trash, show references and explain that existing public URLs remain while the item is recoverable. Add Trash, Restore, `purge blocked`, permanent-delete double confirmation, and an alt-text missing-language filter. Invalidate both normal and trash query keys after every mutation.
- [ ] Run `cd frontend && npm run lint && ./node_modules/.bin/tsc --noEmit && npm run build`; expect pass; commit `feat(media): add trash restore and quality checks`.

## Self-review

Tasks cover migration, URL references, 30-day recovery, safe automatic purge, deliberate permanent deletion, th/en/de alt text, API, Admin states, and verification.
