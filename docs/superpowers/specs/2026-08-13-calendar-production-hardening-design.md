# Calendar Production Hardening Design

**Status:** Approved design; ready for implementation planning.

## Goal

Make the existing Custom Calendar safe to release by proving its critical public and admin workflows in the browser, adding regression coverage for defects found, and preserving its current generic library boundary.

## Scope

- Cover both Public Discovery and Admin Planning consumers because they share `CalendarRoot`, calendar state, event adapters, and generic visual primitives.
- Treat this as behavior hardening, not a new Calendar feature or visual redesign.
- Use the development mock feed for public checks. Use an authenticated local admin session only where available; record that scenario as manually blocked when no local credentials/session exist.

## Acceptance matrix

| Area | Required behavior |
| --- | --- |
| URL state | `view=month|week|day` and `date=YYYY-MM-DD` remain canonical; unsupported views rewrite to Month without losing the date. |
| Navigation | Previous, Next, Today, date selection, and visible feed range stay synchronized for Month, Week, and Day. |
| Keyboard | Tabs implement roving focus; Arrow keys, Home, and End select the target view and move focus. |
| Public Discovery | Month remains a seven-column overview with a selected-day full agenda; Week/Day remain readable agendas and never render a TimeGrid. Event activation follows the detail URL. |
| Admin Planning | Month, Week, and Day preserve the Planning preset; Week/Day show shared TimeGrid geometry; event activation opens the existing drawer. |
| Responsive | At 390px, no page-level horizontal overflow. Any operational TimeGrid horizontal scroll is scoped to `[data-calendar-time-grid]`. |
| States | Loading, refreshing, error/retry, and empty states remain actionable and localized. |
| Locale | Thai, English, and German labels remain complete and do not clip key controls at desktop or mobile widths. |

## Verification approach

1. Run the existing calendar test suite, TypeScript check, ESLint, and production build before browser work to establish a baseline.
2. Browser-test the Public mock feed at desktop and mobile widths; take screenshots or record precise observed failures.
3. Browser-test Admin in an existing authenticated local session; do not bypass authentication to obtain a passing result.
4. For each confirmed defect, add the narrowest feasible unit/state/component regression test, implement the correction in the owning Calendar layer, then repeat the relevant browser scenario.
5. Record any scenario blocked by unavailable auth/session separately from test failures.

## Boundaries

- Do not add FullCalendar, new endpoints, drag/drop, resizing, recurrence, resource UI, Timeline, Grid Day, or editing.
- Do not alter the generic `CalendarEvent<TMeta>` contract unless a verified production defect makes it necessary.
- Preserve WAT-only routing, query, theme, and drawer behavior at adapter/route boundaries.
- Keep `th`, `en`, and `de`, 44px targets, visible focus, and the `Europe/Berlin` date semantics.
- Do not modify user-owned `frontend/src/components/ui/DataTable.tsx` or `frontend/src/services/api.ts`.
