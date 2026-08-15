# Calendar Stable View Transitions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the visible layout jump while Calendar changes Month, Week, Day, or date range, while preserving immediate controls and accessible refresh feedback.

**Architecture:** Keep TanStack Query's previous Calendar data rendered during a range refetch. `CalendarQueryBoundary` becomes the sole owner of non-blocking refresh feedback: it wraps the Calendar in a stable positioning context and renders a small absolute status badge whose opacity changes without changing document flow. Calendar controller state and URL updates remain immediate; no grid, height, or scroll animation is introduced.

**Tech Stack:** Next.js 16, React 19, TanStack Query 5, TypeScript, Tailwind CSS 4, happy-dom, node:test.

## Global Constraints

- Do not add dependencies or migrate animation libraries.
- Do not use FullCalendar.
- Preserve initial-loading and blocking-error behavior.
- Preserve Thai, English, and German `refreshing` labels.
- Animate only the small status badge's opacity for `150ms`; never animate Calendar dimensions, grid tracks, sticky regions, or scroll position.
- Respect `prefers-reduced-motion` with `motion-reduce:transition-none`.
- Keep generic Calendar rendering free of fetching and query-state logic.
- Do not use TypeScript `any`, `as any`, or `@ts-ignore`.

---

### Task 1: Make refresh feedback layout-neutral and lock it with a DOM regression test

**Files:**
- Modify: `frontend/src/features/calendar/integrations/wat/CalendarQueryBoundary.tsx`
- Create: `frontend/src/features/calendar/integrations/wat/CalendarQueryBoundary.test.tsx`
- Modify: `frontend/package.json`

**Interfaces:**
- Consumes: `UseQueryResult<TData, Error>` fields `data`, `isPending`, `isError`, `isFetching`, and `refetch`.
- Produces: `CalendarQueryBoundary<TData>` where a successful, stale query renders a stable wrapper with `aria-busy`, and a `data-calendar-refresh-status` overlay that never occupies layout flow.

- [ ] **Step 1: Add the DOM test runner glob for WAT integrations.**

Change `test:calendar` so the middle `tsx --test` command includes this exact glob:

```json
"src/features/calendar/integrations/wat/*.test.tsx"
```

This makes the new boundary test part of the required Calendar gate rather than a manually invoked test.

- [ ] **Step 2: Write the failing refresh-layout test.**

Create `CalendarQueryBoundary.test.tsx` with happy-dom globals matching `ui/calendar-acceptance.test.ts`. Render the boundary with `data: { id: "calendar" }`, `isPending: false`, `isError: false`, and `isFetching: true`.

Assert all of the following:

```ts
const boundary = screen.container.firstElementChild as HTMLElement;
const status = screen.container.querySelector<HTMLElement>("[data-calendar-refresh-status]");

assert.equal(boundary.getAttribute("aria-busy"), "true");
assert.ok(status);
assert.equal(status?.getAttribute("role"), "status");
assert.match(status?.className ?? "", /absolute/);
assert.doesNotMatch(status?.className ?? "", /mb-3/);
assert.match(screen.container.textContent ?? "", /Calendar body/);
```

Rerender with `isFetching: false`, then assert the wrapper reports `aria-busy="false"` and the same status node has the `opacity-0` class. This test must fail against the current in-flow `<p className="mb-3 ...">` implementation.

- [ ] **Step 3: Run the new test and verify the expected failure.**

Run:

```bash
cd frontend && NODE_ENV=development npx tsx --test src/features/calendar/integrations/wat/CalendarQueryBoundary.test.tsx
```

Expected: FAIL because the refresh status has no `data-calendar-refresh-status` marker, is not absolutely positioned, and pushes the Calendar down with `mb-3`.

- [ ] **Step 4: Narrow the boundary contract and implement the overlay.**

Replace the broad query prop with this local structural contract so the component declares exactly what it needs:

```ts
interface CalendarQueryState<TData> {
  data: TData | undefined;
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
  refetch: () => Promise<unknown>;
}
```

Keep the existing initial loading and error branches unchanged. For the successful-data branch, render this stable structure:

```tsx
<div className="relative" aria-busy={query.isFetching}>
  <p
    data-calendar-refresh-status
    role="status"
    aria-live="polite"
    aria-hidden={!query.isFetching}
    className={`pointer-events-none absolute right-0 top-0 z-30 border border-current/15 bg-[Canvas] px-2 py-1 text-xs opacity-0 motion-safe:transition-opacity motion-safe:duration-150 motion-reduce:transition-none ${query.isFetching ? "opacity-100" : ""}`}
  >
    {labels.refreshing ?? labels.loading ?? "Refreshing"}
  </p>
  {children(query.data)}
</div>
```

The badge is always mounted after initial data exists so `opacity-100` to `opacity-0` can transition. It uses only opacity on a compact, isolated surface. Do not add `useEffect`, timers, `startTransition`, DOM measurement, `will-change`, or view-layout animation.

- [ ] **Step 5: Run the focused test and the full Calendar suite.**

Run:

```bash
cd frontend && NODE_ENV=development npx tsx --test src/features/calendar/integrations/wat/CalendarQueryBoundary.test.tsx
cd frontend && npm run test:calendar
```

Expected: the new test passes; existing Month/Week/Day, URL-state, API, and Admin drawer tests stay green.

- [ ] **Step 6: Run quality gates and manual browser verification.**

Run:

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
cd frontend && ./node_modules/.bin/eslint src/features/calendar/integrations/wat/CalendarQueryBoundary.tsx src/features/calendar/integrations/wat/CalendarQueryBoundary.test.tsx
cd frontend && NEXT_PUBLIC_PUBLIC_ACCOUNT_AUTH_ENABLED=false npm run build
```

In the browser, switch Month → Week → Day and use previous/next at `390px` and `1280px`. Confirm the toolbar's top position stays fixed while the refresh badge fades without changing grid position; confirm `prefers-reduced-motion: reduce` shows no opacity transition.

- [ ] **Step 7: Commit the implementation.**

```bash
git add frontend/package.json frontend/src/features/calendar/integrations/wat/CalendarQueryBoundary.tsx frontend/src/features/calendar/integrations/wat/CalendarQueryBoundary.test.tsx
git commit -m "fix(calendar): stabilize view transitions"
```

## Self-review

- Spec coverage: Task 1 preserves stale data, removes refresh-induced layout shift, adds compositor-only feedback, preserves accessibility, supports reduced motion, and runs the complete gate.
- Placeholder scan: no `TODO`, `TBD`, or unspecified test steps.
- Type consistency: `CalendarQueryState<TData>` accepts the required subset of TanStack Query's result, while `refetch` remains callable in the error branch.
