# Production Hardening Review Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the public Contact contract, shared responses, public theme tokens, frontend lockfiles, and media rollout documentation with the reviewed production behavior.

**Architecture:** Keep Contact runtime semantics unchanged. Introduce a status-aware shared success response for the existing `201` envelope, document the specific Contact error shapes in OpenAPI, and make the public page consume established `site-*` theme roles. Regenerate the Yarn v1 lockfile from the existing manifest, then document the prerequisite order for browser-only managed-media cropping.

**Tech Stack:** Go 1.24, Fiber v2, OpenAPI 3 YAML, Next.js 16, React 19, Tailwind CSS 4, Yarn 1.22, npm lockfile.

## Global Constraints

- Do not modify any file under `frontend/src/app/[locale]/admin/website`.
- Preserve the Contact success body exactly: `{ "success": true, "message": "Message received." }` with HTTP 201.
- Preserve Contact persistence, honeypot, rate-limit, retry, and UI-copy behavior.
- `website` is an optional honeypot: a non-empty value receives generic success without validation or persistence.
- Supported locales remain exactly `th`, `en`, and `de`.
- Do not add dependencies, `any`, `as any`, `@ts-ignore`, secrets, or production values.
- Keep `package-lock.json` unchanged unless dependency resolution proves it inconsistent; `npm ci` remains the reproducible frontend install command.

---

## File Map

- Modify `backend/pkg/utils/response.go`: add a reusable success-message sender with an explicit status code.
- Modify `backend/pkg/utils/response_test.go`: prove a 201 response retains the standard message envelope.
- Modify `backend/internal/handlers/contact_handler.go`: use the shared 201 response for real and honeypot submissions.
- Modify `backend/docs/openapi.yaml`: define Contact-specific 400/429 response schemas and remove the unsupported honeypot length.
- Modify `frontend/src/app/[locale]/(client)/contact/ContactContent.tsx`: replace raw red/emerald classes with public theme roles.
- Modify `frontend/yarn.lock`: remove stale Resend and React Email graph entries using Yarn v1 resolution.
- Modify `docs/DEPLOYMENT.md`: make CORS verification an explicit prerequisite to frontend build/deploy.

### Task 1: Standardize the Contact HTTP 201 response

**Files:**

- Modify: `backend/pkg/utils/response.go`
- Modify: `backend/pkg/utils/response_test.go`
- Modify: `backend/internal/handlers/contact_handler.go`

**Interfaces:**

- Produces: `MessageResponseWithStatus(c *fiber.Ctx, statusCode int, message string) error`.
- Preserves: `MessageResponse(c, message)` as the existing HTTP 200 convenience wrapper.

- [ ] **Step 1: Write the failing status-aware response test**

Add to `backend/pkg/utils/response_test.go`:

```go
func TestMessageResponseWithStatusUsesMessageEnvelope(t *testing.T) {
	app := fiber.New()
	app.Post("/", func(c *fiber.Ctx) error {
		return MessageResponseWithStatus(c, fiber.StatusCreated, "Message received.")
	})

	response, err := app.Test(httptest.NewRequest(http.MethodPost, "/", nil))
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	var body struct {
		Success bool   `json:"success"`
		Message string `json:"message"`
	}
	if err := json.NewDecoder(response.Body).Decode(&body); err != nil {
		t.Fatal(err)
	}
	if response.StatusCode != fiber.StatusCreated || !body.Success || body.Message != "Message received." {
		t.Fatalf("unexpected response: status=%d body=%+v", response.StatusCode, body)
	}
}
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./pkg/utils -run TestMessageResponseWithStatusUsesMessageEnvelope -v`

Expected: FAIL because `MessageResponseWithStatus` does not exist.

- [ ] **Step 3: Write the minimal shared response implementation**

In `backend/pkg/utils/response.go`, add and use:

```go
func MessageResponseWithStatus(c *fiber.Ctx, statusCode int, message string) error {
	return c.Status(statusCode).JSON(fiber.Map{
		"success": true,
		"message": message,
	})
}

func MessageResponse(c *fiber.Ctx, message string) error {
	return MessageResponseWithStatus(c, fiber.StatusOK, message)
}
```

In `SubmitContact`, replace both direct 201 JSON expressions—the filled-honeypot
path and committed-inquiry path—with:

```go
return utils.MessageResponseWithStatus(c, fiber.StatusCreated, "Message received.")
```

Leave error/status logic unchanged.

- [ ] **Step 4: Verify the response package and affected backend compile**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./pkg/utils ./internal/handlers/... ./cmd/app -run 'Test(MessageResponseWithStatusUsesMessageEnvelope|ContactRateLimitResponse)' -v`

Expected: PASS; packages without a matching test still compile.

- [ ] **Step 5: Commit**

```bash
git add backend/pkg/utils/response.go backend/pkg/utils/response_test.go backend/internal/handlers/contact_handler.go
git commit -m "fix(contact): use shared created response"
```

### Task 2: Make the Contact OpenAPI contract exact

**Files:**

- Modify: `backend/docs/openapi.yaml`

**Interfaces:**

- Produces: `ContactValidationError` with `success`, `error`, `fields`, and `trace_id`.
- Produces: `ContactRateLimitError` with `success`, `error`, `code: CONTACT_RATE_LIMITED`, and `trace_id`.
- Consumes: current `FieldErrorResponse` and `CodedErrorResponse` runtime envelopes.

- [ ] **Step 1: Run the failing structural check**

```bash
ruby -e 'require "yaml"; d = YAML.load_file("backend/docs/openapi.yaml"); s = d.fetch("components").fetch("schemas"); abort "missing ContactValidationError" unless s.key?("ContactValidationError"); abort "missing ContactRateLimitError" unless s.key?("ContactRateLimitError")'
```

Expected: non-zero exit and `missing ContactValidationError`.

- [ ] **Step 2: Add Contact-specific response schemas**

Under `components.schemas`, add:

```yaml
ContactValidationError:
  type: object
  required: [success, error, fields, trace_id]
  properties:
    success: {type: boolean, enum: [false]}
    error: {type: string}
    fields:
      type: object
      additionalProperties: {type: string}
    trace_id: {type: string}

ContactRateLimitError:
  type: object
  required: [success, error, code, trace_id]
  properties:
    success: {type: boolean, enum: [false]}
    error: {type: string}
    code: {type: string, enum: [CONTACT_RATE_LIMITED]}
    trace_id: {type: string}
```

Change `/public/contact` response schemas:

- `400` references `ContactValidationError`.
- `429` references `ContactRateLimitError` and keeps the integer `Retry-After` header.
- `500` continues using generic `ErrorResponse`.

Remove only `maxLength: 200` from `ContactInput.website`; retain its optional
honeypot description.

- [ ] **Step 3: Run the passing structural and YAML checks**

```bash
ruby -e 'require "yaml"; d = YAML.load_file("backend/docs/openapi.yaml"); s = d.fetch("components").fetch("schemas"); abort "missing fields" unless s.fetch("ContactValidationError").fetch("properties").key?("fields"); abort "bad contact code" unless s.fetch("ContactRateLimitError").dig("properties", "code", "enum") == ["CONTACT_RATE_LIMITED"]; abort "website max remains" if s.fetch("ContactInput").fetch("properties").fetch("website").key?("maxLength")'
git diff --check -- backend/docs/openapi.yaml
```

Expected: both commands exit 0.

- [ ] **Step 4: Commit**

```bash
git add backend/docs/openapi.yaml
git commit -m "docs(contact): specify validation errors"
```

### Task 3: Use public design tokens for Contact status UI

**Files:**

- Modify: `frontend/src/app/[locale]/(client)/contact/ContactContent.tsx`

**Interfaces:**

- Consumes: `site-danger`, `site-danger-surface`, `site-surface`, `site-border`, and `site-foreground`.
- Preserves: localized messages, `role="alert"`, `role="status"`, `aria-live`, submission, and field errors.

- [ ] **Step 1: Confirm the roles already exist**

Run: `rg -n 'color-site-(danger|danger-surface|surface|border|foreground)' frontend/src/app/globals.css`

Expected: all five mappings exist; do not create a new color token.

- [ ] **Step 2: Replace raw utilities only**

In `ContactContent.tsx`, change the root error class to:

```tsx
className="flex items-start gap-2 border border-site-danger bg-site-danger-surface p-3 text-sm text-site-danger"
```

Change the success class to:

```tsx
className="flex items-center gap-2 border border-site-border bg-site-surface p-3 text-sm text-site-foreground"
```

Change each field-error paragraph class to:

```tsx
className="mt-1 text-sm text-site-danger"
```

Do not alter component structure, icons, ARIA, or copy.

- [ ] **Step 3: Verify source and frontend contracts**

```bash
rg -n 'red-|emerald-' 'frontend/src/app/[locale]/(client)/contact/ContactContent.tsx'
cd frontend && ./node_modules/.bin/tsx --test src/features/public/contact/schema.test.ts src/features/public/contact/api.test.ts && ./node_modules/.bin/eslint 'src/app/[locale]/(client)/contact/ContactContent.tsx' && ./node_modules/.bin/tsc --noEmit
```

Expected: first command exits 1 with no output; focused tests, lint, and type-check exit 0.

- [ ] **Step 4: Commit**

```bash
git add 'frontend/src/app/[locale]/(client)/contact/ContactContent.tsx'
git commit -m "fix(contact): use public theme tokens"
```

### Task 4: Align Yarn resolution and media rollout instructions

**Files:**

- Modify: `frontend/yarn.lock`
- Modify: `docs/DEPLOYMENT.md`

**Interfaces:**

- Consumes: `frontend/package.json`, which has no direct Resend or React Email dependency.
- Produces: a Yarn v1 lockfile without `resend` or `@react-email/*` entries.
- Produces: explicit CORS-before-build instructions for managed media.

- [ ] **Step 1: Regenerate Yarn v1 resolution**

Run: `cd frontend && yarn install --ignore-scripts`

Expected: `yarn.lock` updates from the current manifest. Inspect the diff. If files
other than `yarn.lock` change, restore only generated/unrelated files; do not
alter `package.json` or `package-lock.json`.

- [ ] **Step 2: Verify obsolete packages are absent**

Run: `rg -n '^resend@|^"@react-email' frontend/yarn.lock`

Expected: no output and exit 1.

- [ ] **Step 3: State the media release order**

In `docs/DEPLOYMENT.md`, make the managed-media invariant a numbered sequence:

```markdown
1. Configure the exact managed-media origin and R2/CDN CORS for GET and HEAD
   from each deployed frontend origin; verify the response includes Content-Type.
2. Set NEXT_PUBLIC_MEDIA_ALLOWED_ORIGINS to that same origin.
3. Only then build and deploy the frontend; rebuild whenever the allowlist changes.
```

Keep the existing warning about credentials and `*`.

- [ ] **Step 4: Verify lockfile, docs, and npm consistency**

```bash
rg -n '^resend@|^"@react-email' frontend/yarn.lock
git diff --check -- frontend/yarn.lock docs/DEPLOYMENT.md
cd frontend && npm ci --ignore-scripts --dry-run --no-audit --no-fund
```

Expected: the first command exits 1; the remaining commands exit 0.

- [ ] **Step 5: Commit**

```bash
git add frontend/yarn.lock docs/DEPLOYMENT.md
git commit -m "chore: align media delivery guidance"
```

### Task 5: Final scoped verification

**Files:**

- Verify only files changed by Tasks 1–4.

**Interfaces:**

- Verifies: Contact contract documentation, response consistency, token compliance, dependency metadata, and release guidance.

- [ ] **Step 1: Run backend verification**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./pkg/utils ./internal/handlers/... ./cmd/app && GOCACHE=/private/tmp/wat-profile-go-cache go vet ./...`

Expected: exit 0.

- [ ] **Step 2: Run frontend verification**

Run: `cd frontend && ./node_modules/.bin/tsx --test src/features/public/contact/schema.test.ts src/features/public/contact/api.test.ts && ./node_modules/.bin/tsc --noEmit`

Expected: exit 0.

- [ ] **Step 3: Run final scope checks**

```bash
git diff --check ee53ef6...HEAD
git diff --name-only ee53ef6...HEAD | rg '^frontend/src/app/\[locale\]/admin/website/'
```

Expected: `git diff --check` exits 0; the scope command exits 1 with no output,
confirming the excluded directory remains untouched by this remediation.

- [ ] **Step 4: Record final status**

Report verification output, any known repository-wide lint baseline, and confirm
that `docs/DEPLOYMENT_TH.md` plus
`docs/superpowers/plans/2026-08-13-client-hero-mobile-fallback.md` remain
untracked user files.

