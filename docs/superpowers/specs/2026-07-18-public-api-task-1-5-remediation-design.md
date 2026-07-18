# Public API Tasks 1–5 Remediation Design

**Goal:** Complete the outstanding Tasks 1–5 of the public-client API migration without changing public content pages or Home.

## Scope

This work is limited to the shared public API layer, Events/Schedules, and Monks. Tasks 6–8 in `2026-07-18-public-client-api-state.md` remain out of scope.

## Backend contract

The public Events endpoint accepts an optional positive `limit` query parameter and applies it after filtering active records. Event list order remains explicit and deterministic. Event schedules are preloaded in ascending `display_order` for both the list and detail endpoints.

The event detail handler returns HTTP 404 only when GORM reports `ErrRecordNotFound`. Database and preload failures return HTTP 500. This keeps client-side `not-found` and retryable/transient states accurate.

## Typed client API boundary

Endpoint functions and response DTOs live in their owning domain feature directories. `publicService.ts` remains the configured `publicApi` Axios host. Its two temporary Home adapters remain until Task 7 because the Home route still consumes them, but they receive explicit response types and must not be used by Events or Monks routes. Task 7 removes the adapters after Home moves to the domain APIs.

Events, schedules, monks, and monk detail use the existing public retry classifier and set `staleTime` to 60 seconds. Query keys remain domain-specific and parameterized only by values that change the response.

## Monk detail lifecycle

The public Monk detail route uses the URL segment `[slug]`. It does not use `generateStaticParams`, because public records are runtime API data.

The server page fetches the detail only to produce metadata, derive a stable page shell, and call `notFound()` for a confirmed 404. For a transient server fetch failure, the shell still renders. `MonkDetailContent` receives `slug` and optional `initialMonk`, then owns `usePublicMonkQuery`, loading skeleton, retryable error state, empty state, and success presentation.

Localization helpers accept `LocalizedTextDto` rather than untyped values. They select the requested locale then `th`, `en`, and `de`, without unsafe type assertions.

## Events hardening

Event detail JSON-LD includes an `image` property only when `image_url` is present. Existing public image presentation retains the established multi-stage fallback behavior.

## Verification

Do not add automated tests. Verify the public API manually for event list limit, event detail 404, and event detail 500. Run focused ESLint for the shared feature layer, Events, Monks, and the affected routes. Run source audits for unsafe assertions, direct public-service calls, fixture imports, and obsolete `[id]` Monk detail references within Tasks 1–5.
