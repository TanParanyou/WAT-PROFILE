# Calendar Resources and Read-only Views Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real calendar resources, multi-resource event assignments, and production-ready read-only Timeline and Resource DayGrid layouts to the custom Calendar.

**Architecture:** `month`, `week`, and `day` remain semantic ranges. A developer preset chooses `monthGrid`, `monthAgenda`, `timeGrid`, `dayStrip`, `timeline`, or `resourceDayGrid` as presentation. The generic React Calendar consumes normalized events/resources and render callbacks only; WAT adapters, typed API clients, and Go services own persistence, locale, permission, filter, and visibility rules.

**Tech Stack:** React 19, Next.js 16 App Router, TypeScript, Tailwind CSS 4, TanStack Query, Go 1.24, Fiber v2, GORM, PostgreSQL, node:test/tsx.

## Global Constraints

- Keep the custom Calendar; do not add FullCalendar or another calendar UI library.
- Calendar core cannot import Next.js, WAT adapters, locale messages, Axios, or routes.
- Backend owns persistence, permissions, public visibility, and `Europe/Berlin` time semantics.
- Preserve complete `th`, `en`, and `de` public/admin messages, 44px controls, 3px focus indicators, keyboard operation, 200% zoom, reduced motion, and a non-horizontal-only mobile fallback.
- Production screens use API data; fixtures are only for automated tests.
- Do not alter the uncommitted Event-detail files or migrations `000043_add_event_extended_fields` and `000044_add_group_event_registrations`; this slice creates `000045`.
- Update OpenAPI, backend contracts, frontend parser/client, and tests together for every API change.
- Drag/drop, resize, recurrence, conflict validation, and external sync are out of scope for this read-only slice.

---

## File structure

| Path | Responsibility |
|---|---|
| `frontend/src/features/calendar/core/types.ts` | Generic event/resource types and resource-ID normalization. |
| `frontend/src/features/calendar/layout.ts` | Pure multi-resource lane grouping. |
| `frontend/src/features/calendar/config.ts` | Developer layout override validation. |
| `frontend/src/features/calendar/views/timeline.ts` | Pure Timeline model. |
| `frontend/src/features/calendar/views/TimelineView.tsx` | Generic resource-by-time renderer. |
| `frontend/src/features/calendar/views/resource-day-grid.ts` | Pure resource-day model. |
| `frontend/src/features/calendar/views/DayGridView.tsx` | Generic resource-by-day renderer. |
| `backend/internal/models/calendar_resource.go` | GORM resource and assignment models. |
| `backend/internal/services/calendar_resource_service.go` | Resource CRUD and event assignment service. |
| `backend/internal/calendar/resource_source.go` | Localized feed resource query/materialization. |
| `frontend/src/app/[locale]/admin/calendar/resources/page.tsx` | Permission-gated resource registry. |

## Interfaces created by this slice

```ts
export interface CalendarEventBase {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  resourceId?: string; // compatibility alias
  resourceIds?: readonly string[];
}

export interface CalendarResource<TMeta = unknown> {
  id: string;
  title: string;
  color?: string;
  group?: string;
  meta?: TMeta;
}

export function getCalendarEventResourceIds(event: CalendarEventLike): readonly string[];
```

```go
type Entry struct {
    ID          string   `json:"id"`
    ResourceID  string   `json:"resourceId,omitempty"`
    ResourceIDs []string `json:"resourceIds,omitempty"`
    // Current presentation fields remain unchanged.
}

type ResourceSource interface {
    ListResources(context.Context, Locale, bool) ([]Resource, error)
}
```

Valid layouts: Month → `monthGrid | monthAgenda`; Week → `timeGrid | dayStrip | timeline`; Day → `timeGrid | timeline | resourceDayGrid`.

### Task 1: Extend generic resource/layout contracts

**Files:**
- Modify: `frontend/src/features/calendar/core/types.ts`, `layout.ts`, `presets/types.ts`, `config.ts`, `index.ts`, `README.md`
- Test: `frontend/src/features/calendar/layout.test.ts`, `config.test.ts`, `public-api.test.ts`

**Interfaces:**
- Consumes: current `CalendarEventLike`, `CalendarResource`, preset layouts.
- Produces: plural IDs, `getCalendarEventResourceIds`, valid resource layouts, and `CalendarConfigInput.layouts` for Tasks 4–6.

- [ ] **Step 1: Write failing tests**

```ts
test("plural resource IDs take precedence over the legacy alias", () => {
  assert.deepEqual(
    getCalendarEventResourceIds({ ...event(), resourceId: "hall", resourceIds: ["hall", "projector"] }),
    ["hall", "projector"],
  );
});

test("only compatible resource layouts resolve", () => {
  const config = resolveCalendarConfig(planningPreset, {
    layouts: { desktop: { week: "timeline", day: "resourceDayGrid", month: "timeline" } },
  });
  assert.equal(config.layouts.desktop.week, "timeline");
  assert.equal(config.layouts.desktop.day, "resourceDayGrid");
  assert.equal(config.layouts.desktop.month, "monthGrid");
});
```

- [ ] **Step 2: Run tests and observe the missing contract**

Run: `cd frontend && NODE_ENV=development ./node_modules/.bin/tsx --test src/features/calendar/layout.test.ts src/features/calendar/config.test.ts src/features/calendar/public-api.test.ts`

Expected: FAIL because plural IDs, `timeline`, `resourceDayGrid`, and input layout overrides do not exist.

- [ ] **Step 3: Add the minimal source-neutral implementation**

```ts
export function getCalendarEventResourceIds(event: CalendarEventLike): readonly string[] {
  const values = event.resourceIds?.length ? event.resourceIds : event.resourceId ? [event.resourceId] : [];
  return [...new Set(values.filter((id) => id.trim().length > 0))];
}

const validLayouts: Record<CalendarView, readonly CalendarLayout[]> = {
  month: ["monthGrid", "monthAgenda"],
  week: ["timeGrid", "dayStrip", "timeline"],
  day: ["timeGrid", "timeline", "resourceDayGrid"],
};
```

Merge `CalendarConfigInput.layouts` over preset layouts before validation. Update lane grouping to place a multi-resource event in every assigned lane and an unassigned event in the caller-defined fallback lane. Keep `discoveryPreset` unchanged.

- [ ] **Step 4: Verify generic Calendar compatibility**

Run: `cd frontend && npm run test:calendar && ./node_modules/.bin/tsc --noEmit`

Expected: PASS; singular `resourceId` callers retain behavior.

- [ ] **Step 5: Commit**

Stage only Task 1 files and commit with `feat(calendar): support resource layout contracts`.

### Task 2: Add resource and assignment persistence

**Files:**
- Create: `backend/migrations/000045_create_calendar_resources.up.sql`, `backend/migrations/000045_create_calendar_resources.down.sql`
- Create: `backend/internal/models/calendar_resource.go`, `backend/internal/models/calendar_resource_test.go`
- Modify: `backend/internal/models/event.go`

**Interfaces:**
- Consumes: `models.Event`, `models.MultiLangText`, and already-applied migration `000043`.
- Produces: `models.CalendarResource` and `models.EventResourceAssignment` for Tasks 3–4.

- [ ] **Step 1: Write failing model-invariant tests**

```go
func TestCalendarResourceAssignmentUsesEventAndResourceIDs(t *testing.T) {
    assignment := models.EventResourceAssignment{EventID: 12, ResourceID: 7}
    if assignment.EventID != 12 || assignment.ResourceID != 7 { t.Fatalf("unexpected assignment: %#v", assignment) }
}

func TestCalendarResourceStoresLocalizedTitleAndVisibility(t *testing.T) {
    resource := models.CalendarResource{Slug: "main-hall", Title: models.MultiLangText{"th": "ศาลาหลัก", "en": "Main hall", "de": "Haupthalle"}, IsActive: true, IsPublic: true}
    if resource.Title.Get("de") != "Haupthalle" || !resource.IsPublic { t.Fatalf("unexpected resource: %#v", resource) }
}
```

- [ ] **Step 2: Run focused model tests**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/models -run TestCalendarResource`

Expected: FAIL because resource/assignment types are absent.

- [ ] **Step 3: Add a reversible migration and matching models**

```sql
CREATE TABLE calendar_resources (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  resource_type VARCHAR(50) NOT NULL,
  title JSONB NOT NULL,
  color VARCHAR(16),
  capacity INTEGER CHECK (capacity IS NULL OR capacity > 0),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE event_resource_assignments (
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  resource_id BIGINT NOT NULL REFERENCES calendar_resources(id) ON DELETE RESTRICT,
  PRIMARY KEY (event_id, resource_id)
);
CREATE INDEX event_resource_assignments_resource_event_idx ON event_resource_assignments (resource_id, event_id);
CREATE INDEX calendar_resources_visibility_order_idx ON calendar_resources (is_active, is_public, display_order, id);
UPDATE roles
SET permissions = jsonb_set(COALESCE(permissions, '{}'::jsonb), '{calendar_resources}', '"all"'::jsonb, true)
WHERE name IN ('admin', 'editor') AND admin_access = true;
```

Implement a JSONB-safe `JSONMap` Scanner/Valuer in `calendar_resource.go`, `CalendarResource`, and `EventResourceAssignment`. Append `ResourceAssignments []EventResourceAssignment` to `models.Event` without replacing the user’s current Event fields. The down migration removes `calendar_resources` from the affected role permissions, then drops the join table/index before the resource table/index.

- [ ] **Step 4: Verify on a confirmed local non-production database**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/models && go run cmd/migrate/main.go up && go run cmd/migrate/main.go version`

Expected: PASS and migration version `44`; do not run down against shared or production data.

- [ ] **Step 5: Commit**

Stage only Task 2 files and commit with `feat(calendar): add resource persistence`.

### Task 3: Add registry APIs and atomic event-resource assignment

**Files:**
- Create: `backend/internal/services/calendar_resource_service.go`, `backend/internal/services/calendar_resource_service_test.go`
- Create: `backend/internal/handlers/calendar_resource_handler.go`, `backend/internal/handlers/calendar_resource_handler_test.go`
- Modify: `backend/internal/handlers/event_handler.go`, `backend/internal/services/event_service.go`, `backend/internal/routes/routes.go`, `backend/internal/routes/admin_policy_test.go`, `backend/cmd/seed/main.go`, `backend/docs/openapi.yaml`

**Interfaces:**
- Consumes: Task 2 models, `listquery.Common`, existing Event create/update and audit service.
- Produces: protected `/admin/calendar-resources` CRUD and `resource_ids: number[]` event input for Tasks 4 and 6.

- [ ] **Step 1: Write failing validation and assignment tests**

```go
func TestValidateCalendarResourceInputRejectsIncompleteData(t *testing.T) {
    input := handlers.CalendarResourceInput{Slug: "", ResourceType: "", Title: models.MultiLangText{"th": "", "en": "", "de": ""}}
    if err := handlers.ValidateCalendarResourceInput(input); err == nil { t.Fatal("expected validation error") }
}

func TestNormalizeResourceIDsDeduplicatesValues(t *testing.T) {
    ids, err := services.NormalizeResourceIDs([]int{3, 3, 7})
    if err != nil || !reflect.DeepEqual(ids, []int{3, 7}) { t.Fatalf("ids=%v err=%v", ids, err) }
}
```

- [ ] **Step 2: Run focused backend tests**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services ./internal/handlers ./internal/routes -run 'TestValidateCalendarResource|TestNormalizeResourceIDs'`

Expected: FAIL because input validation and assignment normalization are missing.

- [ ] **Step 3: Implement permission-safe CRUD and assignment replacement**

```go
type CalendarResourceInput struct {
    Slug string `json:"slug"`
    ResourceType string `json:"resource_type"`
    Title models.MultiLangText `json:"title"`
    Color string `json:"color"`
    Capacity *int `json:"capacity"`
    Metadata models.JSONMap `json:"metadata"`
    IsActive bool `json:"is_active"`
    IsPublic bool `json:"is_public"`
    DisplayOrder int `json:"display_order"`
}

func (s *EventService) ReplaceResourceAssignments(tx *gorm.DB, eventID int, resourceIDs []int) error
```

Validate lowercase slug, non-empty type, all three non-empty titles, optional six-digit color, and positive capacity. List by `display_order ASC, id ASC`; filter search/type/status and return `assignment_count` with each admin resource row. Register static `/calendar-resources` routes before `/:id` with `calendar_resources:{read,create,update,delete}`. Delete returns `409 Conflict` while a resource is assigned. Parse `resource_ids` through an Event request DTO and replace associations inside the current event service transaction; never accept association objects from the browser. Add seed permission and OpenAPI schemas.

- [ ] **Step 4: Verify backend contracts**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/services ./internal/handlers ./internal/routes && GOCACHE=/private/tmp/wat-profile-go-cache go vet ./...`

Expected: PASS; invalid input uses the common error envelope and duplicate IDs cannot create duplicate assignments.

- [ ] **Step 5: Commit**

Stage only Task 3 files and commit with `feat(calendar): add resource registry API`.

### Task 4: Expand the typed calendar feed with localized resources

**Files:**
- Modify: `backend/internal/calendar/types.go`, `backend/internal/calendar/event_source.go`, `backend/internal/calendar/event_source_test.go`, `backend/internal/handlers/calendar_handler.go`, `backend/internal/handlers/calendar_handler_test.go`
- Create: `backend/internal/calendar/resource_source.go`, `backend/internal/calendar/resource_source_test.go`
- Modify: `frontend/src/features/calendar/types.ts`, `api.ts`, `api.test.ts`, `queries.ts`, `backend/docs/openapi.yaml`

**Interfaces:**
- Consumes: Task 1 plural IDs and Task 3 registry/assignments.
- Produces: `CalendarFeedRequest.resourceIds?: readonly string[]`, localized resource list, and normalized resource IDs for Tasks 5–6.

- [ ] **Step 1: Write failing feed-contract tests**

```go
func TestEventSourceMaterializesEveryAssignedResource(t *testing.T) {
    entry := MaterializeEntry(eventWithResourceSlugs("main-hall", "projector"), "en", true)
    if diff := cmp.Diff([]string{"main-hall", "projector"}, entry.ResourceIDs); diff != "" { t.Fatal(diff) }
}

func TestPublicResourceSourceOmitsInactiveAndPrivateRows(t *testing.T) {
    resources := materializePublicResources(fixtures, calendar.LocaleEnglish)
    if got := resourceSlugs(resources); !reflect.DeepEqual(got, []string{"main-hall"}) { t.Fatalf("resources=%v", got) }
}
```

```ts
test("calendar client normalizes plural IDs and serializes filters", async () => {
  const feed = await fetchCalendarFeedFromApi({ scope: "admin", locale: "en", range, resourceIds: ["main-hall"] });
  assert.deepEqual(feed.entries[0]?.resourceIds, ["main-hall", "projector"]);
});
```

- [ ] **Step 2: Run focused feed tests**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/calendar ./internal/handlers -run 'TestEventSourceMaterializesEvery|TestPublicResourceSource'`

Run: `cd frontend && NODE_ENV=development ./node_modules/.bin/tsx --test src/features/calendar/api.test.ts`

Expected: FAIL because the current feed uses a hard-coded default resource.

- [ ] **Step 3: Materialize feed resources and parse filters**

```go
func (s *EventSource) List(ctx context.Context, request Request, canEdit bool) ([]Entry, error) {
    query := s.db.WithContext(ctx).Preload("ResourceAssignments.Resource")
    // retain existing date-overlap and active-scope filters
}

func (s *ResourceSource) ListResources(ctx context.Context, locale Locale, publicOnly bool) ([]Resource, error) {
    query := s.db.WithContext(ctx).Where("is_active = ?", true).Order("display_order ASC, id ASC")
    if publicOnly { query = query.Where("is_public = ?", true) }
    // localize title and map color
}
```

Refactor `CalendarHandler` to compose event/resource sources. Parse repeated optional `resourceId` query values into `calendar.Request.ResourceIDs`, preserve the 93-day cap, and filter in EventSource. Emit ordered `resourceIds`; emit `resourceId` only as first-ID compatibility. The TypeScript parser accepts both and normalizes plural IDs, rejects blank/duplicate IDs, keys TanStack data by sorted filters, and serializes repeated query parameters.

- [ ] **Step 4: Verify API and frontend contracts**

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./internal/calendar ./internal/handlers && GOCACHE=/private/tmp/wat-profile-go-cache go test ./...`

Run: `cd frontend && npm run test:calendar && ./node_modules/.bin/tsc --noEmit`

Expected: PASS; public feeds expose active/public resources only, and admin feeds preserve current inactive-event behavior.

- [ ] **Step 5: Commit**

Stage only Task 4 files and commit with `feat(calendar): expose assigned resources in feed`.

### Task 5: Replace Timeline prototype and add Resource DayGrid through the facade

**Files:**
- Create: `frontend/src/features/calendar/views/timeline.ts`, `timeline.test.ts`, `resource-day-grid.ts`, `resource-day-grid.test.ts`
- Modify: `frontend/src/features/calendar/views/TimelineView.tsx`, `DayGridView.tsx`, `frontend/src/features/calendar/Calendar.tsx`, `calendar-copy.ts`, `presets/planning.ts`
- Test: `frontend/src/features/calendar/views/TimelineView.test.tsx`, `DayGridView.test.tsx`, `Calendar.test.tsx`, `presets/presets.test.ts`, `ui/calendar-acceptance.test.ts`

**Interfaces:**
- Consumes: Tasks 1 and 4 generic contracts/real feed.
- Produces: generic `<TimelineView<TEvent>>`, `<DayGridView<TEvent>>`, and facade branches for Task 6.

- [ ] **Step 1: Write failing pure-model, DOM, and facade tests**

```ts
test("Timeline renders a multi-resource event in each assigned lane", () => {
  const model = buildTimelineModel({ day: "2026-08-12", entries: [event({ resourceIds: ["hall", "projector"] })], resources });
  assert.equal(model.lanes.find((lane) => lane.resource.id === "hall")?.timedEntries.length, 1);
  assert.equal(model.lanes.find((lane) => lane.resource.id === "projector")?.timedEntries.length, 1);
});

test("planning layout keeps semantic view while selecting presentation", () => {
  assertCalendarMode({ viewport: 1280, view: "week", mode: "timeline" });
  assertCalendarMode({ viewport: 1280, view: "day", mode: "resourceDayGrid" });
  assertCalendarMode({ viewport: 390, view: "week", mode: "dayStrip" });
  assertCalendarMode({ viewport: 390, view: "day", mode: "timeGrid" });
});
```

- [ ] **Step 2: Run focused layout tests**

Run: `cd frontend && NODE_ENV=development ./node_modules/.bin/tsx --test src/features/calendar/views/timeline.test.ts src/features/calendar/views/TimelineView.test.tsx src/features/calendar/views/resource-day-grid.test.ts src/features/calendar/views/DayGridView.test.tsx src/features/calendar/Calendar.test.tsx`

Expected: FAIL because the existing prototypes are WAT-specific and Calendar has no resource-layout dispatch.

- [ ] **Step 3: Implement generic models and responsive facade dispatch**

```tsx
const viewContent = layout === "timeline" ? (
  <TimelineView days={timelineDays} entries={events} resources={resources ?? []} labels={labels} variant={variant} onEntryActivate={onEventActivate} />
) : layout === "resourceDayGrid" ? (
  <DayGridView day={controller.selectedDate} entries={events} resources={resources ?? []} labels={labels} variant={variant} onEntryActivate={onEventActivate} />
) : /* current Month/DayStrip/TimeGrid branches */ null;
```

Timeline uses labelled row headers and time-axis column headers, existing render/class/tooltip callbacks, per-lane overlap layout, all-day lane headers, and 44px buttons. DayGrid groups entries for one selected day, includes an unassigned lane only when needed, and uses no hard-coded display strings. Add `timeline`, `resource`, and `unassignedResource` labels. Configure Planning desktop Week → Timeline and Day → Resource DayGrid; mobile Week → DayStrip and Day → TimeGrid. Discovery remains unchanged.

- [ ] **Step 4: Verify generic boundary, accessibility, and build**

Run: `cd frontend && npm run test:calendar && ./node_modules/.bin/tsc --noEmit && npm run build -- --webpack`

Expected: PASS; views have no WAT/Next import, keyboard activation works, long German lane labels do not clip, and mobile has no horizontal-only access path.

- [ ] **Step 5: Commit**

Stage only Task 5 files and commit with `feat(calendar): add resource read-only layouts`.

### Task 6: Integrate resource management, assignment, filtering, and localization in WAT Admin

**Files:**
- Create: `frontend/src/schemas/calendar-resource.schema.ts`, `frontend/src/app/[locale]/admin/calendar/resources/page.tsx`, `frontend/src/app/[locale]/admin/calendar/_components/CalendarResourceManager.tsx`, `CalendarResourceManager.test.tsx`, `CalendarResourceFilter.tsx`
- Modify: `frontend/src/types/entities.ts`, `types/auth.ts`, `services/adminService.ts`, `components/admin/PermissionEditor.tsx`, `components/admin/AdminSidebar.tsx`
- Modify: `frontend/src/app/[locale]/admin/calendar/_components/AdminCalendarContent.tsx`, `frontend/src/app/[locale]/admin/events/_components/EventEditor.tsx`, `frontend/src/schemas/event.schema.ts`
- Modify: `frontend/src/features/calendar/integrations/wat/useClientCalendarLabels.ts`, all `frontend/src/messages/{th,en,de}.json`, all `frontend/src/messages/admin/{th,en,de}.json`, `README.md`, `dependency-boundary.test.ts`, and `ui/calendar-acceptance.test.ts`

**Interfaces:**
- Consumes: Tasks 3–5 APIs and view contracts.
- Produces: usable admin registry/assignment/filter UI and Slice 1 completion evidence.

- [ ] **Step 1: Write failing schema and integration tests**

```ts
test("calendar resource schema rejects an incomplete localized title", () => {
  const result = calendarResourceSchema.safeParse({ slug: "hall", resource_type: "location", title: { th: "", en: "Hall", de: "Halle" } });
  assert.equal(result.success, false);
});

test("resource manager disables delete for an assigned resource", () => {
  const screen = renderResourceManager(resource({ assignment_count: 2 }));
  assert.equal(screen.getByRole("button", { name: /delete/i }).hasAttribute("disabled"), true);
});
```

- [ ] **Step 2: Run focused WAT integration tests**

Run: `cd frontend && NODE_ENV=development ./node_modules/.bin/tsx --test src/features/calendar/integrations/wat/*.test.tsx 'src/app/[locale]/admin/calendar/_components/CalendarResourceManager.test.tsx'`

Expected: FAIL because registry, resource schema, assignment field, and filter are absent.

- [ ] **Step 3: Implement adapters and admin UI only**

```ts
export interface CalendarResourceEntity {
  id: number;
  slug: string;
  resource_type: string;
  title: MultiLangText;
  color: string | null;
  capacity: number | null;
  metadata: Record<string, unknown>;
  is_active: boolean;
  is_public: boolean;
  display_order: number;
  assignment_count: number;
}

export const calendarResourceAdminService = createAdminService<CalendarResourceEntity>("calendar-resources");
```

Use React Hook Form, Zod, `MultiLangInput`, existing admin controls, typed service calls, and TanStack invalidation. Add `calendar_resources` to the frontend permission union/editor/sidebar. EventEditor submits `resource_ids: number[]`; backend Task 3 replaces assignments. `AdminCalendarContent` passes `data.resources` into `<Calendar>` and CalendarResourceFilter passes selected slugs to `useCalendarEntries`, never into Calendar core state. Add every public/admin label in all required locales and keep user-visible strings out of generic calendar modules. Document the resource contract, developer layout example, resource route/permission, public visibility rule, and deferred work in README.

- [ ] **Step 4: Run release verification and browser QA**

Run: `cd frontend && npm run test:calendar && ./node_modules/.bin/tsc --noEmit && npm run lint && npm run build -- --webpack`

Run: `cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./... && GOCACHE=/private/tmp/wat-profile-go-cache go vet ./... && GOCACHE=/private/tmp/wat-profile-go-cache go build -o /private/tmp/wat-profile-calendar-server ./cmd/app`

Manual browser QA: test `/th/admin/calendar?view=week` and `/th/admin/calendar?view=day` at 390px, 768px, 1280px; inspect assigned/unassigned events, active/inactive resources, filter behavior, and keyboard tabs. Repeat labels at `/en` and `/de`. Confirm `/th/calendar` retains discovery layouts and only returns public resources.

Expected: all commands PASS; no hydration warning, clipping, or information reachable only by horizontal drag.

- [ ] **Step 5: Commit**

Stage only Task 6 files and commit with `feat(calendar): manage resource calendar views`.

## Coverage review

| Requirement | Tasks |
|---|---|
| Generic multi-resource API and developer layout selection | 1, 5 |
| Resource registry and event assignments | 2, 3, 4, 6 |
| Localized typed public/admin feed | 4 |
| Timeline and Resource DayGrid | 5 |
| Admin CRUD, permissions, assignment, filtering | 3, 6 |
| Accessibility, localization, and release evidence | 5, 6 |
| Interaction, recurrence, conflicts, external sync | Deliberately deferred |
