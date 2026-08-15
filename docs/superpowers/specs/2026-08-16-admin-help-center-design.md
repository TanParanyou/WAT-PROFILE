# Admin Help Center Design

## Purpose

Provide a multilingual, developer-maintained help center for every Admin menu. It
helps authorized administrators complete common tasks without requiring a CMS,
database schema, or new API.

## Scope

- Add a Help Center route at `/admin/help` and a sidebar entry visible to every
  authenticated Admin user.
- Cover the Dashboard and all existing Admin modules, grouped consistently with
  the Admin sidebar: Website, Operations, Finance, and System.
- Supply every guide in Thai, English, and German.
- Filter the guide index, search results, and direct-guide access using the same
  permissions as the related Admin module.
- Store guidance in source code, including optional screenshots from the real
  Admin UI.

## Out of Scope

- CMS authoring, a backend API, database storage, version history, or in-app
  video/interactive tours.
- Generating screenshots from AI artwork. Screenshots must represent the real
  Admin interface.

## User Experience

The Help Center page has a navigation panel with a search field and sidebar-aligned
categories. The main area renders the selected guide with a title, summary,
requirements, numbered steps, optional screenshots, cautions, and links to the
corresponding Admin screen.

Users see only guides for modules they can read. A direct URL for an inaccessible
guide presents the normal unavailable/not-authorized state rather than exposing
its content.

Each guide uses short practical steps. Screenshots are limited to 1--3 points
where the task would otherwise be confusing.

## Content Model and File Layout

Each guide is a self-contained module, making additions a local change:

```text
frontend/src/features/admin-help/
  types.ts
  registry.ts
  README.md
  guides/
    index.ts
    events/
      guide.ts
      images.ts
    media/
      guide.ts
      images.ts

frontend/public/admin-help/
  events/
    create-event.webp
  media/
    upload-image.webp
```

`guide.ts` contains the stable guide id, associated Admin route, permission
resource, category, and localized content for `th`, `en`, and `de`. It is the
single source for a guide, so a developer can review all translations and task
steps together. `guides/index.ts` registers each guide once.

Shared TypeScript types require every supported locale and every mandatory guide
field. The registry validates duplicate ids and missing routes at build time. A
missing locale or malformed content therefore fails type-checking rather than
silently reaching users.

`images.ts` is optional and provides image metadata and localized alt text. Image
assets are optimized WebP files under `public/admin-help/<guide-id>/`. Use one
image across locales when it contains no visible language-specific text; otherwise
provide locale-specific files.

## Developer Workflow

To add coverage for a new Admin menu, a developer:

1. Creates `guides/<guide-id>/guide.ts` from the documented template.
2. Completes Thai, English, and German copy.
3. Sets the route, category, and permission to match the real Admin menu.
4. Adds only necessary real-UI screenshots and their localized alt text.
5. Exports the guide from `guides/index.ts`.
6. Runs lint, TypeScript checking, and build validation.

When an Admin UI flow changes, its guide and screenshots are updated in the same
pull request. The README documents the content schema, naming conventions, image
constraints, and the addition checklist.

## AI-Assisted Authoring

AI may draft structured steps, cautions, FAQ content, and all three translations.
Developers verify terminology and the rendered UI before committing. AI may
recommend screenshot locations and write alt text, but image files are captured
from the actual running Admin UI.

## Error Handling and Accessibility

The Help Center includes loading-free static rendering, a clear empty search
state, and a not-authorized state for filtered direct links. Images require
meaningful localized alt text; content remains navigable by keyboard, works at
mobile widths, and follows the existing Admin design tokens and visible focus
rules.

## Verification

- Type-check validates complete localized content and the registry shape.
- Lint and production build verify the route and rendering integration.
- Manual QA verifies desktop/mobile layouts, keyboard navigation, search, and
  permission filtering in Thai, English, and German.
- The existing project lacks a usable aggregate frontend test runner; component
  tests may be added where their direct execution is supported, otherwise this
  limitation is recorded with the implementation.
