# Event Registration Deadline Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with review checkpoints.

**Goal:** Prevent Admin users and direct API callers from saving a registration deadline later than an event's effective start time.

**Architecture:** Keep the rule in a pure backend service validation helper and call it from both event mutation handlers before persistence. Mirror the same date-only rule in the existing Admin Zod schema so the form gives immediate localized feedback, while the backend remains authoritative.

**Tech Stack:** Go 1.24, Fiber/GORM, Go `time`, Next.js 16, React Hook Form, Zod, `next-intl`, date-only HTML inputs.

## Global Constraints

- Preserve `th`, `en`, and `de` translations in every changed message file.
- Keep `Europe/Berlin` semantics for event dates and times.
- Do not bypass backend validation or change existing event data automatically.
- Keep API errors in the existing `utils.ErrorResponse` shape.
- Do not use TypeScript `any`, `as any`, or `@ts-ignore`.

### Task 1: Add backend event-window validation

**Files:**
- Create: `backend/internal/services/event_validation.go`
- Create: `backend/internal/services/event_validation_test.go`
- Modify: `backend/internal/handlers/event_handler.go`

**Interfaces:**
- Produce `services.ValidateEventRegistrationDeadline(event *models.Event) error`.
- Produce `services.ErrRegistrationDeadlineAfterStart` for handlers and tests.

- [x] **Step 1: Write failing service tests** for a deadline before start, equal to the effective start, after start, no start time, no deadline, and date/time conversion in `Europe/Berlin`.
- [x] **Step 2: Run the focused Go test** and confirm the new validation symbol is missing or the invalid case fails.
- [x] **Step 3: Implement the helper** using the event date and optional start time in `Europe/Berlin`; interpret the Admin deadline as the end of its selected Berlin calendar day and reject it when it is after the effective start.
- [x] **Step 4: Call validation from `CreateEvent` and `UpdateEvent`** after body parsing/rich-text validation and before `CreateWithResourceIDs`, `Update`, or resource replacement; map the sentinel error to HTTP 400.
- [x] **Step 5: Run focused backend tests** and confirm all cases pass.

### Task 2: Add Admin form validation and localized copy

**Files:**
- Modify: `frontend/src/schemas/event.schema.ts`
- Modify: `frontend/src/messages/admin/th.json`
- Modify: `frontend/src/messages/admin/en.json`
- Modify: `frontend/src/messages/admin/de.json`

**Interfaces:**
- Keep `eventSchema` as the existing `zodResolver` contract used by `EventEditor`.
- Add the localized key `Admin.events.form.registrationDeadlineAfterStart` for the schema refinement message.

- [x] **Step 1: Add schema tests** for deadline before start (valid), deadline on the event start date (invalid because the selected deadline means 23:59:59), and no deadline (valid).
- [x] **Step 2: Run the focused schema test** and confirm the new invalid case fails before the refinement exists.
- [x] **Step 3: Add the cross-field Zod refinement** comparing normalized `YYYY-MM-DD` values and attach the issue to `registration_deadline` with the new translation key.
- [x] **Step 4: Add Thai, English, and German translations** for the validation message.
- [x] **Step 5: Run the focused frontend schema test** and JSON parsing checks.

### Task 3: Verify the full change

**Files:**
- No additional source files.

- [x] **Step 1: Run backend `go test ./...` with the repository GOCACHE override.**
- [x] **Step 2: Run backend `go vet ./...` with the same cache override.**
- [x] **Step 3: Run frontend TypeScript, targeted ESLint, and the focused schema tests.**
- [x] **Step 4: Run the frontend webpack production build with safe placeholder environment values.**
- [x] **Step 5: Review `git diff --check` and ensure only owned files are staged before committing.**
