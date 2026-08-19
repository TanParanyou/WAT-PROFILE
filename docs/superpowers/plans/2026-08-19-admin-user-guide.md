# Admin User Guide & Help System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, multilingual (TH/EN/DE), type-safe, and print-ready Admin User Guide and Contextual Help Drawer system covering all 21 administrative sections of the WAT-PROFILE temple platform.

**Architecture:** A static, typed content registry (`src/data/admin-guide/`) powers both the full Docs Hub (`/admin/guide` & `/admin/guide/[slug]`) and the slide-out Contextual Help Drawer (`AdminHelpDrawer.tsx`). Route matching automatically surfaces relevant operational workflows for the active page, while clean `@media print` rules enable zero-dependency A4 PDF manual export.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript (Strict, 0 `any`), Tailwind CSS 4, `next-intl` (TH/EN/DE), Lucide React.

## Global Constraints

- Strict TypeScript with 0 `any` or `@ts-ignore` types.
- 0 hardcoded strings in UI components; all labels, buttons, and placeholders come from `src/messages/admin/{th,en,de}.json`.
- Multilingual content must preserve `th`, `en`, and `de` for every article, step, tip, and FAQ.
- All admin UI components must strictly adhere to `ADMIN_DESIGN.md` tokens (`rounded-none`, `bg-admin-surface`, `border-admin-border`, `admin-action`, minimum 44px touch targets).

---

### Task 1: Guide Type System & Centralized Guide Content Registry

**Files:**
- Create: `frontend/src/types/adminGuide.ts`
- Create: `frontend/src/data/admin-guide/getting-started.ts`
- Create: `frontend/src/data/admin-guide/website-cms.ts`
- Create: `frontend/src/data/admin-guide/operations.ts`
- Create: `frontend/src/data/admin-guide/finance.ts`
- Create: `frontend/src/data/admin-guide/system.ts`
- Create: `frontend/src/data/admin-guide/index.ts`

**Interfaces:**
- Produces: `GuideArticle`, `GuideStep`, `GuideStatusLegend`, `GuideFaqItem`, `GuideCategoryMeta`, `getAllGuideArticles()`, `getGuideArticleBySlug(slug: string)`, `getGuideArticlesByCategory(category: GuideCategory)`, `getGuideByRoutePath(pathname: string)`, `searchGuideArticles(query: string, locale: "th" | "en" | "de")`.

- [ ] **Step 1: Create TypeScript type definitions**
Create `frontend/src/types/adminGuide.ts` with strict definitions for all guide structures.

- [ ] **Step 2: Create guide content files for all 21 modules**
Implement `getting-started.ts`, `website-cms.ts`, `operations.ts`, `finance.ts`, and `system.ts` containing complete, localized operational guides with steps, tips, warnings, status legends, and FAQs.

- [ ] **Step 3: Create registry index and query helpers**
Implement `frontend/src/data/admin-guide/index.ts` exposing typed query helpers for articles, slugs, route mapping, and keyword search.

- [ ] **Step 4: Type-check registry**
Run: `cd frontend && ./node_modules/.bin/tsc --noEmit`
Expected: PASS (0 errors)

- [ ] **Step 5: Commit**
```bash
git add frontend/src/types/adminGuide.ts frontend/src/data/admin-guide/
git commit -m "feat(admin-guide): add typed guide data registry for all 21 modules"
```

---

### Task 2: Admin Localization (TH, EN, DE)

**Files:**
- Modify: `frontend/src/messages/admin/th.json`
- Modify: `frontend/src/messages/admin/en.json`
- Modify: `frontend/src/messages/admin/de.json`

**Interfaces:**
- Produces: `"Admin.guide"` namespace, `"Admin.sidebar.guide"`, `"Admin.header.help"` in all 3 language files.

- [ ] **Step 1: Add translation keys to `th.json`**
Add guide titles, search placeholders, actions (`exportPdf`, `printHandbook`, `openFullGuide`, `quickSteps`, `statusLegend`, `faqs`, `relatedGuides`, `tableOfContents`, etc.).

- [ ] **Step 2: Add translation keys to `en.json`**
Add English equivalents matching exact key structure.

- [ ] **Step 3: Add translation keys to `de.json`**
Add German equivalents matching exact key structure.

- [ ] **Step 4: Verify JSON validity and type safety**
Run: `cd frontend && ./node_modules/.bin/tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add frontend/src/messages/admin/
git commit -m "feat(admin-guide): add trilingual localization keys for guide and help center"
```

---

### Task 3: Shared Guide Components (UI & Print Engine)

**Files:**
- Create: `frontend/src/components/admin/guide/GuideCategoryNav.tsx`
- Create: `frontend/src/components/admin/guide/GuideArticleViewer.tsx`
- Create: `frontend/src/components/admin/guide/GuideSearchModal.tsx`
- Create: `frontend/src/components/admin/guide/GuidePrintHeader.tsx`
- Create: `frontend/src/components/admin/guide/GuideQuickLinks.tsx`

**Interfaces:**
- Consumes: `GuideArticle`, `GuideCategoryMeta`, `GuideStep`, `MultiLangContent`, `useTranslations("Admin.guide")`
- Produces: Accessible, responsive guide reading components with table of contents, print header, and modal search.

- [ ] **Step 1: Implement `GuideCategoryNav.tsx`**
Sidebar category navigation component with article counters, active highlights, and mobile sheet support.

- [ ] **Step 2: Implement `GuideArticleViewer.tsx`**
Step-by-step reader component with numbered badges, warning/tip callouts, status legend tables, FAQ accordions, and sticky Table of Contents.

- [ ] **Step 3: Implement `GuideSearchModal.tsx`**
Interactive search dialog triggered by `Ctrl+K` / `⌘+K` or button click, with real-time filtering and keyboard navigation.

- [ ] **Step 4: Implement `GuidePrintHeader.tsx` & Print Styling**
Print-only header component with temple metadata, date stamp, and clean `@media print` rules.

- [ ] **Step 5: Implement `GuideQuickLinks.tsx`**
Card grid for related articles and jump links.

- [ ] **Step 6: Verify component compilation**
Run: `cd frontend && ./node_modules/.bin/tsc --noEmit`
Expected: PASS

- [ ] **Step 7: Commit**
```bash
git add frontend/src/components/admin/guide/
git commit -m "feat(admin-guide): create shared guide viewer, search modal, and print components"
```

---

### Task 4: Contextual Help Drawer & Integration with Header / Sidebar

**Files:**
- Create: `frontend/src/components/admin/guide/AdminHelpDrawer.tsx`
- Modify: `frontend/src/components/admin/AdminHeader.tsx`
- Modify: `frontend/src/components/admin/AdminSidebar.tsx`
- Modify: `frontend/src/components/admin/AdminLayout.tsx`

**Interfaces:**
- Consumes: `getGuideByRoutePath(pathname)`, `usePathname()`, `useTranslations("Admin.guide")`
- Produces: Global slide-out help drawer accessible from any admin page with 1-click access.

- [ ] **Step 1: Implement `AdminHelpDrawer.tsx`**
Create slide-out drawer reading current route path, showing module title, quick checklist steps, status definitions, and full guide link.

- [ ] **Step 2: Update `AdminHeader.tsx`**
Add `(?) Help` button with `Admin.header.help` tooltip that triggers the help drawer.

- [ ] **Step 3: Update `AdminSidebar.tsx`**
Add `guide` menu item under sidebar navigation linking to `/admin/guide`.

- [ ] **Step 4: Update `AdminLayout.tsx`**
Mount `AdminHelpDrawer` in the admin shell.

- [ ] **Step 5: Verify build & types**
Run: `cd frontend && ./node_modules/.bin/tsc --noEmit`
Expected: PASS

- [ ] **Step 6: Commit**
```bash
git add frontend/src/components/admin/
git commit -m "feat(admin-guide): integrate contextual help drawer in admin header and layout"
```

---

### Task 5: Admin Docs Hub Pages (`/admin/guide` & `/admin/guide/[slug]`)

**Files:**
- Create: `frontend/src/app/[locale]/admin/guide/layout.tsx`
- Create: `frontend/src/app/[locale]/admin/guide/page.tsx`
- Create: `frontend/src/app/[locale]/admin/guide/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getAllGuideArticles()`, `getGuideArticleBySlug()`, `GuideCategoryNav`, `GuideArticleViewer`
- Produces: App Router pages for `/admin/guide` (landing hub) and `/admin/guide/[slug]` (dynamic article reader).

- [ ] **Step 1: Create `guide/layout.tsx`**
Provide layout container with breadcrumbs, search button, print action, and responsive category sidebar.

- [ ] **Step 2: Create `guide/page.tsx`**
Landing page featuring search bar, quick-start category cards, recently updated guides, and handbook print button.

- [ ] **Step 3: Create `guide/[slug]/page.tsx`**
Article reader page with route validation (`notFound()` fallback), article viewer, table of contents, and related guide recommendations.

- [ ] **Step 4: Type-check and verify App Router routing**
Run: `cd frontend && ./node_modules/.bin/tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add frontend/src/app/[locale]/admin/guide/
git commit -m "feat(admin-guide): implement docs hub pages and dynamic article reader routes"
```

---

### Task 6: Comprehensive Verification & Build

**Files:**
- Test & Verification across `frontend/`

- [ ] **Step 1: Run TypeScript strict check**
Run: `cd frontend && ./node_modules/.bin/tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: Run ESLint**
Run: `cd frontend && npm run lint`
Expected: 0 errors

- [ ] **Step 3: Run Next.js production build**
Run: `cd frontend && npm run build`
Expected: Successful build with all routes compiled

- [ ] **Step 4: End-to-End manual verification**
1. Test switching languages (`TH`, `EN`, `DE`) on `/admin/guide`.
2. Test search dialog (`Ctrl+K`) finding terms like "บริจาค", "donation", "สิทธิ์", "event".
3. Navigate to `/admin/donations`, `/admin/events`, `/admin/roles` and click `(?)` to verify Contextual Help Drawer.
4. Click "พิมพ์ / บันทึก PDF" and verify browser print dialog renders clean A4 layout.

- [ ] **Step 5: Final commit**
```bash
git add .
git commit -m "chore(admin-guide): complete admin user guide and help system feature"
```
