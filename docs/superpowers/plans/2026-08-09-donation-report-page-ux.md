# Donation Report Page UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move public donation reporting to a focused, accessible page with localized field-level validation while keeping the home-page donation section calm.

**Architecture:** `DonationSection` becomes payment guidance plus a locale-aware CTA. The new route composes a feature-owned React Hook Form that uses a localized Zod schema, a TanStack Query category query, and the existing proof-backed API. The Go handler continues to be authoritative and returns optional structured field errors so client errors are shown beside the affected input rather than only as a generic alert.

**Tech Stack:** Next.js 16 App Router, React 19, React Hook Form, Zod, TanStack Query, next-intl, Go 1.24, Fiber v2.

## Global Constraints

- Currency is EUR only; public reports allow bank transfer or PayPal only and require PDF/JPEG/PNG/WebP proof no larger than 10 MB.
- Category is optional; an entered ID must be active. Phone is optional but validated when present.
- Preserve `th`, `en`, and `de`; do not put new user-facing strings in schemas or components.
- Public components use `publicApi`/feature API boundaries and TanStack Query; do not fetch categories with `useEffect`.
- Keep 44px controls, visible labels, 3px focus state, keyboard operation, mobile single-column order, and no rounded/card-heavy public design.
- Keep backend validation authoritative and preserve `trace_id` in failure envelopes.
- Do not modify existing numbered migrations.

---

## File Structure

| File | Responsibility |
|---|---|
| `backend/pkg/utils/response.go` | Optional structured field errors while retaining the standard error envelope. |
| `backend/pkg/utils/response_test.go` | Response-envelope contract coverage. |
| `backend/internal/donations/validation.go` | Donation validation errors with stable field names. |
| `backend/internal/donations/validation_test.go` | Validation field-name and rule coverage. |
| `backend/internal/handlers/donation_handler.go` | Maps public donation validation failures to structured responses. |
| `backend/docs/openapi.yaml` | Documents optional `fields` in public donation 400 responses. |
| `frontend/src/features/public/donations/api.ts` | Typed public donation API and category DTO. |
| `frontend/src/features/public/donations/queries.ts` | Stable TanStack Query key and active-category query. |
| `frontend/src/features/public/donations/schema.ts` | Localized schema factory and shared report values. |
| `frontend/src/features/public/donations/DonationReportForm.tsx` | Form state, submission, field errors, success state, and accessibility. |
| `frontend/src/app/[locale]/(client)/donate/report/page.tsx` | New route metadata and public-page composition. |
| `frontend/src/components/home/DonationSection.tsx` | Payment guidance plus link to the report page, no inline form. |
| `frontend/src/messages/{th,en,de}.json` | CTA, route copy, validation, error, and success messages. |

### Task 1: Return donation validation errors by field

**Files:**
- Modify: `backend/pkg/utils/response.go`
- Create: `backend/pkg/utils/response_test.go`
- Modify: `backend/internal/donations/validation.go`
- Modify: `backend/internal/donations/validation_test.go`
- Modify: `backend/internal/handlers/donation_handler.go`
- Modify: `backend/docs/openapi.yaml`

**Interfaces:**
- Produces `utils.FieldErrorResponse(c, status, message, fields)` where `fields` is `map[string]string` and `trace_id` remains present.
- Produces `donations.ValidationError{Field string, Message string}`; `Field` is one of `amount`, `currency`, `donation_date`, `donation_method`, `donor_name`, `donor_email`, `donor_phone`, `category_id`, `proof`, or `privacy_acknowledged`.

- [ ] **Step 1: Write failing Go tests for the envelope and field classification.**

```go
func TestFieldErrorResponseIncludesFieldsAndTraceID(t *testing.T) {
  app := fiber.New()
  app.Get("/", func(c *fiber.Ctx) error {
    c.Locals("trace_id", "trace-test")
    return FieldErrorResponse(c, fiber.StatusBadRequest, "Invalid donation", map[string]string{"donor_email": "Invalid email"})
  })
  response, err := app.Test(httptest.NewRequest(http.MethodGet, "/", nil))
  if err != nil { t.Fatal(err) }
  var body map[string]any
  if err := json.NewDecoder(response.Body).Decode(&body); err != nil { t.Fatal(err) }
  if body["trace_id"] != "trace-test" || body["fields"].(map[string]any)["donor_email"] != "Invalid email" { t.Fatal(body) }
}

func TestValidatePublicInputReturnsFieldError(t *testing.T) {
  err := ValidatePublicInput(PublicInput{Amount: "0", Currency: "EUR"})
  var validationErr *ValidationError
  if !errors.As(err, &validationErr) || validationErr.Field != "amount" {
    t.Fatalf("expected amount field error, got %v", err)
  }
}
```

- [ ] **Step 2: Run the focused tests and confirm they fail.**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./pkg/utils ./internal/donations -run 'Test(FieldErrorResponse|ValidatePublicInputReturnsFieldError)' -count=1`

Expected: FAIL because the response helper and typed validation error do not yet exist.

- [ ] **Step 3: Implement typed validation errors and the response helper.**

```go
type ValidationError struct { Field, Message string }
func (e *ValidationError) Error() string { return e.Message }

func FieldErrorResponse(c *fiber.Ctx, status int, message string, fields map[string]string) error {
  traceID, _ := c.Locals("trace_id").(string)
  if traceID == "" { traceID = c.GetRespHeader("X-Trace-Id") }
  return c.Status(status).JSON(fiber.Map{"success": false, "error": message, "fields": fields, "trace_id": traceID})
}
```

Replace each public-input rule's raw `fmt.Errorf` with a `*ValidationError` carrying the field named above. Keep staff validation behavior but return the same typed errors. In `SubmitSelfReported`, use `errors.As` to return `FieldErrorResponse` for validation, category parsing, and proof failures; retain normal `ErrorResponse` for storage/internal failures. Add the optional `fields` object to the OpenAPI error schema and the public donations `400` response description.

- [ ] **Step 4: Run focused and full backend verification.**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./pkg/utils ./internal/donations ./internal/handlers -count=1 && GOCACHE=/private/tmp/wat-profile-go-cache go test ./... && GOCACHE=/private/tmp/wat-profile-go-cache go vet ./...`

Expected: PASS.

- [ ] **Step 5: Commit the backend validation contract.**

```bash
git add backend/pkg/utils/response.go backend/pkg/utils/response_test.go backend/internal/donations/validation.go backend/internal/donations/validation_test.go backend/internal/handlers/donation_handler.go backend/docs/openapi.yaml
git commit -m "feat: return donation field validation errors"
```

### Task 2: Create typed client data and localized validation boundaries

**Files:**
- Modify: `frontend/src/features/public/donations/api.ts`
- Create: `frontend/src/features/public/donations/queries.ts`
- Modify: `frontend/src/features/public/donations/schema.ts`
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`

**Interfaces:**
- Produces `useDonationCategoriesQuery()` with key `['public', 'donation-categories']`.
- Produces `createSelfReportedDonationSchema(messages)` and `DonationReportValues`.
- Produces `PublicDonationApiError` with `message: string` and `fields: Record<string, string>`.

- [ ] **Step 1: Write the failing schema and API-envelope tests where the existing TypeScript runner can execute them; otherwise add compile-time fixtures and document the runner gap.**

```ts
const schema = createSelfReportedDonationSchema(messages);
expect(schema.safeParse({ amount: "0", /* valid remaining fields */ }).success).toBe(false);
expect(parseDonationApiError({ error: "Invalid", fields: { donor_email: "..." } }).fields.donor_email).toBeDefined();
```

- [ ] **Step 2: Run the focused test command or record the repository's TypeScript-runner limitation before implementation.**

Run: `cd frontend && node --test src/features/public/donations/*.test.ts`

Expected: if Node cannot resolve TypeScript aliases, record that limitation and retain the fixtures for future runner wiring; do not add a test dependency solely for this feature.

- [ ] **Step 3: Implement the feature boundary.**

```ts
export const donationKeys = { categories: () => ['public', 'donation-categories'] as const };
export function useDonationCategoriesQuery() {
  return useQuery({ queryKey: donationKeys.categories(), queryFn: getPublicDonationCategories, staleTime: 60_000, retry: shouldRetryPublicQuery });
}
```

Use `publicApi` for `/donation-categories` and `/donations`; unwrap the success envelope and narrow failed Axios payloads to `{ error?: string; fields?: Record<string, string> }`. Replace English Zod literals with a schema-message object supplied by `DonationReportForm`. Add every route/form/validation/error/success message in all three locale files.

- [ ] **Step 4: Type-check the feature boundary.**

Run: `cd frontend && ./node_modules/.bin/tsc --noEmit`

Expected: PASS.

- [ ] **Step 5: Commit typed data and localized validation.**

```bash
git add frontend/src/features/public/donations/api.ts frontend/src/features/public/donations/queries.ts frontend/src/features/public/donations/schema.ts frontend/src/messages/th.json frontend/src/messages/en.json frontend/src/messages/de.json
git commit -m "feat: localize donation report validation"
```

### Task 3: Build the focused donation report page and remove the inline form

**Files:**
- Create: `frontend/src/features/public/donations/DonationReportForm.tsx`
- Create: `frontend/src/app/[locale]/(client)/donate/report/page.tsx`
- Modify: `frontend/src/components/home/DonationSection.tsx`
- Delete: `frontend/src/features/public/donations/DonationForm.tsx`

**Interfaces:**
- Consumes `useDonationCategoriesQuery`, `createSelfReportedDonationSchema`, `submitSelfReportedDonation`, and `PublicDonationApiError` from Task 2.
- Produces the locale-aware route `/[locale]/donate/report` and leaves the home page with a `Link href="/donate/report"` CTA.

- [ ] **Step 1: Add the report page shell and assert route composition through a TypeScript compile fixture.**

```tsx
export default async function DonationReportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <DonationReportForm locale={locale as 'th' | 'en' | 'de'} />;
}
```

Include `generateMetadata` using `buildPublicMetadata`, pathname `/${locale}/donate/report`, and localized title/description. Use the public canvas, a back link to `/#donate`, one `h1`, and a readable `max-w-3xl` content rail.

- [ ] **Step 2: Implement `DonationReportForm` with React Hook Form.**

```tsx
const form = useForm<DonationReportValues>({
  resolver: zodResolver(createSelfReportedDonationSchema(messages)),
  mode: 'onBlur',
  reValidateMode: 'onChange',
  shouldFocusError: true,
  defaultValues: { currency: 'EUR', donation_method: 'bank_transfer', category_id: null, receipt_requested: false, privacy_acknowledged: false },
});
```

Render `fieldset`/`legend` sections named donation details and contact/proof. Give every input an ID, visible label, `aria-invalid`, and `aria-describedby` when it has an error. Map API `fields` keys with `form.setError(field, { type: 'server', message })`; use `root.server` for unclassified failures. Show the accepted proof types and 10 MB limit before the file picker. On success, call `form.reset()` and render the localized success state with the back link.

- [ ] **Step 3: Simplify `DonationSection`.**

Replace the `DonationForm` import and rendered form with a single public-theme primary `Link` to `/donate/report`. Add `id="donate"` to the donation section so the report page's back link reaches payment instructions. Do not change QR modal behavior or payment-data loading/error states.

- [ ] **Step 4: Run type-check and targeted lint.**

Run: `cd frontend && ./node_modules/.bin/tsc --noEmit && npx eslint src/features/public/donations src/components/home/DonationSection.tsx 'src/app/[locale]/(client)/donate/report/page.tsx'`

Expected: PASS.

- [ ] **Step 5: Commit the focused report experience.**

```bash
git add frontend/src/features/public/donations/DonationReportForm.tsx frontend/src/features/public/donations/DonationForm.tsx frontend/src/app/'[locale]'/'(client)'/donate/report/page.tsx frontend/src/components/home/DonationSection.tsx
git commit -m "feat: move donation reporting to dedicated page"
```

### Task 4: Verify responsive, localized, and operational behavior

**Files:**
- Modify only if verification exposes a defect: files from Tasks 1–3.

**Interfaces:**
- Verifies public report input rules, page navigation, and backend rejection paths without altering payment or Admin donation workflows.

- [ ] **Step 1: Run complete automated verification.**

Run:

```bash
cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./... && GOCACHE=/private/tmp/wat-profile-go-cache go vet ./... && GOCACHE=/private/tmp/wat-profile-go-cache go build -o /private/tmp/wat-profile-server ./cmd/app
cd frontend && ./node_modules/.bin/tsc --noEmit && npx eslint src/features/public/donations src/components/home/DonationSection.tsx 'src/app/[locale]/(client)/donate/report/page.tsx'
```

Expected: PASS. If `npm run build` requires an HTTPS public API environment, run it with an explicit non-production HTTPS test URL and report the environment requirement rather than editing `.env.local`.

- [ ] **Step 2: Run manual browser acceptance in each locale.**

Verify at 375px and 1440px: Home contains no report fields; CTA navigates to the report page; empty submit focuses the first invalid control; invalid email/phone/category/file/privacy errors are attached to their fields; valid proof report reaches success; browser back returns to payment instructions; long German text does not overflow; keyboard focus is visible.

- [ ] **Step 3: Verify backend-authoritative rejection.**

Submit direct malformed multipart requests for a zero amount, non-EUR currency, inactive category, invalid phone, oversized/unsupported proof, and missing privacy acknowledgement. Confirm each response is `400`, preserves `trace_id`, and returns the matching `fields` key without storing a proof.

- [ ] **Step 4: Commit verification fixes only if any were necessary.**

```bash
git add backend/pkg/utils/response.go backend/pkg/utils/response_test.go backend/internal/donations/validation.go backend/internal/donations/validation_test.go backend/internal/handlers/donation_handler.go backend/docs/openapi.yaml frontend/src/features/public/donations/api.ts frontend/src/features/public/donations/queries.ts frontend/src/features/public/donations/schema.ts frontend/src/features/public/donations/DonationReportForm.tsx frontend/src/features/public/donations/DonationForm.tsx frontend/src/app/'[locale]'/'(client)'/donate/report/page.tsx frontend/src/components/home/DonationSection.tsx frontend/src/messages/th.json frontend/src/messages/en.json frontend/src/messages/de.json
git commit -m "fix: polish donation report validation"
```

If no files changed in verification, do not create an empty commit.

## Plan Self-Review

- Spec coverage: Tasks 1–3 cover the dedicated route, quiet home section, two form sections, client/server validation, field errors, query boundary, localization, and accessibility. Task 4 covers responsive and backend acceptance.
- Placeholder scan: every task includes named files, commands, interfaces, and concrete implementation details.
- Type consistency: `DonationReportValues`, `createSelfReportedDonationSchema`, `useDonationCategoriesQuery`, and `PublicDonationApiError` are defined in Task 2 before Task 3 consumes them.
