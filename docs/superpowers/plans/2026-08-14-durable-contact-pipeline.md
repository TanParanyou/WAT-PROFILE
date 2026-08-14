# Durable Contact Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist every real public contact submission with its language and atomically enqueue a retryable operator notification before returning success.

**Architecture:** The Go API owns normalization, validation, honeypot handling, persistence, and outbox enqueue. A background operations worker loads contact data by ID and sends through the existing Resend adapter, so provider failure never loses the inquiry. The public React form uses a typed feature boundary, React Hook Form, Zod, and field-level API error mapping.

**Tech Stack:** Go 1.25, Fiber v2, GORM, PostgreSQL migrations, operations outbox, Resend HTTP adapter, Next.js 16, React 19, TanStack Query, React Hook Form, Zod, next-intl.

## Global Constraints

- Public contract fields are `name`, `email`, `subject`, `message`, `locale`, and honeypot `website`.
- Limits are 120 Unicode code points for name, 254 email characters, 200 Unicode code points for subject, and 5000 Unicode code points for message.
- Supported locales are exactly `th`, `en`, and `de`.
- Real success means the Contact Inquiry and `contact.notification` job committed in one PostgreSQL transaction.
- Honeypot submissions return the same HTTP `201` generic success but write no row or job.
- Outbox job key is `contact:notification:<contact_id>` and payload contains only `contact_id`.
- Operator recipient and sender come only from `CONTACT_NOTIFICATION_TO` and `CONTACT_EMAIL_FROM`; Resend uses backend `RESEND_API_KEY`.
- Logs contain contact ID, outbox job ID, outcome, and an operation trace ID derived from the outbox job ID; logs never contain visitor email or message body.
- Rate limiting remains 5 requests per minute and returns `CONTACT_RATE_LIMITED` plus integer `Retry-After` seconds.
- Public contact JSON bodies are capped at 32 KiB.
- Preserve complete Thai, English, and German UX copy.
- Update migration, GORM model, OpenAPI, and frontend contracts together.
- Do not introduce TypeScript `any`, `as any`, or `@ts-ignore`.

---

## File Map

- Create `backend/migrations/000042_add_contact_communication_locale.{up,down}.sql`: reversible locale schema.
- Modify `backend/internal/models/contact.go`: add `CommunicationLocale`.
- Modify `frontend/src/types/entities.ts`: align Admin Contact Inquiry type.
- Create `backend/internal/contacts/contracts.go`: request DTO normalization and validation.
- Create `backend/internal/contacts/contracts_test.go`: Unicode, locale, email, and limit tests.
- Modify `backend/internal/services/contact_service.go`: atomic contact + outbox transaction.
- Create `backend/internal/services/contact_service_integration_test.go`: commit and rollback behavior against `DATABASE_URL_TEST`.
- Modify `backend/internal/handlers/contact_handler.go`: request-only parsing, honeypot, body limit, generic response.
- Modify `backend/cmd/app/main.go`: stable rate-limit response and `Retry-After`.
- Create `backend/cmd/app/contact_limiter_test.go`: rate-limit envelope test.
- Modify `backend/docs/openapi.yaml`: exact request, response, errors, and locale contract.
- Create `backend/internal/services/contact_notification_service.go`: operator notification formatting and delivery.
- Create `backend/internal/services/contact_notification_service_test.go`: destination and no-op/error behavior.
- Modify `backend/internal/services/account_email_service.go`: expose a generic Resend sender constructor.
- Modify `backend/internal/services/account_email_service_test.go`: verify the generic constructor rejects incomplete configuration.
- Modify `backend/internal/services/operation_dispatcher.go`: dispatch `contact.notification` and structured ID-only logging.
- Modify `backend/internal/services/operation_dispatcher_test.go`: contact job parsing and dependency checks.
- Modify `backend/cmd/operations-worker/main.go`: construct contact sender/service from server environment.
- Modify `backend/cmd/media-retention/main.go`: pass nil Contact dependencies to the expanded dispatcher constructor.
- Create `frontend/src/features/public/contact/{types,schema,api,queries}.ts`: typed public mutation boundary.
- Create `frontend/src/features/public/contact/{schema,api}.test.ts`: client validation and error-envelope tests.
- Modify `frontend/src/app/[locale]/(client)/contact/ContactContent.tsx`: accessible form states and honeypot.
- Modify `frontend/src/messages/{th,en,de}.json`: complete validation, rate-limit, and server-error copy.
- Delete `frontend/src/app/api/send-email/route.tsx`, `frontend/src/services/emailService.ts`, `frontend/src/lib/resend.ts`, `frontend/src/components/emails/ContactTemplate.tsx`, and the now-empty `frontend/src/services/index.ts`.
- Modify `frontend/package.json` and `frontend/package-lock.json`: remove frontend email dependencies.
- Modify `frontend/.env.example`, `backend/.env.example`, and `docs/DEPLOYMENT.md`: move Contact delivery configuration to backend/worker.

### Task 1: Contact communication locale schema

**Files:**
- Create: `backend/migrations/000042_add_contact_communication_locale.up.sql`
- Create: `backend/migrations/000042_add_contact_communication_locale.down.sql`
- Modify: `backend/internal/models/contact.go`
- Modify: `frontend/src/types/entities.ts`

**Interfaces:**
- Produces: persisted/API field `communication_locale` with values `th | en | de`.
- Preserves: existing Contact Inquiry IDs, status workflow, admin list, replies, and timestamps.

- [ ] **Step 1: Add the reversible migration pair**

```sql
-- 000042_add_contact_communication_locale.up.sql
BEGIN;
ALTER TABLE contact_inquiries
  ADD COLUMN IF NOT EXISTS communication_locale varchar(5) NOT NULL DEFAULT 'th';
ALTER TABLE contact_inquiries
  DROP CONSTRAINT IF EXISTS contact_inquiries_communication_locale_check;
ALTER TABLE contact_inquiries
  ADD CONSTRAINT contact_inquiries_communication_locale_check
  CHECK (communication_locale IN ('th', 'en', 'de'));
COMMIT;
```

```sql
-- 000042_add_contact_communication_locale.down.sql
BEGIN;
ALTER TABLE contact_inquiries
  DROP CONSTRAINT IF EXISTS contact_inquiries_communication_locale_check;
ALTER TABLE contact_inquiries
  DROP COLUMN IF EXISTS communication_locale;
COMMIT;
```

- [ ] **Step 2: Align backend and frontend models**

Add to `models.ContactInquiry`:

```go
CommunicationLocale string `gorm:"size:5;not null;default:th" json:"communication_locale"`
```

Add to the frontend `ContactInquiry` interface:

```ts
communication_locale: "th" | "en" | "de";
```

- [ ] **Step 3: Compile model consumers**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/models/... ./internal/services/...`

Expected: exit 0; database-backed tests may report SKIP when `DATABASE_URL_TEST` is unset.

Run: `cd frontend && ./node_modules/.bin/tsc --noEmit`

Expected: exit 0.

- [ ] **Step 4: Inspect migration direction**

Run: `git diff --check -- backend/migrations/000042_add_contact_communication_locale.up.sql backend/migrations/000042_add_contact_communication_locale.down.sql backend/internal/models/contact.go frontend/src/types/entities.ts`

Expected: exit 0; down migration removes only the constraint and column introduced here.

- [ ] **Step 5: Commit schema and typed models**

```bash
git add backend/migrations/000042_add_contact_communication_locale.up.sql backend/migrations/000042_add_contact_communication_locale.down.sql backend/internal/models/contact.go frontend/src/types/entities.ts
git commit -m "feat(contact): persist communication locale"
```

### Task 2: Request-only normalization and validation

**Files:**
- Create: `backend/internal/contacts/contracts.go`
- Create: `backend/internal/contacts/contracts_test.go`

**Interfaces:**
- Produces: `contacts.SubmitRequest` with JSON tags for the public handler.
- Produces: `contacts.Submission` containing normalized persistence values.
- Produces: `contacts.ValidationError` with `Fields map[string]string`.
- Produces: `NormalizeAndValidate(request): (Submission, *ValidationError)`.

- [ ] **Step 1: Write failing table-driven validation tests**

```go
func TestNormalizeAndValidate(t *testing.T) {
  valid := SubmitRequest{Name: " วัด ", Email: " Visitor@Example.com ", Subject: " ถาม ", Message: " ข้อความ ", Locale: "th"}
  got, validationErr := NormalizeAndValidate(valid)
  if validationErr != nil { t.Fatalf("unexpected validation error: %v", validationErr) }
  if got.Name != "วัด" || got.Email != "visitor@example.com" || got.Subject != "ถาม" || got.Message != "ข้อความ" || got.Locale != "th" {
    t.Fatalf("unexpected normalization: %+v", got)
  }

  cases := []struct { name string; mutate func(*SubmitRequest); field string }{
    {"name required", func(v *SubmitRequest) { v.Name = " " }, "name"},
    {"name Unicode limit", func(v *SubmitRequest) { v.Name = strings.Repeat("ก", 121) }, "name"},
    {"email invalid", func(v *SubmitRequest) { v.Email = "bad" }, "email"},
    {"subject required", func(v *SubmitRequest) { v.Subject = "" }, "subject"},
    {"subject Unicode limit", func(v *SubmitRequest) { v.Subject = strings.Repeat("ä", 201) }, "subject"},
    {"message Unicode limit", func(v *SubmitRequest) { v.Message = strings.Repeat("🙂", 5001) }, "message"},
    {"locale invalid", func(v *SubmitRequest) { v.Locale = "fr" }, "locale"},
  }
  for _, tc := range cases {
    t.Run(tc.name, func(t *testing.T) {
      request := valid
      tc.mutate(&request)
      _, err := NormalizeAndValidate(request)
      if err == nil || err.Fields[tc.field] == "" { t.Fatalf("expected %s error, got %#v", tc.field, err) }
    })
  }
}
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/contacts -run TestNormalizeAndValidate -v`

Expected: FAIL because the package does not exist.

- [ ] **Step 3: Implement the request contract**

```go
type SubmitRequest struct {
  Name string `json:"name"`
  Email string `json:"email"`
  Subject string `json:"subject"`
  Message string `json:"message"`
  Locale string `json:"locale"`
  Website string `json:"website"`
}

type Submission struct {
  Name string
  Email string
  Subject string
  Message string
  Locale string
}

type ValidationError struct { Fields map[string]string }
func (e *ValidationError) Error() string { return "contact submission is invalid" }
```

`NormalizeAndValidate` trims name, subject, message, and locale; normalizes email with `accountauth.NormalizeEmail`; validates email with `accountauth.ValidEmail`; enforces the 254-code-point email limit; counts name, email, subject, and message with `utf8.RuneCountInString`; and returns every invalid field in one map. It never copies `Website` into `Submission`.

- [ ] **Step 4: Run focused and package tests**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/contacts -v`

Expected: PASS.

- [ ] **Step 5: Commit the public request contract**

```bash
git add backend/internal/contacts/contracts.go backend/internal/contacts/contracts_test.go
git commit -m "feat(contact): validate public submission contract"
```

### Task 3: Atomic Contact Inquiry and outbox enqueue

**Files:**
- Modify: `backend/internal/services/contact_service.go`
- Create: `backend/internal/services/contact_service_integration_test.go`

**Interfaces:**
- Consumes: `contacts.Submission` from Task 2.
- Produces: `ContactOutbox.EnqueueTx(*gorm.DB, OutboxJobInput)` seam.
- Produces: `NewContactServiceWithOutbox(db, outbox)` for deterministic integration tests.
- Changes: `Submit(ctx, contacts.Submission): (*models.ContactInquiry, error)`.

- [ ] **Step 1: Write integration tests for commit and rollback**

```go
type failingContactOutbox struct{}
func (failingContactOutbox) EnqueueTx(*gorm.DB, OutboxJobInput) (*models.OperationOutbox, error) {
  return nil, errors.New("outbox unavailable")
}

func TestContactSubmitCommitsInquiryAndOutbox(t *testing.T) {
  db := contactTestDB(t)
  service := NewContactServiceWithOutbox(db, NewOperationOutboxService(db))
  created, err := service.Submit(context.Background(), contacts.Submission{
    Name: "Visitor", Email: "visitor@example.invalid", Subject: "Visit", Message: "Hello", Locale: "en",
  })
  if err != nil { t.Fatal(err) }
  var job models.OperationOutbox
  if err := db.Where("job_key = ?", "contact:notification:"+strconv.Itoa(created.ID)).First(&job).Error; err != nil { t.Fatal(err) }
  if job.Kind != "contact.notification" || job.AggregateID != strconv.Itoa(created.ID) || len(job.Payload) != 1 || job.Payload["contact_id"] == nil {
    t.Fatalf("unexpected job: %+v", job)
  }
}

func TestContactSubmitRollsBackWhenOutboxFails(t *testing.T) {
  db := contactTestDB(t)
  before := contactRowCount(t, db)
  _, err := NewContactServiceWithOutbox(db, failingContactOutbox{}).Submit(context.Background(), contacts.Submission{
    Name: "Visitor", Email: "rollback@example.invalid", Subject: "Visit", Message: "Hello", Locale: "de",
  })
  if err == nil { t.Fatal("expected enqueue failure") }
  if got := contactRowCount(t, db); got != before { t.Fatalf("contact count = %d, want %d", got, before) }
}
```

`contactTestDB` opens only `DATABASE_URL_TEST`, skips when it is unset, and auto-migrates only `models.ContactInquiry` and `models.OperationOutbox` in the isolated test database. Each test deletes rows using its unique email/job key.

- [ ] **Step 2: Run the integration test and confirm signature failure**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services -run 'TestContactSubmit' -v`

Expected: FAIL because the transactional constructor and method are not implemented.

- [ ] **Step 3: Implement the transaction and minimal outbox payload**

```go
type ContactOutbox interface {
  EnqueueTx(*gorm.DB, OutboxJobInput) (*models.OperationOutbox, error)
}

func NewContactService(db *gorm.DB) *ContactService {
  return NewContactServiceWithOutbox(db, NewOperationOutboxService(db))
}

func NewContactServiceWithOutbox(db *gorm.DB, outbox ContactOutbox) *ContactService {
  return &ContactService{db: db, outbox: outbox}
}

func (s *ContactService) Submit(ctx context.Context, input contacts.Submission) (*models.ContactInquiry, error) {
  inquiry := &models.ContactInquiry{
    Name: input.Name, Email: input.Email, Subject: input.Subject, Message: input.Message,
    CommunicationLocale: input.Locale, InquiryType: "general", Status: "new",
  }
  err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
    if err := tx.Create(inquiry).Error; err != nil { return err }
    id := strconv.Itoa(inquiry.ID)
    _, err := s.outbox.EnqueueTx(tx, OutboxJobInput{
      JobKey: "contact:notification:" + id,
      Kind: "contact.notification",
      AggregateType: "contact",
      AggregateID: id,
      Payload: models.JSONMap{"contact_id": inquiry.ID},
    })
    return err
  })
  if err != nil { return nil, err }
  return inquiry, nil
}
```

- [ ] **Step 4: Run service tests**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services -run 'TestContactSubmit' -v`

Expected: PASS when `DATABASE_URL_TEST` is configured; otherwise both tests explicitly SKIP.

- [ ] **Step 5: Commit durable persistence**

```bash
git add backend/internal/services/contact_service.go backend/internal/services/contact_service_integration_test.go
git commit -m "feat(contact): enqueue notifications atomically"
```

### Task 4: Public handler, abuse controls, and OpenAPI

**Files:**
- Modify: `backend/internal/handlers/contact_handler.go`
- Modify: `backend/cmd/app/main.go`
- Create: `backend/cmd/app/contact_limiter_test.go`
- Modify: `backend/docs/openapi.yaml`

**Interfaces:**
- Consumes: `contacts.SubmitRequest`, `NormalizeAndValidate`, and transactional `ContactService.Submit`.
- Produces: HTTP `201` `{ "success": true, "message": "Message received." }` for real and honeypot submissions.
- Produces: HTTP `400` field map, HTTP `429` code `CONTACT_RATE_LIMITED`, and HTTP `500` generic transaction failure.

- [ ] **Step 1: Write the stable limiter response test**

```go
func TestContactRateLimitResponse(t *testing.T) {
  app := fiber.New()
  app.Use(requestid.New(requestid.Config{Header: "X-Trace-Id", ContextKey: "trace_id"}))
  app.Use("/api/v1/public/contact", contactLimiter())
  app.Post("/api/v1/public/contact", func(c *fiber.Ctx) error { return c.SendStatus(fiber.StatusCreated) })
  for i := 0; i < 5; i++ { response, _ := app.Test(httptest.NewRequest(http.MethodPost, "/api/v1/public/contact", nil)); if response.StatusCode != 201 { t.Fatalf("request %d = %d", i, response.StatusCode) } }
  response, _ := app.Test(httptest.NewRequest(http.MethodPost, "/api/v1/public/contact", nil))
  if response.StatusCode != 429 || response.Header.Get("Retry-After") != "60" { t.Fatalf("unexpected limiter response") }
  var body struct { Code string `json:"code"`; TraceID string `json:"trace_id"` }
  if err := json.NewDecoder(response.Body).Decode(&body); err != nil { t.Fatal(err) }
  if body.Code != "CONTACT_RATE_LIMITED" || body.TraceID == "" { t.Fatalf("unexpected body: %+v", body) }
}
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./cmd/app -run TestContactRateLimitResponse -v`

Expected: FAIL because `contactLimiter()` does not exist.

- [ ] **Step 3: Implement exact handler and limiter behavior**

Move the Contact limiter configuration into:

```go
func contactLimiter() fiber.Handler {
  return limiter.New(limiter.Config{
    Max: 5,
    Expiration: time.Minute,
    LimitReached: func(c *fiber.Ctx) error {
      c.Set(fiber.HeaderRetryAfter, "60")
      return utils.CodedErrorResponse(c, fiber.StatusTooManyRequests, "CONTACT_RATE_LIMITED", "Too many contact requests. Please try again later.")
    },
  })
}
```

In `SubmitContact`:

```go
if len(c.Body()) > 32*1024 {
  return utils.FieldErrorResponse(c, fiber.StatusBadRequest, "Contact request is too large", map[string]string{"message": "Contact request is too large"})
}
var request contacts.SubmitRequest
if err := c.BodyParser(&request); err != nil {
  return utils.ErrorResponse(c, fiber.StatusBadRequest, "Invalid request body")
}
if strings.TrimSpace(request.Website) != "" {
  return c.Status(fiber.StatusCreated).JSON(fiber.Map{"success": true, "message": "Message received."})
}
input, validationErr := contacts.NormalizeAndValidate(request)
if validationErr != nil {
  return utils.FieldErrorResponse(c, fiber.StatusBadRequest, validationErr.Error(), validationErr.Fields)
}
if _, err := h.contactService.Submit(c.UserContext(), input); err != nil {
  return utils.ErrorResponse(c, fiber.StatusInternalServerError, "Unable to receive message")
}
return c.Status(fiber.StatusCreated).JSON(fiber.Map{"success": true, "message": "Message received."})
```

Never serialize the created Contact Inquiry in the public response.

- [ ] **Step 4: Update OpenAPI and run backend checks**

Define `ContactInput` with required `[name, email, subject, message, locale]`, optional `website`, exact lengths/locales, and a honeypot description. Define the generic `201` envelope, field-map `400`, `CONTACT_RATE_LIMITED` `429` with `Retry-After`, and generic `500`. Add `communication_locale` to `ContactInquiry`.

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./cmd/app ./internal/contacts ./internal/handlers/...`

Expected: exit 0; DB-dependent tests may SKIP only when their documented test database is absent.

- [ ] **Step 5: Commit the HTTP contract**

```bash
git add backend/internal/handlers/contact_handler.go backend/cmd/app/main.go backend/cmd/app/contact_limiter_test.go backend/docs/openapi.yaml
git commit -m "feat(contact): harden public submission endpoint"
```

### Task 5: Retryable operator notification

**Files:**
- Create: `backend/internal/services/contact_notification_service.go`
- Create: `backend/internal/services/contact_notification_service_test.go`
- Modify: `backend/internal/services/account_email_service.go`
- Modify: `backend/internal/services/account_email_service_test.go`
- Modify: `backend/internal/services/operation_dispatcher.go`
- Modify: `backend/internal/services/operation_dispatcher_test.go`
- Modify: `backend/cmd/operations-worker/main.go`
- Modify: `backend/cmd/media-retention/main.go`

**Interfaces:**
- Produces: `NewContactNotificationService(sender accountauth.EmailSender, recipient string)`.
- Produces: `Send(ctx context.Context, inquiry *models.ContactInquiry) error`.
- Produces: `NewResendEmailSender(apiKey, from string): (accountauth.EmailSender, error)`.
- Changes: `NewOperationDispatcher(..., contacts *ContactService, notifications *ContactNotificationService)` adds two final dependencies.
- Consumes: `CONTACT_NOTIFICATION_TO`, `CONTACT_EMAIL_FROM`, and `RESEND_API_KEY` in the worker only.

- [ ] **Step 1: Write notifier and dispatcher tests**

```go
type contactCaptureSender struct { messages []accountauth.EmailMessage; err error }
func (s *contactCaptureSender) Send(_ context.Context, message accountauth.EmailMessage) error {
  s.messages = append(s.messages, message)
  return s.err
}

func TestContactNotificationTargetsConfiguredRecipient(t *testing.T) {
  sender := &contactCaptureSender{}
  service := NewContactNotificationService(sender, "office@example.invalid")
  err := service.Send(context.Background(), &models.ContactInquiry{ID: 42, Name: "Visitor", Email: "visitor@example.invalid", Subject: "Visit", Message: "Hello", CommunicationLocale: "de"})
  if err != nil { t.Fatal(err) }
  if len(sender.messages) != 1 || sender.messages[0].To != "office@example.invalid" { t.Fatalf("unexpected message: %+v", sender.messages) }
  if !strings.Contains(sender.messages[0].Body, "Contact ID: 42") || !strings.Contains(sender.messages[0].Body, "Locale: de") { t.Fatalf("missing identifiers") }
}

func TestOperationDispatcherRequiresContactDependencies(t *testing.T) {
  err := (&OperationDispatcher{}).Dispatch(context.Background(), models.OperationOutbox{Kind: "contact.notification", AggregateID: "42"})
  if err == nil || !strings.Contains(err.Error(), "contact notification dependencies") { t.Fatalf("unexpected error: %v", err) }
}

func TestNewResendEmailSenderRequiresConfiguration(t *testing.T) {
  if _, err := NewResendEmailSender("", "contact@example.invalid"); err == nil { t.Fatal("expected missing API key error") }
  if _, err := NewResendEmailSender("re_test", ""); err == nil { t.Fatal("expected missing sender error") }
}
```

- [ ] **Step 2: Run focused tests and confirm they fail**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services -run 'TestContactNotification|TestOperationDispatcherRequiresContact' -v`

Expected: FAIL because the notifier and dispatch case do not exist.

- [ ] **Step 3: Implement notification formatting and dispatch**

Add `NewResendEmailSender` around the existing `resendEmailSender`; trim both values, reject an empty API key or sender, and make `NewAccountEmailSender` call the new constructor for its `resend` branch. The notifier validates the recipient with `accountauth.NormalizeEmail` and `accountauth.ValidEmail`, rejects a nil inquiry, and sends one plain-text message:

```go
subject := fmt.Sprintf("[Website contact #%d] %s", inquiry.ID, inquiry.Subject)
body := fmt.Sprintf(
  "Contact ID: %d\nLocale: %s\nName: %s\nEmail: %s\nSubject: %s\n\nMessage:\n%s",
  inquiry.ID, inquiry.CommunicationLocale, inquiry.Name, inquiry.Email, inquiry.Subject, inquiry.Message,
)
return s.sender.Send(ctx, accountauth.EmailMessage{To: s.recipient, Locale: inquiry.CommunicationLocale, Subject: subject, Body: body})
```

Add `contact.notification` to `OperationDispatcher.Dispatch`. Parse the positive integer from `job.AggregateID`, load with `contacts.GetByID`, and call the notifier. Log through `pkg/logger` with fields `contact_id`, `outbox_job_id`, `operation_trace_id` equal to `job.ID.String()`, and `outcome`. Do not attach request payload or Contact fields to the log event.

Expand every `NewOperationDispatcher` call. `cmd/media-retention` passes `nil, nil` for Contact dependencies.

- [ ] **Step 4: Configure the operations worker**

In `cmd/operations-worker/main.go`, construct a second Resend sender:

```go
contactSender, err := services.NewResendEmailSender(
  strings.TrimSpace(os.Getenv("RESEND_API_KEY")),
  strings.TrimSpace(os.Getenv("CONTACT_EMAIL_FROM")),
)
if err != nil { log.Fatal(err) }
recipient := strings.TrimSpace(os.Getenv("CONTACT_NOTIFICATION_TO"))
if recipient == "" { log.Fatal("CONTACT_NOTIFICATION_TO is required") }
```

Pass `services.NewContactService(config.DB)` and `services.NewContactNotificationService(contactSender, recipient)` to the dispatcher. This worker fails startup when Contact delivery configuration is incomplete.

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services ./cmd/operations-worker ./cmd/media-retention`

Expected: exit 0.

- [ ] **Step 5: Commit worker delivery**

```bash
git add backend/internal/services/contact_notification_service.go backend/internal/services/contact_notification_service_test.go backend/internal/services/account_email_service.go backend/internal/services/account_email_service_test.go backend/internal/services/operation_dispatcher.go backend/internal/services/operation_dispatcher_test.go backend/cmd/operations-worker/main.go backend/cmd/media-retention/main.go
git commit -m "feat(contact): dispatch retryable notifications"
```

### Task 6: Typed public Contact form

**Files:**
- Create: `frontend/src/features/public/contact/types.ts`
- Create: `frontend/src/features/public/contact/schema.ts`
- Create: `frontend/src/features/public/contact/schema.test.ts`
- Create: `frontend/src/features/public/contact/api.ts`
- Create: `frontend/src/features/public/contact/api.test.ts`
- Create: `frontend/src/features/public/contact/queries.ts`
- Modify: `frontend/src/app/[locale]/(client)/contact/ContactContent.tsx`
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`

**Interfaces:**
- Produces: `ContactSubmitInput`, `ContactLocale`, `ContactField`, and `PublicContactApiError`.
- Produces: `createContactSchema(messages)` and `ContactFormValues`.
- Produces: `submitPublicContact(input): Promise<void>` and `useSubmitPublicContact()`.
- Consumes: backend `fields`, `code`, status, and `Retry-After` response data.

- [ ] **Step 1: Write schema and API contract tests**

```ts
test("contact schema enforces Unicode limits and accepts an empty honeypot", () => {
  const schema = createContactSchema(messages);
  assert.equal(schema.safeParse({ name: "ก".repeat(121), email: "a@example.com", subject: "ถาม", message: "ข้อความ", website: "" }).success, false);
  assert.equal(schema.safeParse({ name: "Visitor", email: "a@example.com", subject: "Visit", message: "Hello", website: "" }).success, true);
});

test("contact API maps backend fields and rate-limit metadata", async () => {
  publicApi.defaults.adapter = async (config) => {
    throw new AxiosError("rate limited", AxiosError.ERR_BAD_REQUEST, config, null, {
      data: { success: false, error: "Too many", code: "CONTACT_RATE_LIMITED", fields: { email: "Invalid email" }, trace_id: "trace-1" },
      status: 429, statusText: "Too Many Requests", headers: { "retry-after": "60" }, config,
    });
  };
  await assert.rejects(
    submitPublicContact({ name: "Visitor", email: "bad", subject: "Visit", message: "Hello", locale: "en", website: "" }),
    (error: unknown) => error instanceof PublicContactApiError && error.code === "CONTACT_RATE_LIMITED" && error.retryAfterSeconds === 60 && error.fields.email === "Invalid email",
  );
});
```

- [ ] **Step 2: Run focused frontend tests and confirm they fail**

Run: `cd frontend && ./node_modules/.bin/tsx --test src/features/public/contact/schema.test.ts src/features/public/contact/api.test.ts`

Expected: FAIL because the Contact feature files do not exist.

- [ ] **Step 3: Implement the typed feature boundary**

Define:

```ts
export type ContactLocale = "th" | "en" | "de";
export type ContactField = "name" | "email" | "subject" | "message" | "locale";
export interface ContactSubmitInput {
  name: string; email: string; subject: string; message: string;
  locale: ContactLocale; website: string;
}
```

`createContactSchema` uses Zod `.trim()` and `.min(1)`, then `Array.from(value).length` refinements for the 120/200/5000 Unicode-code-point limits. Email uses `.email()` plus the same code-point technique for the 254 limit. Keep `website` as a string without client rejection so bots can populate it. `submitPublicContact` posts to `publicApi.post("/contact", input)`, verifies `{ success: true }`, and converts Axios failures into `PublicContactApiError` without trusting unknown response data. `useSubmitPublicContact` wraps the function in `useMutation`.

- [ ] **Step 4: Replace manual form state with accessible RHF behavior**

Use `useForm` with `zodResolver`, `mode: "onBlur"`, `reValidateMode: "onChange"`, `shouldFocusError: true`, and default values for four visible fields plus `website`. Submit `{ ...values, locale }` through the mutation. Map backend `fields` with `setError`, preserve values after failure, and `reset()` only after success.

Render the honeypot outside visual flow:

```tsx
<div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
  <label htmlFor="contact-website">Website</label>
  <input id="contact-website" tabIndex={-1} autoComplete="off" {...register("website")} />
</div>
```

Every visible field gets `aria-invalid`, an `aria-describedby` target, and a text error with `role="alert"`. Disable submit while the mutation is pending. Map `CONTACT_RATE_LIMITED` to localized rate-limit copy; map all other root failures to generic retry copy. Keep the CMS-configured success message.

Add localized keys for name/subject/message limits, required fields, invalid email, rate limit, generic server error, and pending button copy in all three public locale files.

- [ ] **Step 5: Run focused tests and compile the public page**

Run: `cd frontend && ./node_modules/.bin/tsx --test src/features/public/contact/schema.test.ts src/features/public/contact/api.test.ts`

Expected: PASS.

Run: `cd frontend && ./node_modules/.bin/eslint src/features/public/contact src/app/'[locale]'/'(client)'/contact/ContactContent.tsx && ./node_modules/.bin/tsc --noEmit`

Expected: exit 0.

- [ ] **Step 6: Commit the public form integration**

```bash
git add frontend/src/features/public/contact frontend/src/app/'[locale]'/'(client)'/contact/ContactContent.tsx frontend/src/messages/th.json frontend/src/messages/en.json frontend/src/messages/de.json
git commit -m "feat(contact): submit durable public inquiries"
```

### Task 7: Remove frontend email delivery and document rollout

**Files:**
- Delete: `frontend/src/app/api/send-email/route.tsx`
- Delete: `frontend/src/services/emailService.ts`
- Delete: `frontend/src/lib/resend.ts`
- Delete: `frontend/src/components/emails/ContactTemplate.tsx`
- Delete: `frontend/src/services/index.ts`
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Modify: `frontend/.env.example`
- Modify: `backend/.env.example`
- Modify: `docs/DEPLOYMENT.md`

**Interfaces:**
- Removes: browser/Next.js Resend ownership and `/api/send-email`.
- Documents: backend/worker-only Contact delivery configuration and backend-before-frontend release order.

- [ ] **Step 1: Remove obsolete frontend modules and dependencies**

Delete the five listed source files. From `frontend/`, run:

```bash
npm uninstall resend @react-email/components @react-email/render
```

This updates both `package.json` and `package-lock.json` without adding dependencies.

- [ ] **Step 2: Move environment examples to the backend**

Remove `RESEND_API_KEY`, `EMAIL_FROM`, and `CONTACT_EMAIL` from `frontend/.env.example`. Keep the existing backend Resend key and add:

```dotenv
# Public Contact operator notification; consumed only by operations-worker.
CONTACT_EMAIL_FROM=contact@watloungporsai.de
CONTACT_NOTIFICATION_TO=office@watloungporsai.de
```

The committed addresses are illustrative sample values; do not commit production addresses.

- [ ] **Step 3: Update deployment order and worker requirements**

Document:

```markdown
Contact notifications:
- Set backend/worker `RESEND_API_KEY`, `CONTACT_EMAIL_FROM`, and `CONTACT_NOTIFICATION_TO`.
- Apply migration `000042_add_contact_communication_locale`.
- Deploy backend and operations worker before the Contact frontend.
- A successful API submission must create one `contact_inquiries` row and one `contact.notification` outbox row.
- Resend failure leaves the inquiry intact and the outbox job retryable.
- Remove frontend Resend variables; `/api/send-email` must return `404`.
```

- [ ] **Step 4: Verify no legacy email path remains**

Run: `rg -n "send-email|emailService|ContactTemplate|CONTACT_EMAIL|EMAIL_FROM|from ['\"]resend['\"]|@react-email" frontend`

Expected: no matches except unrelated prose that does not import or configure the deleted path.

- [ ] **Step 5: Run full release checks**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./...`

Expected: exit 0; documented isolated-DB tests may SKIP only when `DATABASE_URL_TEST` is unset.

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go vet ./... && GOCACHE=/private/tmp/wat-profile-go-cache go build -o bin/server ./cmd/app && GOCACHE=/private/tmp/wat-profile-go-cache go build -o bin/operations-worker ./cmd/operations-worker`

Expected: exit 0.

Run: `cd frontend && npm run lint && ./node_modules/.bin/tsc --noEmit`

Expected: touched files have no lint errors and type-check exits 0; record unrelated repository lint baseline separately.

Run: `cd frontend && NEXT_PUBLIC_API_URL=https://api.example.invalid NEXT_PUBLIC_MEDIA_ALLOWED_ORIGINS=https://media.example.invalid npm run build`

Expected: production build exits 0.

- [ ] **Step 6: Run end-to-end acceptance**

```text
1. POST a valid th/en/de message -> HTTP 201, one Contact Inquiry, one outbox job.
2. Stop or invalidate Resend -> HTTP 201 still returned after commit; job becomes failed/retryable.
3. POST website=filled -> HTTP 201, no Contact Inquiry, no outbox job.
4. Submit invalid/oversized fields -> HTTP 400 with owning field errors.
5. Submit the sixth request within one minute -> HTTP 429, CONTACT_RATE_LIMITED, Retry-After: 60.
6. Run operations-worker with valid delivery config -> job succeeds and operator receives one message.
7. Open /th/admin/contacts -> committed inquiry is visible immediately.
8. Repeat public form UX in /en/contact and /de/contact at mobile and desktop widths.
9. Confirm /api/send-email returns 404 and logs/outbox payload contain no visitor message or email.
```

- [ ] **Step 7: Commit cleanup and production guidance**

```bash
git add frontend/src/app/api/send-email/route.tsx frontend/src/services/emailService.ts frontend/src/lib/resend.ts frontend/src/components/emails/ContactTemplate.tsx frontend/src/services/index.ts frontend/package.json frontend/package-lock.json frontend/.env.example backend/.env.example docs/DEPLOYMENT.md
git commit -m "chore(contact): move email delivery to backend"
```
