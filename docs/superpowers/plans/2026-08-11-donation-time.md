# Donation Transfer Time Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Require users and staff to submit the transfer time while preserving legacy donations that have no recorded time.

**Architecture:** Store a separate nullable PostgreSQL `TIME` column as the canonical `donation_time` value and validate new writes as `HH:mm`. Extend the shared date/time picker primitives with public/admin theme variants, then update both donation forms and all typed API/documentation surfaces.

**Tech Stack:** Go 1.24, Fiber, GORM, PostgreSQL migrations, Next.js 16, React Hook Form, Zod, `react-datepicker`, `date-fns`, OpenAPI.

## Global Constraints

- Preserve `th`, `en`, and `de` messages.
- Keep `donation_date` as PostgreSQL `DATE` and do not convert `donation_time` to UTC.
- New public and staff create requests require `donation_time` in `HH:mm`; legacy read data may be empty/null.
- Do not use TypeScript `any` or bypass backend validation.
- Update API, frontend contracts, OpenAPI, migration, model, and tests together.

### Task 1: Add the nullable donation-time database/model field

**Files:**
- Create: `backend/migrations/000037_add_donation_time.up.sql`
- Create: `backend/migrations/000037_add_donation_time.down.sql`
- Modify: `backend/internal/models/donation.go`

- [x] Add `donation_time TIME` only if the column is absent; do not backfill old rows.
- [x] Make down migration drop only `donation_time` if it exists.
- [x] Add `DonationTime *models.TimeOfDay` with `gorm:"type:time" json:"donation_time"` and keep legacy reads null when NULL.

### Task 2: Validate and persist time on backend creates

**Files:**
- Modify: `backend/internal/donations/validation.go`
- Modify: `backend/internal/donations/validation_test.go`
- Modify: `backend/internal/handlers/donation_handler.go`
- Modify: `backend/internal/services/donation_document_service.go`

- [x] Add `DonationTime` to public/staff validation inputs and reject empty or non-`HH:mm` values with field `donation_time`.
- [x] Pass multipart `donation_time` and staff JSON `donation_time` through validation and model creation.
- [x] Include the time in generated receipts only when it is present.
- [x] Add valid, empty, malformed, out-of-range, and minute-range unit tests.

### Task 3: Synchronize OpenAPI and frontend domain contracts

**Files:**
- Modify: `backend/docs/openapi.yaml`
- Modify: `frontend/src/features/public/donations/api.ts`
- Modify: `frontend/src/features/public/donations/schema.ts`
- Modify: `frontend/src/types/entities.ts`
- Modify: `frontend/src/schemas/donation.schema.ts`

- [x] Add required `donation_time` to public multipart and staff input schemas with `HH:mm` pattern.
- [x] Add nullable `donation_time` to donation/member response schemas and frontend types.
- [x] Add localized schema messages for required/invalid time.

### Task 4: Make the shared time picker public-theme compatible

**Files:**
- Modify: `frontend/src/components/ui/TimePicker.tsx`
- Modify: `frontend/src/app/globals.css`

- [x] Add `variant`, `locale`, `placeholder`, and localized time-caption props while preserving Admin defaults.
- [x] Keep output format `HH:mm` and 15-minute selection intervals.
- [x] Portal public calendars into `public-modal-root` and style calendar controls with public role tokens.

### Task 5: Update public and admin donation forms and displays

**Files:**
- Modify: `frontend/src/features/public/donations/DonationReportForm.tsx`
- Modify: `frontend/src/features/admin/donations/StaffDonationForm.tsx`
- Modify: `frontend/src/app/[locale]/admin/donations/page.tsx`
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`
- Modify: `frontend/src/messages/admin/th.json`
- Modify: `frontend/src/messages/admin/en.json`
- Modify: `frontend/src/messages/admin/de.json`

- [x] Add controlled `TimePicker` fields next to date fields and map errors to `donation_time`.
- [x] Require time in public and staff forms; keep old records readable without a fabricated time.
- [x] Show time in admin date cells and CSV exports when present.
- [x] Keep all changed copy present in all six locale files.

### Task 6: Verify and commit

- [x] Run targeted frontend ESLint, TypeScript, production build, and donation tests.
- [x] Run `GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/donations` and relevant backend tests.
- [x] Run `git diff --check`, migration review, and locale parity checks.
- [x] Commit only the donation-time implementation files.
