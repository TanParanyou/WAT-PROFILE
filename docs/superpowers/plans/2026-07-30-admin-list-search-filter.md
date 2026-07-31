# Admin List Search, Filters, Sorting, and Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every Admin collection page one typed, URL-driven, server-side search, multi-filter, sort, pagination, and full-result CSV export experience.

**Architecture:** A focused frontend Admin-list module owns URL codecs, TanStack Query state, export batching, and reusable toolbar primitives; each page composes its resource-specific controls. Backend handlers share strict query parsing, while each service retains a typed list-options structure and explicit GORM predicates, search fields, preloads, and sort allowlist.

**Tech Stack:** Next.js 16 App Router, React 19, strict TypeScript, TanStack Query 5, next-intl, Tailwind CSS 4, Go 1.24, Fiber v2, GORM, PostgreSQL.

## Global Constraints

- The approved design is `docs/superpowers/specs/2026-07-30-admin-list-search-filter-design.md`.
- The canonical domain language is in `CONTEXT.md`.
- Do not add Vitest, React Testing Library, or new automated test cases; report this coverage gap at handoff.
- Still run the repository's existing frontend lint/type-check/build and backend test/vet/build commands.
- Preserve `th`, `en`, and `de` for every new Admin message.
- Do not use TypeScript `any`, `as any`, or `@ts-ignore`.
- Components do not import Axios or construct API URLs.
- Every protected Admin route retains `PermissionRequired(resource, action)`.
- Public endpoints continue to return active/published data only.
- Use URL parameters as the only owner of search, filters, sort, page, and limit.
- Multi-select values use repeated query parameters, OR within a field, and AND between fields.
- Page sizes are exactly `10`, `25`, `50`, and `100`; the default is `25`.
- Do not edit an existing numbered migration; add migration `000021`.
- Preserve all unrelated user changes in the dirty worktree.

---

## File Map

### Frontend files to create

- `frontend/src/features/admin-list/types.ts` — common query, pagination, filter, and option contracts.
- `frontend/src/features/admin-list/url.ts` — pure parsing and serialization of canonical list URLs.
- `frontend/src/features/admin-list/useAdminListState.ts` — URL-backed state and 350 ms search debounce.
- `frontend/src/features/admin-list/useAdminListQuery.ts` — TanStack Query orchestration and invalid-page recovery.
- `frontend/src/features/admin-list/useAdminListExport.ts` — batched filtered CSV export.
- `frontend/src/features/admin-list/index.ts` — public module exports.
- `frontend/src/components/admin/list/AdminListToolbar.tsx` — responsive toolbar and collapsible filter region.
- `frontend/src/components/admin/list/AdminSearchInput.tsx` — accessible debounced search control.
- `frontend/src/components/admin/list/AdminMultiSelectFilter.tsx` — repeated-value checkbox filter.
- `frontend/src/components/admin/list/AdminDateRangeFilter.tsx` — URL-backed inclusive date range.
- `frontend/src/components/admin/list/AdminActiveFilterChips.tsx` — removable active values and clear-all.
- `frontend/src/components/admin/list/AdminListStates.tsx` — filtered-empty and request-error states.
- `frontend/src/components/admin/list/AdminPageSizeSelect.tsx` — fixed page-size control.
- `frontend/src/components/admin/list/AdminListExportButton.tsx` — export progress and retry UI.
- `frontend/src/components/admin/list/index.ts` — public component exports.

### Backend files to create

- `backend/internal/listquery/query.go` — strict common Fiber query parsing and validation helpers.
- `backend/migrations/000021_add_admin_list_query_indexes.up.sql` — extension and query-path indexes.
- `backend/migrations/000021_add_admin_list_query_indexes.down.sql` — reversal of only migration 000021.

### Existing files grouped by responsibility

- Shared frontend contracts: `frontend/src/types/api.ts`, `frontend/src/types/entities.ts`, `frontend/src/types/auditLog.ts`, `frontend/src/types/website-cms.ts`.
- Shared frontend transport: `frontend/src/services/adminService.ts`, `frontend/src/services/auditLogService.ts`, `frontend/src/services/mediaService.ts`, `frontend/src/services/websiteCmsService.ts`.
- Shared table UI: `frontend/src/components/ui/DataTable.tsx`, `frontend/src/hooks/useDataTable.ts`, `frontend/src/hooks/useRowSelection.ts`.
- Admin pages: the 15 list pages named in Tasks 9–11.
- Backend handlers/services/models: the resource files named in Tasks 5–7.
- Routes and contract: `backend/internal/routes/routes.go`, `backend/docs/openapi.yaml`.
- Localized Admin copy: `frontend/src/messages/admin/th.json`, `frontend/src/messages/admin/en.json`, `frontend/src/messages/admin/de.json`.

---

### Task 1: Add typed Admin-list contracts and canonical URL codecs

**Files:**
- Create: `frontend/src/features/admin-list/types.ts`
- Create: `frontend/src/features/admin-list/url.ts`
- Create: `frontend/src/features/admin-list/index.ts`
- Modify: `frontend/src/types/api.ts`

**Interfaces:**
- Produces: `AdminListParams<TFilters>`, `AdminListResult<T>`, `AdminFilterDefinition<TFilters>`, `AdminFilterOption`, `parseAdminListParams()`, and `serializeAdminListParams()`.
- Consumes: Next.js `ReadonlyURLSearchParams`-compatible `URLSearchParams`.

- [ ] **Step 1: Define the shared contracts**

```ts
export const ADMIN_PAGE_SIZES = [10, 25, 50, 100] as const;
export type AdminPageSize = (typeof ADMIN_PAGE_SIZES)[number];
export type AdminSortOrder = "asc" | "desc";
export type AdminFilterValue = string | string[] | undefined;
export type AdminFilterRecord = Record<string, AdminFilterValue>;

export interface AdminListParams<TFilters extends AdminFilterRecord> {
  page: number;
  limit: AdminPageSize;
  search: string;
  sort?: string;
  order: AdminSortOrder;
  filters: TFilters;
}

export interface AdminPagination {
  page: number;
  limit: AdminPageSize;
  total: number;
  totalPages: number;
}

export interface AdminListResult<T> {
  data: T[];
  pagination: AdminPagination;
}

export interface AdminFilterOption {
  value: string;
  label: string;
}

export interface AdminFilterDefinition<TFilters extends AdminFilterRecord> {
  key: keyof TFilters & string;
  kind: "multi" | "date-range";
  label: string;
  options?: AdminFilterOption[];
}
```

- [ ] **Step 2: Replace the duplicate pagination contract**

Update `frontend/src/types/api.ts` so `PaginatedResponse<T>` imports and uses
`AdminPagination`, while preserving the backend envelope:

```ts
import type { AdminPagination } from "@/features/admin-list/types";

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: AdminPagination;
}
```

- [ ] **Step 3: Implement canonical parsing**

```ts
import {
  ADMIN_PAGE_SIZES,
  type AdminFilterRecord,
  type AdminListParams,
  type AdminPageSize,
  type AdminSortOrder,
} from "./types";

export interface AdminListUrlSchema<TFilters extends AdminFilterRecord> {
  defaultSort?: string;
  defaultOrder?: AdminSortOrder;
  multi: readonly (keyof TFilters & string)[];
  single?: readonly (keyof TFilters & string)[];
  allowedSorts: readonly string[];
}

const positiveInt = (value: string | null, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export function parseAdminListParams<TFilters extends AdminFilterRecord>(
  input: URLSearchParams,
  schema: AdminListUrlSchema<TFilters>,
): AdminListParams<TFilters> {
  const rawLimit = positiveInt(input.get("limit"), 25);
  const limit = (
    ADMIN_PAGE_SIZES.includes(rawLimit as AdminPageSize) ? rawLimit : 25
  ) as AdminPageSize;
  const requestedSort = input.get("sort") || undefined;
  const sort =
    requestedSort && schema.allowedSorts.includes(requestedSort)
      ? requestedSort
      : schema.defaultSort;
  const order = input.get("order") === "asc" ? "asc" : schema.defaultOrder ?? "desc";
  const filters: AdminFilterRecord = {};

  for (const key of schema.multi) {
    const values = [...new Set(input.getAll(key).map((value) => value.trim()).filter(Boolean))];
    if (values.length > 0) filters[key] = values;
  }
  for (const key of schema.single ?? []) {
    const value = input.get(key)?.trim();
    if (value) filters[key] = value;
  }

  return {
    page: positiveInt(input.get("page"), 1),
    limit,
    search: input.get("search")?.trim() ?? "",
    sort,
    order,
    filters: filters as TFilters,
  };
}
```

- [ ] **Step 4: Implement deterministic serialization**

```ts
export function serializeAdminListParams<TFilters extends AdminFilterRecord>(
  params: AdminListParams<TFilters>,
): URLSearchParams {
  const output = new URLSearchParams();
  if (params.page !== 1) output.set("page", String(params.page));
  if (params.limit !== 25) output.set("limit", String(params.limit));
  if (params.search) output.set("search", params.search);
  if (params.sort) output.set("sort", params.sort);
  if (params.order !== "desc") output.set("order", params.order);

  for (const key of Object.keys(params.filters).sort()) {
    const value = params.filters[key];
    const values = Array.isArray(value) ? [...value].sort() : value ? [value] : [];
    for (const item of values) output.append(key, item);
  }
  return output;
}
```

- [ ] **Step 5: Export the module and run static verification**

```ts
export * from "./types";
export * from "./url";
```

Run:

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
```

Expected: exit code `0`.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/features/admin-list frontend/src/types/api.ts
git commit -m "feat(admin): add typed list query contracts"
```

---

### Task 2: Build the URL state and TanStack Query hooks

**Files:**
- Create: `frontend/src/features/admin-list/useAdminListState.ts`
- Create: `frontend/src/features/admin-list/useAdminListQuery.ts`
- Modify: `frontend/src/features/admin-list/index.ts`
- Modify: `frontend/src/hooks/useDataTable.ts`

**Interfaces:**
- Consumes: `AdminListUrlSchema<TFilters>` and a typed list fetcher.
- Produces: `useAdminListState()`, `useAdminListQuery()`, a stable `scopeKey`, and query actions.

- [ ] **Step 1: Implement URL-backed list state**

`useAdminListState` must import `usePathname` and `useRouter` from `@/navigation`, and
`useSearchParams` from `next/navigation`. Its public signature is:

```ts
export interface UseAdminListStateOptions<TFilters extends AdminFilterRecord> {
  schema: AdminListUrlSchema<TFilters>;
  debounceMs?: number;
}

export interface AdminListActions<TFilters extends AdminFilterRecord> {
  setSearch(value: string, immediate?: boolean): void;
  setFilter<K extends keyof TFilters>(key: K, value: TFilters[K]): void;
  removeFilterValue<K extends keyof TFilters>(key: K, value: string): void;
  clearFilters(): void;
  setSort(key: string): void;
  setPage(page: number): void;
  setLimit(limit: AdminPageSize): void;
}

export function useAdminListState<TFilters extends AdminFilterRecord>(
  options: UseAdminListStateOptions<TFilters>,
): {
  params: AdminListParams<TFilters>;
  draftSearch: string;
  isDebouncing: boolean;
  scopeKey: string;
  actions: AdminListActions<TFilters>;
}
```

Use a 350 ms timer for normal typing. `setSearch(value, true)` commits immediately.
Search/filter/sort/limit updates set `page` to `1`. Page-only updates preserve all other
parameters. Use router `replace` for search typing and canonicalization.

- [ ] **Step 2: Implement query orchestration**

```ts
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export interface UseAdminListQueryOptions<
  TItem,
  TFilters extends AdminFilterRecord,
> {
  queryKey: readonly unknown[];
  params: AdminListParams<TFilters>;
  fetcher(params: AdminListParams<TFilters>): Promise<AdminListResult<TItem>>;
  setPage(page: number): void;
}

export function useAdminListQuery<TItem, TFilters extends AdminFilterRecord>(
  options: UseAdminListQueryOptions<TItem, TFilters>,
) {
  const query = useQuery({
    queryKey: [...options.queryKey, options.params],
    queryFn: () => options.fetcher(options.params),
    placeholderData: keepPreviousData,
  });

  const pagination = query.data?.pagination;
  if (
    pagination &&
    pagination.totalPages > 0 &&
    options.params.page > pagination.totalPages
  ) {
    options.setPage(pagination.totalPages);
  }

  return {
    ...query,
    rows: query.data?.data ?? [],
    pagination: pagination ?? {
      page: options.params.page,
      limit: options.params.limit,
      total: 0,
      totalPages: 0,
    },
  };
}
```

Move invalid-page recovery into an effect in the final code so no router update occurs
during render.

- [ ] **Step 3: Deprecate the old hook without breaking untouched pages**

Keep `frontend/src/hooks/useDataTable.ts` temporarily, but remove its unsupported
`searchQuery`/`onSearch` promise from new call sites. Add a deprecation comment pointing
to `useAdminListState` and `useAdminListQuery`. Do not delete it until Task 11 has
migrated the final caller.

- [ ] **Step 4: Export hooks and verify**

```ts
export * from "./useAdminListState";
export * from "./useAdminListQuery";
```

Run:

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
```

Expected: exit code `0`.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/admin-list frontend/src/hooks/useDataTable.ts
git commit -m "feat(admin): add URL-driven list hooks"
```

---

### Task 3: Build shared Admin-list UI primitives

**Files:**
- Create: `frontend/src/components/admin/list/AdminListToolbar.tsx`
- Create: `frontend/src/components/admin/list/AdminSearchInput.tsx`
- Create: `frontend/src/components/admin/list/AdminMultiSelectFilter.tsx`
- Create: `frontend/src/components/admin/list/AdminDateRangeFilter.tsx`
- Create: `frontend/src/components/admin/list/AdminActiveFilterChips.tsx`
- Create: `frontend/src/components/admin/list/AdminListStates.tsx`
- Create: `frontend/src/components/admin/list/AdminPageSizeSelect.tsx`
- Create: `frontend/src/components/admin/list/AdminListExportButton.tsx`
- Create: `frontend/src/components/admin/list/index.ts`
- Modify: `frontend/src/components/ui/DataTable.tsx`

**Interfaces:**
- Consumes: `AdminListActions`, `AdminFilterOption`, and existing Button/Input/Checkbox/DateRangePicker.
- Produces: composable controls; does not fetch data or construct query parameters.

- [ ] **Step 1: Implement toolbar and search**

```ts
export interface AdminListToolbarProps {
  search: React.ReactNode;
  primaryFilters?: React.ReactNode;
  activeFilters?: React.ReactNode;
  children?: React.ReactNode;
  activeFilterCount: number;
}
```

The filter toggle uses a native button with `aria-expanded` and `aria-controls`. The
expanded region is rendered below the first row, remains in document flow, and uses a
responsive grid.

```ts
export interface AdminSearchInputProps {
  value: string;
  isDebouncing: boolean;
  placeholder: string;
  onChange(value: string): void;
  onSubmit(value: string): void;
  onClear(): void;
}
```

The clear and submit controls have 44-pixel hit areas and translated accessible names.

- [ ] **Step 2: Implement multi-select and date range**

```ts
export interface AdminMultiSelectFilterProps {
  id: string;
  label: string;
  options: AdminFilterOption[];
  values: string[];
  onChange(values: string[]): void;
}

export interface AdminDateRangeFilterProps {
  id: string;
  label: string;
  from?: string;
  to?: string;
  onChange(value: { from?: string; to?: string }): void;
}
```

Use Checkbox rows. When options exceed ten, filter only the visible option list with a
local search input; do not alter the active server filters until a checkbox changes.
Serialize dates as local calendar dates in `yyyy-MM-dd`, and reject a range where
`from > to`.

- [ ] **Step 3: Implement chips, states, page size, and export button contracts**

```ts
export interface AdminActiveFilterChip {
  key: string;
  value: string;
  label: string;
}

export interface AdminActiveFilterChipsProps {
  filters: AdminActiveFilterChip[];
  onRemove(key: string, value: string): void;
  onClear(): void;
}

export interface AdminPageSizeSelectProps {
  value: AdminPageSize;
  onChange(value: AdminPageSize): void;
}

export interface AdminListExportButtonProps {
  isExporting: boolean;
  completed: number;
  total: number;
  onExport(): void;
}
```

Filtered-empty state receives `hasActiveQuery` and `onClear`; error state receives
`message` and `onRetry`.

- [ ] **Step 4: Make DataTable consume the shared pagination type**

Replace `PaginationState` with `AdminPagination`, add `onLimitChange`, and render
`AdminPageSizeSelect` beside the result count. Remove the local fallback that reports
one page when the API reports zero pages. Replace existing generic `any` and `@ts-ignore`
in this touched file with `unknown` plus narrowing and a Checkbox API that exposes
indeterminate state explicitly.

- [ ] **Step 5: Export components and verify**

```ts
export * from "./AdminListToolbar";
export * from "./AdminSearchInput";
export * from "./AdminMultiSelectFilter";
export * from "./AdminDateRangeFilter";
export * from "./AdminActiveFilterChips";
export * from "./AdminListStates";
export * from "./AdminPageSizeSelect";
export * from "./AdminListExportButton";
```

Run:

```bash
cd frontend && npm run lint
cd frontend && ./node_modules/.bin/tsc --noEmit
```

Expected: both commands exit `0`.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/admin/list frontend/src/components/ui/DataTable.tsx
git commit -m "feat(admin): add list toolbar primitives"
```

---

### Task 4: Add strict backend query parsing

**Files:**
- Create: `backend/internal/listquery/query.go`
- Modify: `backend/pkg/utils/response.go`

**Interfaces:**
- Produces: `listquery.Common`, `listquery.Parse()`, `AllowedValues()`, and `AllowedSort()`.
- Consumes: `*fiber.Ctx`.

- [ ] **Step 1: Implement common parsing**

```go
package listquery

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
)

type Common struct {
	Page   int
	Limit  int
	Search string
	Sort   string
	Order  string
	From   *time.Time
	To     *time.Time
}

type Config struct {
	DefaultSort string
	DefaultOrder string
	AllowedSort map[string]string
	MaxSearch   int
}

func Parse(c *fiber.Ctx, config Config) (Common, error) {
	page, err := strconv.Atoi(c.Query("page", "1"))
	if err != nil || page < 1 {
		return Common{}, fmt.Errorf("page must be a positive integer")
	}
	limit, err := strconv.Atoi(c.Query("limit", "25"))
	if err != nil || (limit != 10 && limit != 25 && limit != 50 && limit != 100) {
		return Common{}, fmt.Errorf("limit must be one of 10, 25, 50, or 100")
	}
	defaultOrder := config.DefaultOrder
	if defaultOrder == "" {
		defaultOrder = "desc"
	}
	order := strings.ToLower(c.Query("order", defaultOrder))
	if order != "asc" && order != "desc" {
		return Common{}, fmt.Errorf("order must be asc or desc")
	}
	sortKey := c.Query("sort", config.DefaultSort)
	if _, ok := config.AllowedSort[sortKey]; !ok {
		return Common{}, fmt.Errorf("unsupported sort")
	}
	search := strings.TrimSpace(c.Query("search"))
	maxSearch := config.MaxSearch
	if maxSearch == 0 {
		maxSearch = 200
	}
	if len([]rune(search)) > maxSearch {
		return Common{}, fmt.Errorf("search is too long")
	}
	from, err := parseDate(c.Query("from"))
	if err != nil {
		return Common{}, fmt.Errorf("from must use yyyy-mm-dd")
	}
	to, err := parseDate(c.Query("to"))
	if err != nil {
		return Common{}, fmt.Errorf("to must use yyyy-mm-dd")
	}
	if from != nil && to != nil && from.After(*to) {
		return Common{}, fmt.Errorf("from must not be after to")
	}
	return Common{Page: page, Limit: limit, Search: search, Sort: sortKey, Order: order, From: from, To: to}, nil
}
```

Implement `parseDate`, repeated-value extraction through
`c.Context().QueryArgs().PeekMulti(key)`, duplicate removal, and allowlist validation in
the same file. Return user-safe errors only.

- [ ] **Step 2: Add stable response metadata**

Keep the existing `PaginatedResponse` JSON keys. Ensure empty results return
`totalPages: 0`, and reject a zero limit before division.

- [ ] **Step 3: Format and verify**

Run:

```bash
cd backend && gofmt -w internal/listquery/query.go pkg/utils/response.go
cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./...
cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go vet ./...
```

Expected: existing tests either pass or explicitly skip for missing
`DATABASE_URL_TEST`; vet exits `0`.

- [ ] **Step 4: Commit**

```bash
git add backend/internal/listquery/query.go backend/pkg/utils/response.go
git commit -m "feat(api): add strict admin list query parser"
```

---

### Task 5: Add the reversible query-index migration

**Files:**
- Create: `backend/migrations/000021_add_admin_list_query_indexes.up.sql`
- Create: `backend/migrations/000021_add_admin_list_query_indexes.down.sql`
- Modify: `backend/internal/models/user.go`
- Modify: `backend/internal/models/member.go`
- Modify: `backend/internal/models/donation.go`
- Modify: `backend/internal/models/event_registration.go`
- Modify: `backend/internal/models/contact.go`
- Modify: `backend/internal/models/media.go`
- Modify: `backend/internal/models/audit_log.go`
- Modify: `backend/internal/models/role.go`
- Modify: `backend/internal/models/event.go`
- Modify: `backend/internal/models/monk.go`
- Modify: `backend/internal/models/schedule.go`
- Modify: `backend/internal/models/gallery.go`
- Modify: `backend/internal/models/content.go`

**Interfaces:**
- Produces: indexes used by Tasks 6–8.
- Consumes: existing tables and PostgreSQL `pg_trgm`.

- [ ] **Step 1: Write the up migration**

Use `CREATE EXTENSION IF NOT EXISTS pg_trgm;`. Add ordinary B-tree indexes for missing
filter/date/order paths and GIN trigram indexes for the explicit high-growth search
expressions. Use deterministic names beginning with `idx_admin_list_`.

The migration must include:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS migration_000021_status_backup (
  entity_type TEXT NOT NULL,
  entity_id BIGINT NOT NULL,
  old_status TEXT NOT NULL,
  PRIMARY KEY (entity_type, entity_id)
);

INSERT INTO migration_000021_status_backup (entity_type, entity_id, old_status)
SELECT 'contact_inquiry', id, status
FROM contact_inquiries
WHERE status IN ('pending', 'closed')
ON CONFLICT DO NOTHING;

INSERT INTO migration_000021_status_backup (entity_type, entity_id, old_status)
SELECT 'event_registration', id, registration_status
FROM event_registrations
WHERE registration_status IN ('approved', 'rejected')
ON CONFLICT DO NOTHING;

UPDATE contact_inquiries
SET status = CASE status
  WHEN 'pending' THEN 'new'
  WHEN 'closed' THEN 'archived'
  ELSE status
END
WHERE status IN ('pending', 'closed');

UPDATE event_registrations
SET registration_status = CASE registration_status
  WHEN 'approved' THEN 'confirmed'
  WHEN 'rejected' THEN 'cancelled'
  ELSE registration_status
END
WHERE registration_status IN ('approved', 'rejected');

CREATE INDEX IF NOT EXISTS idx_admin_list_users_name_trgm
  ON users USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_admin_list_users_email_trgm
  ON users USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_admin_list_users_created_id
  ON users (created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_admin_list_members_code_trgm
  ON members USING gin (member_code gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_admin_list_members_name_th_trgm
  ON members USING gin ((first_name_th || ' ' || last_name_th) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_admin_list_members_name_en_trgm
  ON members USING gin ((first_name_en || ' ' || last_name_en) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_admin_list_members_created_id
  ON members (created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_admin_list_donations_receipt_trgm
  ON donations USING gin (receipt_number gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_admin_list_donations_donor_trgm
  ON donations USING gin (donor_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_admin_list_donations_created_id
  ON donations (created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_admin_list_registrations_name_trgm
  ON event_registrations USING gin ((first_name || ' ' || last_name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_admin_list_registrations_email_trgm
  ON event_registrations USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_admin_list_registrations_created_id
  ON event_registrations (created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_admin_list_contacts_name_trgm
  ON contact_inquiries USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_admin_list_contacts_subject_trgm
  ON contact_inquiries USING gin (subject gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_admin_list_contacts_created_id
  ON contact_inquiries (created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_admin_list_media_filename_trgm
  ON media USING gin (original_filename gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_admin_list_media_created_id
  ON media (created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_admin_list_audit_created_id
  ON audit_logs (created_at DESC, id DESC);
```

Add these missing ordinary indexes:

```sql
CREATE INDEX IF NOT EXISTS idx_admin_list_users_role_id ON users (role_id);
CREATE INDEX IF NOT EXISTS idx_admin_list_users_is_active ON users (is_active);
CREATE INDEX IF NOT EXISTS idx_admin_list_users_email_verified ON users (email_verified);
CREATE INDEX IF NOT EXISTS idx_admin_list_roles_is_active ON roles (is_active);
CREATE INDEX IF NOT EXISTS idx_admin_list_members_type ON members (membership_type);
CREATE INDEX IF NOT EXISTS idx_admin_list_membership_date ON members (membership_date);
CREATE INDEX IF NOT EXISTS idx_admin_list_monks_display_order ON monks (display_order, id);
CREATE INDEX IF NOT EXISTS idx_admin_list_events_display_order ON events (display_order, id);
CREATE INDEX IF NOT EXISTS idx_admin_list_schedules_weekday ON schedules (day_of_week);
CREATE INDEX IF NOT EXISTS idx_admin_list_schedules_display_order ON schedules (display_order, id);
CREATE INDEX IF NOT EXISTS idx_admin_list_gallery_display_order ON galleries (display_order, id);
CREATE INDEX IF NOT EXISTS idx_admin_list_gallery_categories_display_order ON gallery_categories (display_order, id);
CREATE INDEX IF NOT EXISTS idx_admin_list_donations_method ON donations (donation_method);
CREATE INDEX IF NOT EXISTS idx_admin_list_donations_currency ON donations (currency);
CREATE INDEX IF NOT EXISTS idx_admin_list_donation_categories_is_active ON donation_categories (is_active);
CREATE INDEX IF NOT EXISTS idx_admin_list_donation_categories_display_order ON donation_categories (display_order, id);
CREATE INDEX IF NOT EXISTS idx_admin_list_registrations_created_at ON event_registrations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_list_contacts_type ON contact_inquiries (inquiry_type);
CREATE INDEX IF NOT EXISTS idx_admin_list_media_mime_type ON media (mime_type);
CREATE INDEX IF NOT EXISTS idx_admin_list_media_uploaded_by ON media (uploaded_by_id);
CREATE INDEX IF NOT EXISTS idx_admin_list_content_pages_status ON content_pages (status);
CREATE INDEX IF NOT EXISTS idx_admin_list_content_pages_updated_at ON content_pages (updated_at DESC, id);
```

- [ ] **Step 2: Write the down migration**

Restore backed-up Contact and Registration statuses by joining
`migration_000021_status_backup`, then drop the backup table. Drop every
`idx_admin_list_*` index introduced above with `DROP INDEX IF EXISTS`. Do not drop
`pg_trgm`, because another application object may use the extension.

- [ ] **Step 3: Mirror portable indexes in GORM tags**

Add named `index:` tags for ordinary single-column indexes where absent. Do not attempt
to express trigram or expression indexes as GORM tags.

- [ ] **Step 4: Verify migration syntax when a test database is available**

Run:

```bash
cd backend && go run cmd/migrate/main.go version
cd backend && go run cmd/migrate/main.go up
cd backend && go run cmd/migrate/main.go down
cd backend && go run cmd/migrate/main.go up
```

Expected: version advances to `21`, rolls back to `20`, and advances to `21` again. If
`DATABASE_URL` is not a confirmed test database, do not run these mutation commands and
record the skipped verification.

- [ ] **Step 5: Commit**

```bash
git add backend/migrations/000021_add_admin_list_query_indexes.up.sql backend/migrations/000021_add_admin_list_query_indexes.down.sql backend/internal/models/user.go backend/internal/models/member.go backend/internal/models/donation.go backend/internal/models/event_registration.go backend/internal/models/contact.go backend/internal/models/media.go backend/internal/models/audit_log.go backend/internal/models/role.go backend/internal/models/event.go backend/internal/models/monk.go backend/internal/models/schedule.go backend/internal/models/gallery.go backend/internal/models/content.go
git commit -m "perf(db): index admin list queries"
```

---

### Task 6: Migrate identity and audit resources to the common backend contract

**Files:**
- Modify: `backend/internal/handlers/user_handler.go`
- Modify: `backend/internal/services/user_service.go`
- Modify: `backend/internal/handlers/role_handler.go`
- Modify: `backend/internal/services/role_service.go`
- Modify: `backend/internal/handlers/member_handler.go`
- Modify: `backend/internal/services/member_service.go`
- Modify: `backend/internal/handlers/audit_log_handler.go`
- Modify: `backend/internal/services/audit_service.go`
- Modify: `backend/internal/routes/routes.go`

**Interfaces:**
- Consumes: `listquery.Common`.
- Produces: paginated Users, Roles, Members, Audit Logs, and Audit filter options.

- [ ] **Step 1: Add typed service options**

Define one options type in each owning service file:

```go
type UserListOptions struct {
	Common        listquery.Common
	Statuses      []string
	RoleIDs       []uuid.UUID
	EmailVerified []bool
}

type RoleListOptions struct {
	Common   listquery.Common
	Statuses []string
}

type MemberListOptions struct {
	Common   listquery.Common
	Statuses []string
	Types    []string
}

type AuditListOptions struct {
	Common      listquery.Common
	Actions     []string
	EntityTypes []string
	UserIDs     []uuid.UUID
}
```

Change each `List` signature to `(options) ([]Model, int64, error)`.

- [ ] **Step 2: Apply explicit queries**

For every resource:

1. Start from `db.Model(&models.Model{})`.
2. Apply search predicates with parameter placeholders.
3. Apply `IN ?` only when a repeated filter is non-empty.
4. Apply inclusive dates to the resource date column.
5. Count after filters and before offset/limit.
6. Map the allowlisted public sort key to a fixed SQL expression.
7. Append the ID tie-breaker.
8. Preserve required preloads.

For Members, join users only for email search and keep `Preload("User")` for response
data. For Audit Logs, join users only for user name/email search.

- [ ] **Step 3: Parse handlers and return `PaginatedResponse`**

Each handler calls `listquery.Parse`, validates repeated resource values, maps parser
errors to HTTP 400, calls the typed service, and returns:

```go
return utils.PaginatedResponse(
	c,
	items,
	query.Page,
	query.Limit,
	int(total),
)
```

Allowed status values are `active/inactive` for boolean-backed resources and the
canonical membership values for Members.

- [ ] **Step 4: Add Audit filter options**

Register `GET /admin/audit-logs/filter-options` before any parameterized Audit route.
Protect it with `PermissionRequired("audit_logs", "read")`. Return distinct non-empty
actions and entity types ordered ascending.

- [ ] **Step 5: Format and verify**

Run:

```bash
cd backend && gofmt -w internal/handlers/user_handler.go internal/services/user_service.go internal/handlers/role_handler.go internal/services/role_service.go internal/handlers/member_handler.go internal/services/member_service.go internal/handlers/audit_log_handler.go internal/services/audit_service.go internal/routes/routes.go
cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./...
cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go vet ./...
```

Expected: commands exit `0`, except database-dependent tests may explicitly skip.

- [ ] **Step 6: Commit**

```bash
git add backend/internal/handlers/user_handler.go backend/internal/services/user_service.go backend/internal/handlers/role_handler.go backend/internal/services/role_service.go backend/internal/handlers/member_handler.go backend/internal/services/member_service.go backend/internal/handlers/audit_log_handler.go backend/internal/services/audit_service.go backend/internal/routes/routes.go
git commit -m "feat(api): query identity and audit lists"
```

---

### Task 7: Migrate content-management resources without changing public visibility

**Files:**
- Modify: `backend/internal/handlers/event_handler.go`
- Modify: `backend/internal/services/event_service.go`
- Modify: `backend/internal/handlers/monk_handler.go`
- Modify: `backend/internal/services/monk_service.go`
- Modify: `backend/internal/handlers/schedule_handler.go`
- Modify: `backend/internal/services/schedule_service.go`
- Modify: `backend/internal/handlers/gallery_handler.go`
- Modify: `backend/internal/services/gallery_service.go`
- Modify: `backend/internal/handlers/content_handler.go`
- Modify: `backend/internal/services/content_service.go`

**Interfaces:**
- Produces: paginated Admin Events, Monks, Schedules, Gallery, Gallery Categories, and Website Pages.
- Preserves: existing `ListActive` and published public methods.

- [ ] **Step 1: Split Admin list methods from public methods**

Keep each existing active-only method unchanged. Add:

```go
func (s *EventService) ListAdmin(options EventListOptions) ([]models.Event, int64, error)
func (s *MonkService) ListAdmin(options MonkListOptions) ([]models.Monk, int64, error)
func (s *ScheduleService) ListAdmin(options ScheduleListOptions) ([]models.Schedule, int64, error)
func (s *GalleryService) ListAdmin(options GalleryListOptions) ([]models.Gallery, int64, error)
func (s *GalleryService) ListCategoriesAdmin(options GalleryCategoryListOptions) ([]models.GalleryCategory, int64, error)
func (s *ContentService) ListPagesAdmin(options ContentPageListOptions) ([]models.ContentPage, int64, error)
```

Options embed `listquery.Common` and add the matrix filters from the design. Search
localized JSONB fields explicitly through `column->>'th'`, `column->>'en'`, and
`column->>'de'`.

- [ ] **Step 2: Implement stable filter and sort maps**

Use fixed maps inside each service, for example:

```go
var eventSortColumns = map[string]string{
	"start_date":    "events.start_date",
	"title":         "events.title->>'th'",
	"event_type":    "events.event_type",
	"created_at":    "events.created_at",
	"display_order": "events.display_order",
}
```

Boolean status maps `active` to true and `inactive` to false. Date bounds are supported
for Events only in this task and apply to `events.start_date`.

- [ ] **Step 3: Update Admin handlers only**

Admin handlers call `ListAdmin` and return `PaginatedResponse`. Public route handlers
continue calling `ListActive` or published methods and keep their current response
shape.

- [ ] **Step 4: Verify public behavior and backend build**

Run:

```bash
cd backend && gofmt -w internal/handlers/event_handler.go internal/services/event_service.go internal/handlers/monk_handler.go internal/services/monk_service.go internal/handlers/schedule_handler.go internal/services/schedule_service.go internal/handlers/gallery_handler.go internal/services/gallery_service.go internal/handlers/content_handler.go internal/services/content_service.go
cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./...
cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go build -o bin/server ./cmd/app
```

Expected: test command exits `0` with permitted skips; build exits `0`.

- [ ] **Step 5: Commit**

```bash
git add backend/internal/handlers/event_handler.go backend/internal/services/event_service.go backend/internal/handlers/monk_handler.go backend/internal/services/monk_service.go backend/internal/handlers/schedule_handler.go backend/internal/services/schedule_service.go backend/internal/handlers/gallery_handler.go backend/internal/services/gallery_service.go backend/internal/handlers/content_handler.go backend/internal/services/content_service.go
git commit -m "feat(api): paginate admin content lists"
```

---

### Task 8: Migrate operational resources and canonical statuses

**Files:**
- Modify: `backend/internal/handlers/donation_handler.go`
- Modify: `backend/internal/services/donation_service.go`
- Modify: `backend/internal/handlers/registration_handler.go`
- Modify: `backend/internal/services/registration_service.go`
- Modify: `backend/internal/handlers/contact_handler.go`
- Modify: `backend/internal/services/contact_service.go`
- Modify: `backend/internal/handlers/media_handler.go`
- Modify: `backend/internal/services/media_service.go`
- Modify: `backend/internal/routes/routes.go`

**Interfaces:**
- Produces: complete Donations, Donation Categories, Registrations, Contact Inquiries, Media, and two filter-option endpoints.
- Enforces: canonical Contact and Registration statuses.

- [ ] **Step 1: Add typed options and explicit search**

Define:

```go
type DonationListOptions struct {
	Common      listquery.Common
	Statuses    []string
	CategoryIDs []int
	Methods     []string
	Currencies  []string
}

type RegistrationListOptions struct {
	Common   listquery.Common
	Statuses []string
	EventIDs []int
}

type ContactListOptions struct {
	Common listquery.Common
	Statuses []string
	Types []string
}

type MediaListOptions struct {
	Common      listquery.Common
	MIMEGroups  []string
	Categories  []string
	UploaderIDs []uuid.UUID
}
```

Add a separate paginated options type and method for Donation Categories.

- [ ] **Step 2: Enforce canonical lifecycle values**

Contact update accepts only:

```go
var contactStatuses = map[string]struct{}{
	"new": {}, "read": {}, "replied": {}, "archived": {},
}
```

Registration update accepts only:

```go
var registrationStatuses = map[string]struct{}{
	"pending": {}, "confirmed": {}, "attended": {}, "cancelled": {},
}
```

Return HTTP 400 for any other value. Preserve cancellation reason handling. Update
registration response usage to the model's `registration_status` field.

- [ ] **Step 3: Add resource filter-option routes**

Register these before `/:id` routes:

```text
GET /admin/donations/filter-options
GET /admin/media/filter-options
```

Donation options contain distinct methods and currencies. Media options contain distinct
categories and normalized MIME groups (`image`, `video`, `pdf`, `other`). Protect routes
with the owning resource's read permission.

- [ ] **Step 4: Return the shared paginated envelope**

All six collection handlers use `listquery.Parse`, typed repeated values, and
`utils.PaginatedResponse`. Media preloads `UploadedBy`; Donations preload Category and
Member; Registrations preload Event and Member; Contacts preload RepliedBy.

- [ ] **Step 5: Format and verify**

Run:

```bash
cd backend && gofmt -w internal/handlers/donation_handler.go internal/services/donation_service.go internal/handlers/registration_handler.go internal/services/registration_service.go internal/handlers/contact_handler.go internal/services/contact_service.go internal/handlers/media_handler.go internal/services/media_service.go internal/routes/routes.go
cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./...
cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go vet ./...
cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go build -o bin/server ./cmd/app
```

Expected: all commands exit `0`, except configured integration tests may skip.

- [ ] **Step 6: Commit**

```bash
git add backend/internal/handlers/donation_handler.go backend/internal/services/donation_service.go backend/internal/handlers/registration_handler.go backend/internal/services/registration_service.go backend/internal/handlers/contact_handler.go backend/internal/services/contact_service.go backend/internal/handlers/media_handler.go backend/internal/services/media_service.go backend/internal/routes/routes.go
git commit -m "feat(api): query operational admin lists"
```

---

### Task 9: Type frontend services and repair Registration/Contact contracts

**Files:**
- Modify: `frontend/src/types/entities.ts`
- Modify: `frontend/src/types/auditLog.ts`
- Modify: `frontend/src/types/website-cms.ts`
- Modify: `frontend/src/services/adminService.ts`
- Modify: `frontend/src/services/auditLogService.ts`
- Modify: `frontend/src/services/mediaService.ts`
- Modify: `frontend/src/services/websiteCmsService.ts`
- Modify: `frontend/src/hooks/website-cms.ts`

**Interfaces:**
- Consumes: backend `PaginatedResponse`.
- Produces: typed list fetchers compatible with `useAdminListQuery`.

- [ ] **Step 1: Add the missing Event Registration type**

```ts
export type RegistrationStatus =
  | "pending"
  | "confirmed"
  | "attended"
  | "cancelled";

export interface EventRegistration {
  id: number;
  event_id: number;
  event?: Event;
  registration_type: "member" | "guest";
  member_id: number | null;
  member?: Member;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  registration_status: RegistrationStatus;
  confirmation_code: string;
  created_at: string;
  updated_at: string;
}
```

Add `ContactStatus = "new" | "read" | "replied" | "archived"` and type
`ContactInquiry.status` with it.

- [ ] **Step 2: Replace `Record<string, string | number>` parameters**

Change the generic list helper to:

```ts
export function createAdminService<T, TFilters extends AdminFilterRecord>(
  resource: string,
) {
  return {
    async getAll(
      params: AdminListParams<TFilters>,
    ): Promise<AdminListResult<T>> {
      const response = await api.get<PaginatedResponse<T>>(`/admin/${resource}`, {
        params: toApiListParams(params),
        paramsSerializer: { indexes: null },
      });
      return {
        data: response.data.data,
        pagination: response.data.pagination,
      };
    },
    // Existing mutation methods remain unchanged.
  };
}
```

`toApiListParams` flattens `filters` and preserves arrays so Axios emits repeated keys.
Validate `success`, `data`, and `pagination` before returning.

- [ ] **Step 3: Add typed parameter interfaces per resource**

Declare and export `UserListFilters`, `RoleListFilters`, `MemberListFilters`,
`MonkListFilters`, `EventListFilters`, `ScheduleListFilters`, `GalleryListFilters`,
`GalleryCategoryListFilters`, `DonationListFilters`, `DonationCategoryListFilters`,
`RegistrationListFilters`, `ContactListFilters`, `AuditListFilters`,
`MediaListFilters`, and `WebsitePageListFilters`. Each property matches the approved
resource matrix and uses `string[]` for multi-select.

- [ ] **Step 4: Type filter-option requests**

Add explicit methods:

```ts
auditLogAdminService.getFilterOptions(): Promise<{
  actions: string[];
  entityTypes: string[];
}>

donationAdminService.getFilterOptions(): Promise<{
  methods: string[];
  currencies: string[];
}>

mediaAdminService.getFilterOptions(): Promise<{
  categories: string[];
  mimeGroups: Array<"image" | "video" | "pdf" | "other">;
}>
```

Reuse typed Admin list methods for roles, categories, events, and uploaders.

- [ ] **Step 5: Update Website CMS list query key**

Change `websiteCmsKeys.pages()` to accept canonical list params and make
`websiteCmsAdminService.listPages(params)` return `AdminListResult<ContentPage>`.
Mutation invalidation targets the `websiteCmsKeys.pagesRoot()` prefix so every filtered
page refreshes after a mutation.

- [ ] **Step 6: Verify and commit**

Run:

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
cd frontend && npm run lint
```

Expected: commands exit `0`.

```bash
git add frontend/src/types frontend/src/services frontend/src/hooks/website-cms.ts
git commit -m "feat(admin): type list API services"
```

---

### Task 10: Migrate Users, Roles, Members, Audit Logs, Events, Monks, and Schedules

**Files:**
- Modify: `frontend/src/app/[locale]/admin/users/page.tsx`
- Modify: `frontend/src/app/[locale]/admin/roles/page.tsx`
- Modify: `frontend/src/app/[locale]/admin/members/page.tsx`
- Modify: `frontend/src/app/[locale]/admin/audit-logs/page.tsx`
- Modify: `frontend/src/app/[locale]/admin/events/page.tsx`
- Modify: `frontend/src/app/[locale]/admin/monks/page.tsx`
- Modify: `frontend/src/app/[locale]/admin/schedules/page.tsx`

**Interfaces:**
- Consumes: shared Admin-list hooks/components and typed services.
- Produces: seven URL-driven list pages.

- [ ] **Step 1: Apply the common page composition**

Each page creates a resource URL schema, calls `useAdminListState`, calls
`useAdminListQuery`, and renders:

```tsx
<AdminListToolbar
  search={
    <AdminSearchInput
      value={state.draftSearch}
      isDebouncing={state.isDebouncing}
      placeholder={t("list.searchPlaceholder")}
      onChange={(value) => state.actions.setSearch(value)}
      onSubmit={(value) => state.actions.setSearch(value, true)}
      onClear={() => state.actions.setSearch("", true)}
    />
  }
  primaryFilters={primaryFilters}
  activeFilters={activeFilterChips}
  activeFilterCount={activeFilterCount}
>
  {additionalFilters}
</AdminListToolbar>
```

Pass `state.params.page`, `state.params.limit`, server pagination, sort actions, and page
size actions to DataTable.

- [ ] **Step 2: Reset row selection from the canonical scope key**

In each selectable page:

```ts
useEffect(() => {
  selectedIds.clearSelection();
}, [state.scopeKey, selectedIds.clearSelection]);
```

“Select all” remains limited to the current visible rows.

- [ ] **Step 3: Supply exact filters**

- Users: status primary; role and email-verified additional.
- Roles: status primary.
- Members: membership status primary; type and membership date additional.
- Audit Logs: action primary; entity type, user, and created date additional.
- Events: status primary; type and event date additional.
- Monks: status primary.
- Schedules: schedule type primary; status and weekday additional.

Use relation options from typed queries and fixed options from localized typed constants.

- [ ] **Step 4: Preserve page-specific actions**

Keep create/edit/delete, preview, bulk delete, forms, and drawers unchanged. After
mutations, invalidate or refetch the canonical list query instead of calling the old
`fetchData`.

- [ ] **Step 5: Verify and commit**

Run:

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
cd frontend && npm run lint
```

Expected: commands exit `0`.

```bash
git add 'frontend/src/app/[locale]/admin/users/page.tsx' 'frontend/src/app/[locale]/admin/roles/page.tsx' 'frontend/src/app/[locale]/admin/members/page.tsx' 'frontend/src/app/[locale]/admin/audit-logs/page.tsx' 'frontend/src/app/[locale]/admin/events/page.tsx' 'frontend/src/app/[locale]/admin/monks/page.tsx' 'frontend/src/app/[locale]/admin/schedules/page.tsx'
git commit -m "feat(admin): query identity and content lists"
```

---

### Task 11: Migrate Gallery, Categories, Donations, Registrations, Contacts, Media, and Website Pages

**Files:**
- Modify: `frontend/src/app/[locale]/admin/gallery/page.tsx`
- Modify: `frontend/src/app/[locale]/admin/gallery/categories/page.tsx`
- Modify: `frontend/src/app/[locale]/admin/donations/page.tsx`
- Modify: `frontend/src/app/[locale]/admin/donations/categories/page.tsx`
- Modify: `frontend/src/app/[locale]/admin/registrations/page.tsx`
- Modify: `frontend/src/app/[locale]/admin/contacts/page.tsx`
- Modify: `frontend/src/app/[locale]/admin/media/page.tsx`
- Modify: `frontend/src/components/admin/website/WebsitePagesManager.tsx`
- Modify: `frontend/src/hooks/useDataTable.ts`

**Interfaces:**
- Consumes: shared Admin-list hooks/components and typed services.
- Produces: the remaining eight URL-driven pages and removes the obsolete hook.

- [ ] **Step 1: Migrate the common page composition**

Use the same explicit shared component composition from Task 10. Replace category page
`useEffect` loading with typed TanStack list queries. Preserve category edit/create
modals and Media grid presentation; the shared hooks do not require a DataTable.

- [ ] **Step 2: Supply exact filters**

- Gallery: category primary; status and event additional.
- Gallery Categories: status primary.
- Donations: status primary; category, method, currency, and donation date additional.
- Donation Categories: status primary.
- Registrations: registration status primary; event and created date additional.
- Contacts: Contact Inquiry status primary; inquiry type and created date additional.
- Media: MIME group primary; category, uploader, and created date additional.
- Website Pages: publication status primary.

- [ ] **Step 3: Repair Registration rendering**

Replace `Record<string, unknown>` with `EventRegistration`. Render:

```ts
const fullName = `${registration.first_name} ${registration.last_name}`.trim();
const eventTitle = registration.event?.title?.[locale] ?? registration.event?.title?.th ?? "-";
const status = registration.registration_status;
```

Status choices are only pending, confirmed, attended, and cancelled.

- [ ] **Step 4: Repair Contact status rendering**

Status choices are only new, read, replied, and archived. Opening an Inquiry may update
new to read through the existing status endpoint; saving a reply sets replied. Archived
replaces the old closed option.

- [ ] **Step 5: Remove the obsolete table hook**

After `rg "useDataTable" frontend/src` finds no imports, delete
`frontend/src/hooks/useDataTable.ts`. Keep DataTable as a controlled rendering component.

- [ ] **Step 6: Verify and commit**

Run:

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
cd frontend && npm run lint
rg -n "useDataTable" frontend/src
```

Expected: type-check and lint exit `0`; ripgrep returns no matches and exits `1`.

```bash
git add 'frontend/src/app/[locale]/admin/gallery/page.tsx' 'frontend/src/app/[locale]/admin/gallery/categories/page.tsx' 'frontend/src/app/[locale]/admin/donations/page.tsx' 'frontend/src/app/[locale]/admin/donations/categories/page.tsx' 'frontend/src/app/[locale]/admin/registrations/page.tsx' 'frontend/src/app/[locale]/admin/contacts/page.tsx' 'frontend/src/app/[locale]/admin/media/page.tsx' frontend/src/components/admin/website/WebsitePagesManager.tsx frontend/src/hooks/useDataTable.ts
git commit -m "feat(admin): query remaining management lists"
```

---

### Task 12: Add full-result batched CSV export

**Files:**
- Create: `frontend/src/features/admin-list/useAdminListExport.ts`
- Modify: `frontend/src/features/admin-list/index.ts`
- Modify: every exporting page migrated in Tasks 10–11

**Interfaces:**
- Consumes: canonical params, typed list fetcher, and resource CSV mapper.
- Produces: progress-aware export with count consistency checking.

- [ ] **Step 1: Implement the export hook**

```ts
export interface UseAdminListExportOptions<
  TItem extends { id: string | number },
  TFilters extends AdminFilterRecord,
  TCsvRow extends Record<string, string | number | boolean>,
> {
  params: AdminListParams<TFilters>;
  fetcher(params: AdminListParams<TFilters>): Promise<AdminListResult<TItem>>;
  mapRow(item: TItem): TCsvRow;
  fileName: string;
  columns: Array<{ label: string; key: keyof TCsvRow & string }>;
}
```

The hook fetches page 1 at limit 100, calculates remaining pages, runs at most three
requests concurrently, deduplicates through `Map<string | number, TItem>`, compares the
map size with the first response total, and calls the existing `exportToCsv`.

Expose:

```ts
{
  exportAll(): Promise<void>;
  isExporting: boolean;
  completed: number;
  total: number;
  error: Error | null;
}
```

- [ ] **Step 2: Replace current-page export handlers**

Each exporting page passes its existing typed row mapper and columns to
`useAdminListExport`. The button uses `AdminListExportButton` and reports a translated
retry message if data changed during export.

- [ ] **Step 3: Verify and commit**

Run:

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
cd frontend && npm run lint
```

Expected: commands exit `0`.

```bash
git add frontend/src/features/admin-list/useAdminListExport.ts frontend/src/features/admin-list/index.ts 'frontend/src/app/[locale]/admin/contacts/page.tsx' 'frontend/src/app/[locale]/admin/donations/categories/page.tsx' 'frontend/src/app/[locale]/admin/donations/page.tsx' 'frontend/src/app/[locale]/admin/events/page.tsx' 'frontend/src/app/[locale]/admin/gallery/categories/page.tsx' 'frontend/src/app/[locale]/admin/gallery/page.tsx' 'frontend/src/app/[locale]/admin/members/page.tsx' 'frontend/src/app/[locale]/admin/monks/page.tsx' 'frontend/src/app/[locale]/admin/registrations/page.tsx' 'frontend/src/app/[locale]/admin/roles/page.tsx' 'frontend/src/app/[locale]/admin/schedules/page.tsx' 'frontend/src/app/[locale]/admin/users/page.tsx'
git commit -m "feat(admin): export all filtered list results"
```

---

### Task 13: Complete localization and OpenAPI

**Files:**
- Modify: `frontend/src/messages/admin/th.json`
- Modify: `frontend/src/messages/admin/en.json`
- Modify: `frontend/src/messages/admin/de.json`
- Modify: `backend/docs/openapi.yaml`

**Interfaces:**
- Documents: common query parameters, repeated filters, pagination envelope, filter-option routes, and canonical statuses.

- [ ] **Step 1: Add one shared Admin list message namespace**

Add matching keys to all three locale files:

```json
{
  "list": {
    "search": "Search",
    "searchPlaceholder": "Search records...",
    "moreFilters": "More filters",
    "clearAll": "Clear all",
    "closeFilters": "Close filters",
    "noMatches": "No matching results",
    "empty": "No records yet",
    "retry": "Try again",
    "rowsPerPage": "Rows per page",
    "exporting": "Exporting {completed} of {total}",
    "exportChanged": "The results changed during export. Please try again."
  }
}
```

Translate naturally into Thai and German. Add localized option labels for Contact and
Registration canonical statuses, weekdays, boolean status, MIME groups, and email
verification.

- [ ] **Step 2: Document common list parameters**

Add reusable OpenAPI parameters for page, limit, search, sort, order, from, and to.
Document repeated array parameters with `style: form` and `explode: true`. Apply the
resource-specific parameter set to every in-scope list route.

- [ ] **Step 3: Document responses and filter-option routes**

Document the shared pagination object with camel-case `totalPages`. Add the Audit,
Donation, and Media filter-option routes and their owning read permissions in
descriptions. Document Contact and Registration status enums.

- [ ] **Step 4: Verify and commit**

Run:

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
cd frontend && npm run lint
git diff --check -- frontend/src/messages/admin backend/docs/openapi.yaml
```

Expected: commands exit `0`.

```bash
git add frontend/src/messages/admin backend/docs/openapi.yaml
git commit -m "docs(api): document admin list queries"
```

---

### Task 14: Final verification and manual QA

**Files:**
- Modify only files required to correct verification failures introduced by Tasks 1–13.

**Interfaces:**
- Produces: a verified release candidate and an explicit automated-test coverage note.

- [ ] **Step 1: Run frontend verification**

```bash
make fe-lint
cd frontend && ./node_modules/.bin/tsc --noEmit
make fe-build
```

Expected: all commands exit `0`.

- [ ] **Step 2: Run backend verification**

```bash
cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go test ./...
cd backend && GOCACHE=/private/tmp/wat-profile-go-cache go vet ./...
make be-build
```

Expected: all commands exit `0`; tests requiring an unset `DATABASE_URL_TEST` may report
an explicit skip.

- [ ] **Step 3: Inspect migration and diff**

```bash
git diff --check
git status --short
git diff --stat
```

Expected: no whitespace errors, no generated artifacts, and only intended source,
contract, migration, and localization files.

- [ ] **Step 4: Run the manual Admin matrix**

For each of the 15 in-scope pages:

1. Search from one character and confirm the request waits 350 ms.
2. Press Enter and confirm immediate search.
3. Choose two values in one filter and confirm OR behavior.
4. Add a second filter and confirm AND behavior.
5. Refresh and use Back/Forward to confirm URL restoration.
6. Change sort and confirm server ordering across multiple pages.
7. Change limit through 10, 25, 50, and 100.
8. Select rows, change page/filter, and confirm selection clears.
9. Confirm filtered-empty, resource-empty, request-error, and retry behavior.
10. Export and confirm the CSV contains all matching pages.

Repeat the UI review in Thai, English, and German at desktop and mobile widths. Verify
keyboard access, visible focus, 44-pixel targets, and reduced motion.

- [ ] **Step 5: Verify public isolation**

Check public Events, Monks, Schedules, Gallery, and Website CMS pages. Confirm inactive,
draft, and archived records remain excluded exactly as before.

- [ ] **Step 6: Review representative PostgreSQL plans**

When a test database with representative data is available, run `EXPLAIN (ANALYZE,
BUFFERS)` for filtered/search queries on Users, Members, Donations, Registrations,
Contacts, Audit Logs, and Media. Confirm the new indexes are considered and no query
constructs an unbounded response.

- [ ] **Step 7: Commit verification fixes**

```bash
git add -p
git commit -m "fix(admin): complete list query verification"
```

Create this commit only when verification produced source fixes. Do not create an empty
commit.

- [ ] **Step 8: Handoff**

Report:

- commands run and outcomes;
- migration verification performed or skipped;
- manual locales/viewports covered;
- known data-volume limitations of batched CSV export;
- the explicit decision that no new automated tests were added.
