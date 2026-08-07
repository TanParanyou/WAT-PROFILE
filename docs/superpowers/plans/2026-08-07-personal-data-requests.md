# Personal Data Requests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let authorised staff verify a requester, find selected personal data, export it privately, or anonymise permitted data with an audit trail.

**Architecture:** Request and item aggregates record verification and selected domain records. Discovery returns minimised candidates; actions require verified status. Exports and deferred external-object deletion are private, retryable service workflows.

**Tech Stack:** Go 1.24, Fiber, GORM/PostgreSQL, R2, Next.js 16, React 19, React Hook Form, Zod.

## Global Constraints

- This slice does not add automatic retention.
- Before export or erasure require an expiring email verification link or recorded in-person verification.
- Preserve accounting fields on Donation; never log PII, proof URLs, tokens, full IP, or user agent in AuditLog changes.
- Add `privacy_requests` to routes, role seeds, PermissionEditor, OpenAPI, sidebar, and th/en/de messages.

---

### Task 1: Add request persistence and permission catalog

**Files:** Create `backend/migrations/000031_add_personal_data_requests.{up,down}.sql`, `backend/internal/models/personal_data_request.go`; modify `backend/internal/config/config.go`, `backend/cmd/seed/main.go`, `frontend/src/components/admin/PermissionEditor.tsx`; test `backend/internal/models/personal_data_request_test.go`.

- [ ] Write a failing test that an `open` request cannot perform actions until verification succeeds.
- [ ] Run `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/models -run TestPersonalDataRequest -count=1`; expect failure.
- [ ] Add `PersonalDataRequest` fields for subject email/member code, request type, verification method/status/evidence reference, request status, notes, and actor timestamps. Add `PersonalDataRequestItem` fields for domain, record ID, match basis, selected action, result, and reason.
- [ ] Seed `privacy_requests: "all"` only for `admin`; add its Thai/English label to PermissionEditor.
- [ ] Run the model test; expect pass; commit `feat(privacy): add data request records`.

### Task 2: Implement verification, discovery, and anonymisation

**Files:** Create `backend/internal/services/personal_data_request_service.go`, `backend/internal/services/personal_data_discovery_service.go`, `backend/internal/services/personal_data_action_service.go`, `backend/internal/services/personal_data_export_service.go`; test `backend/internal/services/personal_data_discovery_service_test.go`, `backend/internal/services/personal_data_action_service_test.go`.

- [ ] Write failing tests for standalone Member discovery by member code, verified-only completion, Donation PII redaction that preserves amount/date/receipt number, and audit payload without PII.
- [ ] Run `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services -run 'Test(PersonalData|Discovery)' -count=1`; expect failure.
- [ ] Implement `Discover(PersonalDataSearch)` across ContactInquiry, EventRegistration, Donation, Member, and User. Return `{domain, recordID, matchBasis, displayName, email}` only; do not return payment proof or secrets.
- [ ] Implement email-token and in-person verification. Implement selected-item actions only after verification. Use a database outbox record for R2 deletes; retry it outside the database transaction.
- [ ] Run focused service tests; expect pass; commit `feat(privacy): verify and process data requests`.

### Task 3: Add API, private export, and Admin page

**Files:** Create `backend/internal/handlers/personal_data_request_handler.go`, `frontend/src/app/[locale]/admin/privacy-requests/page.tsx`, `frontend/src/services/personalDataRequestService.ts`, `frontend/src/types/personal-data-request.ts`; modify `backend/internal/routes/routes.go`, `backend/docs/openapi.yaml`, `frontend/src/components/admin/AdminSidebar.tsx`, and `frontend/src/messages/admin/{th,en,de}.json`; test `backend/internal/handlers/personal_data_request_handler_test.go`.

- [ ] Write failing tests that unverified export returns conflict, unknown selected IDs return 400, and all privacy routes require `privacy_requests` permission.
- [ ] Run `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/handlers -run TestPersonalDataRequest -count=1`; expect failure.
- [ ] Register list, create, detail, search, complete, reject, and export routes under `/admin/privacy-requests`. Export selected records to a private expiring artifact; audit only request ID, action, actor, reason category, and affected count.
- [ ] Build list/detail stepper with verification state, candidates grouped by domain, explicit selection, typed reason confirmation, export/erasure disabled until verified, and Donation warning. Use PermissionGuard and invalidate request queries after mutation.
- [ ] Run `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./... && go vet ./...` and `cd frontend && npm run lint && ./node_modules/.bin/tsc --noEmit && npm run build`; expect pass; commit `feat(privacy): add personal data request administration`.

## Self-review

Tasks cover identity verification, all requested discovery domains, selective export/anonymisation, accounting preservation, private artifacts, retryable external deletion, RBAC, audit minimisation, localization, OpenAPI, and verification without automatic retention.
