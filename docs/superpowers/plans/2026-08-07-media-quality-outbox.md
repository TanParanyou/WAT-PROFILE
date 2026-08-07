# Media Quality and Operations Outbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Admin list sorting/filtering truthful, add a multilingual Media alt-text quality queue, and make donation email and media-retention work durable and retryable.

**Architecture:** Keep the existing typed Admin list URL contract, but align frontend query keys with backend allowlists and add contract tests for every affected list. Persist background operations in PostgreSQL as idempotent outbox jobs; a one-shot worker claims due jobs with row locks, executes storage/email work, and records exponential backoff without adding a broker.

**Tech Stack:** Next.js 16/React 19/TypeScript, Go 1.24/Fiber/GORM, PostgreSQL migrations, Cloudflare R2, existing email sender adapter.

## Global Constraints

- Preserve `th`, `en`, and `de` messages and localized Media quality labels.
- Keep all Admin routes behind `PermissionRequired` and keep storage access inside `internal/storage`.
- Use versioned SQL migrations as the production schema authority; do not edit existing migrations.
- Do not expose private proof/receipt objects or email payloads in logs or API responses.
- Do not use TypeScript `any`, `as any`, or `@ts-ignore`.

### Task 1: Align Admin list contracts

**Files:**
- Modify: `backend/internal/handlers/*_handler.go` and `backend/internal/services/*_service.go` list allowlists/maps.
- Modify: `frontend/src/app/[locale]/admin/*/page.tsx` list schemas and filter keys.
- Modify: `frontend/src/features/admin-list/url.ts` only if canonical serialization needs a shared alias map.
- Test: backend list-query/service tests for accepted canonical keys.

- [x] Inventory frontend `allowedSorts` and filter keys against backend allowlists.
- [x] Add safe `id` aliases and existing field aliases where the UI exposes a sortable column; map them to qualified SQL columns.
- [x] Rename mismatched query keys (`mime`/`category` and donation `method`) in the frontend and add `alt_missing` as a Media-only key.
- [x] Add contract coverage for every affected list's UI-exposed sort key.

### Task 2: Add Media missing-alt quality filter

**Files:**
- Modify: `backend/internal/handlers/media_handler.go`.
- Modify: `backend/internal/services/media_service.go`.
- Modify: `frontend/src/services/adminService.ts`, `frontend/src/services/mediaService.ts`, and `frontend/src/app/[locale]/admin/media/page.tsx`.
- Modify: `frontend/src/messages/admin/{th,en,de}.json`.
- Test: `backend/internal/services/media_service_test.go` and Media client contract tests.

- [x] Parse `alt_missing=th|en|de` and apply a JSONB empty-string predicate against `media.alt_texts`.
- [x] Return supported locales from Media filter options.
- [x] Add a three-locale multi-select filter, localized labels, active chips, and loading/empty behavior; keep Trash independent from the normal list.
- [x] Verify the frontend type contract and invalidate the normal-list/filter/trash queries after media mutations.

### Task 3: Persist and claim outbox jobs

**Files:**
- Create: `backend/internal/models/operation_outbox.go`.
- Create: `backend/migrations/000034_add_operation_outbox.up.sql` and `.down.sql`.
- Create: `backend/internal/services/operation_outbox_service.go` and tests.
- Create: `backend/cmd/operations-worker/main.go`.
- Modify: `backend/internal/config/config.go` to include the model for local AutoMigrate only.

- [x] Add `operation_outbox` fields: id, unique idempotency key, kind, aggregate identifiers, JSON payload, status, attempts, available/locked/completed timestamps, last error, and timestamps.
- [x] Implement `Enqueue` with duplicate-key reuse, `ClaimDue` using `FOR UPDATE SKIP LOCKED`, `Complete`, and `Fail` with bounded exponential backoff.
- [x] Implement a one-shot worker that claims a bounded batch and dispatches known job kinds.
- [x] Add pure contract coverage; DB-backed claim timing/concurrency tests remain dependent on `DATABASE_URL_TEST`.

### Task 4: Move donation email and media purge through outbox

**Files:**
- Modify: `backend/internal/handlers/donation_handler.go` and `backend/internal/services/donation_service.go`.
- Modify: `backend/internal/services/donation_email_service.go` and `backend/internal/services/media_retention_service.go`.
- Modify: `backend/internal/routes/routes.go` and `backend/cmd/media-retention/main.go`.
- Test: donation handler/service tests, retention tests, and worker dispatch tests.

- [x] Enqueue acknowledgement atomically with the self-reported donation transaction; delivery failures do not fail the public response.
- [x] Prepare and persist one immutable receipt PDF, enqueue receipt delivery with a deterministic key, and make retries reuse the stored object rather than render another PDF.
- [x] Enqueue the daily Media purge operation and let the worker retry transient R2/database failures while preserving reference checks.
- [x] Mark jobs and donation receipt state idempotently; private proof contents and email bodies stay out of logs/API payloads.

### Task 5: Contracts, docs, and verification

**Files:**
- Modify: `backend/docs/openapi.yaml`.
- Modify: `docs/DEPLOYMENT.md` and `docs/DATABASE.md` with migration/worker cron commands.

- [x] Document the outbox migration and a single-worker cron invocation.
- [x] Run `gofmt`, `go test ./...`, and `go vet ./...`.
- [x] Run frontend type-check and lint; report unrelated pre-existing failures separately.
- [x] Run `git diff --check` and verify all changed locale message trees remain aligned.
