# Antigravity Handoff: Admin Theme Migration

## Copy/paste instruction

Copy the following instruction into the Antigravity coding agent from the repository root:

```text
Implement the WAT-PROFILE Admin theme migration described in the two design plans below.

Execute the plans in this exact order:
1. design-plans/2026-08-01-admin-theme-foundation-and-core-surfaces.md
2. design-plans/2026-08-01-admin-website-cms-theme-migration.md

Before editing, read completely:
- AGENTS.md
- frontend/AGENTS.md
- frontend/ADMIN_DESIGN.md if it already exists
- DESIGN.md for the Public preview boundary
- docs/superpowers/specs/2026-08-02-admin-dark-theme-design.md
- .agents/skills/building-admin-forms/SKILL.md
- both implementation plans above

Start by running git status --short and inspecting every existing diff that overlaps
the plan. Existing changes belong to the user. Preserve and integrate them; do not
discard, reset, overwrite, or broadly reformat them.

Work one task at a time. After each task:
- run the exact scoped checks in that task;
- inspect git diff --check;
- review the affected Admin route at desktop and mobile widths;
- summarize files changed, verification, and remaining blockers;
- commit only the task's files when repository policy and user authorization allow it.

Do not begin the Website CMS plan until the Admin foundation completion gate passes.
Do not redesign business behavior, API contracts, permissions, forms, queries, routes,
or translations. Do not add dependencies. Do not use TypeScript any, as any,
@ts-ignore, native alert(), raw theme hex values, or structural Tailwind palette
classes in migrated Admin TSX.

Critical architecture rules:
- .admin-theme is the only Admin palette seam.
- Admin supports exactly System, Light, and Dark; default to System and persist the
  preference with next-themes under wat-admin-theme.
- AdminThemeProvider resolves the preference through data-admin-theme. Light tokens
  live on .admin-theme and Dark overrides the same semantic roles in globals.css.
- Do not add a global .dark owner or distribute dark: utilities through Admin TSX.
- Admin components consume role-based admin-* utilities.
- .public-theme and site-* remain the Public website owners.
- Modal and Drawer portals must carry .admin-theme because they render under body.
- Website CMS editor chrome uses Admin theme roles.
- Website CMS preview content is wrapped by .public-theme and must visually match
  the real Public route in every Admin mode; never apply Admin colors to preview
  content and do not add Public Dark mode in this migration.
- Keep Thai, English, and German complete.
- Preserve loading, empty, error, selected, disabled, focus, dirty, saving, publishing,
  confirmation, and permission states.

Do not hide existing lint/type failures by weakening rules. Report pre-existing failures
separately from failures introduced by the migration.

At completion, return a report containing:
1. completed task checklist;
2. commits created, if any;
3. files intentionally left unchanged and why;
4. commands run and their results;
5. manual routes/viewports/states verified;
6. remaining pre-existing failures or blockers;
7. confirmation that Public and Admin themes can be changed independently.
8. confirmation that System follows OS Light/Dark and the preference survives reload.
```

## Mission

Create a maintainable Admin design-system seam with persisted `System`, `Light`, and `Dark` modes, while keeping Admin and Public visually and technically independent.

This is a maintainability migration first. Light mode preserves the current neutral and amber appearance; Dark mode uses the approved semantic overrides. A future Admin redesign should require changing `.admin-theme` values and shared variants rather than editing route modules.

## Required reading order

1. `AGENTS.md` — repository rules and verification commands.
2. `frontend/AGENTS.md` — frontend architecture and localization rules.
3. `.agents/skills/building-admin-forms/SKILL.md` — Admin form interaction contract.
4. `DESIGN.md` — Public theme contract, needed for CMS preview separation.
5. `docs/superpowers/specs/2026-08-02-admin-dark-theme-design.md` — approved theme behavior.
6. `design-plans/2026-08-01-admin-theme-foundation-and-core-surfaces.md`.
7. `design-plans/2026-08-01-admin-website-cms-theme-migration.md`.

If `frontend/ADMIN_DESIGN.md` exists when execution starts, read it after `frontend/AGENTS.md`; Task 1 creates it otherwise.

## Execution sequence

### Phase 0: Protect the workspace

1. Run `git status --short`.
2. Inspect diffs in every file touched by the next task.
3. Treat all existing changes as user-owned.
4. Do not run destructive Git commands.
5. Do not use repository-wide automated replacements until the semantic owners are migrated and overlapping diffs are understood.

Known overlap at handoff time includes Admin list pages, list filters, media picker, `DataTable`, `DateRangePicker`, `JsonTextareaField`, and Admin list state. The live `git status` is authoritative because this list may change.

### Phase 1: Admin foundation and core surfaces

Execute Tasks 1–7 in the foundation plan:

1. Theme seam and migration guard.
2. Localized System/Light/Dark switcher.
3. Shared controls.
4. Admin shell and navigation.
5. List and table owners.
6. Form, feedback, and overlay owners.
7. Core Admin route consumers and closing the core guard.

Do not start Phase 2 until all foundation completion-gate items pass.

### Phase 2: Website CMS

Execute Tasks 1–4 in the CMS plan:

1. Explicit Admin/Public preview boundary.
2. CMS workspace chrome.
3. CMS forms, page manager, and specialized editors.
4. Remove guard deferrals and run final production verification.

## Non-negotiable boundaries

| Surface | Theme owner | Allowed structural utilities |
| --- | --- | --- |
| Public website | `.public-theme` | `site-*` |
| Admin shell and controls | `.admin-theme` | `admin-*` |
| Website CMS editor chrome | `.admin-theme` | `admin-*` |
| Website CMS embedded preview | `.public-theme` | `site-*` |

- `globals.css` owns values; TSX owns semantic roles only.
- `AdminThemeProvider` owns Admin preference resolution through `data-admin-theme`; `wat-admin-theme` is the only persistence key.
- Admin TSX must not use structural `dark:` variants; both palettes come from semantic tokens.
- Shared primitives own control states; routes compose them.
- Semantic status roles retain visible labels or icons; color is not the only signal.
- Portaled Admin UI must re-establish `.admin-theme` at the portal root.
- Public preview placeholders are Public UI and use `site-*`, even though their source file lives under `components/admin`.

## Verification checkpoints

Run the scoped commands defined by each task. At the end of each phase, run:

```bash
cd frontend
npm run lint:admin-theme
./node_modules/.bin/tsc --noEmit
npm run build
```

Run scoped ESLint against touched Admin paths. Full-repository lint may contain pre-existing failures; do not claim those were caused or fixed by this migration without evidence.

Minimum manual matrix:

- Locales: Thai, English, German.
- Preferences: explicit Light, explicit Dark, System with OS Light, System with OS Dark, reload, and a second Admin tab.
- Widths: 375px, 768px, 1440px.
- Shell: Login, expanded/collapsed Sidebar, mobile Sidebar, language switch.
- Lists: loading, empty, error, data, sorting, filtering, pagination, selection.
- Forms: create, edit loading, validation, dirty, saving, destructive confirmation.
- Feedback: success, warning, danger, info, modal, drawer, toast.
- CMS: page manager, all editor tabs, draft/published modes, three preview devices in Admin Light and Dark.
- Preview comparison: Home, About, Contact, and a generic content page against their real Public routes; pixels remain unchanged when switching only the Admin mode.

## Stop conditions

Stop the current task and report before continuing when:

- an overlapping user diff cannot be preserved safely;
- implementation requires changing an API, permission, schema, route, or CMS data contract;
- the semantic token design cannot express a required state;
- a new dependency appears necessary;
- the same fix fails three times;
- Public preview and the real Public route cannot be made equivalent without product decisions.

## Final acceptance

The handoff is complete only when:

- Admin palette values can change from `.admin-theme` without route-by-route edits;
- localized System, Light, and Dark controls work, System follows OS preference, and `wat-admin-theme` survives reload;
- no migrated Admin TSX relies on structural `dark:` utilities;
- Public palette values can change from `.public-theme` without changing Admin chrome;
- CMS preview still uses the current Public theme in every Admin mode;
- the Admin theme guard covers core Admin and Website CMS;
- scoped lint, type-check, and production build results are reported accurately;
- no unrelated user work was removed or overwritten.
