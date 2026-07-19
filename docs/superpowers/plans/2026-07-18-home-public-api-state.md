# Home Public API State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render Home CMS, Events, and Monks through independent typed TanStack Query boundaries with localized loading, error, empty, and fallback states.

**Architecture:** Keep CMS Home query ownership under `features/public/content`; Events and Monks retain their current domain hooks. `HomeContent` becomes a composition shell that renders Hero, Events, and Monks sections independently. The server route supplies metadata only; no runtime public data is fetched or aggregated there.

**Tech Stack:** Next.js App Router, React 19, TypeScript strict mode, TanStack Query, Axios, next-intl.

## Global Constraints

- Do not use `any`, `unknown as T`, `as Record`, or type assertions that hide an API contract mismatch.
- Do not hardcode user-visible text in components; add TH/EN/DE messages first.
- Do not add automated tests; use focused lint, `npx tsc --noEmit`, build, source audits, and manual state checks.
- Do not create a Home-specific backend endpoint or fetch independent resources with `Promise.all`.
- Each API section owns its own loading, error/retry, empty, and success UI.
- Reuse `PublicImage`, `QueryErrorState`, `EmptyState`, and existing domain query keys.

---

## File Structure

```text
frontend/src/
  features/public/content/
    home.ts                                  # typed public Home CMS API and query key/hook
    home-section.ts                          # safe CMS section value readers and view model
  app/[locale]/(client)/
    HomeContent.tsx                          # composition-only client shell
    home/
      HomeHeroSection.tsx                    # CMS Home boundary
      HomeEventsSection.tsx                  # Events boundary
      HomeMonksSection.tsx                   # Monks boundary
      HomeSectionSkeleton.tsx                # reusable visual section skeleton
  app/[locale]/page.tsx                      # metadata only
  components/public/website/PublicHomePageLayout.tsx # layout primitives only
  messages/{th,en,de}.json                   # PublicHome labels and states
```

### Task 1: Add a typed public Home CMS query

**Files:**
- Create: `frontend/src/features/public/content/home.ts`
- Modify: `frontend/src/services/websiteCmsService.ts`

**Consumes:** `publicApi`, `ApiResponse<PublicContentPage>`, `shouldRetryPublicQuery`, and `PublicContentPage`.

**Produces:** `publicHomeKeys.page()` and `usePublicHomePageQuery()` with a 60-second cache policy.

- [ ] **Step 1: Add the typed endpoint function without mock-only behavior**

Move the public `home` endpoint access into `features/public/content/home.ts` and return `PublicContentPage | null`. Preserve the current mock switch only inside the service adapter; do not expose an untyped `unknown` result to the component.

```ts
export async function fetchPublicHomePage(): Promise<PublicContentPage | null> {
  return websiteCmsPublicService.getPage("home");
}
```

- [ ] **Step 2: Add a Home-specific key and query hook**

```ts
export const publicHomeKeys = {
  all: ["public", "content", "home"] as const,
  page: () => [...publicHomeKeys.all, "page"] as const,
};

export function usePublicHomePageQuery() {
  return useQuery({
    queryKey: publicHomeKeys.page(),
    queryFn: fetchPublicHomePage,
    staleTime: 60_000,
    retry: shouldRetryPublicQuery,
  });
}
```

- [ ] **Step 3: Verify the API boundary**

```bash
cd frontend && npm run lint -- src/features/public/content/home.ts src/services/websiteCmsService.ts
```

Expected: no lint errors and no unsafe type casts.

- [ ] **Step 4: Commit the Home CMS query**

```bash
git add frontend/src/features/public/content/home.ts frontend/src/services/websiteCmsService.ts
git commit -m "feat: add public home CMS query"
```

### Task 2: Define safe, flexible CMS Home section projection

**Files:**
- Create: `frontend/src/features/public/content/home-section.ts`
- Modify: `frontend/src/components/public/website/PublicHomePageLayout.tsx`

**Consumes:** `PublicContentPage`, `ContentSection`, and `LocalizedText`.

**Produces:** Typed `HomeHeroModel` and explicit helpers for CMS section lookup without `as Record` or arbitrary nested property access.

- [ ] **Step 1: Model supported CMS values explicitly**

Define a small recursive value guard rather than asserting records:

```ts
type CmsValue = string | LocalizedText | { [key: string]: CmsValue };

function isCmsValue(value: unknown): value is CmsValue {
  if (typeof value === "string") return true;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every(isCmsValue);
}
```

Use this only to read the known Hero fields `description`, `settings.cta_label`, and `settings.cta_href`. Unknown or malformed fields return `undefined`; they never throw and never receive a cast.

- [ ] **Step 2: Project Hero CMS into a view model**

```ts
export interface HomeHeroModel {
  title: LocalizedText | undefined;
  description: LocalizedText | undefined;
  ctaLabel: LocalizedText | undefined;
  ctaHref: string | undefined;
}

export function toHomeHeroModel(page: PublicContentPage | null): HomeHeroModel { /* known-section projection */ }
```

The resolver must match `section_key === "hero"` before its `section_type === "hero"`, and return values only after the guard passes.

- [ ] **Step 3: Reduce `PublicHomePageLayout` to visual primitives**

Remove aggregate Events/Monks props and CMS path traversal from the layout. Keep a typed `HomeHeroView` that receives already-projected text and CTA values, plus slots for the Events and Monks sections. Do not make the visual layout fetch data.

- [ ] **Step 4: Verify the CMS projection**

```bash
cd frontend && npm run lint -- src/features/public/content/home-section.ts src/components/public/website/PublicHomePageLayout.tsx
```

Expected: no `any`, `unknown as`, or `as Record` diagnostics.

- [ ] **Step 5: Commit the projection layer**

```bash
git add frontend/src/features/public/content/home-section.ts frontend/src/components/public/website/PublicHomePageLayout.tsx
git commit -m "refactor: isolate home CMS section projection"
```

### Task 3: Split Home into independent client query sections

**Files:**
- Create: `frontend/src/app/[locale]/(client)/home/HomeHeroSection.tsx`
- Create: `frontend/src/app/[locale]/(client)/home/HomeEventsSection.tsx`
- Create: `frontend/src/app/[locale]/(client)/home/HomeMonksSection.tsx`
- Create: `frontend/src/app/[locale]/(client)/home/HomeSectionSkeleton.tsx`
- Modify: `frontend/src/app/[locale]/(client)/HomeContent.tsx`
- Modify: `frontend/src/app/[locale]/page.tsx`

**Consumes:** Home CMS, Events, and Monks domain queries; shared state components; localized message keys.

**Produces:** Three independently renderable Home sections with no page-level query branch.

- [ ] **Step 1: Add localized `PublicHome` copy in all locales**

Add equal keys in TH, EN, and DE:

```json
{
  "heroFallbackTitle": "",
  "heroFallbackDescription": "",
  "heroFallbackCta": "",
  "heroUnavailableTitle": "",
  "heroUnavailableDescription": "",
  "eventsTitle": "",
  "eventsDescription": "",
  "monksTitle": "",
  "monksDescription": ""
}
```

Populate each language with real localized text. Components call `useTranslations("PublicHome")`; no visual copy is written inline.

- [ ] **Step 2: Implement the CMS Hero boundary**

`HomeHeroSection` calls `usePublicHomePageQuery()` and uses `toHomeHeroModel` for successful data. Its state rules are:

- loading: Hero-shaped skeleton;
- `null` data or 404: intentional localized fallback Hero with usable CTA;
- retryable error: `QueryErrorState` with `query.refetch` inside the Hero area;
- success: projected CMS Hero.

It must not fetch Events or Monks.

- [ ] **Step 3: Implement the Events boundary**

`HomeEventsSection` calls `usePublicEventsQuery(3)`. It renders its own `HomeSectionSkeleton`, `QueryErrorState`, `EmptyState`, or three `EventCard` values. Keep the Events title/action link visible in all states. Use the locale from `useLocale`, not a hardcoded locale string.

- [ ] **Step 4: Implement the Monks boundary**

`HomeMonksSection` calls `usePublicMonksQuery()`, selects `data.slice(0, 4)` during render, and renders its own skeleton/error/empty/success boundary. This is intentional client display selection; do not change the backend contract in this task.

- [ ] **Step 5: Convert `HomeContent` into a composition shell**

Delete its `usePublicEventsQuery`, `usePublicMonksQuery`, global loading condition, global error conditions, and aggregate empty condition. It composes exactly:

```tsx
<div className="flex min-h-screen flex-col">
  <HomeHeroSection />
  <HomeEventsSection />
  <HomeMonksSection />
</div>
```

The server page no longer fetches the CMS Home page for runtime rendering. Retain only metadata fetch with translated fallback in `generateMetadata`.

- [ ] **Step 6: Verify independent section behavior**

```bash
cd frontend && npm run lint -- 'src/app/[locale]/(client)/HomeContent.tsx' 'src/app/[locale]/(client)/home' src/features/public/content src/components/public/website/PublicHomePageLayout.tsx src/messages/{th,en,de}.json
```

Manually confirm that an Events failure leaves Hero and Monks visible, a Monks failure leaves Hero and Events visible, and an unavailable CMS Home page still leaves a translated Hero CTA.

- [ ] **Step 7: Commit independent Home boundaries**

```bash
git add 'frontend/src/app/[locale]/(client)/HomeContent.tsx' 'frontend/src/app/[locale]/(client)/home' 'frontend/src/app/[locale]/page.tsx' frontend/src/messages/{th,en,de}.json
git commit -m "feat: split home public API state boundaries"
```

### Task 4: Retire obsolete Home query consumers and audit

**Files:**
- Modify or delete only if no imports remain: `frontend/src/components/home/EventsSection.tsx`
- Modify or delete only if no imports remain: `frontend/src/components/home/EventAlertModal.tsx`
- Modify: affected route or component files found by audit

**Consumes:** Completed section components.

**Produces:** One Home API composition path without duplicate Events requests or obsolete fixture consumers.

- [ ] **Step 1: Decide ownership of the event alert**

Keep `EventAlertModal` only if it receives the Events query data from `HomeEventsSection` or a shared Home Events provider. Do not make a second `usePublicEventsQuery(3)` call solely for the alert. If the alert is not part of the intended Home experience, remove its import and component after confirming no consumers remain.

- [ ] **Step 2: Run source audits**

```bash
rg -n '@/data/(events|schedule|monks|about)|publicService\.|Promise\.all|\bas any\b|unknown as|\bas Record<' frontend/src/app/'[locale]' frontend/src/components/home frontend/src/components/public frontend/src/features/public
rg -n 'usePublicEventsQuery\(3\)' frontend/src/app/'[locale]' frontend/src/components/home
```

Expected: the first command has no matches; the second shows exactly one owner unless a typed shared provider is explicitly introduced.

- [ ] **Step 3: Run final static verification**

```bash
cd frontend && npm run lint -- src/features/public src/components/public 'src/app/[locale]'
npx tsc --noEmit
npm run build
```

Expected: all commands exit successfully.

- [ ] **Step 4: Commit audit corrections**

```bash
git add frontend
git commit -m "chore: complete home public API migration"
```

## Plan Self-Review

- CMS, Events, and Monks have one clear query owner and independent UI boundaries.
- The plan prevents aggregate Home loading/error state, duplicate Event requests, hardcoded visitor copy, and unsafe type assertions.
- Verification includes the exact audits and production checks required by the approved design.
