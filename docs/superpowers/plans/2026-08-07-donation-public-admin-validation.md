# Donation Public/Admin Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Validate EUR-only donation entry in public and Admin flows while preserving an auditable confirmation, receipt, and cancellation workflow.

**Architecture:** Handlers parse typed request DTOs; a donation domain package validates input and `DonationService` owns transitions. React Hook Form and Zod validate each UI flow; Go remains authoritative. A new migration holds receipt-request and cancellation fields.

**Tech Stack:** Next.js 16, React 19, TypeScript, Zod, Go 1.24, Fiber, GORM, PostgreSQL, R2.

## Global Constraints

- Support only `EUR`, and preserve `th`, `en`, and `de` copy.
- Public bank transfer/PayPal reports require a private PDF/JPEG/PNG/WebP proof of 10 MB or less; Admin cash records do not.
- Confirmed records are cancelled with a reason, never hard-deleted.
- Use a new reversible migration; do not edit existing migrations.
- Do not use `any`, `as any`, or `@ts-ignore`.

---

### Task 1: Add durable receipt-request and cancellation data

**Files:**

- Create: `backend/migrations/000035_add_donation_receipt_and_cancellation.up.sql`
- Create: `backend/migrations/000035_add_donation_receipt_and_cancellation.down.sql`
- Modify: `backend/internal/models/donation.go`
**Interfaces:** Produces `ReceiptRequested`, `CancellationReason`, `CancelledByID`, and `CancelledAt` on `models.Donation`.

- [ ] Add migration `000035`: add `receipt_requested boolean not null default false`, `cancellation_reason text`, `cancelled_by_id uuid references users(id) on delete set null`, and `cancelled_at timestamptz`; copy `tax_receipt_required` into `receipt_requested`; then remove the legacy tax receipt fields. Down migration restores legacy fields and drops only 000035 additions.
- [ ] Add matching model fields:

```go
ReceiptRequested bool `gorm:"default:false" json:"receipt_requested"`
CancellationReason string `gorm:"type:text" json:"cancellation_reason,omitempty"`
CancelledByID *uuid.UUID `gorm:"type:uuid" json:"cancelled_by_id,omitempty"`
CancelledAt *time.Time `json:"cancelled_at,omitempty"`
```

- [ ] Run: `cd backend && gofmt -w internal/models/donation.go && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/models -count=1` — expect PASS.
- [ ] Commit: `git add backend/migrations/000035* backend/internal/models/donation.go && git commit -m "feat: persist donation cancellation state"`.

### Task 2: Build shared validation and typed request contracts

**Files:**

- Create: `backend/internal/donations/validation.go`
- Create: `backend/internal/donations/validation_test.go`
- Modify: `backend/internal/handlers/donation_handler.go`
- Modify: `backend/internal/services/donation_service.go`

**Interfaces:** `ValidatePublicInput`, `ValidateStaffInput`, and `ValidateDonationCancellationReason`; staff and public request structs are not persistence models.

- [ ] Write table tests that accept staff `cash/EUR/2026-08-07`, reject `THB`, `1.999`, invalid date, receipt request with blank email, public missing proof, public blank name, and unsupported public method.
- [ ] Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/donations -count=1` — expect FAIL.
- [ ] Implement request structs and validators. Require EUR, a finite positive amount with two decimal places maximum, a valid date, valid optional phone, and active category. Require public `bank_transfer|paypal`, locale `th|en|de`, name, email, and proof. Permit staff `cash` without proof; reject staff receipt request without email.
- [ ] Change `CreateStaffDonation` to parse the staff DTO and map only permitted properties into `models.Donation`. Strengthen `SubmitSelfReported` before upload. Determine proof type from file bytes (PDF signature plus `http.DetectContentType`), never the multipart content-type alone.
- [ ] Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/donations ./internal/services -count=1` — expect PASS.
- [ ] Commit: `git add backend/internal/donations backend/internal/handlers/donation_handler.go backend/internal/services/donation_service.go && git commit -m "feat: validate donation entry by source"`.

### Task 3: Lock down Admin operations and audit proof access

**Files:**

- Modify: `backend/internal/services/donation_service.go`
- Modify: `backend/internal/handlers/donation_handler.go`
- Modify: `backend/internal/routes/routes.go`
- Modify: `backend/internal/services/donation_operations_test.go`
- Modify: `backend/docs/openapi.yaml`

**Interfaces:** Add `Cancel(id int, actorID uuid.UUID, reason string) (*models.Donation, error)` and `POST /admin/donations/{id}/cancel`.

- [ ] Write failing tests for row-locked cancellation, receipt dispatch without `receipt_requested`/email, and repeated receipt queueing.
- [ ] Implement cancellation under `clause.Locking{Strength: "UPDATE"}`: set cancelled status, reason, actor, and time; reject blank reason and duplicate cancellation.
- [ ] Remove generic donation update/delete/bulk-delete routes and handlers. Add cancel endpoint guarded by `PermissionRequired("donations", "update")`; do not accept status, confirmation, receipt number, dispatch metadata, or object keys from HTTP input.
- [ ] Require confirmed status, receipt request, and email in the receipt service before rendering/queuing. After successful proof download, call the existing audit service with action `donation.proof_access`, entity `donation`, and its ID. Audit create, confirm, cancel, and receipt queue too.
- [ ] Update OpenAPI with public/staff validation errors, cancel body `{ "reason": "..." }`, `409` transitions, and proof `403`.
- [ ] Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./... && GOCACHE=/private/tmp/wat-profile-go-cache go vet ./... && go build -o /private/tmp/wat-profile-server ./cmd/app` — expect PASS.
- [ ] Commit: `git add backend/internal/services/donation_service.go backend/internal/handlers/donation_handler.go backend/internal/routes/routes.go backend/internal/services/donation_operations_test.go backend/docs/openapi.yaml && git commit -m "feat: enforce donation operations workflow"`.

### Task 4: Finish the public donation report form

**Files:**

- Modify: `frontend/src/features/public/donations/DonationForm.tsx`
- Modify: `frontend/src/features/public/donations/schema.ts`
- Modify: `frontend/src/features/public/donations/api.ts`
- Create: `frontend/src/features/public/donations/schema.test.ts`
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`

**Interfaces:** `SelfReportedDonationValues` includes `currency: "EUR"`, `donation_date`, category, and `receipt_requested`.

- [ ] Write Zod tests rejecting THB, 3-decimal amounts, invalid dates, invalid proof types, and files above 10 MB.
- [ ] Add a labelled native EUR select, transfer date input, active-category selector, receipt-request checkbox, required privacy-policy acknowledgement, and field-level errors. Preserve 44px controls and locale-specific copy.
- [ ] Send the new fields via existing multipart feature API and narrow its currency type to `"EUR"`.
- [ ] Run: `cd frontend && npm run lint && ./node_modules/.bin/tsc --noEmit && npm run build` — expect PASS; record the aggregate test-runner limitation if alias resolution blocks direct TS tests.
- [ ] Commit: `git add frontend/src/features/public/donations frontend/src/messages/{th,en,de}.json && git commit -m "feat: validate public donation reports"`.

### Task 5: Add staff form and cancellation UI

**Files:**

- Modify: `frontend/src/app/[locale]/admin/donations/page.tsx`
- Create: `frontend/src/components/admin/donations/StaffDonationForm.tsx`
- Create: `frontend/src/components/admin/donations/CancelDonationDialog.tsx`
- Modify: `frontend/src/schemas/donation.schema.ts`
- Modify: `frontend/src/services/adminService.ts`
- Modify: `frontend/src/types/entities.ts`
- Modify: `frontend/src/messages/admin/th.json`
- Modify: `frontend/src/messages/admin/en.json`
- Modify: `frontend/src/messages/admin/de.json`

**Interfaces:** `staffDonationSchema`; `donationAdminService.createStaff(data)`; `donationAdminService.cancel(id, reason)`.

- [ ] Write staff Zod schema with EUR literal, cash/bank transfer/PayPal methods, valid date/amount, and a refinement requiring email when receipt is requested.
- [ ] Implement the Staff Donation form with React Hook Form and `zodResolver`, gated by donations/create permission. Do not render a proof input; after create invalidate `['admin', 'donations']`.
- [ ] Replace Delete and bulk-delete controls with a cancellation dialog requiring a reason and calling the typed cancel client. Hide it for cancelled records.
- [ ] Display Send Receipt only for confirmed, receipt-requested records having an email and no dispatch timestamp. Add every new label/error/action key to all three Admin message files.
- [ ] Run: `cd frontend && npm run lint && ./node_modules/.bin/tsc --noEmit && npm run build` — expect PASS.
- [ ] Commit: `git add frontend/src/app/[locale]/admin/donations/page.tsx frontend/src/components/admin/donations frontend/src/schemas/donation.schema.ts frontend/src/services/adminService.ts frontend/src/types/entities.ts frontend/src/messages/admin && git commit -m "feat: manage staff donation records safely"`.

### Task 6: Update glossary and acceptance-check the feature

**Files:**

- Modify: `CONTEXT.md`

- [ ] Update `CONTEXT.md` once with `Member-Linked Donation`, `Receipt Request`, and `General Donation Receipt`; clarify proof is private and staff-authorized. Keep implementation fields and endpoints out of the glossary.
- [ ] Apply migrations on an empty database and an upgrade copy, then run the complete verification commands from Tasks 3–5.
- [ ] Manually verify: public valid report becomes pending; invalid currency/file/date is rejected; staff cash is confirmed without proof; confirmed records cancel but do not disappear; receipt cannot dispatch without request/email; proof access creates an audit record and unauthorized access is denied.
- [ ] Commit: `git add CONTEXT.md && git commit -m "docs: clarify donation operations"`.
