# Public Client API and State Design

## Goal

Move public visitor pages from local JSON fixtures and ad-hoc request handling to a consistent, typed TanStack Query data layer. Each data-bearing section must communicate loading, error, and empty states without causing unrelated sections of the page to disappear. The home page is deliberately last because it composes data owned by the other public domains.

## Scope and order

1. **Events**: `/events`, `/events/[slug]`, and the daily, weekly, and online schedule content.
2. **Monks**: `/monks` and `/monks/[slug]`.
3. **Public content**: `/about`, `/contact`, `/privacy`, and `/impressum`.
4. **Home**: consume the proven event, monk, and public-content queries. It does not create duplicate endpoint wrappers.

Admin pages, legacy Website CMS editing routes, and a general-purpose data abstraction are out of scope. Backend changes are limited to public response contracts that do not provide the data required by the existing visitor UI.

## Architecture

Organize code by domain so the API contract, mapping, query definitions, and UI that consume them change together.

```text
src/features/public/events/
  api.ts                 // typed public HTTP calls
  types.ts               // DTO and UI models; no `any`
  mappers.ts             // DTO -> view model, including safe defaults
  queries.ts             // query keys and TanStack Query options/hooks
  components/
    EventsList.tsx
    SchedulesSection.tsx
    EventDetailContent.tsx
    EventListSkeleton.tsx

src/features/public/monks/
src/features/public/content/
src/components/public/states/
  QueryErrorState.tsx
  EmptyState.tsx
```

Route files remain intentionally thin:

- The server route owns metadata, canonical URLs, JSON-LD, and server-only `notFound()` decisions.
- A client container owns `useQuery` calls and composes presentational components.
- Presentational components receive view models and callbacks only; they never call Axios or inspect raw response envelopes.

`services/publicService.ts` may become a small compatibility facade while domains migrate, but new work uses the domain `api.ts` files. Shared primitives belong in the existing API client only when they are genuinely shared by two or more domains.

## Type and API contract rules

- Every public endpoint has an explicit response-envelope type and explicit DTO type. Axios calls use generics.
- Mappers are the only boundary where API naming, nullable values, dates, localized fields, and rich-text payloads become UI models.
- Components and hooks must not use `any`, `unknown as T`, or type assertions to conceal a contract mismatch. Narrow `unknown` with type guards at untrusted boundaries instead.
- The Events migration replaces the current local JSON ids with public API slugs. Related events are selected from the query result using the same view model.
- Events and schedules are independent public resources: `GET /public/events`, `GET /public/events/:slug`, and `GET /public/schedules`. A missing field needed by the existing UI is a small backend contract task, not a frontend fallback to JSON.

## TanStack Query policy

All browser-side reads use TanStack Query. Components do not fetch through `useEffect` and local `useState`, and do not invoke service functions directly.

```text
["public", "events"]
["public", "event", slug]
["public", "schedules"]
["public", "monks"]
["public", "monk", slug]
["public", "content", page]
```

- Detail queries use `enabled: Boolean(slug)`.
- Public content receives a longer `staleTime` than lists; events, schedules, and monks use a shorter freshness window appropriate to their update frequency.
- Initial loading shows a skeleton. Background refetch preserves already-rendered data and uses a subtle refreshing indicator only where useful.
- Retry is restricted to transient failures. HTTP 404 does not retry.
- A visitor's browser cache cannot be invalidated by an admin mutation in another browser. Freshness comes from `staleTime`, normal remount/refetch behavior, and any server cache policy that may be added later.

## State rendering policy

Each independently loaded section owns its own state boundary.

| State | List / section behavior | Detail behavior |
|---|---|---|
| Initial loading | Domain-specific skeleton matching final layout | Detail skeleton |
| Background fetch | Keep prior data; optional subtle indicator | Keep prior data |
| Request failure | Localized `QueryErrorState` with `refetch()` | 404 maps to not-found; other failures use retry state |
| Valid empty result | Localized `EmptyState`, preserving page heading and layout | Not applicable; use not-found for absent resource |
| Success | Render view model | Render view model and metadata/structured data |

Events demonstrate the boundary: schedules can fail and display their own retry card while the event list remains usable. The reverse is also true. Home page sections follow this exact isolation rule after their source domains are complete.

## Shared components

Reuse only small semantic state components:

- `QueryErrorState`: contextual message, optional retry action, and accessible status semantics.
- `EmptyState`: icon, localized title, description, and optional action.
- `ContentSkeleton`: base primitives; domains create their own layout skeletons.

Do not build a generic `ResourceRenderer` or a catch-all component with numerous state props. It would obscure domain behavior and make page-specific design changes harder.

## Localization and accessibility

- Loading, retry, failure, empty, and refreshing copy is defined in TH, EN, and DE namespaces owned by the relevant public domain.
- State changes use appropriate `aria-live` status messaging without repeatedly announcing background refetches.
- Retry controls are keyboard reachable and have localized accessible names.

## Delivery boundaries

Complete each domain end-to-end before starting the next: typed contract, query hook, page migration, all four state paths, removal of its JSON fixture imports, and a focused visual/manual verification. Do not begin the Home migration until Events, Monks, and public-content APIs are the sole source of their respective public pages.

## Non-goals

- No generic application-wide request framework beyond TanStack Query and narrow shared API helpers.
- No change to admin information architecture or legacy Website CMS behavior.
- No automatic tests are added as part of this requested plan; implementation verification is limited to type/lint checks and manual state-path review unless testing scope is explicitly reopened.
