# Donation Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Receive proof-backed self-reported donations and staff-recorded cash donations, then confirm and send immutable PDF receipts safely.

**Architecture:** `DonationService` owns the canonical `pending → confirmed/cancelled` state machine. Proofs and receipts are private R2 objects, never public Media. A receipt is rendered once and reused for delivery retries.

**Tech Stack:** Go 1.24, Fiber, GORM/PostgreSQL, R2, Resend adapter, Next.js 16, React Hook Form, Zod.

## Global Constraints

- Canonical statuses are only `pending`, `confirmed`, and `cancelled`; migrate legacy `verified/rejected` values.
- Self-reported bank transfer/PayPal requires a proof; staff-recorded cash does not.
- Private proof and receipt retrieval requires `donations:read`; all Admin operations are audited without PII in audit changes.
- UI and transactional emails must provide th/en/de variants.

---

### Task 1: Add workflow persistence and tests

**Files:** Create `backend/migrations/000030_add_donation_operations.{up,down}.sql`, `backend/internal/models/donation_proof.go`; modify `backend/internal/models/donation.go`, `backend/internal/config/config.go`, `backend/internal/services/donation_service.go`; test `backend/internal/services/donation_service_test.go`.

- [ ] Write failing tests: confirmation rejects a non-pending record; bank transfer self-report requires a proof; second receipt dispatch returns an idempotency result.
- [ ] Run `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services -run TestDonation -count=1`; expect failure.
- [ ] Add `DonationProof` with private key, original filename, MIME, size, checksum and timestamps. Add donation `source`, `communication_locale`, confirmation actor/time, receipt object key/checksum, and receipt dispatch actor/time. Add a migration that normalizes status values before constraining them.
- [ ] Implement `CreateSelfReported`, `CreateStaffRecorded`, `Confirm`, and `MarkReceiptDispatched` behind a transaction and lock rows during state transition.
- [ ] Run the focused test command; expect pass; commit `feat(donations): add confirmed donation workflow`.

### Task 2: Add private files, endpoints, email, and OpenAPI

**Files:** Modify `backend/internal/storage/r2.go`, `backend/internal/handlers/donation_handler.go`, `backend/internal/routes/routes.go`, `backend/internal/accountauth/templates.go`, `backend/docs/openapi.yaml`; create `backend/internal/services/donation_document_service.go`, `backend/internal/services/donation_email_service.go`; test `backend/internal/handlers/donation_handler_test.go`, `backend/internal/services/donation_document_service_test.go`.

- [ ] Write failing handler tests for missing bank-transfer proof (400), proof download without `donations:read` (403), confirmation of pending item (200), and receipt dispatch before confirmation (409).
- [ ] Run `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/handlers -run 'Test(Donation|Proof|Receipt)' -count=1`; expect failure.
- [ ] Add `UploadPrivate`, `OpenPrivate`, and `DeleteFile` storage operations. `POST /public/donations` validates multipart MIME/size/locale/email/amount and stores proof under a private donation key; delete the object if DB persistence fails.
- [ ] Register `POST /admin/donations`, `GET /admin/donations/:id/proof`, `POST /admin/donations/:id/confirm`, and `POST /admin/donations/:id/send-receipt`. Add an explicit donation rate-limit setting instead of borrowing account rate limits.
- [ ] Render acknowledgement copy after self-report commit. Render PDF once with receipt number, amount, currency, date, donor data, and temple details; persist its checksum/key, then attach the stored PDF on delivery retry.
- [ ] Update OpenAPI and run `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./... && go vet ./...`; expect pass; commit `feat(donations): receive proofs and dispatch receipts`.

### Task 3: Build public reporting and Admin controls

**Files:** Create `frontend/src/features/public/donations/{api.ts,schema.ts,DonationForm.tsx}`; modify `frontend/src/components/home/DonationSection.tsx`, `frontend/src/app/[locale]/admin/donations/page.tsx`, `frontend/src/services/adminService.ts`, `frontend/src/types/entities.ts`, all `frontend/src/messages/{th,en,de}.json`, and all `frontend/src/messages/admin/{th,en,de}.json`.

- [ ] Write a failing Zod test that rejects `{ method: "bank_transfer", proof: undefined }` and accepts a `File` proof.
- [ ] Run `cd frontend && npx tsx --test src/features/public/donations/schema.test.ts`; expect failure.
- [ ] Implement form submission through the feature API. Add conditional proof upload, acknowledgement success state, and complete th/en/de copy. Do not put Axios calls in components.
- [ ] Replace current Admin `verified/rejected` filters with `confirmed/cancelled`; show source, proof state, receipt state, private proof download, Confirm, and Send Receipt through `PermissionGuard`. Invalidate the donation query after each mutation.
- [ ] Run `cd frontend && npm run lint && ./node_modules/.bin/tsc --noEmit && npm run build`; expect pass; commit `feat(donations): add reporting and receipt controls`.

## Self-review

Tasks cover canonical status migration, both entry paths, private proofs, acknowledgement, manually dispatched immutable PDF receipt, rate limiting, OpenAPI, RBAC, localization, and full backend/frontend verification.
