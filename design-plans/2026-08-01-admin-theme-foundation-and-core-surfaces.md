# Admin Theme Foundation and Core Surfaces Implementation Plan

> **For implementation agents:** Execute this plan task-by-task in order. Steps use checkbox (`- [ ]`) syntax for tracking. Review the rendered Admin surface after every task.

**Written against:** `83da51938331f04016590873f54c3d7b0776940a`

**Goal:** Give the Admin application one independently configurable semantic theme and migrate its shared shell, controls, tables, forms, and feedback surfaces without changing business behavior.

**Architecture:** Add an `.admin-theme` seam at the Admin route layout and expose role-based Tailwind utilities through `@theme inline`. Shared UI owners consume those roles; route modules inherit them instead of naming Tailwind palette colors. The initial token values preserve the current neutral/amber appearance, so this is a maintainability migration rather than a visual redesign.

**Tech Stack:** Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS 4, next-intl, React Hook Form, TanStack Query.

## Global Constraints

- Preserve Admin API, permission, route, query, DTO, form, and mutation behavior.
- Keep Admin theme ownership independent from `.public-theme`.
- Preserve `th`, `en`, and `de`; do not add hard-coded user-facing copy.
- Do not add dependencies.
- Do not use `any`, `as any`, `@ts-ignore`, or native `alert()`.
- Keep current component interfaces unless a task explicitly defines an additive variant.
- Use semantic roles in Admin TSX; do not use raw hex values or palette names such as `gray-*`, `zinc-*`, or `amber-*` for structural UI.
- Status colors are consumed through `admin-success`, `admin-warning`, `admin-danger`, and `admin-info` roles.
- Portals must carry `.admin-theme`; CSS variables scoped to the route wrapper do not inherit through `createPortal(..., document.body)`.
- Preserve existing user changes. At plan creation, uncommitted changes overlap `DataTable`, `DateRangePicker`, Admin list filters, and several Admin pages; inspect and rebase those diffs before editing.
- Admin forms follow `.agents/skills/building-admin-forms/SKILL.md`, including 44px controls, localized validation, loading states, permission guards, confirmation for destructive actions, and sticky save actions.

---

## Evidence Chain

### Design language

- **Audited surface:** Authenticated routes under `frontend/src/app/[locale]/admin`, excluding the Website CMS editor covered by the companion plan.
- **Design sources:** `frontend/AGENTS.md`, `.agents/skills/building-admin-forms/SKILL.md`, current shared owners under `frontend/src/components/ui` and `frontend/src/components/admin`.
- **Documented decisions:** Admin is task-focused; forms use shared controls, minimal loading, tabs for long forms, sticky action bars, permission-aware destructive actions, and localized copy.
- **Governing owners and consumers:** `AdminLayout`, `AdminSidebar`, `AdminHeader`, `AdminPageHeader`, shared UI primitives, Admin list primitives, and Admin route modules.
- **Explicit exceptions:** Public preview content inside Website CMS must remain under `.public-theme`.

### Findings

| # | Problem | Evidence | Proposed change | Scope | Confidence |
| --- | --- | --- | --- | --- | --- |
| 1 | Admin has no theme seam | `AdminLayout` begins with `bg-gray-50`; shell and primitives directly name gray/zinc/amber colors. Audit found 1,166 matching structural color usages across 108 files. | Add `.admin-theme` plus semantic `admin-*` utilities, applied at `admin/layout.tsx`. | All Admin routes | High |
| 2 | Shared owners do not centralize state presentation | `Button`, `Input`, `Select`, `Textarea`, `DataTable`, shell, list filters, and overlays each repeat palette utilities and focus styling. | Migrate shared owners before route modules; keep their interfaces stable. | Shell, controls, lists, overlays | High |
| 3 | Portal surfaces would escape a scoped theme | `Modal` and `Drawer` portal directly to `document.body`. | Put `.admin-theme` on each portal root so semantic variables resolve inside overlays. | Modal, confirm, form modal, drawer | High |

## Improve first

Create the `.admin-theme` seam and a source guard first. It has the highest leverage because every later task depends on stable semantic roles and it prevents new hard-coded palette usage during migration.

## File Map

- `frontend/src/app/globals.css`: Tailwind semantic role registration and `.admin-theme` values.
- `frontend/src/app/[locale]/admin/layout.tsx`: Admin theme boundary, including Login.
- `frontend/ADMIN_DESIGN.md`: Admin-only visual contract and token usage rules.
- `frontend/AGENTS.md`: Route Admin UI work to `ADMIN_DESIGN.md`.
- `frontend/scripts/check-admin-theme-tokens.mjs`: Migration guard against structural palette literals.
- `frontend/src/components/ui/*`: Shared control, table, modal, drawer, and loading owners.
- `frontend/src/components/admin/*`: Shell, list, form, status, toast, rich-text, and media owners.
- `frontend/src/app/[locale]/admin/**`: Page-specific consumers after shared owners are migrated.

---

### Task 1: Establish the Admin theme seam and guardrail

**Files:**

- Create: `frontend/ADMIN_DESIGN.md`
- Create: `frontend/scripts/check-admin-theme-tokens.mjs`
- Modify: `frontend/src/app/globals.css`
- Modify: `frontend/src/app/[locale]/admin/layout.tsx`
- Modify: `frontend/AGENTS.md`
- Modify: `frontend/package.json`

**Interfaces:**

- Consumes Tailwind's existing gray, amber, red, green, blue, and cyan variables.
- Produces `.admin-theme` and role utilities named `admin-canvas`, `admin-surface`, `admin-surface-muted`, `admin-foreground`, `admin-body`, `admin-muted`, `admin-border`, `admin-control-border`, `admin-action`, `admin-action-hover`, `admin-on-action`, `admin-selected`, `admin-selected-foreground`, `admin-focus`, and semantic status roles.

- [ ] **Step 1: Write the Admin design contract**

Create `frontend/ADMIN_DESIGN.md` with these binding rules:

```markdown
# Admin Design System

## Scope
This contract governs routes under `src/app/[locale]/admin` and shared Admin UI.
Public preview content remains governed by the repository-root `DESIGN.md`.

## Theme seam
- `.admin-theme` in `src/app/globals.css` is the only Admin palette owner.
- TSX consumes role utilities (`bg-admin-surface`, `text-admin-foreground`,
  `border-admin-border`, `bg-admin-action`) rather than palette utilities.
- Structural UI does not use raw hex, `gray-*`, `zinc-*`, or `amber-*` classes.
- Status UI uses `admin-success`, `admin-warning`, `admin-danger`, or `admin-info`.

## Shape and hierarchy
- Default controls and panels use `rounded-lg`; compact icon controls may use `rounded-md`.
- Primary actions use `admin-action`; destructive actions use `admin-danger`.
- Focus is always visible through `admin-focus`; minimum target height is 44px.
- Use spacing, borders, and muted surfaces before shadows.

## Forms and lists
- Follow `.agents/skills/building-admin-forms/SKILL.md`.
- Forms retain localized labels/errors and sticky save actions.
- Tables retain sorting, selection, pagination, loading, empty, and error states.
```

- [ ] **Step 2: Register semantic roles with Tailwind**

Add a separate inline theme block in `globals.css`:

```css
@theme inline {
    --color-admin-canvas: var(--admin-canvas);
    --color-admin-surface: var(--admin-surface);
    --color-admin-surface-muted: var(--admin-surface-muted);
    --color-admin-foreground: var(--admin-foreground);
    --color-admin-body: var(--admin-body);
    --color-admin-muted: var(--admin-muted);
    --color-admin-border: var(--admin-border);
    --color-admin-control-border: var(--admin-control-border);
    --color-admin-action: var(--admin-action);
    --color-admin-action-hover: var(--admin-action-hover);
    --color-admin-on-action: var(--admin-on-action);
    --color-admin-selected: var(--admin-selected);
    --color-admin-selected-foreground: var(--admin-selected-foreground);
    --color-admin-focus: var(--admin-focus);
    --color-admin-success: var(--admin-success);
    --color-admin-success-surface: var(--admin-success-surface);
    --color-admin-warning: var(--admin-warning);
    --color-admin-warning-surface: var(--admin-warning-surface);
    --color-admin-danger: var(--admin-danger);
    --color-admin-danger-surface: var(--admin-danger-surface);
    --color-admin-info: var(--admin-info);
    --color-admin-info-surface: var(--admin-info-surface);
}
```

Define `.admin-theme` using current Tailwind variables so the migration preserves today's appearance:

```css
.admin-theme {
    --admin-canvas: var(--color-gray-50);
    --admin-surface: var(--color-white);
    --admin-surface-muted: var(--color-gray-100);
    --admin-foreground: var(--color-gray-900);
    --admin-body: var(--color-gray-700);
    --admin-muted: var(--color-gray-500);
    --admin-border: var(--color-gray-200);
    --admin-control-border: var(--color-gray-300);
    --admin-action: var(--color-amber-600);
    --admin-action-hover: var(--color-amber-700);
    --admin-on-action: var(--color-white);
    --admin-selected: var(--color-amber-50);
    --admin-selected-foreground: var(--color-amber-700);
    --admin-focus: var(--color-amber-500);
    --admin-success: var(--color-green-700);
    --admin-success-surface: var(--color-green-100);
    --admin-warning: var(--color-amber-700);
    --admin-warning-surface: var(--color-amber-100);
    --admin-danger: var(--color-red-700);
    --admin-danger-surface: var(--color-red-100);
    --admin-info: var(--color-blue-700);
    --admin-info-surface: var(--color-blue-100);

    background: var(--admin-canvas);
    color: var(--admin-foreground);
}
```

- [ ] **Step 3: Apply the theme to authenticated and login routes**

Wrap both return branches in `admin/layout.tsx` with:

```tsx
<div className="admin-theme min-h-screen bg-admin-canvas text-admin-foreground">
  {/* existing providers and route content */}
</div>
```

Do not attach `.admin-theme` to `<body>` because public and Admin routes share the locale layout.

- [ ] **Step 4: Add a migration guard**

Create `scripts/check-admin-theme-tokens.mjs`:

```js
import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";

const roots = ["src/app/[locale]/admin", "src/components/admin", "src/components/ui"];
const deferred = new Set([
  "src/app/[locale]/admin/website",
  "src/components/admin/website",
]);
const forbiddenPalette = /(?:bg|text|border|divide|outline|ring)-(?:(?:white|black)(?:\/[0-9]{1,3})?|(?:gray|zinc|slate|amber)-(?:[0-9]{2,3})(?:\/[0-9]{1,3})?)|#[0-9a-fA-F]{3,8}/g;
const forbiddenPublicTheme = /(?:bg|text|border|divide|outline|ring)-site-[a-z-]+(?:\/[0-9]{1,3})?/g;
const publicPreviewOwners = new Set([
  "src/components/admin/website/DevicePreviewFrame.tsx",
  "src/components/admin/website/WebsitePreviewPanel.tsx",
]);
const findings = [];

async function visit(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (deferred.has(child)) continue;
    if (entry.isDirectory()) await visit(child);
    if (!entry.isFile() || ![".ts", ".tsx"].includes(extname(entry.name))) continue;
    const source = await readFile(child, "utf8");
    source.split("\n").forEach((line, index) => {
      const matches = line.match(forbiddenPalette) ?? [];
      const publicMatches = publicPreviewOwners.has(child)
        ? []
        : (line.match(forbiddenPublicTheme) ?? []);
      const violations = [...matches, ...publicMatches];
      if (violations.length > 0) {
        findings.push(`${child}:${index + 1}: ${violations.join(", ")}`);
      }
    });
  }
}

for (const root of roots) await visit(root);
if (findings.length > 0) {
  console.error(findings.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Admin theme token check passed");
}
```

Add `"lint:admin-theme": "node scripts/check-admin-theme-tokens.mjs"` to `package.json`. Keep the script failing until Task 6 completes; use its decreasing finding count as the migration measure. The two Website CMS directories remain explicitly deferred until the companion plan removes those entries.

- [ ] **Step 5: Verify the seam compiles**

Run:

```bash
cd frontend
./node_modules/.bin/tsc --noEmit
npm run build
```

Expected: both commands exit `0`; compiled Admin utilities refer directly to `var(--admin-*)`.

- [ ] **Step 6: Commit the foundation**

```bash
git add frontend/ADMIN_DESIGN.md frontend/AGENTS.md frontend/package.json frontend/scripts/check-admin-theme-tokens.mjs frontend/src/app/globals.css 'frontend/src/app/[locale]/admin/layout.tsx'
git commit -m "refactor(admin): establish semantic theme seam"
```

---

### Task 2: Migrate shared controls

**Files:**

- Modify: `frontend/src/components/ui/Button.tsx`
- Modify: `frontend/src/components/ui/Input.tsx`
- Modify: `frontend/src/components/ui/Select.tsx`
- Modify: `frontend/src/components/ui/Textarea.tsx`
- Modify: `frontend/src/components/ui/Checkbox.tsx`
- Modify: `frontend/src/components/ui/Switch.tsx`
- Modify: `frontend/src/components/ui/DatePicker.tsx`
- Modify: `frontend/src/components/ui/DateRangePicker.tsx`
- Modify: `frontend/src/components/ui/TimePicker.tsx`

**Interfaces:**

- Preserve every exported prop and variant type.
- Produce one control language for default, hover, focus, disabled, invalid, and loading states.

- [ ] **Step 1: Replace Button variant ownership**

Use this mapping without changing `ButtonVariant`:

```tsx
const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-admin-action text-admin-on-action hover:bg-admin-action-hover",
  secondary: "bg-admin-surface-muted text-admin-body hover:bg-admin-border",
  danger: "bg-admin-danger text-admin-on-action hover:brightness-90",
  ghost: "text-admin-body hover:bg-admin-surface-muted",
  outline: "border border-admin-control-border bg-admin-surface text-admin-body hover:bg-admin-surface-muted",
};
```

Base classes must include `min-h-11`, `focus-visible:outline-2`, `focus-visible:outline-offset-2`, and `focus-visible:outline-admin-focus`. Remove decorative resting shadows.

- [ ] **Step 2: Standardize field roles**

Apply the same field contract to Input, Select, Textarea, date, and time controls:

```tsx
const fieldClass = [
  "min-h-11 w-full rounded-lg border border-admin-control-border bg-admin-surface",
  "px-3 py-2 text-sm text-admin-foreground placeholder:text-admin-muted",
  "focus-visible:border-admin-focus focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-focus",
  "disabled:cursor-not-allowed disabled:bg-admin-surface-muted disabled:text-admin-muted",
].join(" ");
```

Errors use `border-admin-danger`, `text-admin-danger`, and an error message; required state must not rely on color alone.

- [ ] **Step 3: Standardize boolean controls**

Checkbox and Switch use `admin-action` for checked state, `admin-control-border` for unchecked state, and `admin-focus` for keyboard focus. Keep current native input behavior and labels.

- [ ] **Step 4: Verify shared controls**

Run:

```bash
cd frontend
npx eslint src/components/ui/Button.tsx src/components/ui/Input.tsx src/components/ui/Select.tsx src/components/ui/Textarea.tsx src/components/ui/Checkbox.tsx src/components/ui/Switch.tsx src/components/ui/DatePicker.tsx src/components/ui/DateRangePicker.tsx src/components/ui/TimePicker.tsx
./node_modules/.bin/tsc --noEmit
```

Expected: no errors in touched files; type-check exits `0`.

- [ ] **Step 5: Commit controls**

```bash
git add frontend/src/components/ui
git commit -m "refactor(admin): migrate shared controls to theme roles"
```

---

### Task 3: Migrate the Admin shell and navigation

**Files:**

- Modify: `frontend/src/components/admin/AdminLayout.tsx`
- Modify: `frontend/src/components/admin/AdminSidebar.tsx`
- Modify: `frontend/src/components/admin/AdminHeader.tsx`
- Modify: `frontend/src/components/admin/AdminPageHeader.tsx`
- Modify: `frontend/src/app/[locale]/admin/login/page.tsx`
- Modify: `frontend/src/app/[locale]/admin/error.tsx`

**Interfaces:**

- Preserve collapse, mobile drawer, locale switch, auth, logout, permission filtering, and active-route behavior.
- Produce semantic shell roles without changing route structure.

- [ ] **Step 1: Convert shell surfaces**

- `AdminLayout`: `bg-admin-canvas`.
- Sidebar/Header: `bg-admin-surface`, `border-admin-border`, `text-admin-foreground`.
- Mobile overlay remains functional black transparency because it is an overlay, not a theme surface.
- Remove the Sidebar resting shadow; the border owns separation.

- [ ] **Step 2: Convert navigation states**

Use:

```tsx
const activeItem = "bg-admin-selected text-admin-selected-foreground font-medium";
const idleItem = "text-admin-body hover:bg-admin-surface-muted hover:text-admin-foreground";
const focusItem = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-focus";
```

Collapsed icon buttons retain `title`; mobile controls retain at least 44px targets and accessible names.

- [ ] **Step 3: Convert header and page hierarchy**

Language selection uses selected surface/action roles; user metadata uses foreground/body/muted roles. `AdminPageHeader` keeps breadcrumbs and actions, but replaces direct gray classes and the literal `Dashboard` label with an existing localized Admin message key or a new key in all three Admin message files.

- [ ] **Step 4: Verify shell routes**

Manual matrix:

- `/th/admin`, `/en/admin`, `/de/admin`
- `/th/admin/login`
- Desktop expanded/collapsed Sidebar
- Mobile open/close Sidebar
- Active navigation, language switch, logout, error page

Run scoped ESLint and `./node_modules/.bin/tsc --noEmit`.

- [ ] **Step 5: Commit shell migration**

```bash
git add frontend/src/components/admin/AdminLayout.tsx frontend/src/components/admin/AdminSidebar.tsx frontend/src/components/admin/AdminHeader.tsx frontend/src/components/admin/AdminPageHeader.tsx 'frontend/src/app/[locale]/admin/login/page.tsx' 'frontend/src/app/[locale]/admin/error.tsx' frontend/src/messages/admin
git commit -m "refactor(admin): theme application shell"
```

---

### Task 4: Migrate list and table owners

**Files:**

- Modify: `frontend/src/components/ui/DataTable.tsx`
- Modify: `frontend/src/components/admin/BulkActionToolbar.tsx`
- Modify: `frontend/src/components/admin/list/AdminActiveFilterChips.tsx`
- Modify: `frontend/src/components/admin/list/AdminDateRangeFilter.tsx`
- Modify: `frontend/src/components/admin/list/AdminListExportButton.tsx`
- Modify: `frontend/src/components/admin/list/AdminListStates.tsx`
- Modify: `frontend/src/components/admin/list/AdminListToolbar.tsx`
- Modify: `frontend/src/components/admin/list/AdminMultiSelectFilter.tsx`
- Modify: `frontend/src/components/admin/list/AdminPageSizeSelect.tsx`
- Modify: `frontend/src/components/admin/list/AdminSearchInput.tsx`

**Interfaces:**

- Preserve `DataTable<T>`, `Column<T>`, pagination, sorting, selection, loading, and callbacks.
- Preserve each list-filter prop interface and translation ownership.

- [ ] **Step 1: Rebase overlapping user changes**

Before editing, inspect current diffs in `DataTable`, `DateRangePicker`, `AdminDateRangeFilter`, `AdminListToolbar`, `AdminMultiSelectFilter`, and `AdminSearchInput`. Keep their functional changes and alter only presentation classes.

- [ ] **Step 2: Convert DataTable structure and states**

Use `admin-surface` for the table, `admin-surface-muted` for header/footer, `admin-border` for divisions, `admin-body` for cells, `admin-muted` for metadata, and selected roles for selected rows/current page. Keep loading and empty rows inside valid table markup.

- [ ] **Step 3: Convert list filters and bulk actions**

Filters delegate to shared field roles. Active chips use selected roles; destructive bulk actions use danger roles. Expanded filter panels use borders and muted surfaces, not an additional shadow.

- [ ] **Step 4: Verify a representative list set**

Test Events, Registrations, Donations, Members, Contacts, and Audit Logs at desktop and 375px. Exercise search, filters, sorting, page-size, pagination, row selection, bulk action confirmation, loading, empty, and error states.

- [ ] **Step 5: Commit list owners**

```bash
git add frontend/src/components/ui/DataTable.tsx frontend/src/components/admin/BulkActionToolbar.tsx frontend/src/components/admin/list
git commit -m "refactor(admin): theme list and table owners"
```

---

### Task 5: Migrate form, feedback, and overlay owners

**Files:**

- Modify: `frontend/src/components/ui/Modal.tsx`
- Modify: `frontend/src/components/ui/Drawer.tsx`
- Modify: `frontend/src/components/ui/Loading.tsx`
- Modify: `frontend/src/components/admin/FormTabs.tsx`
- Modify: `frontend/src/components/admin/MultiLangInput.tsx`
- Modify: `frontend/src/components/admin/ImageUpload.tsx`
- Modify: `frontend/src/components/admin/StatusBadge.tsx`
- Modify: `frontend/src/components/admin/Toast.tsx`
- Modify: `frontend/src/components/admin/public-content/PublicContentSaveBar.tsx`
- Modify: `frontend/src/components/admin/rich-text/RichTextEditor.tsx`
- Modify: `frontend/src/components/admin/rich-text/RichTextToolbar.tsx`
- Modify: `frontend/src/components/admin/media/MediaPickerDialog.tsx`

**Interfaces:**

- Preserve modal/drawer behavior and form interfaces.
- Ensure every portal receives Admin variables through `.admin-theme`.
- Preserve status meaning and accessible text.

- [ ] **Step 1: Keep theme variables inside portals**

Wrap the root returned by both portal owners:

```tsx
return createPortal(
  <div className="admin-theme">
    {/* existing backdrop and dialog/drawer */}
  </div>,
  document.body,
);
```

Do not add `.admin-theme` to public portals. Preserve Escape, overlay-click, loading lock, and scroll-lock behavior.

- [ ] **Step 2: Convert modal, drawer, loading, and toast roles**

Use surface/foreground/body/muted/border roles for structure and semantic status roles for feedback. Backdrop may remain `bg-black/45`. Confirm buttons must show loading and prevent duplicate destructive actions.

- [ ] **Step 3: Convert form owners**

FormTabs delegates to Button variants; MultiLangInput uses shared field states; ImageUpload/MediaPicker use control-border, surface, focus, and danger roles. PublicContentSaveBar uses a themed translucent surface and shared Button where its interface permits.

- [ ] **Step 4: Convert status roles**

Map StatusBadge variants to semantic roles:

```tsx
const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-admin-success-surface text-admin-success",
  warning: "bg-admin-warning-surface text-admin-warning",
  danger: "bg-admin-danger-surface text-admin-danger",
  info: "bg-admin-info-surface text-admin-info",
  default: "bg-admin-surface-muted text-admin-body",
};
```

Keep text labels; color must not be the only status signal.

- [ ] **Step 5: Verify form and overlay states**

Test create/edit forms for Events, Monks, and Users; open modal, drawer, media picker, validation errors, toast types, dirty state, save loading, and delete confirmation.

- [ ] **Step 6: Commit form and feedback owners**

```bash
git add frontend/src/components/ui/Modal.tsx frontend/src/components/ui/Drawer.tsx frontend/src/components/ui/Loading.tsx frontend/src/components/admin
git commit -m "refactor(admin): theme form and feedback owners"
```

---

### Task 6: Migrate core Admin route consumers and close the guard

**Files:**

- Modify: `frontend/src/app/[locale]/admin/**` excluding `website/**`
- Modify: `frontend/src/components/admin/public-content/**`
- Modify: `frontend/src/components/admin/events/**`
- Modify: `frontend/src/components/forms/JsonTextareaField.tsx` only if rendered by an in-scope Admin route

**Interfaces:**

- Consume Tasks 1–5 semantic owners.
- Preserve every route's data, permissions, mutations, translations, and navigation.
- Produce zero structural palette violations in the core Admin scope.

- [ ] **Step 1: Migrate by route family**

Use this order and run the affected route after each family:

1. Dashboard and Settings.
2. Events, Schedules, Registrations, Gallery, and Monks.
3. Members, Donations, Contacts.
4. Users, Roles, Audit Logs.
5. About, Contact, Privacy, Impressum, and Media.

Replace page-level structural colors with semantic roles. Reuse shared Button/fields/table/status owners instead of duplicating their class strings.

- [ ] **Step 2: Preserve meaningful exceptions**

Image pixels, crop masks, chart/data-series colors, and black translucent overlays are not structural theme colors. Document any retained exception as an allow-list entry in the guard script with the exact file and reason; do not weaken the regex globally.

- [ ] **Step 3: Make the guard pass**

Run:

```bash
cd frontend
npm run lint:admin-theme
```

Expected: `Admin theme token check passed` and exit `0`.

- [ ] **Step 4: Run proportional verification**

```bash
cd frontend
npx eslint 'src/app/[locale]/admin' src/components/admin src/components/ui
./node_modules/.bin/tsc --noEmit
npm run build
```

Expected: scoped lint has no new errors; TypeScript and build exit `0`. If full-repository lint still fails, record only pre-existing failures outside touched files.

Manual matrix:

- Locales: `th`, `en`, `de`.
- Widths: `375`, `768`, `1440`.
- Shell: login, expanded/collapsed Sidebar, mobile navigation.
- Lists: loading, empty, data, error, sort, filter, pagination, selection.
- Forms: create, edit loading, validation, dirty, save, delete confirmation.
- Feedback: success, warning, danger, info, modal, drawer, toast.

- [ ] **Step 5: Commit route migration**

```bash
git add 'frontend/src/app/[locale]/admin' frontend/src/components/admin/public-content frontend/src/components/admin/events frontend/src/components/forms/JsonTextareaField.tsx
git commit -m "refactor(admin): complete core theme migration"
```

## Completion Gate

- `.admin-theme` is the only Admin palette seam.
- Public pages and Admin pages can change palettes independently.
- Shared primitives express all structural, action, focus, and status states.
- `npm run lint:admin-theme`, scoped ESLint, type-check, and production build pass.
- Website CMS is intentionally deferred to `design-plans/2026-08-01-admin-website-cms-theme-migration.md`.
