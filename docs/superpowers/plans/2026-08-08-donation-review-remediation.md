# Donation Review Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining donation-flow review findings so public, member, and Admin contracts are secure, auditable, localized, and consistent.

**Architecture:** Keep all state-changing validation and audit decisions in Go services/handlers. Public and Admin forms use their own Zod schemas and localized messages. A member history API is read-only and scoped to the authenticated member; it never recreates the removed unsafe member-create endpoint.

**Tech Stack:** Go 1.24, Fiber, GORM, PostgreSQL, Next.js 16, React 19, TypeScript, Zod, next-intl.

## Global Constraints

- Currency is `EUR` only; public transfer/PayPal reports require one private proof.
- Preserve `th`, `en`, and `de` UI copy; no hard-coded Thai operational strings.
- Confirmed Donation Records are cancelled with a reason and are never hard-deleted.
- Do not restore `POST /member/donations`; member access is read-only until a separately designed proof-backed member submission flow exists.
- Audit proof access and every staff mutation without storing proof content, private object keys, or full personal data in audit changes.
- Do not alter existing numbered migrations; add a new migration only if persistence shape must change.

---

### Task 1: Reconcile donation API contracts and legacy receipt fields

**Files:**

- Modify: `backend/docs/openapi.yaml`
- Modify: `frontend/src/types/entities.ts`
- Modify: `backend/internal/models/donation.go`

**Interfaces:** `receipt_requested`, `receipt_dispatched_at`, and cancellation fields are the only current receipt/cancellation contract fields. Legacy `tax_receipt_*` columns remain compatibility-only database data until a later audited cleanup migration.

- [ ] Write a contract test or static assertion that `Donation` JSON exposes `receipt_requested` and does not expose `tax_receipt_required`.
- [ ] Update OpenAPI: remove `/member/donations`; remove Admin `PUT`/`DELETE /admin/donations/{id}`; document `POST /admin/donations/{id}/cancel`; replace tax receipt properties with `receipt_requested`, `receipt_dispatched_at`, `cancellation_reason`, and `cancelled_at`.
- [ ] Treat 000035 as immutable. Document in the API/model notes that old tax columns remain compatibility-only and are intentionally not exposed; a later cleanup requires a separate numbered migration and explicit data-retention approval.
- [ ] Update frontend Donation type to remove required tax receipt fields and make receipt/cancellation fields match the API exactly.
- [ ] Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./... && GOCACHE=/private/tmp/wat-profile-go-cache go vet ./...`.
- [ ] Commit: `git add backend/docs/openapi.yaml backend/internal/models/donation.go backend/migrations/000035* frontend/src/types/entities.ts && git commit -m "docs: align donation receipt contracts"`.

### Task 2: Add complete server-side field and category validation

**Files:**

- Modify: `backend/internal/donations/validation.go`
- Modify: `backend/internal/donations/validation_test.go`
- Modify: `backend/internal/handlers/donation_handler.go`
- Modify: `backend/internal/services/donation_service.go`

**Interfaces:** `ValidatePhone(string) error`; `DonationService.ValidateActiveCategory(categoryID *int) error`; public/staff DTO validation invokes both before persistence.

- [ ] Add failing table tests for accepted normalized phone numbers, rejected control characters/overlength input, inactive category, and nonexistent category.
- [ ] Implement `ValidatePhone` with a maximum 32 characters and an allowlist of digits, spaces, `+`, `-`, and parentheses; skip validation only when empty.
- [ ] Add `ValidateActiveCategory`: nil is allowed; non-nil must resolve to an active `DonationCategory`, otherwise return a validation error.
- [ ] Call both validators from public and staff creation after request parsing and before storing proof/creating a Donation Record.
- [ ] Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/donations ./internal/services ./internal/handlers -count=1`.
- [ ] Commit: `git add backend/internal/donations backend/internal/handlers/donation_handler.go backend/internal/services/donation_service.go && git commit -m "feat: validate donation categories and phones"`.

### Task 3: Make donation operations auditable

**Files:**

- Modify: `backend/internal/handlers/donation_handler.go`
- Modify: `backend/internal/routes/routes.go`
- Modify: `backend/internal/services/audit_service.go` only if a safe donation-specific helper is needed
- Modify: `backend/internal/handlers/donation_handler_test.go` or create `backend/internal/handlers/donation_audit_test.go`

**Interfaces:** `DonationHandler` receives `*services.AuditService`; audit actions are `donation.create_staff`, `donation.confirm`, `donation.cancel`, `donation.proof_access`, and `donation.receipt_queue`.

- [ ] Write handler tests asserting each successful mutation/access creates one audit record with donation ID and actor, while proof content/object key are absent from `changes`.
- [ ] Construct `AuditService` in both donation-handler construction paths in `routes.go` and inject it into `NewDonationHandler`.
- [ ] After successful staff create, confirm, cancel, proof stream authorization, and receipt queue, call `LogAction` with only non-sensitive metadata such as source/status/receipt_requested.
- [ ] Treat audit failure as an internal server error for mutation endpoints; for proof access, log before streaming so an unlogged download is never returned.
- [ ] Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/handlers ./internal/services -count=1`.
- [ ] Commit: `git add backend/internal/handlers/donation_handler.go backend/internal/routes/routes.go backend/internal/handlers/donation_audit_test.go && git commit -m "feat: audit donation operations"`.

### Task 4: Restore secure member donation history

**Files:**

- Modify: `backend/internal/routes/routes.go`
- Modify: `backend/internal/handlers/donation_handler.go`
- Modify: `backend/internal/services/donation_service.go`
- Modify: `backend/docs/openapi.yaml`
- Create: `frontend/src/features/public/donations/member-api.ts`
- Create: `frontend/src/features/public/donations/member-queries.ts`
- Modify: `frontend/src/app/[locale]/(client)/account/page.tsx`

**Interfaces:** `GET /member/donations` returns only Donation Records linked to the authenticated member, paginated and excluding private proof keys. It has no create/update/delete action.

- [ ] Write a service test creating donations for two member IDs and assert `ListForMember` returns only the caller's records.
- [ ] Add `ListForMember(userID uuid.UUID, options listquery.CommonOptions)`; follow `RegistrationService.GetMyRegistrations` to resolve `members.user_id = userID`, then filter Donation Records by that member ID. The handler gets `userID` only through `middleware.GetCurrentUserID`.
- [ ] Document the GET route and response in OpenAPI; do not add a member POST route.
- [x] Add the read-only backend contract. The current public Account surface uses a separate `public-account` token audience from the legacy `/member` middleware, so no misleading Account-page panel is mounted until an explicit auth bridge is designed; this avoids a UI that always receives 401 responses.
- [ ] Run backend tests and frontend type-check.
- [ ] Commit: `git add backend/internal/services/donation_service.go backend/internal/handlers/donation_handler.go backend/internal/routes/routes.go backend/docs/openapi.yaml frontend/src/features/public/donations frontend/src/app/'[locale]'/'(client)'/account/page.tsx && git commit -m "feat: show member donation history"`.

### Task 5: Complete localized public/Admin donation UX

**Files:**

- Modify: `frontend/src/features/public/donations/DonationForm.tsx`
- Modify: `frontend/src/features/public/donations/schema.ts`
- Modify: `frontend/src/app/[locale]/admin/donations/page.tsx`
- Create: `frontend/src/components/admin/donations/CancelDonationDialog.tsx`
- Create: `frontend/src/components/admin/donations/StaffDonationForm.tsx`
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`
- Modify: `frontend/src/messages/admin/th.json`
- Modify: `frontend/src/messages/admin/en.json`
- Modify: `frontend/src/messages/admin/de.json`

**Interfaces:** Public form receives active categories from a public query; Admin form uses `staffDonationSchema`; cancel dialog emits `{ reason: string }` only after non-empty field validation.

- [ ] Add public category query and optional category selector. Keep “general support” as the empty default and submit an active category ID only when selected.
- [ ] Add native EUR selects to both forms, even though each currently has one option, so denomination is visible and extensible.
- [ ] Replace `window.prompt` with `CancelDonationDialog`; keep focus in the dialog, require a reason, and render backend errors beside the field.
- [ ] Move the inline Admin form to `StaffDonationForm`, use React Hook Form plus `zodResolver`, and render localized field-level errors. Never render a proof input for staff cash records.
- [ ] Add every new message key in all Thai, English, and German public/Admin message files.
- [ ] Run: `cd frontend && ./node_modules/.bin/tsc --noEmit && npx eslint src/features/public/donations src/components/admin/donations 'src/app/[locale]/admin/donations/page.tsx'`.
- [ ] Commit: `git add frontend/src/features/public/donations frontend/src/components/admin/donations frontend/src/app/'[locale]'/admin/donations/page.tsx frontend/src/messages frontend/src/messages/admin && git commit -m "feat: complete localized donation forms"`.

### Task 6: Migration and acceptance verification

**Files:**

- Modify: `backend/internal/services/donation_operations_test.go`
- Create: `backend/internal/services/donation_service_integration_test.go` if the existing test database harness supports it

- [ ] Add tests for cancellation returned state, requested receipt guards in queue/dispatcher, and cancelled-record receipt suppression.
- [ ] Apply migration 000035 to an empty disposable database and to a copy with `tax_receipt_required=true`; verify `receipt_requested=true` afterward and legacy fields remain unchanged.
- [ ] Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./... && GOCACHE=/private/tmp/wat-profile-go-cache go vet ./... && go build -o /private/tmp/wat-profile-server ./cmd/app`.
- [ ] Run: `cd frontend && ./node_modules/.bin/tsc --noEmit` and targeted donation lint from Task 5.
- [ ] Manual acceptance: public report with valid proof is pending; invalid proof/category/phone is rejected; Admin cash record is confirmed; receipt only sends after request+confirm; cancelled record cannot receive a queued receipt; member sees only their own history; every staff action/proof download appears in audit logs.
- [ ] Commit: `git add backend/internal/services/donation_operations_test.go backend/internal/services/donation_service_integration_test.go && git commit -m "test: verify donation operations end to end"`.
