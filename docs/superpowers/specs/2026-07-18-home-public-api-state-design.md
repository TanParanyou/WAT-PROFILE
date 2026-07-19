# Home Public API State Design

**Goal:** Make the public Home page compose CMS, Events, and Monks through independent typed TanStack Query boundaries without global loading or failure states.

## Scope

This design changes the public Home data flow only. It does not introduce a Home-specific backend endpoint, alter Admin CMS, or change domain API contracts unless a required domain field is absent.

## Data ownership

The CMS Home document remains owned by a `usePublicHomePageQuery` hook in `features/public/content`. It uses the public `/pages/home` endpoint, the shared retry classifier, and a 60-second stale time.

Events remain owned by `usePublicEventsQuery(3)`. Monks remain owned by `usePublicMonksQuery`; the Home section selects its display count from typed data until the Monks API gains a deliberate `limit` contract. Home does not create duplicate endpoint wrappers or a page-level `Promise.all`.

## Component boundaries

`HomeContent` is a composition-only client component. It renders three independent children:

- `HomeHeroSection` owns the CMS Home query and renders CMS content, a localized skeleton, an error/retry state for retryable failures, or intentional localized fallback copy when the published Home document is absent.
- `HomeEventsSection` owns the Events query and renders a local skeleton, retryable error, localized empty state, or event cards.
- `HomeMonksSection` owns the Monks query and renders the corresponding local states and monk cards.

No child query controls another section's rendering. A CMS failure cannot remove Events or Monks; an Events failure cannot remove Hero or Monks.

## Flexible typed section model

`PublicHomePageLayout` no longer receives aggregate arrays or query state. It becomes a visual shell composed from focused children. The Home CMS section resolver accepts only `PublicContentPage` and known `PublicContentSection` shapes; nested CMS values are read through a type guard that returns `string | LocalizedText | undefined`, never `any`, `unknown as T`, or `as Record`.

Each section receives a typed labels object from next-intl. There are no English, Thai, or German literals in components. A new `PublicHome` message namespace supplies Hero fallback, CMS retry, Events/Monks state labels, and accessible button labels in every locale.

## Server responsibility

The Home server route generates metadata only. It may fetch CMS data for metadata and use safe translated metadata fallback on a not-found or transient failure, but it does not fetch Events or Monks and does not pass runtime API results to the client.

## Media and accessibility

Event and Monk cards continue using `PublicImage`. Section skeletons preserve approximate final layout to avoid visual jumps. Error and empty states use the existing accessible shared components. Home Hero fallback keeps its CTA usable even when CMS is unavailable.

## Verification

Do not add automated tests. Run focused ESLint, `npx tsc --noEmit`, and `npm run build`. Source audits must show no Home fixture imports, no `publicService` calls, no `Promise.all`, no `any`, `unknown as`, or `as Record` in Home-related files. Manually check independent success, loading, 404/empty, and retryable failure states in TH, EN, and DE.
