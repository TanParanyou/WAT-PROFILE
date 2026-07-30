# Admin List Search, Filters, Sorting, and Pagination

## Goal

Add one consistent list-query experience to every Admin management page. Administrators
must be able to search, filter, sort, paginate, share the current view by URL, and export
all matching records without each page implementing a different interaction model.

The design uses shared hooks and UI primitives while keeping resource-specific fields,
filters, and backend queries explicit and typed.

## Scope

The feature covers these Admin collection pages:

- Users
- Roles
- Members
- Monks
- Events
- Schedules
- Gallery
- Gallery Categories
- Donations
- Donation Categories
- Event Registrations
- Contact Inquiries
- Audit Logs
- Media
- Website Pages

Dashboard, Settings, content editors, detail pages, and public list pages are outside the
scope.

All Admin list endpoints in scope become paginated. This includes Events, Monks,
Schedules, Gallery, both category resources, Roles, Media, and Website Pages, which
currently return complete or active-only collections.

## Principles

- The URL is the source of truth for search, filters, sorting, page, and page size.
- Search, filters, sorting, and pagination execute on the backend.
- Admin lists return all records the administrator may read. Active or published
  visibility remains mandatory for public endpoints.
- UI behavior is shared, but resource query rules remain explicit and typed.
- Multi-select values use OR within one filter and AND between different filters.
- Invalid or unsupported query values fail visibly instead of being ignored silently.
- No server data is mirrored into Zustand or component state.

## Query Contract

Every list endpoint supports these common parameters:

| Parameter | Meaning |
|---|---|
| `page` | One-based page number; defaults to `1` |
| `limit` | One of `10`, `25`, `50`, or `100`; defaults to `25` |
| `search` | Trimmed resource-specific search text |
| `sort` | Resource-specific allowlisted sort key |
| `order` | `asc` or `desc` |
| `from` | Inclusive lower date bound where the resource defines a date filter |
| `to` | Inclusive upper date bound where the resource defines a date filter |

Multi-select values use repeated query parameters:

```text
/admin/events?status=active&status=inactive&type=ceremony&type=festival
```

Repeated values within one field use OR. Different fields and `search` combine with AND:

```text
(status = active OR status = inactive)
AND
(type = ceremony OR type = festival)
AND
search matches
```

Selecting every option is equivalent to omitting that parameter. Empty and default
values are omitted from the canonical URL.

Handlers validate page, limit, order, filter values, date ranges, and sort keys. Services
apply only allowlisted database columns. Sorts include a stable ID tie-breaker.

All endpoints return the existing paginated envelope:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 0,
    "totalPages": 0
  }
}
```

## Resource Query Matrix

| Resource | Searchable fields | Filters | Default sort |
|---|---|---|---|
| Users | name, email | status, role, email verified | created newest |
| Roles | name, description | status | name ascending |
| Members | member code, Thai and English names, phone, user email | membership status, membership type, membership date | created newest |
| Monks | slug, localized name and title, position | status | display order |
| Events | slug, localized title and location | status, event type, event date | start date newest |
| Schedules | localized activity and location | status, schedule type, weekday | display order |
| Gallery | localized caption | status, category, related event | display order |
| Gallery Categories | localized name and description | status | display order |
| Donations | receipt number, donor name, email, phone | status, category, method, currency, donation date | created newest |
| Donation Categories | localized name and description | status | display order |
| Event Registrations | confirmation code, name, email, phone, event title | status, event, created date | created newest |
| Contact Inquiries | name, email, phone, subject | status, inquiry type, created date | created newest |
| Audit Logs | user, entity ID, trace ID, IP address | action, entity type, user, created date | created newest |
| Media | filename, original filename, alt text | MIME group, category, uploader, created date | created newest |
| Website Pages | page key, slug, localized title | publication status | updated newest |

Localized search examines the explicit `th`, `en`, and `de` values rather than arbitrary
JSON. Search uses case-insensitive substring matching and escapes wildcard input.

Dynamic filter options such as roles, categories, events, and uploaders come from typed
Admin API queries. Fixed options such as statuses, weekdays, and MIME groups use shared
typed constants with Thai, English, and German labels.

Open-vocabulary values that cannot be represented safely by a closed constant use
resource-specific, read-protected filter-option endpoints:

- Donations expose distinct methods and currencies.
- Audit Logs expose distinct actions and entity types.
- Media exposes distinct categories and MIME groups.

These endpoints return only filter values, use the same read permission as their owning
list, and are documented in OpenAPI. The UI must not derive global filter options from
the currently visible page.

## Domain Status Alignment

The feature also resolves existing frontend/backend vocabulary mismatches.

Contact Inquiry statuses are:

```text
new -> read -> replied -> archived
```

Event Registration statuses are:

```text
pending -> confirmed -> attended
pending or confirmed -> cancelled
```

The frontend must use the backend fields `registration_status`, `first_name`,
`last_name`, and the typed event relationship. It must not continue using the untyped
aliases `status`, `name`, or `event_title`.

The canonical meanings are recorded in `CONTEXT.md`.

## Frontend Architecture

The frontend adds an Admin list module with two focused hooks:

### `useAdminListState<TFilters>`

- Parses and validates URL parameters through typed codecs.
- Canonicalizes invalid or default values with URL replacement.
- Debounces typed search for 350 milliseconds.
- Searches immediately when Enter is pressed.
- Updates filters, sorting, page, and page size.
- Returns to page 1 when search, filters, sorting, or page size changes.
- Clears row selection whenever any query dimension, including page, changes.
- Responds correctly to browser Back and Forward navigation.

### `useAdminListQuery<TItem, TFilters>`

- Uses the canonical parameters in a stable TanStack Query key.
- Calls a typed resource list service.
- Keeps previous results visible while a new request is pending.
- Prevents stale responses from replacing newer results.
- Exposes pagination, loading, refreshing, empty, and error states.
- Moves to the final valid page and refetches if deletion makes the current page invalid.

Resource services define typed parameter interfaces. For example:

```ts
interface AdminListParams {
  page: number;
  limit: 10 | 25 | 50 | 100;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
}

interface MemberListParams extends AdminListParams {
  status?: string[];
  type?: string[];
  from?: string;
  to?: string;
}
```

The existing generic Admin service must preserve and validate the response envelope.
Components do not construct API URLs or import Axios.

## UI Components

The shared module provides:

- `AdminListToolbar`
- `AdminSearchInput`
- `AdminFilterPanel`
- `AdminMultiSelectFilter`
- `AdminDateRangeFilter`
- `AdminActiveFilterChips`
- `AdminListEmptyState`
- `AdminListErrorState`
- `AdminPageSizeSelect`
- `AdminListExportButton`

The toolbar uses a hybrid layout:

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Search input                     Primary filter   More filters       │
└──────────────────────────────────────────────────────────────────────┘
│ Active filter chips                                 Clear all       │
```

The additional filters open in a collapsible region below the toolbar. This reuses the
existing Input, Button, Checkbox, and DateRangePicker primitives and does not add a new
popover dependency.

Each page composes its own filters:

```tsx
<AdminListToolbar search={list.search}>
  <AdminMultiSelectFilter field="status" options={statusOptions} />
  <AdminFilterPanel>
    <AdminMultiSelectFilter field="type" options={memberTypeOptions} />
    <AdminDateRangeFilter field="membershipDate" />
  </AdminFilterPanel>
</AdminListToolbar>
```

This is deliberate page composition, not a universal page-generating configuration.

Filters apply immediately. The filter panel has no Apply button. A multi-select with more
than ten options includes an option search input. Active values appear as individually
removable chips. The toolbar stacks cleanly on mobile.

## Interaction States

- Search begins 350 milliseconds after typing stops.
- Enter submits immediately.
- Search works from one character.
- Typing updates URL history with replacement so each character does not create an entry.
- Changing a filter, sort, page, or page size updates the canonical URL.
- Changing search, filters, sorting, or page size returns to page 1.
- Selecting all rows selects only the visible page.
- Any query change clears row selection to prevent hidden bulk actions.
- A refresh keeps the same list view.
- A copied URL opens the same list view for another authorized administrator.

While refreshing, the table keeps its previous rows and shows a restrained progress
indicator. Filtered empty results show a clear-filters action. A genuinely empty
resource shows its normal creation action when the current user has permission. Errors
keep the URL state and provide Retry.

All controls have visible focus, keyboard operation, appropriate labels,
`aria-expanded`/`aria-controls`, live loading announcements, and 44-pixel touch targets.
All new messages exist in `th`, `en`, and `de`.

## Backend Architecture

Handlers use a common query parser for pagination, search, order, repeated values, and
date bounds. Each handler supplements it with resource-specific validation.

Each service owns a typed options structure, for example `MemberListOptions` or
`DonationListOptions`. The service explicitly applies:

- its searchable fields;
- its filter predicates;
- its sort allowlist and default;
- its preloads or joins;
- the stable ID tie-breaker;
- identical conditions for count and data queries.

The backend must not introduce a reflection-based generic GORM query builder.

Admin Events, Monks, Schedules, Gallery, Categories, Roles, Media, and Website Pages must
stop reusing active-only public list methods. Public active/published queries remain
unchanged.

Routes and permissions remain the same. Query and response changes are documented in
`backend/docs/openapi.yaml`.

## Export

CSV export contains every record matching the current search, filters, and sorting, not
only the visible page.

`useAdminListExport`:

1. Fetches the first page with a limit of 100.
2. Reads the matching total.
3. Fetches remaining pages with bounded concurrency.
4. Combines and deduplicates rows by ID.
5. Verifies the final count against the initial total.
6. Maps rows through the resource's typed CSV mapper.
7. Creates the file in the browser.

The export button shows progress and prevents duplicate runs. If records change during
the export and counts no longer agree, the UI reports the mismatch and asks the user to
retry rather than presenting a potentially incomplete file.

A dedicated backend export job is deferred until data volume makes batched export
unreasonable.

## Database and Performance

The change adds a new reversible migration pair; existing numbered migrations are not
edited.

Indexes cover the actual filter, relationship, date, and ordering paths introduced by
the feature. PostgreSQL `pg_trgm`/GIN indexes are limited initially to growing datasets
where substring search is likely to need them: Users, Members, Donations, Event
Registrations, Contact Inquiries, Audit Logs, and Media.

Ordinary indexes are reflected in the matching GORM model tags where GORM can express
them. PostgreSQL extension and expression indexes remain explicit in the versioned
migration because they have no equivalent portable model tag.

Small ordered content tables first use their status, relationship, date, and ordering
indexes. Localized expression indexes are added only where query plans demonstrate a
need; the design does not create trigram indexes for every JSONB language field
speculatively.

Implementation verification includes reviewing query plans for representative growing
tables.

## Verification

Per project direction, this feature does not add a frontend test runner or new automated
test cases. The resulting automated coverage gap must be reported at handoff.

Implementation still runs the repository's existing verification:

- frontend lint;
- frontend TypeScript check;
- frontend production build;
- backend existing test suite;
- backend vet;
- backend build;
- migration up/down verification against a test database when available;
- manual Admin QA in Thai, English, and German at desktop and mobile widths;
- keyboard and reduced-motion review;
- OpenAPI and typed client contract review.

## Delivery Sequence

The work should be implemented in reviewable commits:

1. Shared list types and URL codecs.
2. Shared hooks and UI components.
3. Backend common query parsing and the reversible index migration.
4. Paginated backend resource groups and typed frontend services.
5. Admin page migrations.
6. Filtered batched export, accessibility, and localization.
7. OpenAPI alignment and final verification.

Commits may be reviewed independently, but the feature should release only after all
in-scope Admin list pages use the new contract. A partial production rollout would leave
administrators with inconsistent pagination and URL behavior.

## Acceptance Criteria

- Every in-scope Admin list supports server-side search, multi-select filters, sorting,
  pagination, and a canonical shareable URL.
- All in-scope list endpoints return the same paginated envelope.
- Public active/published visibility is unchanged.
- Multi-select semantics are OR within a field and AND between fields.
- Search and filtering cover the explicit resource matrix and all localized values where
  specified.
- Page size supports 10, 25, 50, and 100 with 25 as the default.
- Row selection cannot survive a query or page change.
- CSV export contains all matching records and reports consistency failures.
- Contact Inquiry and Event Registration status vocabulary matches the glossary and
  backend contract.
- Loading, filtered-empty, resource-empty, and error states are distinct.
- New UI copy is complete in Thai, English, and German.
- OpenAPI, frontend parameter types, backend handlers, and services agree.
- Existing verification passes, and the absence of new automated tests is reported.
