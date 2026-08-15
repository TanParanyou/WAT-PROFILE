# Events Calendar Compact Placement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the embedded public Calendar after regular schedules and make the Events page feel more compact without changing Calendar behavior.

**Architecture:** Keep the prop-free `PublicCalendarSection` unchanged: it continues to own route-local URL state, public fetching, labels, adapters, and event navigation. `EventsContent` becomes the sole layout owner and places schedule, Calendar, and upcoming events on the existing content-width surface.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, next-intl, node:test.

## Global Constraints

- Reuse the custom Calendar; do not add FullCalendar or another dependency.
- Keep Month, Week, and Day behavior and `/[locale]/events?view=&date=` URL state unchanged.
- Keep `PublicCalendarSection` prop-free and do not alter the standalone `/[locale]/calendar` page.
- Preserve Thai, English, and German localized content.
- Do not change backend APIs, database schema, Admin Calendar, or OpenAPI.
- Do not use TypeScript `any`, `as any`, or `@ts-ignore`.

---

### Task 1: Reorder the Events page and constrain its Calendar surface

**Files:**
- Modify: `frontend/src/app/[locale]/(client)/events/EventsContent.tsx`
- Modify: `frontend/src/features/calendar/presets/presets.test.ts`

**Interfaces:**
- Consumes: `PublicCalendarSection`, the existing schedules and events query branches, and `PublicSectionHeading`.
- Produces: Events page order `header → schedules → Calendar → upcoming events` on `PageContainer width="content"`.
- Guarantees: Calendar URL state and view behavior continue to be provided by `PublicCalendarSection` without new props.

- [ ] **Step 1: Write the failing layout-order source test.**

In the `Events page composes the shared public calendar section before schedules` test, replace the order assertion with:

```ts
const scheduleIndex = source.indexOf('aria-labelledby="schedule-heading"');
const calendarIndex = source.indexOf('aria-labelledby="calendar-heading"');
const eventsIndex = source.indexOf('aria-labelledby="events-heading"');

assert.ok(scheduleIndex >= 0);
assert.ok(calendarIndex > scheduleIndex);
assert.ok(eventsIndex > calendarIndex);
assert.match(source, /<PageContainer width="content">/);
```

Keep the assertions that `PublicCalendarSection` is rendered, the `/calendar` action link is absent, and localized Calendar title/description are used.

- [ ] **Step 2: Run the source test to verify it fails.**

Run:

```bash
cd frontend && NODE_ENV=development npx tsx --test src/features/calendar/presets/presets.test.ts
```

Expected: FAIL because Calendar currently appears before schedules and the page uses `wide`.

- [ ] **Step 3: Move the existing Calendar section after schedules.**

In `EventsContent.tsx`, keep the existing schedule query and state rendering unchanged. Use this top-level section sequence inside `PageContainer`:

```tsx
<section aria-labelledby="schedule-heading">
  {/* existing schedule heading and query branches */}
</section>
<section className="mt-16 border-t border-site-border pt-12 sm:pt-16" aria-labelledby="calendar-heading">
  <PublicSectionHeading
    id="calendar-heading"
    title={tPage("calendarTitle")}
    description={tPage("calendarDescription")}
  />
  <div className="mt-6">
    <PublicCalendarSection />
  </div>
</section>
<section className="mt-20 border-t border-site-border pt-16" aria-labelledby="events-heading">
  {/* existing upcoming-events heading and query branches */}
</section>
```

Set the container back to `<PageContainer width="content">`. Do not add a `max-w-*` wrapper around `PublicCalendarSection`; the content surface is the intentional compact boundary and Week/Day retain their own narrow-screen scrolling.

- [ ] **Step 4: Run focused tests to verify the compact layout contract.**

Run:

```bash
cd frontend && NODE_ENV=development npx tsx --test src/features/calendar/presets/presets.test.ts
cd frontend && npm run test:calendar
```

Expected: all tests pass, including the new order and content-width assertions.

- [ ] **Step 5: Run type, lint, build, and browser verification.**

Run:

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
cd frontend && ./node_modules/.bin/eslint src/app/[locale]/(client)/events/EventsContent.tsx src/features/calendar/presets/presets.test.ts
cd frontend && NEXT_PUBLIC_PUBLIC_ACCOUNT_AUTH_ENABLED=false npm run build
```

Browser-check `/th/events?view=month&date=2026-08-12` at 390px and 1280px. Verify schedules precede Calendar, Calendar precedes upcoming events, the page has no horizontal overflow, and switching to Week then Day retains the `/th/events` pathname while updating the `view` query parameter.

- [ ] **Step 6: Commit the compact placement.**

```bash
git add frontend/src/app/[locale]/(client)/events/EventsContent.tsx frontend/src/features/calendar/presets/presets.test.ts docs/superpowers/plans/2026-08-15-events-calendar-compact-placement.md
git commit -m "refactor(events): compact calendar placement"
```

## Self-review

- Spec coverage: Task 1 returns the Events page to content width, positions Calendar after schedules and before the event list, and preserves the reusable Calendar integration unchanged.
- Placeholder scan: no TODOs, TBDs, or unspecified implementation steps remain.
- Type consistency: no component interface changes are introduced; `PublicCalendarSection` remains prop-free.
