# Event Alert Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Admin select one active Event and configure the public Event Alert popup through a typed API backed by existing settings records.

**Architecture:** Store four Event Alert values in the existing `settings` table, but hide key-value persistence behind a dedicated typed service and public/Admin endpoints. The Admin form receives backend-owned numeric constraints, while the public popup receives a validated Event plus timing values and never selects an Event implicitly.

**Tech Stack:** Go 1.24, Fiber, GORM/PostgreSQL, SQL migrations, Next.js 16, React 19, TypeScript 5, Zod 4, TanStack Query 5, React Hook Form 7, Node test runner.

## Global Constraints

- Do not change Home CMS content.
- Do not add public Navigation or Footer management.
- Do not create an Event Alert table.
- Do not add popup start/end scheduling.
- Do not use TypeScript `any` or unsafe assertions that bypass type checking.
- Do not hardcode Event selection, delay, dismissal duration, or visitor-facing Event data in components.
- Backend owns setting keys and numeric validation policy.
- Admin validation is built from the constraints returned by the Admin API.
- Missing, malformed, inactive, or deleted Event configuration disables the public popup safely.

---

## File Map

### Database and backend

- Create `backend/migrations/000019_seed_event_alert_settings.up.sql`: seed the four disabled Event Alert records.
- Create `backend/migrations/000019_seed_event_alert_settings.down.sql`: remove only those four records.
- Create `backend/internal/eventalert/contracts.go`: setting keys, DTOs, constraints, validation errors.
- Create `backend/internal/eventalert/service.go`: typed settings read/write, Event lookup, version generation.
- Create `backend/internal/eventalert/service_test.go`: parsing, validation, public disablement, transaction tests.
- Create `backend/internal/handlers/event_alert_handler.go`: public/Admin HTTP handlers.
- Create `backend/internal/handlers/event_alert_handler_test.go`: status and field-error response tests.
- Modify `backend/internal/routes/routes.go`: register public and Admin endpoints.
- Modify `backend/pkg/utils/response.go`: add typed field-error response helper.

### Frontend Event Alert feature

- Create `frontend/src/features/public/event-alert/types.ts`: exact DTO types.
- Create `frontend/src/features/public/event-alert/schema.ts`: runtime public/Admin parsers and dynamic form schema factory.
- Create `frontend/src/features/public/event-alert/api.ts`: public/Admin HTTP methods.
- Create `frontend/src/features/public/event-alert/queries.ts`: public/Admin query and mutation hooks.
- Create `frontend/src/features/public/event-alert/schema.test.ts`: DTO and constraint validation tests.
- Create `frontend/src/features/public/event-alert/dismissal.ts`: storage identity and expiry helpers.
- Create `frontend/src/features/public/event-alert/dismissal.test.ts`: version and expiry tests.
- Create `frontend/src/features/public/events/schema.ts`: runtime Event DTO parser shared by Event and Event Alert APIs.
- Modify `frontend/src/features/public/events/types.ts`: derive `PublicEventDto` from the runtime schema and include numeric Event ID.
- Create `frontend/src/components/admin/settings/EventAlertSettingsPanel.tsx`: isolated Admin form.
- Modify `frontend/src/app/[locale]/admin/settings/page.tsx`: mount the typed panel separately from generic settings.
- Modify `frontend/src/components/home/EventAlertModal.tsx`: consume the typed public Alert only.
- Modify `frontend/src/messages/admin/th.json`, `en.json`, and `de.json`: Admin labels and errors.

---

### Task 1: Seed disabled Event Alert settings

**Files:**
- Create: `backend/migrations/000019_seed_event_alert_settings.up.sql`
- Create: `backend/migrations/000019_seed_event_alert_settings.down.sql`

**Interfaces:**
- Produces persisted keys `event_alert_enabled`, `event_alert_event_id`, `event_alert_delay_seconds`, and `event_alert_dismiss_hours`.

- [ ] **Step 1: Write the migration up file**

```sql
INSERT INTO settings (id, key, value, type, category, is_public, created_at, updated_at)
VALUES
    (gen_random_uuid(), 'event_alert_enabled', 'false', 'boolean', 'event-alert', false, NOW(), NOW()),
    (gen_random_uuid(), 'event_alert_event_id', '', 'number', 'event-alert', false, NOW(), NOW()),
    (gen_random_uuid(), 'event_alert_delay_seconds', '2', 'number', 'event-alert', false, NOW(), NOW()),
    (gen_random_uuid(), 'event_alert_dismiss_hours', '24', 'number', 'event-alert', false, NOW(), NOW())
ON CONFLICT (key) DO NOTHING;
```

Defaults live in the database, not the frontend. The raw records are not public because the typed public endpoint controls exposure.

- [ ] **Step 2: Write the scoped down migration**

```sql
DELETE FROM settings
WHERE key IN (
    'event_alert_enabled',
    'event_alert_event_id',
    'event_alert_delay_seconds',
    'event_alert_dismiss_hours'
);
```

- [ ] **Step 3: Verify migration scope**

Run: `rg -n "INSERT INTO settings|DELETE FROM settings|event_alert_" backend/migrations/000019_seed_event_alert_settings.*.sql`

Expected: exactly four inserted keys and the same four down targets; no other table is mutated.

- [ ] **Step 4: Commit the migration**

```bash
git add backend/migrations/000019_seed_event_alert_settings.*.sql
git commit -m "feat: seed event alert settings"
```

### Task 2: Add typed Event Alert contracts and pure validation

**Files:**
- Create: `backend/internal/eventalert/contracts.go`
- Create: `backend/internal/eventalert/contracts_test.go`

**Interfaces:**
- Produces: `Settings`, `Constraints`, `AdminResponse`, `PublicResponse`, `FieldErrors`, `Validate(Settings) FieldErrors`.

- [ ] **Step 1: Write failing validation tests**

```go
package eventalert

import "testing"

func TestValidateRequiresEventWhenEnabled(t *testing.T) {
    value := Settings{Enabled: true, EventID: nil, DelaySeconds: 2, DismissHours: 24}
    fields := Validate(value)
    if fields["event_id"] == "" { t.Fatalf("expected event_id error: %#v", fields) }
}

func TestValidateUsesPublishedConstraints(t *testing.T) {
    eventID := 7
    value := Settings{Enabled: true, EventID: &eventID, DelaySeconds: MaxDelaySeconds + 1, DismissHours: MinDismissHours - 1}
    fields := Validate(value)
    if fields["delay_seconds"] == "" || fields["dismiss_hours"] == "" { t.Fatalf("unexpected fields: %#v", fields) }
}

func TestConstraintsExposeValidatorBounds(t *testing.T) {
    constraints := PublishedConstraints()
    if constraints.DelaySeconds.Min != MinDelaySeconds || constraints.DelaySeconds.Max != MaxDelaySeconds { t.Fatal("delay constraints drifted") }
    if constraints.DismissHours.Min != MinDismissHours || constraints.DismissHours.Max != MaxDismissHours { t.Fatal("dismiss constraints drifted") }
}
```

- [ ] **Step 2: Run tests and verify failure**

Run: `cd backend && go test ./internal/eventalert -run 'TestValidate|TestConstraints' -v`

Expected: FAIL because the package does not exist.

- [ ] **Step 3: Implement constants, DTOs, and validation**

```go
package eventalert

const (
    KeyEnabled        = "event_alert_enabled"
    KeyEventID        = "event_alert_event_id"
    KeyDelaySeconds   = "event_alert_delay_seconds"
    KeyDismissHours   = "event_alert_dismiss_hours"
    MinDelaySeconds   = 0
    MaxDelaySeconds   = 30
    MinDismissHours   = 1
    MaxDismissHours   = 720
)

type Settings struct {
    Enabled      bool `json:"enabled"`
    EventID      *int `json:"event_id"`
    DelaySeconds int  `json:"delay_seconds"`
    DismissHours int  `json:"dismiss_hours"`
}

type Range struct { Min int `json:"min"`; Max int `json:"max"` }
type Constraints struct { DelaySeconds Range `json:"delay_seconds"`; DismissHours Range `json:"dismiss_hours"` }
type AdminResponse struct { Settings Settings `json:"settings"`; Constraints Constraints `json:"constraints"` }
type FieldErrors map[string]string

func PublishedConstraints() Constraints {
    return Constraints{DelaySeconds: Range{Min: MinDelaySeconds, Max: MaxDelaySeconds}, DismissHours: Range{Min: MinDismissHours, Max: MaxDismissHours}}
}

func Validate(value Settings) FieldErrors {
    fields := FieldErrors{}
    if value.Enabled && value.EventID == nil { fields["event_id"] = "Select an event while the alert is enabled" }
    if value.EventID != nil && *value.EventID <= 0 { fields["event_id"] = "Event must be a positive integer" }
    if value.DelaySeconds < MinDelaySeconds || value.DelaySeconds > MaxDelaySeconds { fields["delay_seconds"] = "Delay is outside the allowed range" }
    if value.DismissHours < MinDismissHours || value.DismissHours > MaxDismissHours { fields["dismiss_hours"] = "Dismiss duration is outside the allowed range" }
    return fields
}
```

Add `PublicResponse` after importing `models`:

```go
type PublicResponse struct {
    Enabled bool `json:"enabled"`; DelaySeconds int `json:"delay_seconds"`; DismissHours int `json:"dismiss_hours"`
    Version string `json:"version"`; Event *models.Event `json:"event"`
}
```

- [ ] **Step 4: Run tests**

Run: `cd backend && go test ./internal/eventalert -v`

Expected: PASS.

- [ ] **Step 5: Commit contracts**

```bash
git add backend/internal/eventalert/contracts.go backend/internal/eventalert/contracts_test.go
git commit -m "feat: define event alert contract"
```

### Task 3: Implement transactional Event Alert service

**Files:**
- Create: `backend/internal/eventalert/service.go`
- Create: `backend/internal/eventalert/service_test.go`

**Interfaces:**
- Consumes: Task 2 contracts and `models.Setting`/`models.Event`.
- Produces: `NewService(db)`, `GetAdmin() (AdminResponse, error)`, `Update(Settings) (AdminResponse, FieldErrors, error)`, `GetPublic() (PublicResponse, error)`.

- [ ] **Step 1: Write failing parser and public-state tests**

```go
func TestParseSettingsRejectsMalformedNumbers(t *testing.T) {
    _, err := parseSettings(map[string]models.Setting{
        KeyEnabled: {Key: KeyEnabled, Value: "true"}, KeyEventID: {Key: KeyEventID, Value: "abc"},
        KeyDelaySeconds: {Key: KeyDelaySeconds, Value: "2"}, KeyDismissHours: {Key: KeyDismissHours, Value: "24"},
    })
    if err == nil { t.Fatal("expected malformed event ID error") }
}

func TestGetPublicDisablesInactiveEvent(t *testing.T) {
    db := eventAlertTestDatabase(t)
    seedEventAlertSettings(t, db, Settings{Enabled: true, EventID: intPointer(9), DelaySeconds: 2, DismissHours: 24})
    db.Create(&models.Event{ID: 9, Slug: "inactive", Title: models.MultiLangText{"th": "ปิด"}, StartDate: time.Now(), EndDate: time.Now(), IsActive: false})
    result, err := NewService(db).GetPublic()
    if err != nil { t.Fatal(err) }
    if result.Enabled || result.Event != nil { t.Fatalf("expected disabled response: %#v", result) }
}
```

Use `DATABASE_URL_TEST`; migrate `Setting`, `Event`, and `EventSchedule`, and clean only those tables.

Define the test helpers in the same file:

```go
func intPointer(value int) *int { return &value }

func eventAlertTestDatabase(t *testing.T) *gorm.DB {
    t.Helper()
    dsn := os.Getenv("DATABASE_URL_TEST")
    if dsn == "" { t.Skip("DATABASE_URL_TEST is not configured") }
    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
    if err != nil { t.Fatal(err) }
    if err := db.AutoMigrate(&models.Setting{}, &models.Event{}, &models.EventSchedule{}); err != nil { t.Fatal(err) }
    if err := db.Exec("DELETE FROM event_schedules").Error; err != nil { t.Fatal(err) }
    if err := db.Exec("DELETE FROM events").Error; err != nil { t.Fatal(err) }
    if err := db.Exec("DELETE FROM settings WHERE category = 'event-alert'").Error; err != nil { t.Fatal(err) }
    return db
}

func seedEventAlertSettings(t *testing.T, db *gorm.DB, value Settings) {
    t.Helper()
    serialized := serializedSettings(value)
    for key, raw := range serialized {
        row := models.Setting{Key: key, Value: raw, Type: "string", Category: "event-alert", IsPublic: false}
        if err := db.Create(&row).Error; err != nil { t.Fatal(err) }
    }
}
```

- [ ] **Step 2: Run focused tests**

Run: `cd backend && go test ./internal/eventalert -run 'TestParseSettings|TestGetPublic' -v`

Expected: FAIL because service functions do not exist.

- [ ] **Step 3: Implement strict setting reads**

Query exactly the four named keys, require all four for Admin reads, parse with `strconv.ParseBool`/`strconv.Atoi`, and reject partial or malformed records. Empty `event_alert_event_id` maps to `nil` only while disabled.

```go
func (s *Service) load(tx *gorm.DB) (Settings, []models.Setting, error) {
    var rows []models.Setting
    if err := tx.Where("key IN ?", settingKeys).Find(&rows).Error; err != nil { return Settings{}, nil, err }
    byKey := make(map[string]models.Setting, len(rows))
    for _, row := range rows { byKey[row.Key] = row }
    value, err := parseSettings(byKey)
    return value, rows, err
}
```

- [ ] **Step 4: Implement transactional update and Event validation**

```go
func (s *Service) Update(value Settings) (AdminResponse, FieldErrors, error) {
    fields := Validate(value)
    if len(fields) > 0 { return AdminResponse{}, fields, nil }
    if value.Enabled {
        var count int64
        if err := s.db.Model(&models.Event{}).Where("id = ? AND is_active = ?", *value.EventID, true).Count(&count).Error; err != nil { return AdminResponse{}, nil, err }
        if count != 1 { return AdminResponse{}, FieldErrors{"event_id": "Selected event is unavailable"}, nil }
    }
    err := s.db.Transaction(func(tx *gorm.DB) error {
        values := serializedSettings(value)
        for key, raw := range values {
            result := tx.Model(&models.Setting{}).Where("key = ?", key).Updates(map[string]interface{}{"value": raw, "updated_at": time.Now()})
            if result.Error != nil { return result.Error }
            if result.RowsAffected != 1 { return fmt.Errorf("missing setting %s", key) }
        }
        return nil
    })
    if err != nil { return AdminResponse{}, nil, err }
    return AdminResponse{Settings: value, Constraints: PublishedConstraints()}, nil, nil
}
```

- [ ] **Step 5: Implement public resolution and opaque version**

If disabled or invalid, return `PublicResponse{Enabled:false}`. If enabled, fetch the active Event with ordered schedules. Hash the normalized settings plus the selected Event's `UpdatedAt` with SHA-256 and return the first 16 hex characters as `version`.

- [ ] **Step 6: Run service tests**

Run: `cd backend && go test ./internal/eventalert -v`

Expected: PASS or explicit SKIP for DB tests without `DATABASE_URL_TEST`.

- [ ] **Step 7: Commit the service**

```bash
git add backend/internal/eventalert/service.go backend/internal/eventalert/service_test.go
git commit -m "feat: persist typed event alert settings"
```

### Task 4: Expose public and Admin Event Alert endpoints

**Files:**
- Create: `backend/internal/handlers/event_alert_handler.go`
- Create: `backend/internal/handlers/event_alert_handler_test.go`
- Modify: `backend/pkg/utils/response.go`
- Modify: `backend/internal/routes/routes.go`

**Interfaces:**
- Produces: `GET /api/v1/public/event-alert`, `GET /api/v1/admin/event-alert`, `PUT /api/v1/admin/event-alert`.

- [ ] **Step 1: Write failing response and handler tests**

```go
func TestFieldErrorResponseUsesFieldsContract(t *testing.T) {
    app := fiber.New()
    app.Get("/", func(c *fiber.Ctx) error { return utils.FieldErrorResponse(c, fiber.StatusUnprocessableEntity, "Validation failed", map[string]string{"event_id": "Select an event"}) })
    response, _ := app.Test(httptest.NewRequest(http.MethodGet, "/", nil))
    var body struct { Success bool `json:"success"`; Fields map[string]string `json:"fields"` }
    json.NewDecoder(response.Body).Decode(&body)
    if response.StatusCode != 422 || body.Success || body.Fields["event_id"] == "" { t.Fatalf("unexpected response: %#v", body) }
}
```

Handler tests use a small service interface fake to verify GET success, invalid JSON 400, field errors 422, and service errors 500.

- [ ] **Step 2: Run handler tests**

Run: `cd backend && go test ./internal/handlers -run 'TestEventAlert|TestFieldErrorResponse' -v`

Expected: FAIL because the helper and handler do not exist.

- [ ] **Step 3: Add the field-error response helper**

```go
func FieldErrorResponse(c *fiber.Ctx, statusCode int, message string, fields map[string]string) error {
    return c.Status(statusCode).JSON(fiber.Map{"success": false, "error": message, "fields": fields, "trace_id": c.Get("X-Trace-Id")})
}
```

- [ ] **Step 4: Implement handlers behind an interface**

```go
type eventAlertService interface {
    GetAdmin() (eventalert.AdminResponse, error)
    Update(eventalert.Settings) (eventalert.AdminResponse, eventalert.FieldErrors, error)
    GetPublic() (eventalert.PublicResponse, error)
}

type EventAlertHandler struct { service eventAlertService }
func NewEventAlertHandler(db *gorm.DB) *EventAlertHandler { return &EventAlertHandler{service: eventalert.NewService(db)} }
```

Admin Update returns 400 for body parse failure, 422 with `fields` for validation, and 200 with normalized data on success.

- [ ] **Step 5: Register routes with existing permissions**

```go
public.Get("/event-alert", eventAlertHandler.GetPublic)
admin.Get("/event-alert", middleware.PermissionRequired("settings", "read"), eventAlertHandler.GetAdmin)
admin.Put("/event-alert", middleware.PermissionRequired("settings", "update"), eventAlertHandler.Update)
```

- [ ] **Step 6: Run handler and full backend tests**

Run: `cd backend && go test ./internal/handlers ./internal/eventalert ./pkg/utils && go test ./...`

Expected: PASS.

- [ ] **Step 7: Commit endpoints**

```bash
git add backend/internal/handlers/event_alert_handler.go backend/internal/handlers/event_alert_handler_test.go backend/internal/routes/routes.go backend/pkg/utils/response.go
git commit -m "feat: expose event alert APIs"
```

### Task 5: Add typed frontend Event Alert API and validation

**Files:**
- Create: `frontend/src/features/public/event-alert/types.ts`
- Create: `frontend/src/features/public/event-alert/schema.ts`
- Create: `frontend/src/features/public/event-alert/api.ts`
- Create: `frontend/src/features/public/event-alert/queries.ts`
- Create: `frontend/src/features/public/event-alert/schema.test.ts`
- Create: `frontend/src/features/public/events/schema.ts`
- Modify: `frontend/src/features/public/events/types.ts`

**Interfaces:**
- Produces: `PublicEventAlert`, `AdminEventAlertResponse`, `createEventAlertFormSchema(constraints)`, public/Admin query hooks, and Admin mutation hook.

- [ ] **Step 1: Write failing schema tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { createEventAlertFormSchema, publicEventAlertSchema } from "./schema";

const constraints = { delay_seconds: { min: 0, max: 30 }, dismiss_hours: { min: 1, max: 720 } };

test("enabled alert requires an event", () => {
  const result = createEventAlertFormSchema(constraints).safeParse({ enabled: true, event_id: null, delay_seconds: 2, dismiss_hours: 24 });
  assert.equal(result.success, false);
});

test("form schema derives numeric limits from API constraints", () => {
  const result = createEventAlertFormSchema(constraints).safeParse({ enabled: false, event_id: null, delay_seconds: 31, dismiss_hours: 0 });
  assert.equal(result.success, false);
});

test("public alert rejects enabled response without event", () => {
  const result = publicEventAlertSchema.safeParse({ enabled: true, delay_seconds: 2, dismiss_hours: 24, version: "abc", event: null });
  assert.equal(result.success, false);
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `cd frontend && npx tsx --test src/features/public/event-alert/schema.test.ts`

Expected: FAIL because the feature files do not exist.

- [ ] **Step 3: Add the reusable Event runtime schema**

Move the Event DTO's runtime shape into `features/public/events/schema.ts` and derive the type from it. Include the numeric ID already returned by the backend:

```ts
import { z } from "zod";
import { isLocalizedRichTextSource, type LocalizedRichText } from "@/lib/rich-text/document";

const localizedTextDtoSchema = z.object({ th: z.string(), en: z.string(), de: z.string() });
const localizedRichTextDtoSchema = z.custom<LocalizedRichText>(isLocalizedRichTextSource, "Invalid localized rich text");
const eventScheduleDtoSchema = z.object({
  id: z.number().int().positive(), start_time: z.string(), end_time: z.string(),
  activity: localizedTextDtoSchema, display_order: z.number().int(),
});

export const publicEventSchema = z.object({
  id: z.number().int().positive(), slug: z.string().min(1), title: localizedTextDtoSchema,
  description: localizedRichTextDtoSchema.nullable(), start_date: z.string(), end_date: z.string(),
  start_time: z.string().nullable(), end_time: z.string().nullable(), location: localizedTextDtoSchema,
  image_url: z.string().nullable(), map_url: z.string().nullable(), schedules: z.array(eventScheduleDtoSchema),
});
export type PublicEventDto = z.infer<typeof publicEventSchema>;
```

Update `events/types.ts` to import and re-export `PublicEventDto`, then update `events/api.ts` to parse single and list responses with this schema. This establishes one runtime Event parser for both features.

- [ ] **Step 4: Define exact Event Alert DTOs and Zod schemas**

Use `PublicEventDto` from `features/public/events/types.ts`; do not duplicate it. Model the public response as a discriminated union so `enabled:true` requires an Event and `enabled:false` requires `event:null`.

```ts
export const publicEventAlertSchema = z.discriminatedUnion("enabled", [
  z.object({ enabled: z.literal(true), delay_seconds: z.number().int(), dismiss_hours: z.number().int(), version: z.string().min(1), event: publicEventSchema }),
  z.object({ enabled: z.literal(false), delay_seconds: z.number().int(), dismiss_hours: z.number().int(), version: z.string(), event: z.null() }),
]);
```

Import `publicEventSchema` from the shared Event schema. Create the form schema factory with `superRefine` for the enabled/Event relationship and use only the provided constraint object for numeric min/max.

- [ ] **Step 5: Add typed API calls and queries**

```ts
export async function fetchPublicEventAlert(): Promise<PublicEventAlert> {
  const response = await publicApi.get<ApiSuccess<unknown>>("/event-alert");
  return publicEventAlertSchema.parse(response.data.data);
}

export async function fetchAdminEventAlert(): Promise<AdminEventAlertResponse> {
  const response = await api.get<ApiResponse<unknown>>("/admin/event-alert");
  return adminEventAlertResponseSchema.parse(response.data.data);
}

export async function updateAdminEventAlert(settings: EventAlertSettings): Promise<AdminEventAlertResponse> {
  const response = await api.put<ApiResponse<unknown>>("/admin/event-alert", settings);
  return adminEventAlertResponseSchema.parse(response.data.data);
}
```

Queries use keys `eventAlertKeys.public()` and `eventAlertKeys.admin()`. Successful mutation replaces Admin cache and invalidates the public key.

- [ ] **Step 6: Run tests, typecheck, and lint**

Run: `cd frontend && npx tsx --test src/features/public/event-alert/schema.test.ts && npx tsc --noEmit && npx eslint src/features/public/event-alert`

Expected: PASS with no `any`.

- [ ] **Step 7: Commit the frontend data layer**

```bash
git add frontend/src/features/public/event-alert frontend/src/features/public/events/schema.ts frontend/src/features/public/events/types.ts frontend/src/features/public/events/api.ts
git commit -m "feat: add typed event alert client"
```

### Task 6: Build the validated Admin Event Alert panel

**Files:**
- Create: `frontend/src/components/admin/settings/EventAlertSettingsPanel.tsx`
- Modify: `frontend/src/app/[locale]/admin/settings/page.tsx`
- Modify: `frontend/src/messages/admin/th.json`
- Modify: `frontend/src/messages/admin/en.json`
- Modify: `frontend/src/messages/admin/de.json`
- Create: `frontend/src/components/admin/settings/EventAlertSettingsPanel.test.ts`

**Interfaces:**
- Consumes: Admin Event Alert query/mutation, `eventAdminService.getAll`, and dynamic form schema from Task 5.

- [ ] **Step 1: Write a failing source contract test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("Event Alert panel uses typed constraints and its own mutation", async () => {
  const source = await readFile(new URL("./EventAlertSettingsPanel.tsx", import.meta.url), "utf8");
  assert.match(source, /createEventAlertFormSchema/);
  assert.match(source, /useUpdateAdminEventAlertMutation/);
  assert.doesNotMatch(source, /settingsAdminService\.update/);
  assert.doesNotMatch(source, /\bas any\b|no-explicit-any/);
});
```

- [ ] **Step 2: Run the test and verify failure**

Run: `cd frontend && npx tsx --test src/components/admin/settings/EventAlertSettingsPanel.test.ts`

Expected: FAIL because the panel does not exist.

- [ ] **Step 3: Implement load, retry, and isolated save states**

The component must wait for `AdminEventAlertResponse` before constructing the resolver and form. Use `zodResolver(createEventAlertFormSchema(data.constraints))`, reset from `data.settings`, and submit only `EventAlertSettings` to the dedicated mutation.

Use `useQuery` with `eventAdminService.getAll()` for options, filter `is_active`, and preserve an unavailable current selection as a disabled option rather than selecting a replacement.

- [ ] **Step 4: Map typed Axios field errors without `useApiError`**

```ts
if (axios.isAxiosError<ApiResponse<never>>(error)) {
  const fields = error.response?.data.fields;
  for (const field of eventAlertFieldNames) {
    const message = fields?.[field];
    if (message) form.setError(field, { type: "server", message });
  }
}
```

`eventAlertFieldNames` is a readonly tuple declared beside the form type. No cast to `FieldPath` or `any` is needed because the tuple is typed from `keyof EventAlertSettings`.

- [ ] **Step 5: Mount the panel independently in Settings**

Render `<EventAlertSettingsPanel />` before the generic grouped settings list. Do not add Event Alert raw records to the generic list; filter category `event-alert` from `grouped` so there is one editing surface and one save action.

- [ ] **Step 6: Add localized labels and error copy**

Add the same keys under `Admin.settings.eventAlert` in Thai, English, and German: title, description, enabled, event, delaySeconds, dismissHours, selectEvent, unavailableEvent, loadError, retry, save, and saveSuccess. Components contain no visitor-facing or Admin-facing hardcoded copy.

- [ ] **Step 7: Run tests and static checks**

Run: `cd frontend && npx tsx --test src/components/admin/settings/EventAlertSettingsPanel.test.ts src/features/public/event-alert/schema.test.ts && npx tsc --noEmit && npx eslint src/components/admin/settings 'src/app/[locale]/admin/settings/page.tsx' src/features/public/event-alert`

Expected: PASS.

- [ ] **Step 8: Commit the Admin panel**

```bash
git add frontend/src/components/admin/settings 'frontend/src/app/[locale]/admin/settings/page.tsx' frontend/src/messages/admin frontend/src/features/public/event-alert
git commit -m "feat: manage event alert settings"
```

### Task 7: Replace implicit public popup behavior

**Files:**
- Create: `frontend/src/features/public/event-alert/dismissal.ts`
- Create: `frontend/src/features/public/event-alert/dismissal.test.ts`
- Modify: `frontend/src/components/home/EventAlertModal.tsx`

**Interfaces:**
- Consumes: `usePublicEventAlertQuery`, `PublicEventAlert`.
- Produces: `dismissalKey(alert)`, `isDismissed(alert, storedAt, now)`.

- [ ] **Step 1: Write failing dismissal tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { dismissalKey, isDismissed } from "./dismissal";

const alert = { enabled: true as const, delay_seconds: 2, dismiss_hours: 24, version: "v2", event: { id: 7 } };

test("dismissal key changes with version", () => {
  assert.notEqual(dismissalKey(alert), dismissalKey({ ...alert, version: "v3" }));
});

test("dismissal expiry uses API hours", () => {
  assert.equal(isDismissed(alert, 1_000, 1_000 + 23 * 60 * 60 * 1_000), true);
  assert.equal(isDismissed(alert, 1_000, 1_000 + 25 * 60 * 60 * 1_000), false);
});
```

Use a minimal typed identity input in `dismissal.ts` so tests do not fabricate the full `PublicEventDto`.

- [ ] **Step 2: Run tests and verify failure**

Run: `cd frontend && npx tsx --test src/features/public/event-alert/dismissal.test.ts`

Expected: FAIL because helpers do not exist.

- [ ] **Step 3: Implement pure dismissal helpers**

```ts
type AlertIdentity = { version: string; dismiss_hours: number; event: { id: number } };
export const dismissalKey = (alert: AlertIdentity) => `event-alert-dismissed-${alert.event.id}-${alert.version}`;
export const isDismissed = (alert: AlertIdentity, storedAt: number, now: number) => storedAt > 0 && now - storedAt < alert.dismiss_hours * 60 * 60 * 1000;
```

The public Event DTO already includes numeric `id` after Task 5; do not use slug as a substitute because the approved identity is Event ID plus version.

- [ ] **Step 4: Refactor EventAlertModal to the dedicated query**

Remove `usePublicEventsQuery(3)` and `query.data?.[0]`. Use the discriminated response:

```ts
const query = usePublicEventAlertQuery();
const alert = query.data;
useEffect(() => {
  if (!alert?.enabled || typeof window === "undefined") return;
  const key = dismissalKey(alert);
  const dismissedAt = Number(window.localStorage.getItem(key));
  if (isDismissed(alert, dismissedAt, Date.now())) return;
  const timer = window.setTimeout(() => setIsOpen(true), alert.delay_seconds * 1000);
  return () => window.clearTimeout(timer);
}, [alert]);
```

On storage read/write exceptions, keep the page operational and limit the failure to dismissal persistence. Query error, disabled response, or missing data renders nothing.

- [ ] **Step 5: Run unit tests, typecheck, and lint**

Run: `cd frontend && npx tsx --test src/features/public/event-alert/dismissal.test.ts src/features/public/event-alert/schema.test.ts && npx tsc --noEmit && npx eslint src/features/public/event-alert src/components/home/EventAlertModal.tsx`

Expected: PASS.

- [ ] **Step 6: Verify hardcoded behavior is gone**

Run: `rg -n "query\.data\?\.\[0\]|setTimeout\([^,]+, 2000\)|24 \* 60 \* 60" frontend/src/components/home/EventAlertModal.tsx`

Expected: no matches.

- [ ] **Step 7: Commit public popup integration**

```bash
git add frontend/src/features/public/event-alert frontend/src/components/home/EventAlertModal.tsx
git commit -m "feat: render configured event alert"
```

### Task 8: Full Event Alert verification

**Files:**
- Modify only files required to correct verification failures introduced by Tasks 1-7.

- [ ] **Step 1: Run backend tests**

Run: `cd backend && go test ./...`

Expected: PASS; DB tests may explicitly SKIP only when `DATABASE_URL_TEST` is absent.

- [ ] **Step 2: Run Event Alert frontend tests**

Run: `cd frontend && npx tsx --test src/features/public/event-alert/schema.test.ts src/features/public/event-alert/dismissal.test.ts src/components/admin/settings/EventAlertSettingsPanel.test.ts`

Expected: PASS.

- [ ] **Step 3: Run full frontend static checks**

Run: `cd frontend && npx tsc --noEmit && npm run lint && npm run build`

Expected: typecheck, lint, and production build all PASS.

- [ ] **Step 4: Verify migration and source constraints**

Run: `git diff --check && rg -n "event_alert_" backend/migrations/000019_seed_event_alert_settings.*.sql backend/internal/eventalert && rg -n "query\.data\?\.\[0\]|2000|24 \* 60 \* 60|\bas any\b|no-explicit-any" frontend/src/features/public/event-alert frontend/src/components/home/EventAlertModal.tsx frontend/src/components/admin/settings`

Expected: migration and backend searches show centralized keys; frontend search finds no implicit selection, popup timing literals, unsafe assertions, or lint suppressions.

- [ ] **Step 5: Manually verify the four critical states**

1. Disabled config: Home shows no popup.
2. Enabled active Event: popup shows the selected Event after the configured delay.
3. Dismissed Alert: refresh does not show it until configured dismissal expiry.
4. Changed Event/config version: the new Alert displays despite the old dismissal.

Also deactivate the selected Event in Admin and confirm the public API returns a disabled Alert.

- [ ] **Step 6: Commit verification-only corrections if needed**

```bash
git add backend frontend
git commit -m "test: verify event alert settings"
```

Skip this commit when verification required no changes.
