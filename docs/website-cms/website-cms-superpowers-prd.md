# Website CMS PRD / Superpowers Handoff

Date: 2026-06-27
Project: WAT-PROFILE
Audience: Superpowers planning agent, implementation agent, and project maintainers

## Objective

Build a structured Website CMS so every piece of content currently shown on the public website can be managed from the admin panel.

The admin experience must follow the approved UX/UI reference:

- Design note: `docs/website-cms/admin-website-cms-uxui.md`
- Mockup: `docs/website-cms/mockups/admin-contact-preview-first-mono.html`

The target admin route pattern is:

```text
/[locale]/admin/website/pages/[pageId]
```

Example:

```text
/th/admin/website/pages/PAGE-CONTACT
```

## Background

The current system already has backend/admin modules for events, monks, gallery, schedules, donations, contacts, members, users, roles, settings, and audit logs.

The major gap is that parts of the public site still read from static JSON files. Admin changes do not reliably update all public pages. The new CMS must close that loop.

## Product Decisions

1. Use a hybrid CMS structure:
   - Settings for global short/config data.
   - Content pages and sections for public page content.
   - Domain entities for workflow-heavy data such as events, monks, gallery, schedules, donations, contacts, and members.

2. Use Structured Section CMS, not a free-form page builder.

3. Use preview-first admin UX:
   - Left side: structured editor.
   - Right side: live responsive public preview.
   - Device modes: desktop, tablet, mobile.

4. Use mono-style admin UI:
   - Black, white, gray.
   - Compact controls.
   - Small radius.
   - Monospace typography.
   - Quiet operational surface that does not compete with public preview.

5. Multilingual fields use this shape:

```json
{ "th": "", "en": "", "de": "" }
```

The shape is required, but individual language values may be empty.

6. Public fallback order:

```text
requested locale -> English -> Thai
```

7. Every public-facing module supports SEO.

8. Public content supports draft/published states.

9. Full revision rollback is out of scope for phase 1.

10. Audit logs must cover all CMS mutations.

11. Media should be selected from a central Media Library, not stored as raw URLs only.

12. Implementation starts with a vertical slice for `PAGE-CONTACT`.
    - The first implementation plan must not attempt to complete every CMS page at once.
    - `PAGE-CONTACT` is the proof-of-architecture page because it exercises structured sections, settings, media, SEO, draft/publish, responsive preview, and public rendering.
    - Once `PAGE-CONTACT` works end-to-end, reuse the same architecture for Home, About, Privacy, Impressum, and other public content.

## Public Content To Manage

The CMS must eventually cover all public data currently shown by the site:

- Home page:
  - Hero
  - Welcome/about section
  - Latest events section
  - Monks highlight
  - Donation callout

- Events:
  - List
  - Detail
  - Event SEO
  - Event image/media
  - Schedules/map fields

- Monks:
  - List
  - Detail
  - Monk SEO
  - Monk image/media

- Gallery:
  - Images
  - Categories
  - Captions
  - Alt text

- Contact / Visit:
  - Address
  - Phone
  - Email
  - Social links
  - Bank/donation info
  - Contact form copy
  - Visit cards
  - Map block

- Legal/static pages:
  - Privacy
  - Impressum

- Shared website shell:
  - Site name
  - Logo
  - Footer text
  - Default SEO image
  - Social links

## Data Model Requirements

### Content Page

Create a backend model/table for public pages.

Suggested fields:

- `id`
- `page_key`
- `slug`
- `title` as multilingual JSONB
- `description` as multilingual JSONB
- `seo` as JSONB
- `status`: `draft` or `published`
- `is_active`
- `published_at`
- `created_at`
- `updated_at`

`page_key` examples:

- `PAGE-HOME`
- `PAGE-ABOUT`
- `PAGE-CONTACT`
- `PAGE-PRIVACY`
- `PAGE-IMPRESSUM`

### Content Section

Create a backend model/table for page sections.

Suggested fields:

- `id`
- `page_id`
- `section_key`
- `section_type`
- `title` as multilingual JSONB
- `subtitle` as multilingual JSONB
- `body` as multilingual JSONB or structured JSONB
- `settings` as JSONB
- `media_id` nullable
- `display_order`
- `status`: `draft` or `published`
- `is_active`
- `published_at`
- `created_at`
- `updated_at`

Initial section types:

- `hero`
- `rich_text`
- `text_image`
- `contact_info`
- `contact_form_copy`
- `visit_cards`
- `map`
- `cta`
- `dynamic_list`
- `legal_text`

Each section type must have a small typed schema. Avoid a single giant unstructured JSON editor.

### SEO JSONB

Use one SEO JSONB object for public-facing modules.

Supported shape:

```json
{
  "meta_title": { "th": "", "en": "", "de": "" },
  "meta_description": { "th": "", "en": "", "de": "" },
  "og_title": { "th": "", "en": "", "de": "" },
  "og_description": { "th": "", "en": "", "de": "" },
  "og_image_url": "",
  "canonical_url": "",
  "noindex": false
}
```

Fallbacks:

- Empty `meta_title` uses page/entity title.
- Empty `meta_description` uses body/description excerpt.
- Empty `og_title` uses `meta_title`.
- Empty `og_description` uses `meta_description`.
- Empty `og_image_url` uses primary image or default SEO image from settings.
- Empty `canonical_url` is generated from route/slug.
- `noindex` defaults to `false`.

### Media Library

Extend or use the existing media model so admin can reuse uploaded images.

Media records should support:

- File URL
- Thumbnail URL
- Alt text as multilingual JSONB
- Caption as multilingual JSONB
- Credit/source
- File type
- File size
- Folder/category
- Used-by visibility where practical

## Backend Requirements

Add admin CRUD APIs for:

- Content pages
- Content sections
- Section ordering
- Section publish/unpublish
- Preview payload
- Media library metadata if missing

Add public APIs for:

- Fetch page by key or slug with published active sections
- Fetch settings needed by public shell
- Fetch SEO-ready page payload

Permissions:

- Add `website` or `content_pages` permission resource.
- Admin can manage all website CMS content.
- Editors can manage website content if assigned permission.

Audit logs:

- Log create/update/delete/publish/unpublish/reorder actions.
- Include entity type, entity id, user, IP, user agent, and change payload.

## Phase 1 Vertical Slice: PAGE-CONTACT

The first implementation plan should target `PAGE-CONTACT` end-to-end.

Admin route:

```text
/[locale]/admin/website/pages/PAGE-CONTACT
```

Public route:

```text
/[locale]/contact
```

The slice must include:

- `content_pages` record for `PAGE-CONTACT`.
- `content_sections` records for:
  - `hero`
  - `contact_info`
  - `contact_form_copy`
  - `visit_cards`
  - `map`
- SEO JSONB for the page.
- Draft/published state for page and sections.
- Admin list entry under `Website > Pages`.
- Admin page editor following the saved mono preview-first mockup.
- Responsive public preview with desktop/tablet/mobile modes.
- Public Contact page rendered from CMS data.
- Locale fallback for incomplete translations.
- Audit log entries for update and publish actions.

The slice may use existing settings for global data such as email, phone, social links, bank info, and map URL if that keeps the implementation smaller. If existing settings are not expressive enough, add only the minimal settings needed by `PAGE-CONTACT`.

The slice should defer:

- Home page migration.
- About page migration.
- Privacy/Impressum migration.
- Domain entity SEO for events/monks/gallery.
- Full media library page if a minimal media picker/reference is enough for the first slice.

## Frontend Admin Requirements

Implement routes:

```text
frontend/src/app/[locale]/admin/website/pages/page.tsx
frontend/src/app/[locale]/admin/website/pages/[id]/page.tsx
```

Admin list page:

- Search pages
- Filter by status, language gaps, SEO warnings
- Show page key, slug, status, language state, sections count, SEO state, updated date
- Actions: open, preview, publish/unpublish where appropriate

Page detail/editor:

- Follow the saved mono preview-first mockup.
- Left editor:
  - Language tabs TH/EN/DE
  - Section list
  - Section-specific fields
  - SEO controls
  - Publishing controls
  - Responsive rules summary
- Right preview:
  - Sticky on desktop
  - Desktop/tablet/mobile device switch
  - Public page preview using draft data when editing
- Responsive behavior:
  - Desktop: editor + preview side-by-side
  - Tablet/mobile: editor and preview stack

Admin sidebar:

- Add Website group:
  - Pages
  - Media
  - SEO Defaults

## Frontend Public Requirements

Public pages must stop reading static JSON for content that belongs in CMS.

Replace static content with backend-backed content for:

- Home
- About
- Contact/Visit
- Privacy
- Impressum

Domain pages should use backend public APIs:

- Events list/detail
- Monks list/detail
- Gallery
- Schedules

Public rendering rules:

- Render only published and active pages/sections.
- Respect locale fallback.
- Render SEO metadata from SEO object with fallbacks.
- Use media alt text where available.

## Migration Requirements

Seed or migrate existing static JSON data into the new database structure.

Likely source files:

- `frontend/src/data/about.json`
- `frontend/src/data/contact.json`
- `frontend/src/data/events.json`
- `frontend/src/data/gallery.json`
- `frontend/src/data/categories.json`
- `frontend/src/data/monks.json`
- `frontend/src/data/schedule.json`

Do not remove static files until public pages have been wired to backend and verified.

## Out Of Scope For Phase 1

- Full drag-and-drop visual page builder.
- Full revision rollback UI.
- Approval workflow with multiple reviewers.
- Event registration flow.
- Payment gateway integration.
- Member portal.

## Suggested Implementation Phases

### Phase 1A: PAGE-CONTACT Data Foundation

- Add backend models and migrations needed for pages and sections.
- Add SEO JSONB support for content pages.
- Add draft/published fields.
- Add permissions for website CMS.
- Seed `PAGE-CONTACT` and its first sections from existing static contact data.

### Phase 1B: PAGE-CONTACT Backend APIs

- Add admin CRUD for pages and sections.
- Add section reorder.
- Add publish/unpublish.
- Add public page fetch.
- Add preview payload endpoint if needed for draft preview.
- Add audit coverage for `PAGE-CONTACT` mutations.

### Phase 1C: PAGE-CONTACT Admin UX

- Build `Website > Pages` list with `PAGE-CONTACT`.
- Build `PAGE-CONTACT` detail/editor based on mockup.
- Build responsive preview shell.
- Add SEO drawer/panel.
- Add language warnings.

### Phase 1D: PAGE-CONTACT Public Rendering

- Wire public Contact page to CMS.
- Wire SEO metadata.
- Add locale fallback.
- Keep old static JSON as temporary fallback only.

### Phase 2: Expand CMS To Other Pages

- Migrate Home.
- Migrate About.
- Migrate Privacy.
- Migrate Impressum.
- Remove static JSON reads only after each migrated page is verified.

### Phase 3: Media Library Polish

- Add media library page or improve existing upload flow.
- Add media picker in section editor.
- Add alt/caption/credit fields.

### Phase 4: Domain Entity SEO

- Add SEO JSONB to events and monks first.
- Then gallery categories and other public-facing entities.
- Update admin forms and public metadata generation.

### Phase 5: Cleanup And Verification

- Remove or deprecate old static data reads.
- Remove duplicate public routes.
- Run backend tests/build.
- Run frontend build/lint.
- Verify responsive admin preview.
- Verify public pages update after admin changes.

## Acceptance Criteria

### Phase 1 Acceptance Criteria

- Admin can open `Website > Pages > PAGE-CONTACT`.
- Admin can edit Contact page sections.
- Admin can save draft changes.
- Admin can publish Contact page changes.
- Admin can preview Contact page in desktop/tablet/mobile modes.
- Public `/[locale]/contact` renders from CMS data.
- Public Contact page does not require static JSON for content covered by `PAGE-CONTACT`.
- Locale fallback works for empty German content.
- SEO metadata for Contact renders with fallback behavior.
- Audit log records Contact page update and publish actions.

### Full CMS Acceptance Criteria

- Admin can create/edit/publish a content page.
- Admin can add/reorder/edit/publish sections.
- Admin can edit multilingual content with fallback warnings.
- Admin can preview public output in desktop/tablet/mobile modes.
- Admin can edit SEO metadata and see search preview.
- Public pages render from backend CMS data, not static JSON.
- Public pages render only published active content.
- SEO metadata renders with fallbacks.
- All CMS mutations create audit log entries.
- UI matches the saved mono preview-first mockup direction.

## Verification Checklist

- Backend build passes.
- Frontend build passes.
- Lint passes if dependencies are installed.
- Public Home renders from CMS.
- Public Contact renders from CMS.
- Admin page editor works on desktop and mobile widths.
- Preview device switch works.
- Locale fallback works for empty German content.
- SEO fallback works when meta fields are empty.
- Audit log records page/section update and publish actions.
