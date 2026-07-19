# Public SEO and Event Alert Design

## Goal

Complete two independent public-client integrations without changing the Home CMS or making public navigation and footer links editable:

1. Render SEO metadata from the existing backend content contracts on the supported public pages.
2. Replace the Home event popup's implicit first-event selection and hardcoded timing with a typed, Admin-managed Event Alert configuration.

Admin inputs must match the backend contract. The implementation must not use TypeScript `any`, unsafe type assertions to bypass checking, or hardcoded business content and configuration in UI components.

## Scope

### Included

- API-backed SEO for About, Contact, Gallery, Events, Monks, Privacy, and Impressum index pages.
- Automatically derived metadata for Event and Monk detail pages.
- A typed Event Alert public API and Admin API backed by the existing `settings` table.
- An Event Alert panel in the existing Admin Settings page.
- Frontend and backend validation, field-error mapping, tests, and production verification.

### Excluded

- Home CMS content and Home SEO migration.
- Editable public navigation or footer links.
- Per-Event or per-Monk custom SEO fields.
- A dedicated Event Alert database table.
- Popup display schedules with start and end dates.
- Redesigning existing public or Admin layouts.

## Design Principles

- Backend API contracts are the source of truth for persisted data.
- Public content must fail safely: missing SEO uses an explicit fallback chain; an invalid Event Alert is disabled.
- Admin validation mirrors backend rules and maps backend field errors to the corresponding inputs.
- Business values come from the database or API. Components do not invent Event selections, timing values, or SEO content.
- Named constants may centralize protocol keys and validation policies. Magic strings and numbers must not be repeated across handlers or components.
- Each module owns one concern: SEO conversion, Event Alert persistence, Admin editing, or public popup behavior.

## Architecture

The work is split into two modules that do not depend on each other.

### SEO integration

The backend continues to use the existing `seo` and `published_seo` content-page fields. Public page responses expose only published SEO. Admin forms edit draft SEO through the existing page-specific content APIs and publish workflow.

The frontend adds one typed SEO metadata utility. Each supported route loads its public content in `generateMetadata()`, passes the typed SEO and content fallbacks to the utility, and receives a Next.js `Metadata` object. This removes route-specific fallback logic and prevents different pages from interpreting the same SEO object differently.

Event and Monk detail routes do not gain new SEO fields. They derive metadata from the entity title, description, and primary image returned by the existing public entity APIs.

### Event Alert settings

Event Alert uses the existing key-value `settings` table. It stores these records:

- `event_alert_enabled`
- `event_alert_event_id`
- `event_alert_delay_seconds`
- `event_alert_dismiss_hours`

The backend owns these keys as named constants inside the Event Alert module. A typed service reads and writes the records as one logical object. The Admin update is transactional so a partial configuration cannot be persisted.

The initial database records are installed with `enabled=false`. Frontend code does not provide substitute business defaults when records are absent.

The typed API facade prevents the key-value storage model from leaking into either frontend:

```text
Admin form
  -> typed Admin Event Alert API
  -> backend validation
  -> settings transaction

Public client
  -> typed Public Event Alert API
  -> validated settings plus active Event
  -> EventAlertModal
```

No new database table is required.

## Contracts

### SEO metadata

Frontend code uses a concrete type equivalent to:

```ts
type SeoMetadata = {
  title: LocalizedText;
  description: LocalizedText;
  keywords: LocalizedText;
  og_image: string;
  canonical_url: string;
  noindex: boolean;
};
```

The exact JSON field names must match the backend validator and existing Admin forms. API boundaries must parse unknown network data into this type; components must not accept `Record<string, unknown>` or use `any`.

SEO values fall back in this order:

1. Published SEO returned by the API.
2. Title, description, and primary image from the public API content or entity.
3. Existing localized route messages.
4. Existing technical site configuration.

The utility must not add new visitor-facing copy. Canonical URLs are resolved against the deployment origin. Empty optional fields are omitted from Next.js metadata rather than emitted as empty strings.

### Admin Event Alert settings

```ts
type EventAlertSettings = {
  enabled: boolean;
  event_id: number | null;
  delay_seconds: number;
  dismiss_hours: number;
};
```

The Admin read response contains the settings and typed constraints used to configure input attributes and frontend validation:

```ts
type EventAlertConstraints = {
  delay_seconds: { min: number; max: number };
  dismiss_hours: { min: number; max: number };
};

type AdminEventAlertResponse = {
  settings: EventAlertSettings;
  constraints: EventAlertConstraints;
};
```

The backend owns constraint values and returns them to Admin. The frontend does not repeat min/max literals inside components.

### Public Event Alert

```ts
type PublicEventAlert = {
  enabled: boolean;
  delay_seconds: number;
  dismiss_hours: number;
  version: string;
  event: PublicEventDto | null;
};
```

`version` changes whenever the effective Alert configuration changes. It is an opaque string to the client and is included in the dismissal storage key, allowing a changed Event or configuration to display even when the previous Alert was dismissed.

When the Alert is disabled or invalid, the public response is still structurally valid: `enabled=false` and `event=null`. Timing values remain typed API fields but are ignored by the client while disabled.

## Backend API

### Public endpoint

`GET /api/v1/public/event-alert`

- Requires no authentication.
- Loads the four Event Alert settings as one object.
- Loads the selected Event only when the Alert is enabled.
- Returns an enabled Alert only when the selected Event exists and is active.
- Returns a disabled response for missing settings, malformed stored values, a missing Event, or an inactive Event.
- Does not expose raw setting records.

### Admin endpoints

`GET /api/v1/admin/event-alert`

- Requires the existing Settings read permission.
- Returns the typed settings and backend-owned constraints.
- Does not silently invent persisted values. Missing required records are reported as a configuration error so they can be repaired operationally.

`PUT /api/v1/admin/event-alert`

- Requires the existing Settings update permission.
- Parses a typed request body.
- Validates the complete object before writing.
- Updates all setting records in one database transaction.
- Returns the normalized typed settings after the transaction.
- Returns HTTP 422 with field keys that exactly match the Admin form contract.

### Validation rules

- `event_id` is a positive integer or `null`.
- `enabled=true` requires `event_id`.
- A selected Event must exist and be active.
- `delay_seconds` is an integer within the backend-owned constraint.
- `dismiss_hours` is an integer within the backend-owned constraint.
- Boolean and numeric setting records must parse strictly; malformed values are not coerced into an enabled Alert.

Backend field errors use `enabled`, `event_id`, `delay_seconds`, and `dismiss_hours`. Cross-field errors are attached to the field the Admin can act on, normally `event_id` when an enabled configuration lacks a usable Event.

## Admin Frontend

The existing Admin Settings page gains an isolated Event Alert panel. It does not reuse the generic key-value save payload.

The panel contains:

- An enabled switch.
- An Event dropdown populated from the existing typed Admin Events API.
- A numeric delay input.
- A numeric dismissal-duration input.
- A read-only summary of the selected Event.
- Its own Save action and mutation state.

Only active Events are selectable. The currently stored Event remains identifiable when it becomes unavailable so the form can explain why the configuration cannot be enabled instead of silently selecting a replacement.

The form builds its validation schema from the constraints returned by the Admin Event Alert API. It performs immediate type, integer, range, and cross-field checks. Backend 422 `fields` are mapped to the matching form controls. A global error is used only when the failure cannot be attached to one field.

Load failure shows a retry state and no fabricated values. Save failure preserves all entered values. Successful save replaces form state with the normalized server response.

The Event Alert panel remains independent from generic Settings changes: saving either section cannot accidentally submit or clear the other section.

## Public Frontend

A dedicated Event Alert feature module owns API fetching, response parsing, query keys, and the typed public hook. `EventAlertModal` consumes the parsed `PublicEventAlert`; it does not fetch a general Event list or select `query.data[0]`.

When enabled, the modal:

- Waits for `delay_seconds` from the response.
- Renders the Event supplied by the Event Alert endpoint.
- Stores dismissal time using an opaque key derived from Event ID and Alert `version`.
- Suppresses the same Alert for `dismiss_hours` from the response.

When disabled, invalid, or unavailable, it renders nothing. A public Event Alert request failure must not replace, block, or degrade the rest of the page.

Browser storage is interaction state, not content storage. It contains only the dismissal timestamp for the effective Alert identity.

## SEO Route Behavior

The supported content index routes are About, Contact, Gallery, Events, Monks, Privacy, and Impressum. Each route adds or updates `generateMetadata()` to use the central typed converter.

- About, Contact, Privacy, and Impressum consume SEO already included in their public content responses.
- Gallery, Events, and Monks consume the published page SEO contract for their corresponding content pages. Domain records remain in their existing APIs.
- Event and Monk detail pages derive metadata from their entity payloads.
- Metadata fetch failure follows the approved fallback chain and never fails the page render.
- Public body rendering remains unchanged by this work.

The route implementation must avoid duplicate network calls when the framework permits request memoization. Data-fetching helpers used by server metadata must be server-safe and must not depend on React client hooks.

## Error Handling

### SEO

- Missing optional SEO fields use the next fallback source.
- Invalid API SEO is rejected at the boundary and treated as unavailable metadata.
- A content API failure produces localized/configured metadata and does not fail navigation.
- Empty metadata values are omitted rather than exposing blanks.

### Event Alert public client

- Request failure or invalid payload hides the popup.
- Missing or inactive selected Event disables the popup at the backend.
- Browser-storage access failure affects only dismissal persistence; it does not crash the page.

### Event Alert Admin

- Load errors show retry without placeholder settings.
- Client validation prevents invalid requests.
- Backend field errors render beside the matching control.
- Conflict caused by an Event becoming inactive is reported on `event_id`.
- Save errors preserve dirty form state.

## Testing

### Backend

- Read valid Event Alert settings into the typed DTO.
- Reject missing, malformed, non-integer, and out-of-range settings.
- Require an Event when enabled.
- Reject missing and inactive Events on Admin update.
- Update all settings transactionally and roll back on failure.
- Return a disabled public response for invalid effective configuration.
- Return the selected active Event and a stable version for valid configuration.
- Change the version when effective settings change.
- Require the correct Settings permissions on Admin endpoints.
- Return HTTP 422 field names that match the Admin contract.
- Validate SEO input and return only published SEO through public content APIs.

### Frontend

- Parse SEO and Event Alert responses without `any`.
- Verify every SEO fallback level and omission of empty optional metadata.
- Verify all supported routes prefer API SEO.
- Verify Event and Monk detail metadata derives from entity data.
- Build Admin Event Alert validation from API constraints.
- Prevent submission for invalid Event, integer, range, and cross-field values.
- Map backend field errors to the correct inputs.
- Preserve form state after failed save and normalize it after success.
- Verify the modal uses the Event supplied by the typed endpoint.
- Verify delay and dismissal behavior use API values.
- Verify changing Alert version bypasses an old dismissal.
- Verify disabled, failed, and malformed Alert responses render no popup without breaking the page.

### Static and integration verification

- `tsc --noEmit` passes.
- ESLint passes, including the prohibition on explicit `any`.
- Backend unit and handler tests pass.
- Frontend unit/integration tests pass.
- Production frontend build passes.
- No first-item Event selection remains in `EventAlertModal`.
- No popup delay or dismissal-duration literals remain in the public component.
- Supported public routes do not use hardcoded content as their primary SEO source.

## Acceptance Criteria

- Admin can load, validate, edit, and save Event Alert configuration through a typed form.
- Admin constraints and backend validation agree, and backend field errors point to actionable controls.
- Public client displays exactly the configured active Event using API timing values.
- Invalid or unavailable Event Alert configuration safely produces no popup.
- Supported public pages render API-backed SEO with the approved fallback order.
- Event and Monk detail pages expose entity-derived metadata without new SEO database fields.
- No TypeScript `any`, unsafe type-check bypass, hardcoded Event selection, hardcoded popup timing, or hardcoded visitor-facing SEO content is introduced.
- Home CMS, public Navigation, and Footer management remain unchanged.
