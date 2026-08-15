# Group Event Registration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver transaction-safe group event registration for guests and Public Accounts, including named participants, admin approval, secure self-service management, localized email, and per-person check-in.

**Architecture:** Keep HTTP contracts in focused registration DTOs, domain rules in `internal/registrations`, and all PostgreSQL work in `RegistrationService`. Public event reads expose a derived registration summary; mutations serialize on the event row and write domain data plus operation-outbox jobs atomically. The frontend uses a dedicated public feature boundary with React Hook Form, Zod, TanStack Query, and localized routes; Admin uses a separately typed operational boundary.

**Tech Stack:** Go 1.24, Fiber v2, GORM, PostgreSQL, operation outbox, Resend-compatible `accountauth.EmailSender`, Next.js 16 App Router, React 19, TypeScript, TanStack Query, React Hook Form, Zod 4, next-intl.

## Global Constraints

- Preserve `th`, `en`, and `de` for every public and Admin message.
- Keep visitor-facing date/time semantics in `Europe/Berlin`.
- One registration contains one primary contact and exactly 1–10 named participants.
- Anonymous submissions use `registration_type=guest`; authenticated Public Accounts use `account` unless a linked temple Member exists, in which case the server uses `member`.
- `user_id`, `member_id`, status, confirmation code, token hash, and consent timestamp are server-derived and absent from public input contracts.
- `pending`, `confirmed`, and legacy `attended` groups consume capacity; `cancelled` groups do not.
- Public Account ownership uses `event_registrations.user_id`; `member_id` remains an optional temple-member relationship and registration must never create a Member row.
- Public edits are allowed before the registration deadline, or before event start when no deadline exists; adding to a confirmed group returns it to `pending`.
- Group size is fixed at 10 in the first release; no waitlist and no capacity override.
- Management links carry an opaque token in the URL fragment; only its SHA-256 hash is stored on the registration. The outbox may store only AES-GCM ciphertext, never plaintext token material.
- Use the existing `events` Admin permission boundary for every protected mutation and audit all Admin changes.
- Use dedicated request/response types; never bind public JSON directly into GORM models.
- Do not add dependencies; standard library and installed packages cover the feature.
- Keep the current uncommitted event-detail and extended-event-field work intact; do not reformat or overwrite it.
- Update `backend/docs/openapi.yaml` whenever a route or payload changes.
- The schema authority is a new reversible migration pair; do not edit migration `000008` or any previously shared migration.

## File map

### Backend domain and persistence

- Create `backend/migrations/000044_add_group_event_registrations.up.sql` and `.down.sql`: additive group ownership, consent, token, participant schema, backfill, and indexes.
- Modify `backend/internal/models/event_registration.go`: group fields and `Participants` association.
- Create `backend/internal/models/event_registration_participant.go`: participant persistence model.
- Modify `backend/internal/config/config.go`: include the participant model in local AutoMigrate.
- Create `backend/internal/registrations/contracts.go`: stable codes, inputs, projections, availability, and typed domain errors.
- Create `backend/internal/registrations/policy.go`: normalization, validation, deadline/event-start policy, and capacity-state derivation.
- Create `backend/internal/registrations/token_cipher.go`: domain-separated AES-GCM encryption for outbox token ciphertext.
- Refactor `backend/internal/services/registration_service.go`: constructor, list/read projections, shared queries.
- Create `backend/internal/services/registration_create_service.go`: create and public availability transactions.
- Create `backend/internal/services/registration_manage_service.go`: guest/account edit and cancellation.
- Create `backend/internal/services/registration_admin_service.go`: approval, admin edit, link rotation, and check-in.

### Backend HTTP, email, privacy, and docs

- Modify `backend/internal/middleware/account_auth.go`: optional Public Account authentication.
- Refactor `backend/internal/handlers/registration_handler.go`: typed public, guest, account, and Admin handlers.
- Modify `backend/internal/routes/routes.go`: public/account/Admin route registration and permissions.
- Modify `backend/internal/handlers/event_handler.go` and `backend/internal/services/event_service.go`: public registration summary.
- Create `backend/internal/services/registration_email_service.go`: localized registration notification rendering.
- Modify `backend/internal/services/operation_dispatcher.go` and `backend/cmd/operations-worker/main.go`: registration email dispatch.
- Modify `backend/internal/services/personal_data_export_service.go`, `personal_data_action_service.go`, and `personal_data_discovery_service.go`: participant privacy coverage.
- Modify `backend/pkg/utils/response.go`: coded field-error envelope.
- Modify `backend/docs/openapi.yaml`, `backend/.env.example`, and `docs/DEPLOYMENT.md`: synchronized API and worker configuration.

### Frontend public and account

- Create `frontend/src/features/public/event-registration/types.ts`, `schema.ts`, `api.ts`, and `queries.ts`: public feature contract.
- Create `frontend/src/features/public/event-registration/components/RegistrationPanel.tsx`, `RegistrationForm.tsx`, `ParticipantFields.tsx`, `RegistrationSuccess.tsx`, and `RegistrationManagement.tsx`.
- Create `frontend/src/app/[locale]/(client)/events/[slug]/register/page.tsx`: dedicated registration route.
- Create `frontend/src/app/[locale]/(client)/events/registrations/manage/page.tsx`: guest token management route.
- Create `frontend/src/app/[locale]/(client)/account/registrations/page.tsx`: authenticated ownership view.
- Modify `frontend/src/features/public/events/types.ts`, `queries.ts`, and `components/EventDetailContent.tsx`: derived availability and CTA composition.
- Modify `frontend/src/messages/th.json`, `en.json`, and `de.json`: complete public copy.

### Frontend Admin

- Create `frontend/src/features/admin-registrations/types.ts`, `api.ts`, and `queries.ts`: typed Admin boundary.
- Refactor `frontend/src/app/[locale]/admin/registrations/page.tsx`: correct list fields and navigation.
- Create `frontend/src/app/[locale]/admin/registrations/[id]/page.tsx`: group detail, approval, edit, management-link rotation, and participant check-in.
- Remove the untyped registration export from `frontend/src/services/adminService.ts` after callers migrate.
- Modify `frontend/src/messages/admin/th.json`, `en.json`, and `de.json`: Admin copy.

---

### Task 1: Add the group registration schema and GORM models

**Files:**
- Create: `backend/migrations/000044_add_group_event_registrations.up.sql`
- Create: `backend/migrations/000044_add_group_event_registrations.down.sql`
- Modify: `backend/internal/models/event_registration.go`
- Create: `backend/internal/models/event_registration_participant.go`
- Modify: `backend/internal/config/config.go`
- Test: `backend/internal/models/event_registration_test.go`

**Interfaces:**
- Produces: `models.EventRegistration.Participants []EventRegistrationParticipant`
- Produces: `models.EventRegistrationParticipant` with table `event_registration_participants`
- Produces: nullable `UserID`, consent fields, locale, token hash/expiry, and cancellation origin on the group model

- [ ] **Step 1: Write the failing model-contract test**

```go
func TestEventRegistrationGroupContract(t *testing.T) {
	typeOf := reflect.TypeOf(EventRegistration{})
	for _, name := range []string{"UserID", "Locale", "PrivacyNoticeVersion", "PrivacyConsentAt", "ManageTokenHash", "ManageTokenExpiresAt", "CancellationOrigin", "Participants"} {
		if _, ok := typeOf.FieldByName(name); !ok {
			t.Fatalf("EventRegistration is missing %s", name)
		}
	}
	participant := EventRegistrationParticipant{}
	if participant.TableName() != "event_registration_participants" {
		t.Fatalf("unexpected participant table %q", participant.TableName())
	}
}
```

- [ ] **Step 2: Run the test and confirm the contract is missing**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/models -run TestEventRegistrationGroupContract -count=1`

Expected: FAIL because `EventRegistrationParticipant` and the new fields do not exist.

- [ ] **Step 3: Add the migration pair**

The up migration must contain these concrete operations in this order:

```sql
ALTER TABLE event_registrations
  ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN locale VARCHAR(5) NOT NULL DEFAULT 'th',
  ADD COLUMN privacy_notice_version VARCHAR(50),
  ADD COLUMN privacy_consent_at TIMESTAMPTZ,
  ADD COLUMN manage_token_hash VARCHAR(64),
  ADD COLUMN manage_token_expires_at TIMESTAMPTZ,
  ADD COLUMN cancellation_origin VARCHAR(20);

ALTER TABLE event_registrations
  ADD CONSTRAINT chk_event_registration_locale CHECK (locale IN ('th', 'en', 'de')),
  ADD CONSTRAINT chk_event_registration_origin CHECK (cancellation_origin IS NULL OR cancellation_origin IN ('registrant', 'admin')),
  ADD CONSTRAINT chk_event_registration_type CHECK (registration_type IN ('guest', 'account', 'member'));

CREATE INDEX idx_event_registrations_user_id ON event_registrations(user_id);
CREATE UNIQUE INDEX idx_event_registrations_manage_token_hash
  ON event_registrations(manage_token_hash)
  WHERE manage_token_hash IS NOT NULL;

UPDATE event_registrations er
SET user_id = m.user_id
FROM members m
WHERE er.member_id = m.id AND m.user_id IS NOT NULL;

CREATE TABLE event_registration_participants (
  id BIGSERIAL PRIMARY KEY,
  registration_id INTEGER NOT NULL REFERENCES event_registrations(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  dietary_restrictions TEXT NOT NULL DEFAULT '',
  special_needs TEXT NOT NULL DEFAULT '',
  additional_notes TEXT NOT NULL DEFAULT '',
  attendance_status VARCHAR(20) NOT NULL DEFAULT 'registered',
  attended_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_event_participant_attendance CHECK (attendance_status IN ('registered', 'attended', 'cancelled'))
);

INSERT INTO event_registration_participants (
  registration_id, first_name, last_name, dietary_restrictions,
  special_needs, additional_notes, attendance_status, attended_at, cancelled_at
)
SELECT id, first_name, last_name, COALESCE(dietary_restrictions, ''),
  COALESCE(special_needs, ''), COALESCE(additional_notes, ''),
  CASE
    WHEN registration_status = 'cancelled' THEN 'cancelled'
    WHEN registration_status = 'attended' OR attended = TRUE THEN 'attended'
    ELSE 'registered'
  END,
  attended_at,
  cancelled_at
FROM event_registrations;

CREATE INDEX idx_event_registration_participants_registration
  ON event_registration_participants(registration_id);
CREATE INDEX idx_event_registration_participants_attendance
  ON event_registration_participants(attendance_status, registration_id);
CREATE UNIQUE INDEX idx_event_registrations_active_email
  ON event_registrations(event_id, LOWER(email))
  WHERE registration_status IN ('pending', 'confirmed', 'attended');
```

The down migration drops the partial indexes, participant table, new constraints, and new columns in reverse dependency order. It must not alter legacy contact or attendance columns.

- [ ] **Step 4: Add the persisted models and AutoMigrate registration**

```go
type EventRegistrationParticipant struct {
	ID                  int64      `gorm:"primaryKey;autoIncrement" json:"id"`
	RegistrationID      int        `gorm:"not null;index" json:"registration_id"`
	FirstName           string     `gorm:"size:100;not null" json:"first_name"`
	LastName            string     `gorm:"size:100;not null" json:"last_name"`
	DietaryRestrictions string     `gorm:"type:text;not null;default:''" json:"dietary_restrictions"`
	SpecialNeeds        string     `gorm:"type:text;not null;default:''" json:"special_needs"`
	AdditionalNotes     string     `gorm:"type:text;not null;default:''" json:"additional_notes"`
	AttendanceStatus    string     `gorm:"size:20;not null;default:registered;index" json:"attendance_status"`
	AttendedAt          *time.Time `json:"attended_at"`
	CancelledAt         *time.Time `json:"cancelled_at"`
	CreatedAt           time.Time  `json:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at"`
}

func (EventRegistrationParticipant) TableName() string {
	return "event_registration_participants"
}
```

Add `UserID *uuid.UUID`, `User *User`, consent/token fields with `json:"-"` on token material, and the participant association to `EventRegistration`. Add `&models.EventRegistrationParticipant{}` immediately after `EventRegistration` in `config.MigrateModels()`.

- [ ] **Step 5: Run model and backend verification**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/models ./internal/config -count=1`

Expected: PASS.

- [ ] **Step 6: Commit the schema slice**

```bash
git add backend/migrations/000044_add_group_event_registrations.up.sql backend/migrations/000044_add_group_event_registrations.down.sql backend/internal/models/event_registration.go backend/internal/models/event_registration_participant.go backend/internal/models/event_registration_test.go backend/internal/config/config.go
git commit -m "feat(registrations): add group participant schema"
```

### Task 2: Define registration contracts, policies, token encryption, and coded field errors

**Files:**
- Create: `backend/internal/registrations/contracts.go`
- Create: `backend/internal/registrations/policy.go`
- Create: `backend/internal/registrations/policy_test.go`
- Create: `backend/internal/registrations/token_cipher.go`
- Create: `backend/internal/registrations/token_cipher_test.go`
- Modify: `backend/pkg/utils/response.go`
- Modify: `backend/pkg/utils/response_test.go`

**Interfaces:**
- Produces: `registrations.Identity`, `CreateInput`, `UpdateInput`, `Availability`, `Detail`, `ListItem`, `DomainError`
- Produces: `registrations.NormalizeAndValidateCreate(CreateRequest) (CreateInput, *DomainError)`
- Produces: `registrations.DeriveAvailability(EventWindow, now, activeCount) Availability`
- Produces: `registrations.NewTokenCipher(secret []byte) (*TokenCipher, error)` with `Seal` and `Open`
- Produces: `utils.CodedFieldErrorResponse`

- [ ] **Step 1: Write failing policy tests**

```go
func TestNormalizeAndValidateCreateRequiresOneToTenParticipants(t *testing.T) {
	valid := CreateRequest{
		Locale: "de",
		Contact: ContactInput{FirstName: " Ada ", LastName: " Lovelace ", Email: " ADA@Example.DE "},
		Participants: []ParticipantInput{{FirstName: "Ada", LastName: "Lovelace"}},
		PrivacyNoticeVersion: "2026-08",
	}
	got, domainErr := NormalizeAndValidateCreate(valid)
	if domainErr != nil || got.Contact.Email != "ada@example.de" {
		t.Fatalf("normalize create = %#v, err=%v", got, domainErr)
	}
	valid.Participants = make([]ParticipantInput, 11)
	_, domainErr = NormalizeAndValidateCreate(valid)
	if domainErr == nil || domainErr.Code != CodeGroupLimitExceeded {
		t.Fatalf("expected group limit error, got %v", domainErr)
	}
}

func TestDeriveAvailabilityUsesDeadlineCapacityAndBerlinEventStart(t *testing.T) {
	location, _ := time.LoadLocation("Europe/Berlin")
	start := time.Date(2026, 9, 12, 9, 0, 0, 0, location)
	deadline := start.Add(-24 * time.Hour)
	window := EventWindow{Enabled: true, Deadline: &deadline, StartsAt: start, MaxParticipants: intPtr(10)}
	if got := DeriveAvailability(window, deadline.Add(time.Second), 4); got.State != AvailabilityClosed {
		t.Fatalf("state=%s want closed", got.State)
	}
	if got := DeriveAvailability(window, deadline.Add(-time.Second), 10); got.State != AvailabilityFull {
		t.Fatalf("state=%s want full", got.State)
	}
}
```

- [ ] **Step 2: Run policy tests and verify failure**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/registrations -count=1`

Expected: FAIL because the package and contracts do not exist.

- [ ] **Step 3: Implement exact contract names and stable codes**

```go
type Code string

const (
	CodeDisabled          Code = "REGISTRATION_DISABLED"
	CodeClosed            Code = "REGISTRATION_CLOSED"
	CodeFull              Code = "EVENT_FULL"
	CodeDuplicate         Code = "ALREADY_REGISTERED"
	CodeGroupLimitExceeded Code = "GROUP_LIMIT_EXCEEDED"
	CodeValidation        Code = "VALIDATION_ERROR"
	CodeTokenInvalid      Code = "MANAGE_TOKEN_INVALID"
	CodeTokenExpired      Code = "MANAGE_TOKEN_EXPIRED"
	CodeNotEditable       Code = "REGISTRATION_NOT_EDITABLE"
)

type Identity struct {
	UserID   *uuid.UUID
	MemberID *int
}

type ContactInput struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
}

type ParticipantInput struct {
	ID                  *int64 `json:"id,omitempty"`
	FirstName           string `json:"first_name"`
	LastName            string `json:"last_name"`
	DietaryRestrictions string `json:"dietary_restrictions"`
	SpecialNeeds        string `json:"special_needs"`
	AdditionalNotes     string `json:"additional_notes"`
}

type CreateRequest struct {
	Locale               string             `json:"locale"`
	Contact              ContactInput       `json:"contact"`
	Participants         []ParticipantInput `json:"participants"`
	PrivacyNoticeVersion string             `json:"privacy_notice_version"`
}
```

Define `UpdateRequest` with contact and participants, normalized `CreateInput`/`UpdateInput`, `AvailabilityState`, `Availability`, `EventSummary`, `Participant`, `Detail`, and `ListItem`. `DomainError` carries `Code`, safe `Message`, and `Fields map[string]string` where nested paths use `participants.0.first_name` notation.

- [ ] **Step 4: Write failing token-cipher round-trip and tamper tests**

```go
func TestTokenCipherRoundTripRejectsTampering(t *testing.T) {
	cipher, err := NewTokenCipher([]byte("0123456789abcdef0123456789abcdef"))
	if err != nil { t.Fatal(err) }
	sealed, err := cipher.Seal("secret-token")
	if err != nil { t.Fatal(err) }
	plain, err := cipher.Open(sealed)
	if err != nil || plain != "secret-token" { t.Fatalf("plain=%q err=%v", plain, err) }
	sealed[len(sealed)-1] ^= 1
	if _, err := cipher.Open(sealed); err == nil { t.Fatal("tampered ciphertext must fail") }
}
```

- [ ] **Step 5: Implement AES-GCM token encryption with domain-separated key derivation**

`NewTokenCipher` must derive a 32-byte AES key as `SHA-256("event-registration-manage-v1:" || secret)`, reject secrets shorter than 32 bytes, generate a fresh nonce with `crypto/rand`, and encode nonce+ciphertext with base64url. This keeps outbox payload token material encrypted while `manage_token_hash` remains the only registration-table credential.

- [ ] **Step 6: Add and test a coded field-error response helper**

```go
func CodedFieldErrorResponse(c *fiber.Ctx, statusCode int, code, message string, fields map[string]string) error {
	traceID, _ := c.Locals("trace_id").(string)
	return c.Status(statusCode).JSON(fiber.Map{
		"success": false, "error": message, "code": code,
		"fields": fields, "trace_id": traceID,
	})
}
```

Add a response test asserting `code`, `fields`, and `trace_id` survive JSON encoding.

- [ ] **Step 7: Run focused tests**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/registrations ./pkg/utils -count=1`

Expected: PASS.

- [ ] **Step 8: Commit the domain slice**

```bash
git add backend/internal/registrations backend/pkg/utils/response.go backend/pkg/utils/response_test.go
git commit -m "feat(registrations): define group registration policy"
```

### Task 3: Implement transaction-safe creation and public availability

**Files:**
- Refactor: `backend/internal/services/registration_service.go`
- Create: `backend/internal/services/registration_create_service.go`
- Create: `backend/internal/services/registration_service_integration_test.go`

**Interfaces:**
- Consumes: Task 1 models and Task 2 contracts/cipher
- Produces: `RegistrationService.Create(ctx, eventID, identity, input) (*registrations.Detail, error)`
- Produces: `RegistrationService.Availability(ctx, eventID) (registrations.Availability, error)`
- Produces: `NewRegistrationServiceWithDependencies(db, outbox, clock, tokenGen, cipher)` for deterministic tests

- [ ] **Step 1: Add the PostgreSQL test fixture and failing create test**

```go
func TestRegistrationCreateReservesEveryParticipantAndDerivesIdentity(t *testing.T) {
	db := registrationTestDB(t)
	user := seedRegistrationUser(t, db, "owner@example.com")
	member := seedRegistrationMember(t, db, user.ID)
	event := seedRegistrationEvent(t, db, 3, true, registrationFuture(t))
	service := newRegistrationTestService(t, db, registrationFixedNow())

	result, err := service.Create(context.Background(), event.ID,
		registrations.Identity{UserID: &user.ID, MemberID: &member.ID},
		registrations.CreateInput{
			Locale: "en", Contact: registrations.ContactInput{FirstName: "Owner", LastName: "One", Email: "owner@example.com"},
			Participants: []registrations.ParticipantInput{{FirstName: "Owner", LastName: "One"}, {FirstName: "Guest", LastName: "Two"}},
			PrivacyNoticeVersion: "2026-08",
		})
	if err != nil { t.Fatal(err) }
	if result.Status != "pending" || len(result.Participants) != 2 { t.Fatalf("result=%#v", result) }
	if result.RegistrationType != "member" || result.UserID == nil || result.MemberID == nil { t.Fatalf("identity=%#v", result) }
	if got := countActiveParticipants(t, db, event.ID); got != 2 { t.Fatalf("active=%d", got) }
}
```

The fixture uses `DATABASE_URL_TEST`, `AutoMigrate` for touched models, and `TRUNCATE ... RESTART IDENTITY CASCADE`. It skips only when `DATABASE_URL_TEST` is absent, matching existing service integration tests.

- [ ] **Step 2: Run the create test and confirm failure**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services -run TestRegistrationCreateReservesEveryParticipantAndDerivesIdentity -count=1`

Expected: FAIL because `Create` and the dependency constructor do not exist.

- [ ] **Step 3: Implement the constructor and create transaction**

```go
type RegistrationService struct {
	db       *gorm.DB
	outbox   RegistrationOutbox
	clock    accountauth.Clock
	tokenGen accountauth.TokenGenerator
	cipher   *registrations.TokenCipher
}

func NewRegistrationService(db *gorm.DB) *RegistrationService {
	cipher, _ := registrations.NewTokenCipher([]byte(os.Getenv("JWT_SECRET")))
	return NewRegistrationServiceWithDependencies(db, NewOperationOutboxService(db), accountauth.SystemClock{}, accountauth.NewOpaqueToken, cipher)
}
```

Inside `Create`, use `db.WithContext(ctx).Transaction`, lock the event with `clause.Locking{Strength: "UPDATE"}`, derive availability, count participants through an explicit join, and compare `activeCount + len(input.Participants)` with `MaxParticipants`. Generate plain/hash token, store only the hash, encrypt the plain token for the outbox payload, create participant rows, and enqueue `registration.received` with job key `registration:received:<id>:1` in the same transaction.

- [ ] **Step 4: Add failing deadline, duplicate, capacity, and concurrency tests**

Add table-driven cases asserting the exact typed codes `REGISTRATION_DISABLED`, `REGISTRATION_CLOSED`, `EVENT_FULL`, and `ALREADY_REGISTERED`. Add a two-goroutine test against one remaining seat; synchronize starts with a channel and assert exactly one success and one `EVENT_FULL` result.

- [ ] **Step 5: Implement availability and database-error mapping**

`Availability` performs the same active participant count without taking a write lock. Map PostgreSQL unique violation for `idx_event_registrations_active_email` to `ALREADY_REGISTERED`; all other database errors remain internal and are never exposed as safe domain messages.

- [ ] **Step 6: Run registration service integration tests**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services -run 'TestRegistration(Create|Availability)' -count=1`

Expected: PASS when `DATABASE_URL_TEST` is configured; otherwise the integration tests report SKIP and the package still passes.

- [ ] **Step 7: Commit creation and availability**

```bash
git add backend/internal/services/registration_service.go backend/internal/services/registration_create_service.go backend/internal/services/registration_service_integration_test.go
git commit -m "feat(registrations): create capacity-safe groups"
```

### Task 4: Expose typed public create and event-summary APIs

**Files:**
- Modify: `backend/internal/middleware/account_auth.go`
- Modify: `backend/internal/middleware/account_auth_test.go`
- Refactor: `backend/internal/handlers/registration_handler.go`
- Create: `backend/internal/handlers/registration_handler_test.go`
- Modify: `backend/internal/routes/routes.go`
- Modify: `backend/internal/services/event_service.go`
- Modify: `backend/internal/handlers/event_handler.go`
- Modify: `backend/docs/openapi.yaml`

**Interfaces:**
- Consumes: Task 3 `Create` and `Availability`
- Produces: optional account middleware that treats no header as guest and rejects invalid supplied credentials
- Produces: `POST /api/v1/public/events/{id}/register`
- Produces: `registration` summary on public event detail

- [ ] **Step 1: Write optional-auth middleware tests**

```go
func TestPublicAccountOptionalAllowsAnonymousAndRejectsInvalidBearer(t *testing.T) {
	app := fiber.New()
	app.Post("/register", PublicAccountOptional(&gorm.DB{}, []byte(accountAuthTestSecret)), func(c *fiber.Ctx) error {
		_, authenticated := c.Locals("userID").(uuid.UUID)
		return c.JSON(fiber.Map{"authenticated": authenticated})
	})
	anonymous, _ := app.Test(httptest.NewRequest(http.MethodPost, "/register", nil))
	if anonymous.StatusCode != http.StatusOK { t.Fatalf("anonymous=%d", anonymous.StatusCode) }
	invalid := httptest.NewRequest(http.MethodPost, "/register", nil)
	invalid.Header.Set("Authorization", "Bearer invalid")
	response, _ := app.Test(invalid)
	if response.StatusCode != http.StatusUnauthorized { t.Fatalf("invalid=%d", response.StatusCode) }
}
```

- [ ] **Step 2: Implement optional authentication by delegating supplied tokens to `PublicAccountRequired`**

```go
func PublicAccountOptional(db *gorm.DB, secret []byte) fiber.Handler {
	required := PublicAccountRequired(db, secret)
	return func(c *fiber.Ctx) error {
		if strings.TrimSpace(c.Get("Authorization")) == "" {
			return c.Next()
		}
		return required(c)
	}
}
```

- [ ] **Step 3: Write failing handler contract tests**

Build a Fiber app around an injected fake registration service. Assert that the handler rejects more than 64 KiB, maps nested validation fields with code `VALIDATION_ERROR`, returns 201 with only the safe `registrations.Detail` projection, and passes `user_id` from locals while looking up optional `member_id` in the service boundary.

- [ ] **Step 4: Refactor the handler around a small service interface**

```go
type registrationOperations interface {
	Create(context.Context, int, registrations.Identity, registrations.CreateInput) (*registrations.Detail, error)
	Availability(context.Context, int) (registrations.Availability, error)
}
```

Use `utils.CodedFieldErrorResponse` for validation and `utils.CodedErrorResponse` for stable conflicts. Return 422 for validation/group limit, 409 for disabled/closed/full/duplicate/not-editable, 401 for invalid token, and 410 for expired token.

- [ ] **Step 5: Add public registration summary to event detail**

Create a response DTO rather than mutating the persisted `models.Event` JSON shape:

```go
type PublicEventDetail struct {
	*models.Event
	Registration registrations.Availability `json:"registration"`
}
```

`GetEvent` loads the event, obtains availability by event ID, and returns `PublicEventDetail`. Public list responses remain unchanged to avoid one count query per list item.

- [ ] **Step 6: Register routes with optional auth only when Public Account auth is enabled**

When enabled, mount `PublicAccountOptional(db, []byte(os.Getenv("JWT_SECRET")))` before `RegisterForEvent`; when disabled, mount the same handler without authentication middleware. Keep the endpoint public in both modes.

- [ ] **Step 7: Update OpenAPI with exact create input, success projection, registration summary, and coded errors**

Document `registration_type` as response-only with values `guest`, `account`, `member`. Add 409 and 422 responses and ensure no schema exposes token hash, ciphertext, or raw management token.

- [ ] **Step 8: Run middleware, handler, route, and event tests**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/middleware ./internal/handlers ./internal/routes ./internal/services -count=1`

Expected: PASS, with database-gated integration tests skipped only when `DATABASE_URL_TEST` is absent.

- [ ] **Step 9: Commit the public API slice**

```bash
git add backend/internal/middleware/account_auth.go backend/internal/middleware/account_auth_test.go backend/internal/handlers/registration_handler.go backend/internal/handlers/registration_handler_test.go backend/internal/routes/routes.go backend/internal/services/event_service.go backend/internal/handlers/event_handler.go backend/docs/openapi.yaml
git commit -m "feat(registrations): expose public group registration api"
```

---

### Task 5: Add secure guest and Public Account self-service

**Files:**
- Create: `backend/internal/services/registration_manage_service.go`
- Create: `backend/internal/services/registration_manage_service_test.go`
- Modify: `backend/internal/handlers/registration_handler.go`
- Modify: `backend/internal/handlers/registration_handler_test.go`
- Modify: `backend/internal/routes/routes.go`
- Modify: `backend/internal/services/personal_data_export_service.go`
- Modify: `backend/internal/services/personal_data_export_service_test.go`
- Modify: `backend/internal/services/personal_data_action_service.go`
- Modify: `backend/internal/services/personal_data_action_service_test.go`
- Modify: `backend/internal/services/personal_data_discovery_service.go`
- Modify: `backend/internal/services/personal_data_discovery_service_test.go`
- Modify: `backend/docs/openapi.yaml`

**Interfaces:**
- Consumes: an opaque guest token or authenticated `user_id`
- Produces: the same safe `registrations.Detail` projection for both ownership paths
- Preserves: `/api/v1/member/registrations` as a read-only compatibility route

- [ ] **Step 1: Write failing policy and ownership tests**

Cover these cases with a real PostgreSQL transaction when `DATABASE_URL_TEST` is set:

```go
func TestUpdateConfirmedGroupAddingParticipantReturnsToPending(t *testing.T) {}
func TestUpdateConfirmedGroupRemovingParticipantKeepsConfirmed(t *testing.T) {}
func TestUpdateRejectsCapacityDeltaAndRollsBack(t *testing.T) {}
func TestExpiredGuestTokenCannotReadOrMutate(t *testing.T) {}
func TestAccountCannotReadAnotherUsersRegistration(t *testing.T) {}
func TestCancelRevokesManageTokenAndReleasesSeats(t *testing.T) {}
```

Also assert that a Public Account without a `members` row can list and manage its own registration by `event_registrations.user_id`.

- [ ] **Step 2: Run the targeted service tests and confirm failure**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services -run 'Test(UpdateConfirmed|UpdateRejects|ExpiredGuest|AccountCannot|CancelRevokes)' -count=1`

Expected: FAIL because guest/account management methods do not exist.

- [ ] **Step 3: Implement token and account ownership methods**

Add the following methods to `RegistrationService`:

```go
func (s *RegistrationService) ResolveManage(ctx context.Context, rawToken string) (*registrations.Detail, error)
func (s *RegistrationService) UpdateByToken(ctx context.Context, rawToken string, input registrations.UpdateInput) (*registrations.Detail, error)
func (s *RegistrationService) CancelByToken(ctx context.Context, rawToken string, input registrations.CancelInput) error
func (s *RegistrationService) ListByUser(ctx context.Context, userID uuid.UUID) ([]registrations.ListItem, error)
func (s *RegistrationService) UpdateByUser(ctx context.Context, userID uuid.UUID, id int, input registrations.UpdateInput) (*registrations.Detail, error)
func (s *RegistrationService) CancelByUser(ctx context.Context, userID uuid.UUID, id int, input registrations.CancelInput) error
```

Hash the submitted token with SHA-256 and compare fixed-size hashes with `subtle.ConstantTimeCompare`. Reject an expired hash with `MANAGEMENT_LINK_EXPIRED`; do not reveal whether a registration exists. Lock the registration and event rows during mutations, validate the deadline, compute only the active-participant delta, and roll back every write when capacity is insufficient.

When updating participants, treat an omitted participant ID as an addition, a known ID as an update, and a persisted ID absent from the submitted list as `attendance_status=cancelled`. Never hard-delete a participant. If an addition occurs on a confirmed group, set the group to `pending` and enqueue `registration.review_required` in the same transaction. A registrant cancellation sets the group and active participants to cancelled, records `cancellation_origin=registrant`, and clears the hash/expiry.

- [ ] **Step 4: Add guest and account handlers and routes**

Mount these exact contracts:

```text
POST   /api/v1/public/registrations/manage/resolve
PATCH  /api/v1/public/registrations/manage
POST   /api/v1/public/registrations/manage/cancel
GET    /api/v1/account/registrations
PATCH  /api/v1/account/registrations/:id
POST   /api/v1/account/registrations/:id/cancel
```

Guest endpoints accept the raw token only in a JSON body, never a path or query string. Account endpoints use `PublicAccountRequired` and take `user_id` from auth locals. Apply the same 64 KiB request limit and error envelope as create. Do not add `member_id` lookup to account ownership checks.

- [ ] **Step 5: Write and pass handler authorization tests**

Assert missing guest token is 422, expired token is 410, wrong account owner is 404, authenticated account routes never accept ownership from request JSON, and cancellation is idempotent for the current owner.

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/handlers ./internal/routes -run 'Registration|AccountRoutes' -count=1`

Expected: PASS.

- [ ] **Step 6: Include participants in privacy discovery, export, and anonymization**

Preload `Participants` for exports. Discovery must report participant rows associated with the contact email. Anonymization must blank or replace participant names and free-text fields while retaining non-identifying attendance/capacity facts required for aggregate reporting.

- [ ] **Step 7: Add privacy regression tests**

Create a registration with two participants and verify both appear in export/discovery, neither participant name survives anonymization, and the registration remains countable without an email or token hash.

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services -run 'PersonalData.*Registration' -count=1`

Expected: PASS.

- [ ] **Step 8: Document self-service contracts in OpenAPI and run the service suite**

Document the guest token body, account-owned routes, `MANAGEMENT_LINK_EXPIRED`, `REGISTRATION_NOT_EDITABLE`, and the rule that participant additions may return a group to pending.

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services ./internal/handlers ./internal/routes -count=1`

Expected: PASS, with database-gated tests skipped only when `DATABASE_URL_TEST` is absent.

- [ ] **Step 9: Commit the self-service slice**

```bash
git add backend/internal/services/registration_manage_service.go backend/internal/services/registration_manage_service_test.go backend/internal/handlers/registration_handler.go backend/internal/handlers/registration_handler_test.go backend/internal/routes/routes.go backend/internal/services/personal_data_export_service.go backend/internal/services/personal_data_export_service_test.go backend/internal/services/personal_data_action_service.go backend/internal/services/personal_data_action_service_test.go backend/internal/services/personal_data_discovery_service.go backend/internal/services/personal_data_discovery_service_test.go backend/docs/openapi.yaml
git commit -m "feat(registrations): add secure self service"
```

---

### Task 6: Deliver localized registration email through the durable outbox

**Files:**
- Create: `backend/internal/services/registration_email_service.go`
- Create: `backend/internal/services/registration_email_service_test.go`
- Modify: `backend/internal/services/operation_dispatcher.go`
- Modify: `backend/internal/services/operation_dispatcher_test.go`
- Modify: `backend/cmd/operations-worker/main.go`
- Modify: `backend/.env.example`
- Modify: `docs/DEPLOYMENT.md`

**Interfaces:**
- Consumes: `registration.received`, `registration.confirmed`, `registration.cancelled`, and `registration.review_required` operation-outbox jobs
- Produces: localized email via the existing `accountauth.EmailSender`
- Security invariant: outbox payloads contain registration ID plus ciphertext only; no plaintext management token or URL

- [ ] **Step 1: Write failing renderer and dispatch tests**

Use a capture sender and fixed clock. Assert `th`, `en`, and `de` subjects/bodies include event title, group status, participant names, and Berlin-localized schedule. Only the initial receipt includes a management action URL. Assert an unsupported locale falls back to `th` and HTML escapes all contact/event/participant input.

```go
func TestRegistrationEmailRendersAllLocales(t *testing.T) {}
func TestRegistrationEmailEscapesUserContent(t *testing.T) {}
func TestDispatcherDecryptsReceivedTokenOnlyAtSendTime(t *testing.T) {}
func TestDispatcherRejectsTamperedRegistrationTokenCiphertext(t *testing.T) {}
```

- [ ] **Step 2: Run targeted tests and confirm failure**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services -run 'RegistrationEmail|Dispatcher.*Registration' -count=1`

Expected: FAIL because registration email rendering/dispatch is not wired.

- [ ] **Step 3: Implement localized registration rendering**

Create `RegistrationEmailService` with injected sender, frontend origin, and `*registrations.TokenCipher`. Load the registration, event, and participants by ID at dispatch time. Render these templates without introducing a template dependency:

```go
type RegistrationEmailKind string

const (
	RegistrationReceived       RegistrationEmailKind = "received"
	RegistrationConfirmed      RegistrationEmailKind = "confirmed"
	RegistrationCancelled      RegistrationEmailKind = "cancelled"
	RegistrationReviewRequired RegistrationEmailKind = "review_required"
)
```

For the received job only, decrypt ciphertext after the worker claims the job, build `/{locale}/events/registrations/manage#token={url.QueryEscape(rawToken)}`, and immediately discard the raw token variable after rendering. Validate the configured origin as HTTPS outside development and use `html/template` or explicit `html.EscapeString` for user-controlled values.

- [ ] **Step 4: Register explicit dispatcher cases**

Extend the dispatcher with the four job types. Decode a typed payload containing `registration_id`, email kind, and optional token ciphertext. Treat a decrypt failure as a permanent malformed-payload error so the dispatcher records failure without sending a tokenless receipt.

- [ ] **Step 5: Wire the operations worker**

Construct the token cipher from `JWT_SECRET`, the existing email sender from configured mode, and the registration email service from `PUBLIC_ACCOUNT_FRONTEND_URL`. Registration email dispatch must work even when `PUBLIC_ACCOUNT_AUTH_ENABLED=false`; that feature flag controls authentication routes, not event registration email.

- [ ] **Step 6: Document configuration behavior**

Update `backend/.env.example` and `docs/DEPLOYMENT.md` to state that group registration email needs `JWT_SECRET` of at least 32 bytes, `PUBLIC_ACCOUNT_FRONTEND_URL`, `ACCOUNT_EMAIL_MODE`, sender address, and provider credentials when mode is `resend`. Use non-secret example values only.

- [ ] **Step 7: Run worker and service tests**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services ./cmd/operations-worker -count=1`

Expected: PASS.

- [ ] **Step 8: Commit the email slice**

```bash
git add backend/internal/services/registration_email_service.go backend/internal/services/registration_email_service_test.go backend/internal/services/operation_dispatcher.go backend/internal/services/operation_dispatcher_test.go backend/cmd/operations-worker/main.go backend/.env.example docs/DEPLOYMENT.md
git commit -m "feat(registrations): send localized status email"
```

---

### Task 7: Add typed Admin group operations and per-person check-in

**Files:**
- Create: `backend/internal/services/registration_admin_service.go`
- Create: `backend/internal/services/registration_admin_service_test.go`
- Modify: `backend/internal/handlers/registration_handler.go`
- Modify: `backend/internal/handlers/registration_handler_test.go`
- Modify: `backend/internal/routes/routes.go`
- Modify: `backend/docs/openapi.yaml`

**Interfaces:**
- Produces: typed Admin list/detail responses with contact, event summary, ownership type, participants, timestamps, and derived attendee counts
- Consumes: Admin edits, status transitions, token rotation, and individual attendance mutation
- Enforces: `events:read` for reads and `events:update` for every mutation

- [ ] **Step 1: Write failing Admin transition and permission tests**

Cover pending to confirmed/cancelled, cancelled terminal behavior, confirmed additions returning to pending, no capacity override, participant check-in/uncheck, regenerated link invalidating the old token, and read/update permission boundaries.

```go
func TestAdminConfirmEnqueuesConfirmation(t *testing.T) {}
func TestAdminEditCannotOverrideCapacity(t *testing.T) {}
func TestAdminParticipantAttendanceIsIdempotent(t *testing.T) {}
func TestAdminRotateLinkInvalidatesPreviousHash(t *testing.T) {}
```

- [ ] **Step 2: Run targeted tests and confirm failure**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services ./internal/handlers ./internal/routes -run 'Admin.*Registration|Registration.*Permission' -count=1`

Expected: FAIL because typed Admin operations are absent.

- [ ] **Step 3: Implement Admin service methods transactionally**

Add these service methods:

```go
func (s *RegistrationService) AdminList(ctx context.Context, filter registrations.AdminListFilter) (registrations.AdminPage, error)
func (s *RegistrationService) AdminGet(ctx context.Context, id int) (*registrations.AdminDetail, error)
func (s *RegistrationService) AdminUpdate(ctx context.Context, actorID uuid.UUID, id int, input registrations.AdminUpdateInput) (*registrations.AdminDetail, error)
func (s *RegistrationService) AdminSetStatus(ctx context.Context, actorID uuid.UUID, id int, input registrations.StatusInput) (*registrations.AdminDetail, error)
func (s *RegistrationService) AdminSetAttendance(ctx context.Context, actorID uuid.UUID, registrationID, participantID int, input registrations.AttendanceInput) (*registrations.AdminDetail, error)
func (s *RegistrationService) AdminRotateManageLink(ctx context.Context, actorID uuid.UUID, id int) error
```

Reuse the same event-row lock and participant-delta policy as public edits. Confirmation enqueues `registration.confirmed`; cancellation enqueues `registration.cancelled`, marks active participants cancelled, and revokes management hash. Token rotation stores a new hash and enqueues only encrypted token material. Record actor, action, registration ID, old/new status, and reason in the existing audit mechanism without participant medical/dietary text.

- [ ] **Step 4: Add typed handlers and exact routes**

```text
GET    /api/v1/admin/event-registrations
GET    /api/v1/admin/event-registrations/:id
PATCH  /api/v1/admin/event-registrations/:id
PUT    /api/v1/admin/event-registrations/:id/status
PATCH  /api/v1/admin/event-registrations/:id/participants/:participantId/attendance
POST   /api/v1/admin/event-registrations/:id/manage-link
```

Keep any existing list/status route stable while replacing its untyped response. Validate positive IDs, page bounds, enum filters, and 64 KiB mutation bodies. The manage-link endpoint returns `202 Accepted`; it never returns a raw link.

- [ ] **Step 5: Add handler and route tests**

Assert `events:read` can list/get but cannot mutate; `events:update` can mutate; malformed IDs and status values use stable errors; the response uses `registration_status`, `contact`, `event`, and `participants` rather than legacy guessed keys.

- [ ] **Step 6: Update OpenAPI and run the Admin backend slice**

Document filters, pagination, detail projection, mutation inputs, permission responses, and attendance enums.

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services ./internal/handlers ./internal/routes -count=1`

Expected: PASS.

- [ ] **Step 7: Commit the Admin backend slice**

```bash
git add backend/internal/services/registration_admin_service.go backend/internal/services/registration_admin_service_test.go backend/internal/handlers/registration_handler.go backend/internal/handlers/registration_handler_test.go backend/internal/routes/routes.go backend/docs/openapi.yaml
git commit -m "feat(registrations): add admin group operations"
```

---

### Task 8: Build the typed frontend registration data boundary

**Files:**
- Create: `frontend/src/features/public/event-registration/types.ts`
- Create: `frontend/src/features/public/event-registration/schema.ts`
- Create: `frontend/src/features/public/event-registration/schema.test.ts`
- Create: `frontend/src/features/public/event-registration/api.ts`
- Create: `frontend/src/features/public/event-registration/api.test.ts`
- Create: `frontend/src/features/public/event-registration/queries.ts`
- Modify: `frontend/src/features/public/events/types.ts`
- Modify: `frontend/src/features/public/events/queries.ts`

**Interfaces:**
- Consumes: public create/manage contracts and authenticated account-owned contracts
- Produces: Zod-validated form types, typed API projections, stable frontend errors, and query/mutation options
- Authentication rule: create uses `publicApi` plus an optional memory bearer token; account-owned management uses `accountApi`

- [ ] **Step 1: Write failing schema tests**

Test exactly one and ten participants pass, zero and eleven fail, whitespace-only names fail, contact email is normalized, privacy consent must be true, all field lengths match backend limits, and updates preserve optional participant IDs.

```ts
test("accepts a ten-person group", () => {})
test("rejects an eleventh participant", () => {})
test("requires the published privacy consent", () => {})
```

- [ ] **Step 2: Run the schema tests and confirm failure**

Run: `cd frontend && ./node_modules/.bin/tsx --test src/features/public/event-registration/schema.test.ts`

Expected: FAIL because the feature boundary does not exist.

- [ ] **Step 3: Add exact TypeScript and Zod contracts**

Define `RegistrationAvailability`, `RegistrationCreateInput`, `RegistrationUpdateInput`, `RegistrationDetail`, `RegistrationListItem`, `RegistrationParticipant`, and `RegistrationErrorCode`. Keep server-derived fields out of input types. Model `remaining_capacity` as `number | null` and all timestamps as ISO strings.

Extend the event detail type with:

```ts
registration: {
  enabled: boolean
  deadline: string | null
  max_participants_per_registration: 10
  capacity: number | null
  reserved_participants: number
  remaining_capacity: number | null
  can_register: boolean
  unavailable_code: RegistrationErrorCode | null
}
```

- [ ] **Step 4: Write failing API error-mapping tests**

Mock the installed Axios transport. Assert create retains backend `code`, `message`, and nested `fields`; an optional access token is sent as `Authorization: Bearer` but never added to JSON; guest management sends token in the body; account calls use the authenticated account client.

- [ ] **Step 5: Implement API functions without weakening public errors**

Use `publicApi` for create and guest management so registration-specific error codes are not collapsed into account-auth errors. Read the optional access token with `getMemoryAccessToken()` and set only the request header. Use `accountApi` for `/account/registrations`. Normalize unknown failures to a typed `RegistrationApiError` after narrowing `unknown`; do not use `any` or assertions that bypass validation.

- [ ] **Step 6: Add query keys and mutation invalidation**

Use keys under `['event-registration']`, with token hashes or raw tokens excluded from query keys. Guest resolution should use a disabled query plus explicit mutation or store an in-memory opaque handle; never put the raw token in React Query devtool-visible cache keys. Create/update/cancel invalidates event detail availability and the account registration list when authenticated.

- [ ] **Step 7: Run the frontend data tests and type-check**

Run: `cd frontend && ./node_modules/.bin/tsx --test src/features/public/event-registration/schema.test.ts src/features/public/event-registration/api.test.ts`

Expected: PASS.

Run: `cd frontend && ./node_modules/.bin/tsc --noEmit`

Expected: PASS.

- [ ] **Step 8: Commit the typed data slice**

```bash
git add frontend/src/features/public/event-registration frontend/src/features/public/events/types.ts frontend/src/features/public/events/queries.ts
git commit -m "feat(registrations): add typed frontend data layer"
```

---

### Task 9: Build the public availability, registration, and success flow

**Files:**
- Create: `frontend/src/features/public/event-registration/components/RegistrationPanel.tsx`
- Create: `frontend/src/features/public/event-registration/components/RegistrationForm.tsx`
- Create: `frontend/src/features/public/event-registration/components/ParticipantFields.tsx`
- Create: `frontend/src/features/public/event-registration/components/RegistrationSuccess.tsx`
- Create: `frontend/src/features/public/event-registration/form-state.ts`
- Create: `frontend/src/features/public/event-registration/form-state.test.ts`
- Create: `frontend/src/app/[locale]/(client)/events/[slug]/register/page.tsx`
- Modify: `frontend/src/features/public/events/components/EventDetailContent.tsx`
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`

**Interfaces:**
- Event detail presents capacity/deadline and links to a dedicated route
- The form submits one contact plus 1–10 named participants
- Success is an in-page terminal state with confirmation code and next-step copy, not a URL containing personal data

- [ ] **Step 1: Write failing pure form-state tests**

Test account prefill, empty guest defaults, append capped at 10, removal blocked at one, server field paths such as `participants.2.first_name`, and confirmed-group additions returning a visible review warning.

```ts
test("prefills contact without creating a participant implicitly", () => {})
test("maps nested server errors to participant fields", () => {})
test("never appends more than ten participants", () => {})
```

- [ ] **Step 2: Run the helper tests and confirm failure**

Run: `cd frontend && ./node_modules/.bin/tsx --test src/features/public/event-registration/form-state.test.ts`

Expected: FAIL because the helpers do not exist.

- [ ] **Step 3: Implement the availability panel on event detail**

Render registration status, deadline in `Europe/Berlin`, remaining seats when capacity is finite, and one primary CTA to `/{locale}/events/{slug}/register`. Disable the CTA with localized reason for disabled, closed, full, or already-started events. Keep the current event-detail composition and uncommitted extended-event fields intact; do not turn the registration form into the existing modal.

- [ ] **Step 4: Implement the dedicated registration page and form**

Use React Hook Form with Zod resolver and `useFieldArray`. Sections are: primary contact, participants, privacy notice/consent, and review/submit. Account session may prefill contact email/display name, but the user can edit contact data and must still provide participant names. Contact attendance is never inferred.

Include keyboard-accessible add/remove controls, visible participant numbering, inline nested errors, form-level capacity/deadline conflicts, pending button state, and focus transfer to the first invalid field or server conflict summary. Do not add a new visual language: use `DESIGN.md` tokens and current public components.

- [ ] **Step 5: Implement the success state**

After 201, replace the form with confirmation code, `pending` explanation, participant count, email-management notice, and links back to the event/account registrations when applicable. Do not persist contact or participant data in URL/search params or localStorage.

- [ ] **Step 6: Add complete localized copy**

Add the same key set in `th`, `en`, and `de` for availability states, contact labels, participant controls, consent, validation, server codes, pending/confirmed explanation, and success actions. Keep Thai as the source wording, then provide natural English/German—not untranslated fallback text.

- [ ] **Step 7: Run helper tests, localization parity, lint, and type-check**

Run: `cd frontend && ./node_modules/.bin/tsx --test src/features/public/event-registration/form-state.test.ts src/features/public/event-registration/schema.test.ts`

Expected: PASS.

Run: `cd frontend && node -e "const fs=require('fs'); const paths=['th','en','de'].map(x=>JSON.parse(fs.readFileSync('src/messages/'+x+'.json','utf8')).EventRegistration); const keys=x=>JSON.stringify(Object.keys(x).sort()); if(!paths.every(x=>keys(x)===keys(paths[0]))) process.exit(1)"`

Expected: exit 0.

Run: `cd frontend && npm run lint && ./node_modules/.bin/tsc --noEmit`

Expected: PASS.

- [ ] **Step 8: Manually verify the public flow**

Run `make dev`, then verify in `th`, `en`, and `de` at desktop and 390 px width: disabled/closed/full/open panels, guest form, signed-in account prefill, 1 and 10 participants, keyboard-only add/remove/submit, nested errors, capacity conflict, and success state. Confirm no token or personal data appears in the URL, browser storage, or console.

- [ ] **Step 9: Commit the public UI slice**

```bash
git add frontend/src/features/public/event-registration/components frontend/src/features/public/event-registration/form-state.ts frontend/src/features/public/event-registration/form-state.test.ts 'frontend/src/app/[locale]/(client)/events/[slug]/register/page.tsx' frontend/src/features/public/events/components/EventDetailContent.tsx frontend/src/messages/th.json frontend/src/messages/en.json frontend/src/messages/de.json
git commit -m "feat(registrations): add public group signup flow"
```

---

### Task 10: Build guest management and Public Account registration history

**Files:**
- Create: `frontend/src/features/public/event-registration/components/RegistrationManagement.tsx`
- Create: `frontend/src/features/public/event-registration/components/AccountRegistrationList.tsx`
- Create: `frontend/src/features/public/event-registration/token-fragment.ts`
- Create: `frontend/src/features/public/event-registration/token-fragment.test.ts`
- Create: `frontend/src/app/[locale]/(client)/events/registrations/manage/page.tsx`
- Create: `frontend/src/app/[locale]/(client)/account/registrations/page.tsx`
- Modify: `frontend/src/messages/th.json`
- Modify: `frontend/src/messages/en.json`
- Modify: `frontend/src/messages/de.json`

**Interfaces:**
- Guest route consumes the token fragment exactly once and removes it before API work
- Account route derives ownership from the in-memory authenticated session
- Both reuse the same edit/cancel presentation and participant rules

- [ ] **Step 1: Write failing token-fragment tests**

```ts
test("reads an encoded token from the fragment", () => {})
test("removes the fragment without navigation", () => {})
test("does not accept a query-string token", () => {})
```

Use injected `Location`/`History` shaped interfaces so the tests run under Node without jsdom.

- [ ] **Step 2: Run the token test and confirm failure**

Run: `cd frontend && ./node_modules/.bin/tsx --test src/features/public/event-registration/token-fragment.test.ts`

Expected: FAIL because the helper does not exist.

- [ ] **Step 3: Implement one-time fragment consumption**

On the client, parse only `window.location.hash`, decode `token`, immediately call `history.replaceState` with pathname/search but no hash, retain the token only in component memory, and then call the resolve mutation. Never log it, put it in a query key, copy it into local/session storage, or send it to analytics.

- [ ] **Step 4: Build guest management states**

Render explicit loading, invalid/expired link, detail, edit, update success, and cancellation confirmation states. Reuse `RegistrationForm` in edit mode with persisted participant IDs. Explain that removing a participant releases a seat; adding someone to a confirmed group returns it to pending. After cancellation, discard the in-memory token and show a terminal state.

- [ ] **Step 5: Build authenticated account history**

Require a ready Public Account session and redirect unauthenticated visitors through the existing account sign-in flow with a safe return path. List upcoming and past registrations with event, status, participant count, and manage action. The API identifies ownership by `user_id`; absence of a temple Member must not hide the list.

- [ ] **Step 6: Add localized management copy and pass checks**

Add matching `th`, `en`, and `de` keys for link expiry, status, edit effects, cancellation confirmation, empty account history, and authentication prompts.

Run: `cd frontend && ./node_modules/.bin/tsx --test src/features/public/event-registration/token-fragment.test.ts src/features/public/event-registration/form-state.test.ts src/features/public/event-registration/api.test.ts`

Expected: PASS.

Run: `cd frontend && npm run lint && ./node_modules/.bin/tsc --noEmit`

Expected: PASS.

- [ ] **Step 7: Manually verify link hygiene and ownership**

Open a captured management URL and confirm the fragment disappears before resolve, browser history has no raw token in the visible URL, refresh shows a safe missing-token state, an expired link reveals no registration data, and Account A cannot view Account B's registration by changing IDs.

- [ ] **Step 8: Commit the self-service frontend slice**

```bash
git add frontend/src/features/public/event-registration/components/RegistrationManagement.tsx frontend/src/features/public/event-registration/components/AccountRegistrationList.tsx frontend/src/features/public/event-registration/token-fragment.ts frontend/src/features/public/event-registration/token-fragment.test.ts 'frontend/src/app/[locale]/(client)/events/registrations/manage/page.tsx' 'frontend/src/app/[locale]/(client)/account/registrations/page.tsx' frontend/src/messages/th.json frontend/src/messages/en.json frontend/src/messages/de.json
git commit -m "feat(registrations): add frontend self service"
```

---

### Task 11: Replace the untyped Admin list with group operations

**Files:**
- Create: `frontend/src/features/admin-registrations/types.ts`
- Create: `frontend/src/features/admin-registrations/api.ts`
- Create: `frontend/src/features/admin-registrations/queries.ts`
- Create: `frontend/src/features/admin-registrations/mappers.ts`
- Create: `frontend/src/features/admin-registrations/mappers.test.ts`
- Modify: `frontend/src/app/[locale]/admin/registrations/page.tsx`
- Create: `frontend/src/app/[locale]/admin/registrations/[id]/page.tsx`
- Modify: `frontend/src/services/adminService.ts`
- Modify: `frontend/src/messages/admin/th.json`
- Modify: `frontend/src/messages/admin/en.json`
- Modify: `frontend/src/messages/admin/de.json`

**Interfaces:**
- List consumes the typed paginated Admin API and uses real keys: `registration_status`, `contact`, `event`, and participant counts
- Detail supports approval/cancellation, contact/participant edits, link rotation, and individual attendance
- CSV export flattens one participant per row without exposing management secrets

- [ ] **Step 1: Write failing mapper and transition tests**

Test API-to-row mapping, active/attended counts, Berlin-local date formatting input, CSV rows for a two-person group, CSV formula escaping, and available actions for pending/confirmed/cancelled states.

```ts
test("exports one escaped row per participant", () => {})
test("does not offer approval for a cancelled group", () => {})
test("uses registration_status rather than a guessed status field", () => {})
```

- [ ] **Step 2: Run mapper tests and confirm failure**

Run: `cd frontend && ./node_modules/.bin/tsx --test src/features/admin-registrations/mappers.test.ts`

Expected: FAIL because the typed Admin feature does not exist.

- [ ] **Step 3: Build the typed Admin data boundary**

Define list/detail/filter/mutation types that exactly mirror OpenAPI. Implement queries for list/detail and mutations for edit, status, attendance, and management-link rotation. Invalidate both list and detail after mutations. Remove the legacy untyped `Record<string, unknown>` registration service only after all callers migrate.

- [ ] **Step 4: Refactor the Admin list**

Render contact, event, group size, attended count, ownership type, status, created date, and detail link. Preserve existing pagination/search conventions. Filters include event, status, registration type, and contact search. Export the current filtered result with one row per participant and columns for registration code, contact, event, participant, attendance, group status, and timestamps; exclude dietary/special-needs text unless the existing export permission explicitly authorizes sensitive fields.

- [ ] **Step 5: Build the Admin detail operations**

Show contact separately from participants. Provide explicit approve/cancel dialogs with reason, editable group data, a “send new management link” action that confirms only delivery acceptance, and individual check-in/uncheck controls with disabled pending states. Surface the no-capacity-override conflict and the confirmed-addition-to-pending behavior before submission.

- [ ] **Step 6: Add complete Admin localization and accessibility behavior**

Keep matching keys in `th`, `en`, and `de`. Every icon button has a label, dialogs trap/focus correctly using existing primitives, status is not color-only, table actions are keyboard reachable, and mutation feedback uses the existing Admin notification pattern.

- [ ] **Step 7: Run Admin tests and frontend verification**

Run: `cd frontend && ./node_modules/.bin/tsx --test src/features/admin-registrations/mappers.test.ts`

Expected: PASS.

Run: `cd frontend && npm run lint && ./node_modules/.bin/tsc --noEmit && npm run build`

Expected: PASS.

- [ ] **Step 8: Manually verify Admin operations**

Verify read-only permission, update permission, pending approval, cancellation, confirmed edit with removal, confirmed edit with addition, link rotation, individual check-in/uncheck, zero-result filters, pagination, CSV escaping, and desktop/390 px layout in all three locales.

- [ ] **Step 9: Commit the Admin frontend slice**

```bash
git add frontend/src/features/admin-registrations 'frontend/src/app/[locale]/admin/registrations/page.tsx' 'frontend/src/app/[locale]/admin/registrations/[id]/page.tsx' frontend/src/services/adminService.ts frontend/src/messages/admin/th.json frontend/src/messages/admin/en.json frontend/src/messages/admin/de.json
git commit -m "feat(registrations): add admin group workflow"
```

---

### Task 12: Run migration, contract, security, and end-to-end acceptance

**Files:**
- Verify: `backend/migrations/000044_add_group_event_registrations.up.sql`
- Verify: `backend/migrations/000044_add_group_event_registrations.down.sql`
- Verify: `backend/docs/openapi.yaml`
- Verify: all files changed by Tasks 1–11

**Interfaces:**
- Confirms database, Go contracts, OpenAPI, TypeScript contracts, UI behavior, email, authorization, and privacy agree
- Produces no new implementation file unless a failing check requires a focused fix

- [ ] **Step 1: Exercise the migration pair on a disposable test database**

Use the explicit migration command documented in `docs/DATABASE.md` against a disposable `DATABASE_URL_TEST`: migrate through `000043`, apply `000044`, inspect constraints/indexes and the participant backfill, roll back one step, then apply again. Never run this step against development, staging, or production data.

Expected: legacy registrations each gain one participant on upgrade; downgrade removes only `000044` objects; re-upgrade succeeds.

- [ ] **Step 2: Run all backend verification**

```bash
cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./...
cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go vet ./...
make be-build
```

Expected: all commands PASS. Database-gated integration tests must run in this acceptance step; do not count a skip as capacity/concurrency verification.

- [ ] **Step 3: Run all frontend registration tests and project verification**

```bash
cd frontend && ./node_modules/.bin/tsx --test src/features/public/event-registration/schema.test.ts src/features/public/event-registration/api.test.ts src/features/public/event-registration/form-state.test.ts src/features/public/event-registration/token-fragment.test.ts src/features/admin-registrations/mappers.test.ts
make fe-lint
cd frontend && ./node_modules/.bin/tsc --noEmit
make fe-build
```

Expected: all commands PASS.

- [ ] **Step 4: Audit API and type consistency**

Compare every registration route and schema in `backend/docs/openapi.yaml` against Go DTO JSON tags and TypeScript interfaces. Search for obsolete frontend field guesses and banned escapes:

```bash
rg 'event_title|\["status"\]|Record<string, unknown>|as any|@ts-ignore' frontend/src/app/\[locale\]/admin/registrations frontend/src/features/admin-registrations frontend/src/features/public/event-registration
rg 'manage_token_hash|token_ciphertext|raw_token' backend/docs/openapi.yaml frontend/src
```

Expected: no obsolete Admin field guesses, unsafe type escapes, or secret persistence fields in client/OpenAPI contracts.

- [ ] **Step 5: Run the security and privacy acceptance matrix**

Verify: invalid optional bearer is rejected; guest token expiry/tampering reveals no data; token is absent from query strings/logs/cache keys/storage; old token fails after rotation/cancel; Account A cannot access Account B; Public Account without Member works; Admin permissions are enforced; concurrent final-seat submissions produce exactly one success; capacity rollback leaves no partial participants/outbox; export/anonymization covers participants; and email HTML escapes user content.

- [ ] **Step 6: Run the user-flow acceptance matrix**

In `th`, `en`, and `de`, verify guest and signed-in create for 1 and 10 participants, closed/full/error states, pending receipt, guest edit/remove/add/cancel, account history/edit/cancel, admin approve/edit/check-in/cancel/link-rotation, confirmed addition returning to pending, and correct Berlin date/time. Repeat primary public/Admin flows at desktop and 390 px with keyboard navigation.

- [ ] **Step 7: Inspect the final diff and repository state**

```bash
git diff --check
git status --short
git diff --stat
```

Expected: no whitespace errors, generated files, secrets, unrelated formatting, or overwritten pre-existing user changes. If verification required fixes, commit each focused fix with a message describing that fix; do not create an empty “verification” commit.
