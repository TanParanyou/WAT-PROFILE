# Admin Website CMS Theme Migration Implementation Plan

> **For implementation agents:** Complete `design-plans/2026-08-01-admin-theme-foundation-and-core-surfaces.md` first. Execute one task at a time and verify both editor chrome and embedded Public preview at each checkpoint.

**Written against:** `83da51938331f04016590873f54c3d7b0776940a`

**Goal:** Migrate Website CMS editor chrome to the Admin semantic theme while keeping its embedded Public preview governed exclusively by the Public theme.

**Architecture:** Website CMS consumes the shared Admin shell, controls, feedback, and status roles established by the foundation plan. `DevicePreviewFrame` becomes the explicit seam between Admin chrome and Public preview: the frame uses `admin-*`; rendered preview content is wrapped in `.public-theme` and uses `site-*`. Editor state, DTOs, preview draft mapping, and API behavior remain unchanged.

**Tech Stack:** Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS 4, next-intl, React Hook Form, Zod, Zustand, TanStack Query.

## Global Constraints

- Complete the Admin foundation plan first.
- Preserve Website CMS API, schemas, stores, preview draft logic, permissions, save, publish, archive, restore, duplicate, and reorder behavior.
- Admin editor chrome uses only semantic `admin-*` theme utilities.
- Public preview content uses `.public-theme` plus `site-*` utilities; never map Public preview to Admin colors.
- Preserve `th`, `en`, and `de` behavior and messages.
- Do not add dependencies.
- Do not introduce or expand `any`, `as any`, `@ts-ignore`, hard-coded user-facing copy, or direct HTTP calls.
- Existing type/lint debt in Website CMS is not silently bundled into a visual migration. Record pre-existing failures separately unless a touched line requires correction.
- Preserve current user changes and rebase before editing overlapping files.

---

## Evidence Chain

### Design language

- **Audited surface:** `/[locale]/admin/website/**` and `frontend/src/components/admin/website/**`.
- **Design sources:** `frontend/ADMIN_DESIGN.md` produced by the foundation plan, repository `DESIGN.md` for Public preview, `frontend/AGENTS.md`, and `.agents/skills/website-cms-frontend/SKILL.md` at execution time.
- **Documented decisions:** Admin chrome is task-focused; Public preview must accurately reflect the Public site; CMS data and editor state retain their existing owners.
- **Governing owners and consumers:** `WebsitePageEditorShell`, `WebsiteEditorToolbar`, `WebsiteEditorTabs`, Website section editors, `WebsitePreviewPanel`, and `DevicePreviewFrame`.
- **Explicit exceptions:** Public preview pixels inside `DevicePreviewFrame` intentionally do not inherit Admin theme values.

### Findings

| # | Problem | Evidence | Proposed change | Scope | Confidence |
| --- | --- | --- | --- | --- | --- |
| 1 | CMS editor chrome duplicates palette decisions | Editor shell, toolbar, tabs, panels, and section editors directly name zinc/amber/red utilities despite consuming shared Admin controls. | Replace chrome styling with Admin semantic roles and shared primitives. | CMS editor | High |
| 2 | Preview theme ownership is implicit | `WebsitePreviewPanel` directly renders Public layouts inside `DevicePreviewFrame`; after Admin variables are scoped, preview requires its own `.public-theme` boundary. | Put `.public-theme` on the preview content root, not on the frame chrome. | Device preview | High |
| 3 | Preview placeholders use Admin-like zinc colors | `PreviewContactForm` and `PreviewField` are part of the rendered Public preview but use zinc/white classes. | Convert preview placeholders to `site-*` roles. | Contact preview | High |

## Improve first

Establish the explicit Admin/Public preview boundary in `DevicePreviewFrame` and `WebsitePreviewPanel`. Without it, a successful Admin theme migration can make preview colors invalid or misleading.

## File Map

- `frontend/src/components/admin/website/DevicePreviewFrame.tsx`: Admin frame surface and device sizing.
- `frontend/src/components/admin/website/WebsitePreviewPanel.tsx`: Public preview theme boundary and preview composition.
- `frontend/src/components/admin/website/WebsitePageEditorShell.tsx`: Editor workspace composition.
- `frontend/src/components/admin/website/WebsiteEditor*.tsx`: Toolbar, tabs, locale, device, state, settings, SEO, and publish chrome.
- `frontend/src/components/admin/website/sections/**`: Section editor consumers.
- `frontend/src/components/admin/website/about/**`, `privacy/**`, `impressum/**`: Specialized editors.
- `frontend/src/app/[locale]/admin/website/**`: CMS route wrappers and page managers.
- `frontend/scripts/check-admin-theme-tokens.mjs`: Remove Website CMS deferrals when migration completes.

---

### Task 1: Make the Admin/Public preview boundary explicit

**Files:**

- Modify: `frontend/src/components/admin/website/DevicePreviewFrame.tsx`
- Modify: `frontend/src/components/admin/website/WebsitePreviewPanel.tsx`

**Interfaces:**

- Preserve `DevicePreviewFrame({ children, device })` and `WebsitePreviewPanel({ page, locale, device, mode })`.
- Produce Admin-themed frame chrome containing a separately scoped Public-themed preview.

- [ ] **Step 1: Theme the device frame as Admin chrome**

Use `border-admin-border bg-admin-surface-muted` on the outer frame and `border-admin-control-border bg-admin-surface` on the viewport shell. Preserve device max widths, scroll behavior, and transition.

- [ ] **Step 2: Add the Public preview seam**

Inside the viewport shell, wrap children with:

```tsx
<div className="public-theme min-h-full bg-site-canvas text-site-foreground">
  {children}
</div>
```

This wrapper belongs inside `DevicePreviewFrame`; do not put `.public-theme` on the Admin frame or editor root.

- [ ] **Step 3: Convert preview-only placeholders**

In `WebsitePreviewPanel`, make `PreviewContactForm` use `site-*` roles:

```tsx
const previewFieldClass =
  "mt-2 border border-site-border bg-site-canvas px-3 py-2.5 text-sm text-site-muted";
```

The preview submit control uses `bg-site-action text-site-on-action`. Do not use Admin Button inside the Public preview.

- [ ] **Step 4: Verify the boundary**

Inspect Home, About, Contact, and one generic page in draft and published mode at mobile, tablet, and desktop preview sizes. Confirm editor chrome changes with `.admin-theme`; preview colors still match the real Public route.

Run:

```bash
cd frontend
npx eslint src/components/admin/website/DevicePreviewFrame.tsx src/components/admin/website/WebsitePreviewPanel.tsx
./node_modules/.bin/tsc --noEmit
```

Expected: no new errors in touched files. Record existing unrelated Website Preview type debt separately.

- [ ] **Step 5: Commit the boundary**

```bash
git add frontend/src/components/admin/website/DevicePreviewFrame.tsx frontend/src/components/admin/website/WebsitePreviewPanel.tsx
git commit -m "refactor(cms): isolate admin and public preview themes"
```

---

### Task 2: Migrate the Website CMS workspace chrome

**Files:**

- Modify: `frontend/src/app/[locale]/admin/website/layout.tsx`
- Modify: `frontend/src/components/admin/website/WebsitePageEditorShell.tsx`
- Modify: `frontend/src/components/admin/website/WebsiteEditorToolbar.tsx`
- Modify: `frontend/src/components/admin/website/WebsiteEditorTabs.tsx`
- Modify: `frontend/src/components/admin/website/WebsiteEditorStatePanel.tsx`
- Modify: `frontend/src/components/admin/website/WebsiteLocaleTabs.tsx`
- Modify: `frontend/src/components/admin/website/WebsitePreviewDeviceSwitch.tsx`
- Modify: `frontend/src/components/admin/website/WebsitePublishPanel.tsx`
- Modify: `frontend/src/components/admin/website/PageStatusPill.tsx`

**Interfaces:**

- Consume foundation Button, Modal, status, and Admin semantic roles.
- Preserve editor tab, locale, preview device/mode, dirty, save, and publish contracts.

- [ ] **Step 1: Convert workspace surfaces**

Use `admin-surface`, `admin-surface-muted`, `admin-border`, `admin-foreground`, `admin-body`, and `admin-muted`. Remove duplicated white/zinc panel decisions; preserve the existing two-column workspace and responsive stacking.

- [ ] **Step 2: Convert selection and status states**

- Tabs and device switch: selected roles or shared Button variants.
- Draft/published switch: `admin-action` for selected, surface/body for unselected.
- Unsaved: danger roles.
- Unpublished: warning roles.
- Saved/published: success roles.
- Errors: danger surface plus text; never color alone.

- [ ] **Step 3: Keep toolbar action hierarchy**

Back uses ghost, View Public uses outline, Publish uses primary. All retain loading, disabled, dirty guard, and keyboard focus.

- [ ] **Step 4: Verify workspace states**

Exercise content/SEO/settings/advanced tabs; three locales; draft/published; mobile/tablet/desktop preview; unsaved, saving, saved, publishing, published, and error states.

- [ ] **Step 5: Commit workspace chrome**

```bash
git add 'frontend/src/app/[locale]/admin/website/layout.tsx' frontend/src/components/admin/website/WebsitePageEditorShell.tsx frontend/src/components/admin/website/WebsiteEditorToolbar.tsx frontend/src/components/admin/website/WebsiteEditorTabs.tsx frontend/src/components/admin/website/WebsiteEditorStatePanel.tsx frontend/src/components/admin/website/WebsiteLocaleTabs.tsx frontend/src/components/admin/website/WebsitePreviewDeviceSwitch.tsx frontend/src/components/admin/website/WebsitePublishPanel.tsx frontend/src/components/admin/website/PageStatusPill.tsx
git commit -m "refactor(cms): theme editor workspace chrome"
```

---

### Task 3: Migrate Website CMS forms, page manager, and specialized editors

**Files:**

- Modify: `frontend/src/app/[locale]/admin/website/**` excluding `layout.tsx`
- Modify: `frontend/src/components/admin/website/WebsitePagesList.tsx`
- Modify: `frontend/src/components/admin/website/WebsitePagesManager.tsx`
- Modify: `frontend/src/components/admin/website/WebsiteContentTab.tsx`
- Modify: `frontend/src/components/admin/website/WebsiteSeoTab.tsx`
- Modify: `frontend/src/components/admin/website/WebsiteSettingsTab.tsx`
- Modify: `frontend/src/components/admin/website/WebsiteAdvancedTab.tsx`
- Modify: `frontend/src/components/admin/website/WebsitePageMetadataEditor.tsx`
- Modify: `frontend/src/components/admin/website/WebsiteSectionList.tsx`
- Modify: `frontend/src/components/admin/website/sections/**`
- Modify: `frontend/src/components/admin/website/about/**`
- Modify: `frontend/src/components/admin/website/privacy/**`
- Modify: `frontend/src/components/admin/website/impressum/**`
- Modify: `frontend/src/components/admin/website/shared/**`

**Interfaces:**

- Preserve schema, form, preview draft, section lifecycle, page lifecycle, and service contracts.
- Consume foundation fields, Button, Modal/confirmation, status, and theme roles.

- [ ] **Step 1: Migrate the page manager**

Convert list, filters, empty/loading/error states, status pills, and actions to shared Admin owners. Preserve permission checks and route navigation.

- [ ] **Step 2: Migrate common editor forms**

Use shared fields and semantic panels for content, SEO, settings, advanced, metadata, section list, media URL, completeness, and SEO preview. Keep FormProvider/Controller ownership, dirty tracking, localized validation, and loading locks.

- [ ] **Step 3: Migrate section and specialized editors**

Move presentation classes only. Preserve each section type, About tab composition, Privacy/Impressum editor behavior, rich text, media selection, archive/restore/duplicate/reorder, and localized `th/en/de` data.

- [ ] **Step 4: Preserve state hierarchy**

Editor success/warning/danger/info surfaces must use the same semantic roles as the workspace. Do not create page-specific color maps.

- [ ] **Step 5: Verify every editor family**

Manual matrix:

- Website page list: loading, empty, data, filters, status, actions.
- Home/About/Contact/Privacy/Impressum editors.
- Generic rich text, hero, map, contact info, and contact form section editors.
- Save page, save section, publish, create, reorder, duplicate, archive, restore.
- Dirty guard on tab, locale, section, and route change.
- Thai, English, German fields and preview.

- [ ] **Step 6: Commit CMS consumers**

```bash
git add 'frontend/src/app/[locale]/admin/website' frontend/src/components/admin/website
git commit -m "refactor(cms): migrate editor consumers to admin theme"
```

---

### Task 4: Close the Website CMS guard and verify production

**Files:**

- Modify: `frontend/scripts/check-admin-theme-tokens.mjs`
- Modify: `frontend/ADMIN_DESIGN.md` only if implementation discovered an explicit preview exception not covered by this plan

**Interfaces:**

- Extends the foundation guard to all Website CMS Admin chrome.
- Keeps Public preview theme utilities allowed only inside preview-rendering owners.

- [ ] **Step 1: Remove deferred directories**

Delete these entries from the guard's `deferred` set:

```js
"src/app/[locale]/admin/website",
"src/components/admin/website",
```

- [ ] **Step 2: Retain the narrow Public preview allowances**

Keep the foundation guard's `publicPreviewOwners` allow-list limited to:

```text
src/components/admin/website/DevicePreviewFrame.tsx
src/components/admin/website/WebsitePreviewPanel.tsx
```

Do not allow raw public hex or public palette utilities anywhere in CMS chrome.

- [ ] **Step 3: Run automated verification**

```bash
cd frontend
npm run lint:admin-theme
npx eslint 'src/app/[locale]/admin/website' src/components/admin/website
./node_modules/.bin/tsc --noEmit
npm run build
```

Expected: theme guard and build exit `0`; scoped lint/type-check introduce no new failures. Report pre-existing Website CMS lint/type failures separately rather than weakening rules.

- [ ] **Step 4: Compare preview with real Public pages**

For Home, About, Contact, and one generic page, compare CMS draft preview against the corresponding Public route at `390`, `760`, and `1120` preview widths. Verify canvas, foreground, surface, border, action, accent, and image-header contrast.

- [ ] **Step 5: Commit migration completion**

```bash
git add frontend/scripts/check-admin-theme-tokens.mjs frontend/ADMIN_DESIGN.md
git commit -m "chore(cms): enforce admin theme boundary"
```

## Completion Gate

- Website CMS chrome uses Admin semantic roles exclusively.
- Embedded Public preview resolves `.public-theme` independently and visually matches real Public routes.
- No editor behavior, API contract, permission, locale, save, publish, or section lifecycle changed.
- Admin theme guard covers core Admin and Website CMS.
- Scoped lint, type-check, production build, and manual preview matrix are complete.
