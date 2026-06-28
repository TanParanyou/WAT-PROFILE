# Website CMS Frontend Architecture Requirements

Date: 2026-06-27
Scope: Frontend architecture requirements for Website CMS admin and public CMS rendering.

## Objective

Build the Website CMS frontend so the UI can be reviewed with mock JSON first, then switched to real backend API without changing page/component contracts.

The frontend must be maintainable, reusable, and production-ready for loading, mutation, validation, and editor state.

This document is requirements only. Do not implement from it until the user approves the architecture.

## Core Principles

- Route components should orchestrate only. They should not contain repeated data mapping, validation rules, field rendering, or mutation logic.
- Components should receive typed props and render UI. They should not know whether data came from mock JSON or the real API.
- Server data belongs to TanStack Query.
- Form state belongs to React Hook Form.
- Validation and parsing belong to Zod.
- Editor-only UI state belongs to Zustand.
- Shared transformations belong to named utility functions.
- Mock data must match the real API contract as closely as possible.

## Data Source Requirement

Website CMS must support two data sources with the same service contract.

Default:

```text
NEXT_PUBLIC_WEBSITE_CMS_SOURCE is unset or not "api" -> use mock JSON
```

Real API:

```text
NEXT_PUBLIC_WEBSITE_CMS_SOURCE=api -> use backend API
```

Components must never branch on mock/API mode. Only the service layer may choose the source.

## Directory Structure

Use this structure for CMS frontend work:

```text
frontend/src/
  app/[locale]/admin/website/
    pages/page.tsx
    pages/[id]/page.tsx

  components/admin/website/
    WebsitePagesList.tsx
    WebsitePageEditorShell.tsx
    WebsiteEditorToolbar.tsx
    WebsiteSectionList.tsx
    WebsiteLocaleTabs.tsx
    WebsitePreviewDeviceSwitch.tsx
    WebsitePreviewPanel.tsx
    WebsiteSeoPanel.tsx
    WebsitePublishPanel.tsx
    sections/
      ContactSectionEditor.tsx
      HeroSectionEditor.tsx
      RichTextSectionEditor.tsx
      MapSectionEditor.tsx

  components/forms/
    LocalizedTextFields.tsx
    LocalizedTextareaFields.tsx
    JsonTextareaField.tsx

  hooks/
    website-cms.ts

  stores/
    website-cms-editor-store.ts

  schemas/
    website-cms.schema.ts

  services/
    websiteCmsService.ts

  types/
    website-cms.ts

  utils/
    websiteCms.ts
    localizedText.ts

  data/
    website-cms.json
```

## Naming Rules

### Components

Use PascalCase and domain-first names.

Examples:

- `WebsitePagesList`
- `WebsitePageEditorShell`
- `WebsiteSectionList`
- `WebsiteLocaleTabs`
- `WebsitePreviewPanel`
- `ContactSectionEditor`
- `LocalizedTextFields`

Do not name reusable CMS components with vague names such as `Form`, `Editor`, `Panel`, or `Preview` without the domain prefix.

### Hooks

Use `useWebsite...` for CMS hooks.

Required hooks:

- `useWebsitePagesQuery`
- `useWebsitePageQuery`
- `useUpdateWebsitePageMutation`
- `useUpdateWebsiteSectionMutation`
- `usePublishWebsitePageMutation`

Optional hooks if the UI becomes complex:

- `useWebsitePageEditorForm`
- `useWebsiteSectionForm`
- `useWebsitePreviewPayload`

### Stores

Use one focused Zustand store:

```text
useWebsiteCmsEditorStore
```

The store may hold:

- `activeLocale`
- `activeSectionId`
- `previewDevice`
- `activePanel`

The store must not hold:

- fetched page records
- API responses
- form values
- auth/session state
- errors returned by mutations

### Utility Functions

Use pure named functions in `utils/websiteCms.ts`.

Required functions:

- `contentPageToPublicPreview(page)`
- `contentPageToFormValues(page)`
- `contentSectionToFormValues(section)`
- `websitePageFormToUpdatePayload(values)`
- `websiteSectionFormToUpdatePayload(values)`
- `getDefaultActiveSectionId(page)`
- `sortContentSections(sections)`

Utility functions must be pure and must not call API, React hooks, Zustand stores, or browser APIs.

## Component Responsibilities

### Route Pages

Route pages must stay thin.

Allowed:

- read route params
- call query hooks
- pass data and handlers into composed components
- render loading/error/empty states through reusable components

Not allowed:

- direct axios/API calls
- importing mock JSON
- manual duplicated mapping logic
- large inline forms
- repeated mutation state handling

### WebsitePagesList

Responsibilities:

- render page list
- show status, slug, updated date, translation completeness
- handle empty state
- link to page editor

Inputs:

- `pages`
- `isLoading`
- `error`
- `onRetry`

### WebsitePageEditorShell

Responsibilities:

- compose editor layout
- render toolbar, section list, active section editor, preview, SEO/publish panels
- connect query/mutation states to UI

Inputs:

- `page`
- `activeLocale`
- `activeSectionId`
- `previewDevice`
- mutation handlers and status flags

### Section Editors

Each section type gets a focused editor.

Examples:

- `ContactSectionEditor`
- `HeroSectionEditor`
- `MapSectionEditor`

Do not build a giant generic JSON editor for all section types in phase 1.

### Form Components

Use shared form field components for repeated multilingual fields.

Required reusable form components:

- `LocalizedTextFields`
- `LocalizedTextareaFields`
- `JsonTextareaField`

These components must:

- work with React Hook Form
- display validation errors
- support `th`, `en`, `de`
- avoid owning submit logic

## Hook Responsibilities

### TanStack Query Hooks

Hooks in `hooks/website-cms.ts` own async server state.

They must:

- define stable query keys
- expose loading, error, success, and mutation states through TanStack Query
- invalidate or update cache after mutation
- work for both mock and API because both go through `websiteCmsService`

They must not:

- import route components
- import UI components
- store data in Zustand

### Mutation Requirements

Every mutation must expose UI-ready state:

- `isPending`
- `isError`
- `error`
- `isSuccess`

After successful mutation:

- update the current page cache when possible
- invalidate the pages list
- keep user on the same page
- show success feedback from the route/shell layer

On error:

- keep current form values
- show a recoverable error
- do not clear query cache

## Form Requirements

Use React Hook Form with Zod resolver for:

- page metadata form
- SEO form
- section editor forms
- publish settings if editable

Zod schemas live in:

```text
frontend/src/schemas/website-cms.schema.ts
```

Required schemas:

- `localizedTextSchema`
- `websiteCmsPageFormSchema`
- `websiteCmsSectionFormSchema`
- section-specific schemas when needed

Form default values must be produced by utilities, not inline in route components.

## Loading And Error Requirements

Every CMS admin screen must have:

- initial loading state
- empty state
- fetch error state with retry
- save pending state
- publish pending state
- mutation error state
- disabled submit buttons while mutation is pending

Use shared UI components where practical:

- existing `PageLoading`
- existing `Loading`
- new CMS-specific `WebsiteCmsStateBlock` if repeated state blocks appear in more than one screen

## Mock Requirements

Mock JSON must:

- live in `frontend/src/data/website-cms.json`
- use the same field names as backend API
- include `PAGE-CONTACT` first
- include multilingual content for `th`, `en`, `de`
- include draft/published fields
- include at least three sections for contact: `hero`, `contact_info`, `contact_form`

Mock service must:

- clone returned data
- simulate publish behavior
- simulate update behavior enough for FE review
- preserve the same method names as API service

## API Requirements

The service API methods must support:

```ts
websiteCmsAdminService.listPages()
websiteCmsAdminService.getPage(pageKey)
websiteCmsAdminService.updatePage(id, payload)
websiteCmsAdminService.updateSection(id, payload)
websiteCmsAdminService.publishPage(id)
websiteCmsPublicService.getPage(slug)
```

Expected backend endpoints:

```text
GET  /api/v1/admin/website/pages
GET  /api/v1/admin/website/pages/:pageKey
PUT  /api/v1/admin/website/pages/:id
PUT  /api/v1/admin/website/sections/:id
POST /api/v1/admin/website/pages/:id/publish
GET  /api/v1/public/pages/:slug
```

## Validation Requirements

Validation should prevent obvious invalid data but not block normal multilingual drafting.

Rules:

- `page_key` required.
- `slug` required and URL-safe.
- At least one locale must be filled for required localized fields.
- SEO canonical URL can be empty.
- `noindex` must be boolean.
- Section key and type required.
- Sort order must be a non-negative integer.

## Production Readiness Checklist

Before implementation is considered ready:

- Components do not import mock JSON directly.
- Route pages do not contain repeated mapping logic.
- API/mock source switch is service-only.
- Query hooks own server data.
- Zustand owns only editor UI state.
- React Hook Form owns editor form state.
- Zod owns validation.
- Save and publish show separate pending states.
- Mutation errors are visible and recoverable.
- `npx next build --webpack` passes.

## Out Of Scope For This Step

- Direct Supabase access from frontend.
- Full revision history.
- Generic page builder.
- Media library picker implementation.
- Migrating all public pages at once.
