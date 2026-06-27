# Website CMS Editor UX Design

Date: 2026-06-28
Route: `/[locale]/admin/website/pages/[id]`
Status: Approved design direction, ready for implementation planning

## Goal

Redesign the Website CMS page editor so content admins can edit public website pages confidently without feeling like they are using a page builder or developer console.

The editor must make the important work obvious:

- Edit structured content first.
- Preview the real public page in draft mode.
- Check desktop, tablet, and mobile layouts.
- Save draft and publish as separate actions.
- Keep SEO, settings, and JSON available without making the main workflow noisy.

## Product Direction

Use a `Structured CMS Editor + Controlled Sections + Real Public Preview`.

This is not a full page builder.

Structured CMS means:

- Users edit controlled section types such as `hero`, `contact_info`, `rich_text`, `map`, and `cta`.
- Each section type has a focused editor with fields that match its purpose.
- Users do not freely design columns, spacing, arbitrary blocks, or custom layouts.
- Advanced JSON remains available for admin/dev use, but it is not the default editing experience.
- Public rendering stays stable because the page structure is constrained by known section schemas.

This gives enough flexibility to manage public content while avoiding the maintenance and layout-risk burden of a full builder.

## Primary Users

The editor serves a mixed team.

- Content admins need to edit copy, translations, section visibility, SEO, and publish safely.
- Super admins/devs need access to structured settings and JSON for debugging or unsupported section types.

The first screen must serve content admins. Advanced controls must exist, but they should not dominate the page.

## Information Architecture

The page editor has four editor tabs:

### Content

This is the default tab.

It contains:

- Locale switcher: `TH / EN / DE`
- Section list
- Selected section editor
- Section save action
- Section-level status such as ready, draft, missing translation, hidden, or error

The user should not see page metadata, SEO JSON, or raw settings here unless the selected section explicitly needs a simple setting.

### SEO

This tab contains public-facing SEO fields and quality signals.

It contains:

- Meta title
- Meta description
- Canonical URL
- Noindex toggle
- OG title
- OG description
- OG image URL field, with a disabled media-selector affordance until the media library exists
- Google/search result preview
- Warnings for missing or weak SEO

SEO is edited through normal fields, not raw JSON.

### Settings

This tab contains page-level operational settings.

It contains:

- Page key
- Slug
- Status
- Published timestamp
- Updated timestamp
- Visibility/publish state
- View public action
- Copy preview URL action

This tab is not the main editing surface but must be easy to find.

### Advanced

This tab is for admin/dev use.

It contains:

- Page body JSON
- Page settings JSON
- Active section body JSON
- Active section settings JSON
- JSON validation
- Save advanced action

Advanced fields are allowed as a fallback while section-specific editors are incomplete, but production-ready section types should move toward focused editors.

## Layout

Use a preview-first workbench.

### Desktop

Desktop layout:

```text
Top toolbar
Editor panel | Public preview panel
```

The editor panel is approximately `420px` wide. The preview panel uses the remaining width and stays sticky while editing.

The top toolbar contains:

- Back to pages
- Breadcrumb
- Page key and slug
- Status badges
- Unsaved draft indicator
- Save draft
- Publish changes
- View public

The preview panel contains:

- Preview mode: `Draft / Published`
- Device switch: `Desktop / Tablet / Mobile`
- Locale switch: `TH / EN / DE`
- Public URL
- Public page renderer frame

### Tablet

Tablet layout may stack controls and preview, but the preview controls remain easy to reach. The editor must not force horizontal scrolling.

### Mobile

Mobile admin layout should prioritize editing usability:

- Toolbar stays compact.
- Preview can be collapsed or opened as a preview section/drawer.
- Content fields stay readable.
- Device controls still exist, but preview may be shown below the editor.

## Preview Requirements

The preview should be as close to the public page as practical.

It should not be a generic card mock.

Preview behavior:

- Draft mode uses draft fields from `ContentPage` and `ContentSection`.
- Published mode uses published fields where available, with fallback rules matching the public service.
- Device mode changes the preview frame and should exercise real responsive layout.
- Locale mode uses the current locale with predictable localized text fallback.
- Preview includes a public-like navbar, rendered supported sections, fallback cards for unsupported section types, and a footer.

The preview renderer should be reusable by admin preview and public pages where practical. If a section type does not yet have a public renderer, it must render a clear fallback block with the section title, description, and section type instead of failing silently.

## Section Editing Model

The Content tab uses section cards.

Each section card shows:

- Section label
- Section key/type
- Status
- Translation completeness
- Draft/unsaved indicator
- Visibility state if available

Selecting a section shows one focused editor.

Initial section editors to support:

- `HeroSectionEditor`
- `ContactInfoSectionEditor`
- `ContactFormSectionEditor`
- `RichTextSectionEditor`
- `MapSectionEditor`
- `GenericSectionAdvancedEditor`

The generic advanced editor is a fallback, not the default for known section types.

## State Model

Required UI states:

- `Clean`: no unsaved changes
- `Dirty`: field changed but not saved
- `Saving`: mutation in progress; disable only the affected save action
- `Saved draft`: draft saved but not published
- `Publish ready`: draft differs from published
- `Publishing`: publish mutation in progress
- `Published`: published content is up to date
- `Error`: show recoverable error and keep form values

Save draft and publish are separate actions.

Publishing must not be treated as the same action as saving. This separation reduces accidental public changes.

## Data Flow

Keep the current mock-first API-ready contract.

Data ownership:

- Server data: TanStack Query
- Form state: React Hook Form
- Validation: Zod
- Editor UI state: Zustand
- No server records in Zustand

Mutation flow:

- Save section calls section update mutation.
- Save SEO/page metadata calls page update mutation.
- Publish calls page publish mutation.
- Successful mutations update current page cache and invalidate page list.
- Failed mutations keep form values and show scoped retry/error feedback.

## Component Architecture

Target structure:

```text
app/[locale]/admin/website/pages/[id]/page.tsx
  WebsitePageEditorShell
    WebsiteEditorToolbar
    WebsiteEditorTabs
      WebsiteContentTab
      WebsiteSeoTab
      WebsiteSettingsTab
      WebsiteAdvancedTab
    WebsitePreviewPanel
    WebsiteEditorStatePanel

components/admin/website/sections/
  HeroSectionEditor.tsx
  ContactInfoSectionEditor.tsx
  ContactFormSectionEditor.tsx
  RichTextSectionEditor.tsx
  MapSectionEditor.tsx
  GenericSectionAdvancedEditor.tsx

components/public/website/
  PublicPageRenderer.tsx
  PublicSectionRenderer.tsx
```

Route pages should remain thin. They read params, call hooks, and pass typed handlers into the shell.

## Error Handling

Errors must be scoped.

- Page save error appears in SEO/Settings/page area.
- Section save error appears near the active section editor.
- Publish error appears in toolbar/state panel.
- JSON parse errors appear inline before mutation.

Errors must not clear draft form values.

## Testing And Verification

Implementation should verify:

- `npm run build` passes in `frontend`.
- `/th/admin/website/pages/PAGE-CONTACT` loads in mock auth mode.
- Save section mutation updates preview and query cache.
- Save page/SEO mutation updates preview and query cache.
- Publish action shows state feedback.
- Desktop/tablet/mobile preview modes render without layout overlap.
- JSON editor rejects invalid JSON and keeps typed text.

## Out Of Scope

Do not build these in this iteration:

- Full page builder
- Inline editing directly on preview
- Drag/drop section reorder
- Media library workflow
- Version history and rollback
- Multi-user approval workflow
- Fully final public renderer for every possible section type

## Implementation Scope

The next implementation plan should include:

1. Add editor tab state to Zustand.
2. Add preview mode state: draft vs published.
3. Refactor shell into toolbar, tabs, content tab, SEO tab, settings tab, advanced tab, and preview panel.
4. Move JSON fields out of the default content flow.
5. Add section-specific editors for the initial known section types.
6. Add reusable public page/section renderer for admin preview.
7. Improve preview device frames and responsive checks.
8. Keep mock/API service contracts unchanged.
