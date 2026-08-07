# Admin Operations Safety Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver safe media archival, verified donation handling, and staff-reviewed personal-data requests in three independent releases.

**Architecture:** Add focused Go services behind existing Admin route registration and typed TypeScript service contracts. Use one reversible migration for persistence, server-side authorization for every mutation, and Admin pages that use the existing list/query and permission components.

**Tech Stack:** Go 1.24, Fiber v2, GORM, PostgreSQL, Cloudflare R2, Next.js 16, React 19, TypeScript, TanStack Query, React Hook Form, Zod.

## Global Constraints

- Preserve `th`, `en`, and `de` copy.
- Do not use TypeScript `any`, `as any`, or `@ts-ignore`.
- Register protected routes only in `backend/internal/routes/routes.go` with `PermissionRequired`.
- Add matching OpenAPI and frontend contracts for all changed HTTP payloads.
- Add `000029_admin_operations_safety.up.sql` and its reversible down migration; do not edit prior migrations.
- Audit only identifiers, operation type, and counts for privacy-sensitive mutations.

---

### Task 1: Establish persistence and permissions

**Files:**
- Create: `backend/migrations/000029_admin_operations_safety.up.sql`
- Create: `backend/migrations/000029_admin_operations_safety.down.sql`
- Modify: `backend/internal/models/media.go`
- Modify: `backend/internal/models/donation.go`
- Create: `backend/internal/models/personal_data_request.go`
- Modify: `frontend/src/components/admin/PermissionEditor.tsx`

**Produces:** `Media.DeletedAt`, `Media.PurgeAfter`, `Donation.Source`, `Donation.ProofMediaID`, `Donation.ConfirmedByID`, `Donation.ConfirmedAt`, `Donation.ReceiptDispatchedByID`, `PersonalDataRequest`, and RBAC resources `media` and `personal_data_requests`.

- [ ] Write model/service tests that assert archived media is excluded, self-reported donations require proof, and personal-data request status only transitions `open -> reviewed -> completed`.
- [ ] Run `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services/...` and confirm the new tests fail before implementation.
- [ ] Add nullable archive timestamps to `media`; add donation source/proof/confirmation/dispatch columns; create `personal_data_requests` and `personal_data_request_items` with foreign keys and indexes on request status and requester email.
- [ ] Add matching GORM models, typed status constants, and migration backfill setting existing donations to `staff_recorded`.
- [ ] Add RBAC rows to the permission editor; use `media` for library operations and `personal_data_requests` for request operations.
- [ ] Run the focused Go tests and confirm PASS; run `cd frontend && ./node_modules/.bin/tsc --noEmit`.
- [ ] Commit only the migration, models, permission UI, and focused tests with `feat(admin): add operations safety persistence`.

### Task 2: Deliver media reference, archive, restore, and purge behavior

**Files:**
- Modify: `backend/internal/services/media_service.go`
- Modify: `backend/internal/handlers/media_handler.go`
- Modify: `backend/internal/handlers/upload_handler.go`
- Modify: `backend/internal/routes/routes.go`
- Modify: `backend/internal/storage/r2.go`
- Create: `backend/cmd/media-purge/main.go`
- Modify: `frontend/src/services/mediaService.ts`
- Modify: `frontend/src/types/entities.ts`
- Modify: `frontend/src/components/admin/website/MediaDetailsSidebar.tsx`
- Modify: `frontend/src/app/[locale]/admin/media/page.tsx`
- Modify: `backend/docs/openapi.yaml`

**Interfaces:**

```go
type MediaReference struct { Kind, ID, Label, AdminPath string }
func (s *MediaService) References(id uuid.UUID) ([]MediaReference, error)
func (s *MediaService) Archive(id uuid.UUID, now time.Time) (*models.Media, error)
func (s *MediaService) Restore(id uuid.UUID) (*models.Media, error)
func (s *MediaService) PurgeDue(ctx context.Context, before time.Time) (int, error)
```

- [ ] Write service tests for reference discovery, 30-day archive timestamps, restoration, and permanent purge calling the storage deletion adapter exactly once.
- [ ] Run the focused service tests and confirm they fail because the methods and storage delete interface do not exist.
- [ ] Implement URL-reference scanners for events, monks, galleries, members, users, and CMS section JSON; return stable labels and locale-aware Admin paths without returning content payloads.
- [ ] Replace hard deletion with `Archive`; add `GET /admin/media/:id/references`, `POST /admin/media/:id/archive`, and `POST /admin/media/:id/restore`, each protected by the `media` resource. Extend R2 with object deletion and implement the explicit `media-purge` command for scheduled invocation.
- [ ] Replace the delete dialog with a reference warning and explicit archive confirmation; add a recycle-bin filter and restore action; surface missing-locales alt-text status.
- [ ] Update OpenAPI and typed frontend payloads, then run `go test ./...`, frontend lint, type-check, and build.
- [ ] Commit with `feat(media): archive assets safely`.

### Task 3: Deliver verified donation operations

**Files:**
- Modify: `backend/internal/services/donation_service.go`
- Modify: `backend/internal/handlers/donation_handler.go`
- Modify: `backend/internal/routes/routes.go`
- Create: `backend/internal/services/donation_notification_service.go`
- Modify: `backend/internal/accountauth/templates.go`
- Modify: `frontend/src/services/adminService.ts`
- Modify: `frontend/src/types/entities.ts`
- Modify: `frontend/src/schemas/donation.schema.ts`
- Modify: `frontend/src/app/[locale]/admin/donations/page.tsx`
- Create: `frontend/src/app/[locale]/admin/donations/[id]/page.tsx`
- Modify: `backend/docs/openapi.yaml`

**Interfaces:**

```go
type CreateSelfReportedDonationInput struct { Donation models.Donation; ProofMediaID uuid.UUID; Locale string }
func (s *DonationService) CreateSelfReported(ctx context.Context, in CreateSelfReportedDonationInput) (*models.Donation, error)
func (s *DonationService) Confirm(id int, adminID uuid.UUID) (*models.Donation, error)
func (s *DonationService) DispatchReceipt(ctx context.Context, id int, adminID uuid.UUID, locale string) error
```

- [ ] Write tests covering missing proof rejection, pending creation and acknowledgement attempt, confirm authorization/state validation, and receipt dispatch only after confirmation.
- [ ] Run those tests and confirm they fail before the new service API is implemented.
- [ ] Implement source-aware creation; validate that proof media is image/PDF and owned by the record; share the existing Resend email adapter without putting donation content into auth templates.
- [ ] Add Admin routes for staff creation, confirmation, and receipt dispatch; audit status transitions by IDs only. Do not preserve the broad `PUT /admin/donations/:id` as a way to bypass transitions.
- [ ] Add an Admin detail page with proof preview, status timeline, confirmation action, and Receipt Dispatch action; add all message keys in `th`, `en`, and `de`.
- [ ] Update OpenAPI/contracts, run backend tests, `make fe-lint`, frontend type-check, and `make fe-build`.
- [ ] Commit with `feat(donations): verify and dispatch receipts`.

### Task 4: Deliver staff-reviewed personal-data requests

**Files:**
- Create: `backend/internal/services/personal_data_request_service.go`
- Create: `backend/internal/handlers/personal_data_request_handler.go`
- Modify: `backend/internal/routes/routes.go`
- Create: `frontend/src/services/personalDataRequestService.ts`
- Create: `frontend/src/types/personal-data-request.ts`
- Create: `frontend/src/schemas/personal-data-request.schema.ts`
- Create: `frontend/src/app/[locale]/admin/personal-data-requests/page.tsx`
- Create: `frontend/src/app/[locale]/admin/personal-data-requests/[id]/page.tsx`
- Modify: `frontend/src/components/admin/AdminSidebar.tsx`
- Modify: `backend/docs/openapi.yaml`

**Interfaces:**

```go
type PersonalDataCandidate struct { Source, RecordID, DisplayLabel string; Fields []string }
func (s *PersonalDataRequestService) Search(email string, name string) ([]PersonalDataCandidate, error)
func (s *PersonalDataRequestService) Export(requestID uuid.UUID, itemIDs []uuid.UUID) (io.ReadCloser, string, error)
func (s *PersonalDataRequestService) Erase(requestID uuid.UUID, itemIDs []uuid.UUID, actorID uuid.UUID) error
```

- [ ] Write service tests for cross-source candidate search, explicit selection requirement, donation anonymization, and audit records that contain no personal values.
- [ ] Run the focused tests and confirm they fail before the service/model exist.
- [ ] Implement the request/item state machine and candidate adapters for contacts, registrations, donations, members, and users/profiles. Encrypt or generate export as a one-time object; do not put it in a public URL or audit log.
- [ ] Implement erasure adapters: blank or pseudonymize identity fields, invalidate Donation Proof access, retain the accounting fields defined in the design, and leave account closure to its existing flow.
- [ ] Add protected CRUD/search/export/erase routes, Admin list/detail pages with explicit record selection and destructive confirmation, sidebar navigation, localization, OpenAPI, and typed client service.
- [ ] Run `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./...`, `go vet ./...`, `go build -o bin/server ./cmd/app`, plus frontend lint, type-check, and build.
- [ ] Commit with `feat(privacy): manage personal data requests`.

## Verification matrix

- Media: service tests plus manual archive/restore reference checks for an event and CMS page.
- Donations: service/handler tests plus manual submission with proof, confirmation, acknowledgement, and receipt dispatch in each locale.
- Privacy: service tests plus manual search/export/erasure of selected mixed-source candidates; verify retained donation accounting values and audit redaction.
- Release: apply migration to empty and upgrade-copy databases; run the listed backend and frontend verification commands.
