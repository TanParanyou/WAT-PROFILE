# Admin Website CMS UX/UI

Date: 2026-06-27

## Decision

Use a preview-first, mono-style admin interface for website content management.

The target route shape is:

```text
/th/admin/website/pages/PAGE-CONTACT
```

The saved mockup is here:

```text
docs/website-cms/mockups/admin-contact-preview-first-mono.html
```

## UX Direction

- Admin UI uses a mono, utilitarian style: black, white, gray, small radius, compact controls, monospace typography.
- Public preview is the main surface. Editing happens beside the preview, not in a detached form-only workflow.
- Desktop layout uses left editor + right sticky live preview.
- Tablet and mobile stack the editor and preview.
- Preview supports device modes: desktop, tablet, mobile.
- The page editor is not a free-form page builder. It is a structured section CMS.

## Core Layout

```text
Admin shell
  Sidebar: Website, Content, Operations
  Topbar: current route, audit, preview URL, publish

Page editor
  Left: structured editor
    Language tabs: TH / EN / DE
    Section list: Hero, Contact information, Contact form copy, Visit cards, Map block
    Section fields
    SEO / Publishing / Responsive rules controls

  Right: live public preview
    Desktop / Tablet / Mobile switch
    Public page rendering

Bottom
  Search result preview
  Notes / guidance
```

## Data Model Fit

This UX matches the agreed system structure:

- `content_pages`: public pages such as home, about, contact, privacy, impressum.
- `content_sections`: structured blocks within each page.
- `settings`: global site identity, contact, social, bank, donation, SEO defaults.
- Domain entities: events, monks, gallery, schedules, donations, contacts, members.
- Media library: images are selected from media records, not stored as raw URLs only.
- SEO JSONB: every public-facing module supports structured SEO metadata.

## Publishing Rules

- Public content supports `draft` and `published` states.
- `published_at` tracks when content went live.
- Preview should make it clear whether it renders draft or published content.
- Public site renders only published and active content.

## Multilingual Rules

- Multilingual fields keep the shape `{ th, en, de }`.
- The shape is required, but each language value can be empty.
- Public fallback order should be predictable, such as current locale -> English -> Thai.
- Admin shows warnings for missing translation, but does not block publishing unless the field is required for all locales.

## SEO Rules

SEO is first-class in the editor.

SEO object should support:

- `meta_title`
- `meta_description`
- `og_title`
- `og_description`
- `og_image_url`
- `canonical_url`
- `noindex`

Fallback behavior:

- Empty meta title uses page/entity title.
- Empty meta description uses body/description excerpt.
- Empty OG title/description use meta title/description.
- Empty OG image uses primary image or default SEO image from settings.
- Canonical URL is generated from route and slug unless overridden.

## Section Types To Start With

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

Each type should have a small schema and a focused editor rather than one giant generic JSON editor.

## Next Work

1. Write the implementation plan.
2. Add database schema for `content_pages`, `content_sections`, SEO JSONB, publish state, and media metadata gaps.
3. Add backend CRUD/public APIs for pages and sections.
4. Build admin route `app/[locale]/admin/website/pages`.
5. Build page detail route `app/[locale]/admin/website/pages/[id]`.
6. Implement responsive preview shell and device switch.
7. Wire public site pages to backend content.
8. Migrate static JSON content into seed/database.
9. Expand audit logging to all website CMS mutations.

