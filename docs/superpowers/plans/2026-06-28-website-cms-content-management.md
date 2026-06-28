# Website CMS Content Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Website CMS manage public page content while keeping public page design and layout in code-owned templates.

**Architecture:** Public routes remain route-based templates. CMS data supplies page metadata, SEO, localized copy, section order, section content, CTA/image/map/settings, and publish state. The frontend keeps the mock/API switch inside `websiteCmsService`, server data in TanStack Query, editor forms in React Hook Form + Zod, and editor UI state in Zustand.

**Tech Stack:** Next.js App Router, TypeScript, next-intl, Zod, React Hook Form, TanStack Query, Zustand, Tailwind CSS, mock JSON first with API-ready service contracts.

---

## Scope Lock

This plan intentionally does not build a generic page builder. Admin users manage content and composition only. Public design stays in code through existing templates such as home, about, contact, gallery, monks, and shared layout components.

## File Map

- Modify: `frontend/src/data/website-cms.json` - mock CMS payloads for contact, about, home, gallery, monks.
- Modify: `frontend/src/types/website-cms.ts` - shared content/section contracts if missing section fields are needed.
- Modify: `frontend/src/schemas/website-cms.schema.ts` - Zod validation for page and section content fields.
- Modify: `frontend/src/utils/websiteCms.ts` - section helpers, template availability, content payload transforms.
- Modify: `frontend/src/services/websiteCmsService.ts` - keep mock/API contracts stable for public and admin pages.
- Modify: `frontend/src/components/admin/website/WebsitePreviewPanel.tsx` - render public templates in preview where available.
- Modify: `frontend/src/components/admin/website/WebsiteContentTab.tsx` - register content editors by section type.
- Create: `frontend/src/components/public/website/PublicAboutPageLayout.tsx` - public about template driven by CMS content.
- Create: `frontend/src/components/public/website/PublicHomePageLayout.tsx` - public home template driven by CMS content plus dynamic lists.
- Modify: `frontend/src/app/[locale]/(client)/contact/page.tsx` and `ContactContent.tsx` - complete contact CMS fallback and preview parity.
- Modify: `frontend/src/app/[locale]/(client)/about/page.tsx` and `AboutContent.tsx` - load CMS content while preserving current visual design.
- Modify: `frontend/src/app/[locale]/page.tsx` - load CMS home content while preserving dynamic events/monks sections.
- Modify later: `frontend/src/app/[locale]/(client)/gallery/page.tsx`, `GalleryContent.tsx`, `monks/page.tsx`, `MonksContent.tsx` - CMS-managed heading/intro/SEO first.

---

### Task 1: Define Content-Only CMS Coverage

**Files:**
- Modify: `frontend/src/data/website-cms.json`
- Modify: `frontend/src/utils/websiteCms.ts`

- [ ] **Step 1: Add page records for public routes**

Add mock pages for:

```text
PAGE-HOME -> slug "home"
PAGE-ABOUT -> slug "about"
PAGE-CONTACT -> slug "contact"
PAGE-GALLERY -> slug "gallery"
PAGE-MONKS -> slug "monks"
```

Each page must include `title`, `description`, `seo`, `status`, `sections`, `published_*` fields, and multilingual `th/en/de` values.

- [ ] **Step 2: Register section templates**

Update `getAvailableSectionTemplates(pageKey)` in `frontend/src/utils/websiteCms.ts` with content-only section types:

```ts
PAGE-HOME: hero, featured_events, featured_monks
PAGE-ABOUT: intro, quote, rich_text, item_list, monks_grid
PAGE-CONTACT: hero, contact_info, contact_form, rich_text, map
PAGE-GALLERY: hero, gallery_intro
PAGE-MONKS: hero, monks_intro
```

- [ ] **Step 3: Verify admin can list and open all pages**

Run:

```bash
cd frontend
npx next build --webpack
```

Expected: build passes and `/th/admin/website/pages` can display the added mock pages.

---

### Task 2: Finish Contact As The Reference Pattern

**Files:**
- Modify: `frontend/src/app/[locale]/(client)/contact/page.tsx`
- Modify: `frontend/src/app/[locale]/(client)/contact/ContactContent.tsx`
- Modify: `frontend/src/components/public/website/PublicContactPageLayout.tsx`
- Modify: `frontend/src/components/admin/website/WebsitePreviewPanel.tsx`

- [ ] **Step 1: Keep contact public route CMS-first**

The contact route should call:

```ts
const cmsPage = await websiteCmsPublicService.getPage("contact").catch(() => null);
```

Fallback content must only be used when the CMS payload is unavailable.

- [ ] **Step 2: Keep form behavior code-owned**

The contact form submission remains inside `ContactContent.tsx`. CMS may control labels/copy where useful, but validation, email sending, loading, and success/error behavior stay in code.

- [ ] **Step 3: Make admin preview match public contact template**

`WebsitePreviewPanel` must render `PublicContactPageLayout` for `PAGE-CONTACT` with draft/published data selected by preview mode.

- [ ] **Step 4: Verify live preview**

Run:

```bash
cd frontend
npx next build --webpack
```

Expected: build passes, contact CMS preview updates while typing, and public contact still renders without requiring a real API.

---

### Task 3: Convert About To CMS Content

**Files:**
- Create: `frontend/src/components/public/website/PublicAboutPageLayout.tsx`
- Modify: `frontend/src/app/[locale]/(client)/about/page.tsx`
- Modify: `frontend/src/app/[locale]/(client)/about/AboutContent.tsx`
- Modify: `frontend/src/components/admin/website/WebsitePreviewPanel.tsx`

- [ ] **Step 1: Create a CMS-driven about layout**

Create `PublicAboutPageLayout` that accepts:

```ts
{
  page: PublicContentPage;
  locale: string;
}
```

It should preserve the current about design pattern: page header, sticky navigation, content cards, quote block, building/item list, and monks grid where applicable.

- [ ] **Step 2: Load about CMS data in route**

`about/page.tsx` should fetch:

```ts
const cmsPage = await websiteCmsPublicService.getPage("about").catch(() => null);
```

Metadata should prefer CMS `title`, `description`, and `seo` fields, then fall back to current translations.

- [ ] **Step 3: Keep monk profile data dynamic**

The about template may use CMS text for section copy, but monk cards should continue using current monk data until monk management is moved into a separate content module.

- [ ] **Step 4: Add preview routing**

`WebsitePreviewPanel` should render `PublicAboutPageLayout` for `PAGE-ABOUT`.

- [ ] **Step 5: Verify**

Run:

```bash
cd frontend
npx next build --webpack
```

Expected: build passes, about public page renders with fallback or CMS data, and admin preview uses the same about template.

---

### Task 4: Convert Home Copy To CMS Content

**Files:**
- Create: `frontend/src/components/public/website/PublicHomePageLayout.tsx`
- Modify: `frontend/src/app/[locale]/page.tsx`
- Modify: `frontend/src/components/admin/website/WebsitePreviewPanel.tsx`

- [ ] **Step 1: Extract home layout**

Move the current home visual structure into `PublicHomePageLayout` with props:

```ts
{
  page: PublicContentPage | null;
  locale: string;
  latestEvents: Event[];
  monks: Monk[];
}
```

- [ ] **Step 2: Make CMS control only home copy**

CMS controls hero title, hero subtitle, CTA label/href, section headings, and intro copy. Latest events and monks data still come from `publicService`.

- [ ] **Step 3: Preserve fallback behavior**

If CMS home data is unavailable, the page must use existing `Public.home` translations.

- [ ] **Step 4: Add admin preview**

`WebsitePreviewPanel` should render `PublicHomePageLayout` for `PAGE-HOME` using empty arrays or small mock arrays for dynamic lists.

- [ ] **Step 5: Verify**

Run:

```bash
cd frontend
npx next build --webpack
```

Expected: build passes and home page renders whether CMS mock data is present or unavailable.

---

### Task 5: Add Lightweight CMS Support For Gallery And Monks

**Files:**
- Modify: `frontend/src/app/[locale]/(client)/gallery/page.tsx`
- Modify: `frontend/src/app/[locale]/(client)/gallery/GalleryContent.tsx`
- Modify: `frontend/src/app/[locale]/(client)/monks/page.tsx`
- Modify: `frontend/src/app/[locale]/(client)/monks/MonksContent.tsx`
- Modify: `frontend/src/components/admin/website/WebsitePreviewPanel.tsx`

- [ ] **Step 1: Make gallery heading CMS-managed**

Gallery CMS controls page title, subtitle, SEO, and optional intro. Image grid, category filters, animation, and lightbox stay code/data-owned.

- [ ] **Step 2: Make monks heading CMS-managed**

Monks CMS controls page title, subtitle, SEO, and optional intro. Monk records and detail pages stay data/module-owned.

- [ ] **Step 3: Add preview fallbacks**

Admin preview for `PAGE-GALLERY` and `PAGE-MONKS` may use `PublicPageRenderer` or a small page-specific heading preview. It must not pretend that the grid/list content is editable from Website CMS.

- [ ] **Step 4: Verify**

Run:

```bash
cd frontend
npx next build --webpack
```

Expected: build passes and gallery/monks public pages keep current behavior with CMS-managed heading metadata.

---

### Task 6: Production UX Pass For CMS Admin

**Files:**
- Modify: `frontend/src/components/admin/website/WebsitePageEditorShell.tsx`
- Modify: `frontend/src/components/admin/website/WebsiteContentTab.tsx`
- Modify: `frontend/src/components/admin/website/sections/*`
- Modify: `frontend/src/messages/admin/th.json`
- Modify: `frontend/src/messages/admin/en.json`
- Modify: `frontend/src/messages/admin/de.json`

- [ ] **Step 1: Align labels with content-only model**

Admin labels should describe content editing, not design editing. Avoid wording that implies free layout design or page builder controls.

- [ ] **Step 2: Keep section editors typed**

Each section type should expose only fields that public templates consume. Extra JSON controls can stay in advanced tabs, but normal editing should be field-based.

- [ ] **Step 3: Ensure states are visible**

Save, publish, draft, dirty, loading, and mutation errors should be visible. Toast should be used for success/error feedback where helpful.

- [ ] **Step 4: Verify**

Run:

```bash
cd frontend
npx next build --webpack
```

Expected: build passes and no hardcoded admin labels remain in newly touched CMS UI.

---

### Task 7: Final Verification

**Files:**
- No new files unless build errors reveal required fixes.

- [ ] **Step 1: Run production build**

Run:

```bash
cd frontend
npx next build --webpack
```

Expected: build passes.

- [ ] **Step 2: Manual browser check**

Check these URLs:

```text
http://localhost:3000/th
http://localhost:3000/th/about
http://localhost:3000/th/contact
http://localhost:3000/th/gallery
http://localhost:3000/th/monks
http://localhost:3000/th/admin/website/pages/PAGE-CONTACT
```

Expected: public pages render, admin preview updates draft content, and no page exposes design controls in CMS.

- [ ] **Step 3: Commit**

Commit in small chunks after each page phase. Suggested commit sequence:

```bash
git add frontend/src/data/website-cms.json frontend/src/utils/websiteCms.ts
git commit -m "feat(website-cms): add public page content models"

git add frontend/src/app frontend/src/components frontend/src/messages
git commit -m "feat(website-cms): drive public content from cms"
```

---

## Self-Review

- Spec coverage: Covers content-only CMS, route-based templates, mock/API source boundary, admin preview, and staged migration for contact, about, home, gallery, monks.
- Placeholder scan: No placeholders or unspecified implementation steps remain.
- Type consistency: Uses existing `PublicContentPage`, `ContentPage`, page keys, `websiteCmsPublicService`, `WebsitePreviewPanel`, and established CMS file paths.
- Scope check: This is one cohesive frontend CMS migration plan. Backend/Supabase integration remains outside this plan.
