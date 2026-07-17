# About Admin CMS RichText Design

Date: 2026-07-17
Status: Approved design direction

## Goal

Move the About admin editor from its isolated localStorage mock flow to the existing Website CMS API flow. The three approved long-form fields use the shared localized RichText contract and receive the same normalization, migration, and backend validation as the other CMS content.

## Scope

This phase is admin-only. It changes the About editor's loading and saving path, but does not change the public About page, its `about.json` fallback, or its visual layout.

## Architecture

```text
AboutPageEditor
  -> useAboutPageQuery / useUpdateAboutPageMutation
  -> websiteCmsAdminService
  -> /admin/website/pages/PAGE-ABOUT
  -> ContentPage.body
```

`ContentPage.body` is the source of truth for the About page. The admin form remains focused on its existing field-level UI and converts data at the boundary with pure utilities:

- `contentPageToAboutFormData(page: ContentPage): AboutPageMasterFormData`
- `aboutFormDataToContentPagePayload(values: AboutPageMasterFormData): Partial<ContentPage>`

The utilities contain no API calls, browser state, React hooks, or editor state.

## Content Contract

The following `ContentPage.body` fields use `LocalizedRichText`:

- `objective_content`
- `administration_content`
- `history_content`

All other About fields preserve their current localized-text, list, or scalar shape. In particular, titles, subtitles, locations, navigation labels, Sangha mission/current-work text, and building information do not change type in this phase.

The RichText locale map remains dynamic. The current admin locale list supplies `th`, `en`, and `de`, but shared RichText components and document normalization must not rely on a fixed locale union.

## Admin Load and Legacy Migration

`useAboutPageQuery` reads `PAGE-ABOUT` with `websiteCmsAdminService.getPage`. The page-to-form adapter normalizes each approved RichText value. Legacy strings, HTML, and sparse locale maps render as valid rich-text documents in the form.

When an approved field had legacy content, the admin flow sends a non-blocking, version-checked migration through the existing rich-text migration service. Migration failure must not prevent editing or saving the page. A normal explicit save always persists the current full CMS payload.

## Save and Validation

`useUpdateAboutPageMutation` accepts `{ id, payload }`, calls `websiteCmsAdminService.updatePage`, stores the returned `ContentPage` in the About query cache, and invalidates the general Website CMS cache.

The form schema validates its editor values before submit. The backend validates the three RichText-bearing fields within `PAGE-ABOUT` through `ValidateContentPageBody` before persisting the JSON body. Invalid content receives the existing API error response and is displayed by the editor's established error/toast flow.

Remove the About-only localStorage key, mock load/save helpers, and artificial latency from the active About hooks. Do not alter mock/API behavior for Home or Contact in this task.

## Non-goals

- Render About RichText through `PublicAboutPageLayout`.
- Replace public About fallback data.
- Modify About page layout or add new fields.
- Expand RichText to fields outside the three approved long-form fields.
- Add libraries.
- Add automated tests; the owner will perform manual behavior checks. Build/type verification remains required.

## Acceptance Criteria

- Admin About loads and saves through `PAGE-ABOUT` CMS API endpoints, without About localStorage state.
- Refreshing the admin page shows data returned by the API.
- The three approved fields load, edit, and save as localized RichText JSON.
- Legacy string/HTML values safely normalize in the editor and request non-blocking migration.
- Backend rejects invalid RichText documents for the three approved About fields.
- Public About behavior remains unchanged in this phase.
- Frontend and backend builds pass.
